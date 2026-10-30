import { DonneesExemple } from "@/components/DonneesExemple";
import { Barres } from "@/components/Graphiques";
import { EnTete, Kpi, Panneau } from "@/components/pro";
import { db } from "@/lib/db";
import { ACTIONS, etatPreventions, PROGRAMMES, type EtatAction } from "@/lib/programmes";
import { exigerRole } from "@/lib/session";
import { ZONES } from "@/lib/types";

// Couverture des programmes de prévention : données agrégées, jamais de résultat d'examen.
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : null);
const aff = (x: number | null) => (x === null ? "—" : `${x} %`);

export default async function Programmes() {
  await exigerRole("coordinatrice");
  const base = db();
  const actives = base.beneficiaires.filter((b) => b.etape !== "cloture");
  const etats = actives.map((b) => ({ b, e: etatPreventions(b, base) }));
  const de = (actionId: string, filtre: (x: (typeof etats)[number]) => boolean = () => true) => {
    const lignes = etats.filter(filtre).map((x) => x.e.find((e) => e.action.id === actionId)!).filter((e: EtatAction) => e.statut !== "plus_tard");
    return { eligibles: lignes.length, faits: lignes.filter((e) => e.statut === "fait").length, retards: lignes.filter((e) => e.statut === "en_retard").length, refus: lignes.filter((e) => e.statut === "refuse").length };
  };
  const couverture = (id: string, f?: (x: (typeof etats)[number]) => boolean) => {
    const d = de(id, f);
    return pct(d.faits, d.eligibles);
  };
  // Triple élimination complète : les trois dépistages proposés.
  const tripleComplet = (f: (x: (typeof etats)[number]) => boolean = () => true) => {
    const xs = etats.filter(f).filter((x) => x.e.some((e) => e.action.programme === "triple" && e.statut !== "plus_tard"));
    return pct(xs.filter((x) => x.e.filter((e) => e.action.programme === "triple").every((e) => e.statut === "fait")).length, xs.length);
  };
  const totalRetards = etats.reduce((n, x) => n + x.e.filter((e) => e.statut === "en_retard").length, 0);

  return (
    <div className="space-y-6">
      <EnTete
        titre="Programmes de santé"
        sous="Prévention et dépistage des maladies prioritaires en santé maternelle. Jongoma Care ne diagnostique pas et n'enregistre aucun résultat d'examen."
        actions={<DonneesExemple />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icone="bouclier" valeur={aff(couverture("moustiquaire"))} libelle="Moustiquaire imprégnée" detail={`TPI 3 doses : ${aff(couverture("tpi3"))}`} />
        <Kpi icone="coeur" valeur={aff(tripleComplet())} libelle="Triple élimination" detail="VIH, syphilis et hépatite B proposés" />
        <Kpi icone="etincelle" valeur={aff(couverture("fer"))} libelle="Fer et acide folique" detail={`Vaccin antitétanique : ${aff(couverture("vat"))}`} />
        <Kpi icone="calendrier" valeur={totalRetards} libelle="Actions en retard" detail="Toutes bénéficiaires actives" ton={totalRetards ? "alerte" : "succes"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {PROGRAMMES.map((pg) => (
          <Panneau key={pg.id} titre={pg.nom} sous={pg.pourquoi}>
            <Barres
              items={ACTIONS.filter((a) => a.programme === pg.id).map((a) => {
                const d = de(a.id);
                return { libelle: a.libelle, v: d.faits, max: Math.max(1, d.eligibles), note: d.retards ? `${d.retards} en retard` : undefined, alerte: d.eligibles > 0 && d.faits / d.eligibles < 0.6 };
              })}
            />
            <p className="mt-3 text-[11px] text-muted">Barre : actions réalisées sur les bénéficiaires concernées à ce stade. En orange : couverture inférieure à 60 %.</p>
          </Panneau>
        ))}
      </div>

      <Panneau titre="Couverture par zone">
        <div className="-mx-5 -my-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-5 py-2.5 font-semibold">Zone</th><th className="text-right font-semibold">Moustiquaire</th><th className="text-right font-semibold">TPI 1re dose</th><th className="text-right font-semibold">Fer</th><th className="text-right font-semibold">Triple élimination</th><th className="pr-5 text-right font-semibold">Vaccin antitétanique</th></tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {ZONES.map((z) => {
                const f = (x: (typeof etats)[number]) => x.b.zone === z;
                return (
                  <tr key={z}>
                    <td className="px-5 py-2.5 font-medium">{z}</td>
                    <td className="text-right">{aff(couverture("moustiquaire", f))}</td>
                    <td className="text-right">{aff(couverture("tpi1", f))}</td>
                    <td className="text-right">{aff(couverture("fer", f))}</td>
                    <td className="text-right">{aff(tripleComplet(f))}</td>
                    <td className="pr-5 text-right">{aff(couverture("vat", f))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panneau>
    </div>
  );
}
