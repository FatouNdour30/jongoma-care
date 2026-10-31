// Suivi du nouveau-né dans le dossier de la mère (espace professionnel) : naissance et vaccinations.
import { Badge, fmt } from "./ui";
import { declarerEtatCivil, enregistrerNaissance, enregistrerVaccin, leverAlerteBebe } from "@/lib/actions";
import { db } from "@/lib/db";
import { ageBebe, ALLAITEMENT_JOURS_MAX, etatVaccins, LIBELLE_VACCIN, MENTION_A_VALIDER, nomBebe, VACCINS, type StatutVaccin } from "@/lib/enfants";
import { diffDays, today } from "@/lib/protocol";
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

  return (
    <section className="card">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Nouveau-né · {nomBebe(bebe)}</h2>
        <span className="text-xs text-muted">
          Né(e) le {fmt(bebe.dateNaissance)} · {ageBebe(bebe.dateNaissance)} · {faits} sur {echus} vaccin(s) échu(s){retards ? <span className="font-semibold text-red-700"> · {retards} en retard</span> : ""}
        </span>
      </div>
      {bebe.alerteDangerLe && (
        <div className="mb-4 rounded-xl border-2 border-red-300 bg-red-50 p-3 text-sm text-red-950">
          <p className="font-semibold">Signe de danger signalé par la mère le {fmt(bebe.alerteDangerLe.slice(0, 10))} à {bebe.alerteDangerLe.slice(11, 16)} (UTC)</p>
          <p className="mt-1">Appelez-la tout de suite. Si elle n&apos;est pas déjà au centre de santé, qu&apos;elle y aille sans attendre ; escaladez si besoin.</p>
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
      <p className="mb-4 text-xs text-muted">
        Notez uniquement ce qui figure dans le carnet de santé : vaccin fait (avec sa date) ou refusé. Aucune donnée clinique n&apos;est saisie. Les consultations postnatales mère et bébé figurent dans les rendez-vous. {MENTION_A_VALIDER}
      </p>
      {modifiable && (
        <details className="mb-4 text-sm">
          <summary className="cursor-pointer text-muted underline">Corriger la date de naissance ou le prénom</summary>
          <form action={enregistrerNaissance} className="mt-2 flex flex-wrap items-end gap-2">
            <input type="hidden" name="beneficiaireId" value={b.id} />
            <input type="date" name="date" required max={today()} defaultValue={bebe.dateNaissance} className="field w-auto" />
            <input name="prenom" maxLength={40} defaultValue={bebe.prenom} placeholder="Prénom (facultatif)" className="field w-auto" />
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
