// Suivi du nouveau-né dans le dossier de la mère (espace professionnel) : naissance et vaccinations.
import { Badge, fmt } from "./ui";
import { CourbeCroissance } from "./Croissance";
import { declarerEtatCivil, enregistrerMesure, enregistrerNaissance, enregistrerVaccin, enregistrerVisite, leverAlerteBebe, supprimerMesure } from "@/lib/actions";
import { db } from "@/lib/db";
import { ageBebe, ALLAITEMENT_JOURS_MAX, FIRST_CRY_JOURS, LIENS_GARDIEN, PREMIERES_HEURES, etatVaccins, LIBELLE_VACCIN, MENTION_A_VALIDER, nomBebe, VACCINS, VISITES, zonePoids, type StatutVaccin } from "@/lib/enfants";
import { enRetard } from "@/lib/programmes";
import { addDays, diffDays, today } from "@/lib/protocol";
import type { Beneficiaire } from "@/lib/types";

const TON: Record<StatutVaccin, "vert" | "rouge" | "orange" | "gris" | "bleu"> = {
  fait: "vert",
  refuse: "gris",
  en_retard: "rouge",
  a_faire: "orange",
  plus_tard: "bleu",
};

// Âges du calendrier, dans l'ordre (un groupe par âge recommandé).
const AGES = [...new Set(VACCINS.map((v) => v.age))];

export function PanneauBebe({ b, modifiable = true }: { b: Beneficiaire; modifiable?: boolean }) {
  const base = db();
  const bebe = base.bebes.find((x) => x.beneficiaireId === b.id);
  if (!bebe && b.etape !== "postnatal" && b.etape !== "cloture") return null;

  if (!bebe) {
    return (
      <section className="card">
        <h2 className="mb-1 font-semibold">Nouveau-né</h2>
        <p className="mb-3 text-xs text-muted">Enregistrez la naissance pour suivre les consultations du bébé et sa vaccination. Seuls la date et, si la mère le souhaite, le prénom sont notés.</p>
        {modifiable && (
          <form action={enregistrerNaissance} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="beneficiaireId" value={b.id} />
            <label className="text-sm">Date de naissance<input type="date" name="date" required max={today()} defaultValue={b.dateAccouchement} className="field mt-1 w-auto" /></label>
            <label className="text-sm">Prénom (facultatif)<input name="prenom" maxLength={40} className="field mt-1 w-auto" /></label>
            <label className="text-sm">Sexe (facultatif, pour la courbe)<select name="sexe" className="field mt-1 w-auto" defaultValue=""><option value="">—</option><option value="F">Fille</option><option value="M">Garçon</option></select></label>
            <button className="btn">Enregistrer la naissance</button>
          </form>
        )}
      </section>
    );
  }

  const etats = etatVaccins(bebe, base);
  const retards = etats.filter((e) => e.statut === "en_retard").length;
  const faits = etats.filter((e) => e.statut === "fait").length;
  const echus = etats.filter((e) => e.statut !== "plus_tard").length;
  const t = today();
  const rdvMere = base.rendezVous.filter((r) => r.beneficiaireId === b.id && r.type === "CPoN");
  const preventionsRetard = enRetard(b, base).filter((e) => e.action.programme !== "mental").length;
  const zone = zonePoids(bebe);
  const derniereMesure = (bebe.mesures ?? []).at(-1);
  // Double suivi mère-bébé : une vue d'ensemble du foyer, sans remplacer les professionnels de santé.
  const suivi: [string, [string, string, boolean?][]][] = [
    ["de la mère", [
      ["Consultations postnatales", `${rdvMere.filter((r) => r.statut === "honore").length} honorée(s) · ${rdvMere.filter((r) => r.statut === "prevu" && r.date >= t).length} prévue(s)`],
      ["Prévention", preventionsRetard ? `${preventionsRetard} en retard` : "À jour", preventionsRetard > 0],
      ["Orientations en cours", String(base.orientations.filter((o) => o.beneficiaireId === b.id && (o.statut === "proposee" || o.statut === "transmise")).length)],
      ["Dernier contact", b.dernierContact ? fmt(b.dernierContact) : "jamais", !b.dernierContact || diffDays(t, b.dernierContact) > 14],
    ]],
    ["du bébé", [
      ["Croissance", derniereMesure?.poidsKg ? `${String(derniereMesure.poidsKg).replace(".", ",")} kg le ${fmt(derniereMesure.date)}${zone === "dessous" ? " · sous la zone habituelle" : zone === "dessus" ? " · au-dessus de la zone habituelle" : ""}` : "aucune mesure", zone === "dessous" || zone === "dessus"],
      ["Vaccination", `${faits} sur ${echus} échu(s)${retards ? ` · ${retards} en retard` : ""}`, retards > 0],
      ["Allaitement exclusif", bebe.allaitement ? (bebe.allaitement.exclusif ? "oui" : "non") : diffDays(t, bebe.dateNaissance) <= ALLAITEMENT_JOURS_MAX ? "pas de réponse" : "plus de 6 mois", bebe.allaitement?.exclusif === false],
      ["État civil", bebe.etatCivilLe ? `déclarée le ${fmt(bebe.etatCivilLe)}` : "pas encore déclarée", !bebe.etatCivilLe],
      ["Visites à domicile", `${(bebe.visites ?? []).length} sur ${VISITES.length}`],
      ["First Cry (72 h)", `${(bebe.premieresHeures ?? []).length} geste(s) sur ${PREMIERES_HEURES.length}`, diffDays(t, bebe.dateNaissance) <= FIRST_CRY_JOURS && (bebe.premieresHeures ?? []).length < PREMIERES_HEURES.length],
      ["Cercle de soutien", (b.cercle ?? []).length ? b.cercle!.map((g) => `${g.prenom} (${LIENS_GARDIEN[g.lien].toLowerCase()})`).join(", ") : "aucun proche indiqué"],
    ]],
  ];

  return (
    <section className="card">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Nouveau-né · {nomBebe(bebe)}</h2>
        <span className="text-xs text-muted">
          Né(e) le {fmt(bebe.dateNaissance)} · {ageBebe(bebe.dateNaissance)} · {faits} sur {echus} vaccin(s) échu(s){retards ? <span className="font-semibold text-red-700"> · {retards} en retard</span> : ""}
        </span>
      </div>
      {(bebe.alerteDangerLe || b.alerteMereLe) && (
        <div className="mb-4 rounded-xl border-2 border-red-300 bg-red-50 p-3 text-sm text-red-950">
          {bebe.alerteDangerLe && <p className="font-semibold">Signe de danger signalé pour le bébé le {fmt(bebe.alerteDangerLe.slice(0, 10))} à {bebe.alerteDangerLe.slice(11, 16)} (UTC)</p>}
          {b.alerteMereLe && <p className="font-semibold">Signe de danger signalé par la mère pour elle-même le {fmt(b.alerteMereLe.slice(0, 10))} à {b.alerteMereLe.slice(11, 16)} (UTC)</p>}
          <p className="mt-1">Appelez-la tout de suite. Si elle n&apos;est pas déjà au centre de santé, qu&apos;elle y aille sans attendre ; escaladez si besoin.</p>
          {(b.cercle ?? []).some((g) => g.prevenirSiAlerte) && (
            <p className="mt-1">Si elle ne répond pas, son cercle de soutien (Baby Guardian) : {b.cercle!.filter((g) => g.prevenirSiAlerte).map((g) => `${g.prenom} (${LIENS_GARDIEN[g.lien].toLowerCase()}) ${g.telephone}`).join(" · ")}.</p>
          )}
          {modifiable && (
            <form action={leverAlerteBebe} className="mt-2">
              <input type="hidden" name="beneficiaireId" value={b.id} />
              <button className="btn btn-sm">Mère jointe : lever l&apos;alerte</button>
            </form>
          )}
        </div>
      )}
      <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-xl border border-border px-3 py-2">
          <span className="font-medium">État civil : </span>
          {bebe.etatCivilLe ? <>naissance déclarée le {fmt(bebe.etatCivilLe)}</> : <span className="text-red-700">naissance pas encore déclarée</span>}
          {modifiable && !bebe.etatCivilLe && (
            <form action={declarerEtatCivil} className="mt-1 flex items-center gap-1.5">
              <input type="hidden" name="beneficiaireId" value={b.id} />
              <input type="date" name="date" max={today()} min={bebe.dateNaissance} defaultValue={today()} className="field w-auto py-1" />
              <button className="btn-sec btn-sm">Déclarée</button>
            </form>
          )}
        </div>
        <div className="rounded-xl border border-border px-3 py-2">
          <span className="font-medium">Allaitement exclusif : </span>
          {bebe.allaitement ? <>{bebe.allaitement.exclusif ? "oui" : "non"} (déclaré le {fmt(bebe.allaitement.date)})</> : diffDays(today(), bebe.dateNaissance) <= ALLAITEMENT_JOURS_MAX ? "pas encore de réponse" : "plus de 6 mois"}
        </div>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {suivi.map(([qui, lignes]) => (
          <div key={qui} className="rounded-xl border border-border">
            <p className="border-b border-border bg-stone-50 px-3 py-1.5 text-sm font-semibold">Suivi {qui}</p>
            <dl className="divide-y divide-border text-sm">
              {lignes.map(([k, v, alerte]) => (
                <div key={k} className="flex justify-between gap-3 px-3 py-1.5"><dt className="text-muted">{k}</dt><dd className={`text-right ${alerte ? "font-semibold text-accent" : ""}`}>{v}</dd></div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-3">
          <p className="mb-2 text-sm font-semibold">Croissance</p>
          <CourbeCroissance bebe={bebe} />
          {modifiable && (
            <form action={enregistrerMesure} className="mt-3 flex flex-wrap items-end gap-2 text-sm">
              <input type="hidden" name="bebeId" value={bebe.id} />
              <label>Date<input type="date" name="date" max={t} min={bebe.dateNaissance} defaultValue={t} className="field mt-1 w-auto py-1" /></label>
              <label>Poids (kg)<input name="poids" inputMode="decimal" placeholder="4,2" className="field mt-1 w-20 py-1" /></label>
              <label>Taille (cm)<input name="taille" inputMode="decimal" placeholder="55" className="field mt-1 w-20 py-1" /></label>
              <button className="btn-sec btn-sm">Ajouter (carnet)</button>
            </form>
          )}
          {modifiable && derniereMesure && (
            <form action={supprimerMesure} className="mt-1">
              <input type="hidden" name="bebeId" value={bebe.id} />
              <input type="hidden" name="date" value={derniereMesure.date} />
              <button className="text-xs text-muted underline">Supprimer la dernière mesure ({fmt(derniereMesure.date)})</button>
            </form>
          )}
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-sm font-semibold">Visites à domicile</p>
          <p className="mb-2 text-xs text-muted">Repères indicatifs après la naissance, à valider. Signalez tout besoin d&apos;accompagnement par une orientation.</p>
          <ul className="divide-y divide-border text-sm">
            {VISITES.map((v) => {
              const faite = bebe.visites?.find((x) => x.etape === v.id);
              const prevue = addDays(bebe.dateNaissance, v.jours);
              return (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                  <span>{v.libelle}<span className="block text-xs text-muted">{faite ? `Faite le ${fmt(faite.date)}` : `Vers le ${fmt(prevue)}`}</span></span>
                  {faite ? <Badge ton="vert">Faite</Badge> : (
                    <span className="flex items-center gap-1.5">
                      {prevue < addDays(t, -7) && <Badge ton="rouge">En retard</Badge>}
                      {modifiable && prevue <= t && (
                        <form action={enregistrerVisite}>
                          <input type="hidden" name="beneficiaireId" value={b.id} />
                          <input type="hidden" name="etape" value={v.id} />
                          <button className="btn-sec btn-sm">✓ Visite faite</button>
                        </form>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <p className="mb-4 text-xs text-muted">
        Notez uniquement ce qui figure dans le carnet de santé : vaccin fait (avec sa date) ou refusé, poids et taille. Aucun diagnostic n&apos;est saisi. Les consultations postnatales mère et bébé figurent dans les rendez-vous. {MENTION_A_VALIDER}
      </p>
      {modifiable && (
        <details className="mb-4 text-sm">
          <summary className="cursor-pointer text-muted underline">Corriger la date de naissance ou le prénom</summary>
          <form action={enregistrerNaissance} className="mt-2 flex flex-wrap items-end gap-2">
            <input type="hidden" name="beneficiaireId" value={b.id} />
            <input type="date" name="date" required max={today()} defaultValue={bebe.dateNaissance} className="field w-auto" />
            <input name="prenom" maxLength={40} defaultValue={bebe.prenom} placeholder="Prénom (facultatif)" className="field w-auto" />
            <select name="sexe" className="field w-auto" defaultValue={bebe.sexe ?? ""}><option value="">Sexe —</option><option value="F">Fille</option><option value="M">Garçon</option></select>
            <button className="btn-sec btn-sm">Corriger</button>
          </form>
        </details>
      )}
      <div className="space-y-4">
        {AGES.map((age) => {
          const lignes = etats.filter((e) => e.vaccin.age === age);
          return (
            <div key={age} className="rounded-xl border border-border">
              <div className="flex items-center justify-between gap-2 border-b border-border bg-stone-50 px-3 py-2">
                <p className="text-sm font-semibold">{age}</p>
                <span className="text-xs text-muted">vers le {fmt(lignes[0].du)}</span>
              </div>
              <ul className="divide-y divide-border">
                {lignes.map((e) => (
                  <li key={e.vaccin.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0">
                      {e.vaccin.nom}
                      {e.date && <span className="block text-xs text-muted">{e.statut === "fait" ? "Fait" : "Refusé"} le {fmt(e.date)}</span>}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Badge ton={TON[e.statut]}>{LIBELLE_VACCIN[e.statut]}</Badge>
                      {modifiable && (
                        <form action={enregistrerVaccin} className="flex gap-1">
                          <input type="hidden" name="bebeId" value={bebe.id} />
                          <input type="hidden" name="vaccinId" value={e.vaccin.id} />
                          {e.statut === "fait" || e.statut === "refuse" ? (
                            <button name="statut" value="annuler" className="btn-sec btn-sm" title="Remettre à faire">Annuler</button>
                          ) : e.statut !== "plus_tard" ? (
                            <>
                              <button name="statut" value="fait" className="btn-sec btn-sm hover:!border-emerald-400 hover:!bg-emerald-50">✓ Fait (carnet)</button>
                              <button name="statut" value="refuse" className="btn-sec btn-sm">Refusé</button>
                            </>
                          ) : null}
                        </form>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
