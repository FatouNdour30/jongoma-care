// Suivi des programmes de santé pour une bénéficiaire (espace professionnel).
import { Badge, fmt } from "./ui";
import { enregistrerPrevention } from "@/lib/actions";
import { db } from "@/lib/db";
import { etatPreventions, LIBELLE_STATUT, PROGRAMMES, type StatutPrevention } from "@/lib/programmes";
import type { Beneficiaire } from "@/lib/types";

const TON: Record<StatutPrevention, "vert" | "rouge" | "orange" | "gris" | "bleu"> = {
  fait: "vert",
  refuse: "gris",
  en_retard: "rouge",
  a_faire: "orange",
  plus_tard: "bleu",
};

export function PanneauPrevention({ b, modifiable = true }: { b: Beneficiaire; modifiable?: boolean }) {
  const etats = etatPreventions(b, db());
  const retards = etats.filter((e) => e.statut === "en_retard").length;
  const faites = etats.filter((e) => e.statut === "fait").length;
  const echues = etats.filter((e) => e.statut !== "plus_tard").length;

  return (
    <section className="card">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Prévention et dépistages</h2>
        <span className="text-xs text-muted">
          {faites} sur {echues} action(s) échue(s) réalisée(s){retards ? <span className="font-semibold text-red-700"> · {retards} en retard</span> : ""}
        </span>
      </div>
      <p className="mb-4 text-xs text-muted">Enregistrez uniquement si l&apos;action a été faite (selon le carnet de santé ou la structure) ou refusée. Aucun résultat d&apos;examen n&apos;est saisi dans Jongoma Care.</p>
      <div className="space-y-4">
        {PROGRAMMES.map((pg) => {
          const lignes = etats.filter((e) => e.action.programme === pg.id);
          return (
            <div key={pg.id} className="rounded-xl border border-border">
              <div className="flex items-center justify-between gap-2 border-b border-border bg-stone-50 px-3 py-2">
                <p className="text-sm font-semibold">{pg.nom}</p>
                {pg.sensible && <span className="text-[11px] text-muted">confidentiel</span>}
              </div>
              <ul className="divide-y divide-border">
                {lignes.map((e) => (
                  <li key={e.action.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0">
                      {e.action.libelle}
                      {e.date && <span className="block text-xs text-muted">{e.statut === "fait" ? "Fait" : "Refusé"} le {fmt(e.date)}</span>}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Badge ton={TON[e.statut]}>{LIBELLE_STATUT[e.statut]}</Badge>
                      {modifiable && (
                        <form action={enregistrerPrevention} className="flex gap-1">
                          <input type="hidden" name="beneficiaireId" value={b.id} />
                          <input type="hidden" name="actionId" value={e.action.id} />
                          {e.statut === "fait" || e.statut === "refuse" ? (
                            <button name="statut" value="annuler" className="btn-sec btn-sm" title="Remettre à faire">Annuler</button>
                          ) : (
                            <>
                              <button name="statut" value="fait" className="btn-sec btn-sm hover:!border-emerald-400 hover:!bg-emerald-50">✓ Fait</button>
                              <button name="statut" value="refuse" className="btn-sec btn-sm">Refusé</button>
                            </>
                          )}
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
