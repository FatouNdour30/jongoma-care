import { Barres, CarteGraphique } from "@/components/Graphiques";
import { EnTete, Kpi, Panneau } from "@/components/pro";
import { Badge } from "@/components/ui";
import Link from "next/link";
import { db } from "@/lib/db";
import { evaluer, SEUIL_ELEVE, VARIABLES } from "@/lib/modele";
import { calculerPriorite, REGLES } from "@/lib/priority";
import { addDays, today } from "@/lib/protocol";
import { exigerRole } from "@/lib/session";
import { ZONES } from "@/lib/types";

// Contrôle de l'équité du score (cahier des charges 5.13) : écarts par zone et par langue.
const ECART_ALERTE = 15; // points de pourcentage d'écart avec la moyenne qui déclenchent une alerte
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

export default async function IaEquite() {
  await exigerRole("coordinatrice");
  const base = db();
  const t = today();
  const actives = base.beneficiaires.filter((b) => b.etape !== "cloture");
  const scores = actives.map((b) => ({ b, p: calculerPriorite(b, base) }));
  const calcules = scores.filter((x) => !x.p.iaRefusee);
  const partHaute = (xs: typeof scores) => pct(xs.filter((x) => !x.p.iaRefusee && x.p.niveau === "haute").length, xs.filter((x) => !x.p.iaRefusee).length);
  const moyenne = partHaute(scores);

  const niveaux = [
    { libelle: "Haute", v: calcules.filter((x) => x.p.niveau === "haute").length },
    { libelle: "Moyenne", v: calcules.filter((x) => x.p.niveau === "moyenne").length },
    { libelle: "Basse", v: calcules.filter((x) => x.p.niveau === "basse").length },
    { libelle: "Non calculée (opposition)", v: scores.length - calcules.length },
  ].map((n) => ({ ...n, max: scores.length }));

  // Part des rendez-vous manqués sur 60 jours, par niveau (contrôle descriptif, pas une validation).
  const debut = addDays(t, -60);
  const manques = (["haute", "moyenne", "basse"] as const).map((niv) => {
    const ids = new Set(calcules.filter((x) => x.p.niveau === niv).map((x) => x.b.id));
    const rdv = base.rendezVous.filter((r) => ids.has(r.beneficiaireId) && r.date >= debut && r.date < t && (r.statut === "honore" || r.statut === "manque"));
    return { niv, taux: pct(rdv.filter((r) => r.statut === "manque").length, rdv.length), n: rdv.length };
  });

  const groupes = [
    ...ZONES.map((z) => ({ type: "Zone", nom: z, xs: scores.filter((x) => x.b.zone === z) })),
    { type: "Langue", nom: "Wolof", xs: scores.filter((x) => x.b.langue === "wo") },
    { type: "Langue", nom: "Français", xs: scores.filter((x) => x.b.langue === "fr") },
    { type: "Langue", nom: "Autres langues", xs: scores.filter((x) => x.b.langue !== "wo" && x.b.langue !== "fr") },
    { type: "Âge", nom: "Jeunes filles (< 20 ans)", xs: scores.filter((x) => x.b.jeuneFille) },
  ].map((g) => ({ ...g, haute: partHaute(g.xs), refus: pct(g.xs.filter((x) => x.p.iaRefusee).length, g.xs.length) }));
  const alertes = groupes.filter((g) => Math.abs(g.haute - moyenne) > ECART_ALERTE && g.xs.length >= 5);

  const ml = evaluer(base);
  const prenom = (identiteId: string) => base.identites.find((i) => i.id === identiteId)?.prenom ?? "";
  const fmt = (v: number | null) => (v === null ? "n.d." : v.toFixed(2).replace(".", ","));
  const desaccords = ml?.observation.filter((o) => o.p >= SEUIL_ELEVE && o.niveauRegles !== "haute") ?? [];

  const consent = (k: "rappels" | "accompagnement" | "ia") => pct(actives.filter((b) => b.consentements[k]).length, actives.length);

  return (
    <div className="space-y-6">
      <EnTete titre="IA et équité" sous="Contrôle du score de priorisation. Il organise les recontacts ; il ne refuse ni ne réduit jamais un service." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icone="etincelle" valeur={`${pct(calcules.length, scores.length)} %`} libelle="Bénéficiaires avec score" detail={`${scores.length - calcules.length} opposition(s) au traitement par l'IA`} />
        <Kpi icone="equipe" valeur={`${moyenne} %`} libelle="En priorité haute" detail="Part moyenne, tous groupes" />
        <Kpi icone="bouclier" valeur={alertes.length} libelle="Écarts à examiner" detail={`Groupes à plus de ${ECART_ALERTE} points de la moyenne`} ton={alertes.length ? "alerte" : "succes"} />
        <Kpi icone="cadenas" valeur={`${consent("ia")} %`} libelle="Acceptent l'IA" detail={`Rappels ${consent("rappels")} % · référente ${consent("accompagnement")} %`} ton="neutre" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CarteGraphique titre="Répartition des niveaux de priorité" sous="Bénéficiaires actives">
          <Barres items={niveaux} />
        </CarteGraphique>
        <Panneau titre="Rendez-vous manqués par niveau" sous="60 derniers jours · contrôle descriptif">
          <ul className="space-y-3">
            {manques.map((m) => (
              <li key={m.niv} className="flex items-center gap-3 text-sm">
                <span className="w-20 capitalize">{m.niv}</span>
                <div className="h-2.5 flex-1 rounded-full bg-stone-100"><div className="h-2.5 rounded-full bg-brand" style={{ width: `${m.taux}%` }} /></div>
                <span className="w-24 text-right tabular-nums"><span className="font-semibold">{m.taux} %</span> <span className="text-xs text-muted">({m.n} RDV)</span></span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">Le score utilise déjà les rendez-vous manqués : cet écart est attendu et ne prouve pas son efficacité. L&apos;efficacité sera mesurée pendant le pilote (rendez-vous manqués évités après recontact prioritaire, comparés à une période de référence).</p>
        </Panneau>
      </div>

      <Panneau titre="Équité par groupe" sous={`Part en priorité haute et taux d'opposition. Un écart de plus de ${ECART_ALERTE} points avec la moyenne (${moyenne} %) est signalé.`}>
        <div className="-mx-5 -my-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-5 py-2.5 font-semibold">Groupe</th><th className="text-right font-semibold">Effectif</th><th className="text-right font-semibold">Priorité haute</th><th className="text-right font-semibold">Écart</th><th className="text-right font-semibold">Opposition IA</th><th className="pr-5 font-semibold" /></tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {groupes.map((g) => {
                const ecart = g.haute - moyenne;
                const alerte = Math.abs(ecart) > ECART_ALERTE && g.xs.length >= 5;
                return (
                  <tr key={g.type + g.nom}>
                    <td className="px-5 py-2.5"><span className="text-xs text-muted">{g.type} · </span><span className="font-medium">{g.nom}</span></td>
                    <td className="text-right">{g.xs.length}</td>
                    <td className="text-right">{g.haute} %</td>
                    <td className={`text-right ${alerte ? "font-semibold text-accent" : "text-muted"}`}>{ecart > 0 ? "+" : ""}{ecart} pts</td>
                    <td className="text-right">{g.refus} %</td>
                    <td className="pr-5 text-right">{alerte ? <Badge ton="orange">À examiner</Badge> : g.xs.length < 5 ? <Badge>Effectif faible</Badge> : <Badge ton="vert">OK</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panneau>

      <Panneau titre="Modèle d'apprentissage automatique · mode observation" sous="Régression logistique v0.2 : probabilité de manquer le prochain rendez-vous. Elle tourne à côté des règles et ne décide rien.">
        {!ml ? (
          <p className="text-sm text-muted">Pas encore assez de rendez-vous passés pour entraîner et évaluer le modèle.</p>
        ) : (
          <div className="space-y-6">
            <p className="rounded-lg bg-brand-soft px-3 py-2 text-xs text-encre">Entraîné ici sur les données de démonstration <strong>simulées</strong> : ces chiffres montrent que la chaîne fonctionne (apprentissage, évaluation, explication, équité), pas une performance réelle. Il sera réentraîné sur les données du pilote, avec un consentement distinct.</p>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Kpi icone="etincelle" valeur={fmt(ml.aucModele)} libelle="AUC du modèle" detail={`Sur les ${ml.nTest} rendez-vous les plus récents, jamais vus à l'entraînement (${ml.nEntrainement})`} />
              <Kpi icone="equipe" valeur={fmt(ml.aucRegles)} libelle="AUC des règles" detail="Mêmes variables, poids fixés à la main" ton="neutre" />
              <Kpi icone="bouclier" valeur={fmt(ml.brier)} libelle="Score de Brier" detail="Erreur des probabilités (0 = parfait)" ton="neutre" />
              <Kpi icone="cadenas" valeur={desaccords.length} libelle="Désaccords avec les règles" detail="Risque élevé selon le modèle, pas en priorité haute" ton={desaccords.length ? "alerte" : "succes"} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">Ce que le modèle a appris</h3>
                <p className="mb-3 text-xs text-muted">Effet de chaque variable (poids standardisé) : vers la droite, il augmente le risque ; vers la gauche, il le diminue.</p>
                <ul className="space-y-2">
                  {VARIABLES.map((v, j) => {
                    const w = ml.modele.poids[j];
                    const largeur = Math.min(50, Math.abs(w) * 25);
                    return (
                      <li key={v.id} className="text-sm">
                        <div className="flex justify-between gap-2"><span>{v.libelle}</span><span className="tabular-nums text-muted">{w > 0 ? "+" : ""}{w.toFixed(2).replace(".", ",")}</span></div>
                        <div className="relative mt-1 h-2 rounded-full bg-stone-100">
                          <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
                          <div className={`absolute inset-y-0 rounded-full ${w > 0 ? "bg-accent" : "bg-brand"}`} style={w > 0 ? { left: "50%", width: `${largeur}%` } : { right: "50%", width: `${largeur}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-xs text-muted">Un effet peu plausible (par exemple un risque plus faible après des rappels sans réponse) trahit un effectif trop petit : c&apos;est pour cela que le modèle reste en observation jusqu&apos;à sa validation sur les données du pilote.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Contrôle d&apos;équité du modèle</h3>
                <p className="mb-3 text-xs text-muted">Taux d&apos;absence observé et prédit par groupe, sur la période d&apos;évaluation. La zone, la langue et le statut « jeune fille » ne sont jamais des variables du modèle.</p>
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-muted"><tr><th className="py-1 font-semibold">Groupe</th><th className="text-right font-semibold">RDV</th><th className="text-right font-semibold">Observé</th><th className="text-right font-semibold">Prédit</th><th className="text-right font-semibold">AUC</th></tr></thead>
                  <tbody className="divide-y divide-border tabular-nums">
                    {ml.groupes.map((g) => (
                      <tr key={g.type + g.nom} className={g.n < 10 ? "text-muted" : ""}>
                        <td className="py-1.5"><span className="text-xs text-muted">{g.type} · </span>{g.nom}</td>
                        <td className="text-right">{g.n}</td>
                        <td className="text-right">{pct(g.observe, 1)} %</td>
                        <td className={`text-right ${g.n >= 10 && Math.abs(g.predit - g.observe) * 100 > ECART_ALERTE ? "font-semibold text-accent" : ""}`}>{pct(g.predit, 1)} %</td>
                        <td className="text-right">{g.n < 10 ? "effectif faible" : fmt(g.auc)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Avis du modèle à examiner</h3>
              <p className="mb-3 text-xs text-muted">Bénéficiaires que le modèle juge à risque élevé (au moins {Math.round(SEUIL_ELEVE * 100)} %) alors que les règles ne les placent pas en priorité haute. Une personne décide ; rien ne change automatiquement.</p>
              {desaccords.length === 0 ? (
                <p className="text-sm text-muted">Aucun désaccord : le modèle et les règles signalent les mêmes bénéficiaires.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {desaccords.slice(0, 6).map((o) => (
                    <li key={o.b.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm">
                      <Link href={`/personnel/beneficiaire/${o.b.id}`} className="w-28 font-medium underline">{prenom(o.b.identiteId)}</Link>
                      <span className="w-14 font-semibold tabular-nums text-accent">{Math.round(o.p * 100)} %</span>
                      <span className="text-xs text-muted">Règles : {o.niveauRegles}</span>
                      <span className="flex-1 text-xs text-muted">{o.explication.map((e) => `${e.c > 0 ? "↑" : "↓"} ${e.libelle.split(" (")[0]}`).join(" · ")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Panneau>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panneau titre="Fiche du modèle" sous="Règles v0.1 en service · apprentissage v0.2 en observation · open source">
          <dl className="space-y-3 text-sm">
            <div><dt className="font-semibold">Objectif</dt><dd className="text-muted">Ordonner les recontacts des référentes pour réduire les ruptures de suivi.</dd></div>
            <div><dt className="font-semibold">Variables utilisées</dt><dd className="text-muted">{REGLES.map((r) => r.libelle.split(" (")[0]).join(" · ")}</dd></div>
            <div><dt className="font-semibold">Variables exclues</dt><dd className="text-muted">Âge, santé mentale, protection, contenu clinique.</dd></div>
            <div><dt className="font-semibold">Supervision</dt><dd className="text-muted">Décision toujours humaine ; opposition possible sans perte de service.</dd></div>
            <div><dt className="font-semibold">Limites</dt><dd className="text-muted">Poids des règles non encore validés cliniquement ; modèle d&apos;apprentissage entraîné sur données simulées tant que le pilote n&apos;a pas commencé ; effectifs faibles par groupe.</dd></div>
          </dl>
        </Panneau>
        <Panneau titre="Feuille de route" sous="Des règles à l'apprentissage automatique, étape par étape">
          <ol className="space-y-3 text-sm">
            {[
              ["Fait", "Modèle d'apprentissage explicable (régression logistique), évaluation temporelle, comparaison aux règles et contrôle d'équité, en mode observation."],
              ["Mois 1–6", "Règles validées par le référent clinique ; le modèle tourne en observation sur les données réelles du pilote, avec un consentement distinct."],
              ["Mois 6–9", "Réentraînement sur le pilote ; mise en service seulement s'il fait mieux que les règles sans écart d'équité."],
              ["Avant extension", "Publication de la fiche du modèle et de l'évaluation d'équité."],
            ].map(([q, t]) => (
              <li key={q} className="flex gap-3"><span className="w-24 shrink-0 font-semibold text-brand">{q}</span><span className="text-muted">{t}</span></li>
            ))}
          </ol>
        </Panneau>
      </div>
    </div>
  );
}
