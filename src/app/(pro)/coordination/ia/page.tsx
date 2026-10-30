import { Barres, CarteGraphique } from "@/components/Graphiques";
import { EnTete, Kpi, Panneau } from "@/components/pro";
import { Badge } from "@/components/ui";
import { db } from "@/lib/db";
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
  ].map((g) => ({ ...g, haute: partHaute(g.xs), refus: pct(g.xs.filter((x) => x.p.iaRefusee).length, g.xs.length) }));
  const alertes = groupes.filter((g) => Math.abs(g.haute - moyenne) > ECART_ALERTE && g.xs.length >= 5);

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Panneau titre="Fiche du modèle" sous="Version « règles » v0.1 · publiée en open source">
          <dl className="space-y-3 text-sm">
            <div><dt className="font-semibold">Objectif</dt><dd className="text-muted">Ordonner les recontacts des référentes pour réduire les ruptures de suivi.</dd></div>
            <div><dt className="font-semibold">Variables utilisées</dt><dd className="text-muted">{REGLES.map((r) => r.libelle.split(" (")[0]).join(" · ")}</dd></div>
            <div><dt className="font-semibold">Variables exclues</dt><dd className="text-muted">Âge, santé mentale, protection, contenu clinique.</dd></div>
            <div><dt className="font-semibold">Supervision</dt><dd className="text-muted">Décision toujours humaine ; opposition possible sans perte de service.</dd></div>
            <div><dt className="font-semibold">Limites</dt><dd className="text-muted">Poids non encore validés cliniquement ; pas de mesure d&apos;efficacité avant le pilote ; effectifs faibles par groupe.</dd></div>
          </dl>
        </Panneau>
        <Panneau titre="Feuille de route" sous="Passage des règles à l'apprentissage automatique">
          <ol className="space-y-3 text-sm">
            {[
              ["Mois 1–6", "Règles explicables validées par le référent clinique et le référent données."],
              ["Mois 6–9", "Collecte des résultats du pilote avec consentement distinct pour l'entraînement."],
              ["Mois 9–12", "Modèle léger et explicable (régression logistique), seuils de performance minimaux, contrôle des biais par zone et langue."],
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
