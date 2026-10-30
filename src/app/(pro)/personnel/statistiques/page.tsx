import { CarteGraphique, Colonnes, Courbe } from "@/components/Graphiques";
import { EnTete, Kpi } from "@/components/pro";
import { db } from "@/lib/db";
import { addDays, today } from "@/lib/protocol";
import { exigerRole } from "@/lib/session";

const SEMAINES = 8;
const MIN_RDV = 2;
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : null);
const lundi = (iso: string) => addDays(iso, -((new Date(iso).getDay() + 6) % 7));
const court = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

// Statistiques personnelles de la référente, sur son seul périmètre.
export default async function MesStatistiques() {
  const s = await exigerRole("referente");
  const base = db();
  const t = today();
  const mes = base.beneficiaires.filter((b) => b.referenteId === s.id && b.etape !== "cloture");
  const ids = new Set(mes.map((b) => b.id));
  const verifies = base.rendezVous.filter((r) => ids.has(r.beneficiaireId) && r.date < t && (r.statut === "honore" || r.statut === "manque"));
  const depuis30 = addDays(t, -30);
  const rdv30 = verifies.filter((r) => r.date >= depuis30);
  const acteur = `referente:${s.id}`;
  const journal30 = base.journal.filter((j) => j.acteur === acteur && j.date.slice(0, 10) >= depuis30);
  const compte = (f: (a: string) => boolean) => journal30.filter((j) => f(j.action)).length;
  const postnatal = mes.filter((b) => b.etape === "postnatal");
  const postSuivies = postnatal.filter((b) => base.rendezVous.some((r) => r.beneficiaireId === b.id && r.type === "CPoN" && r.statut === "honore"));

  const debut = lundi(addDays(t, -7 * (SEMAINES - 1)));
  const hebdo = Array.from({ length: SEMAINES }, (_, i) => {
    const de = addDays(debut, i * 7);
    const r = verifies.filter((x) => x.date >= de && x.date < addDays(de, 7));
    const ok = r.filter((x) => x.statut === "honore").length;
    return { x: court(de), v: r.length >= MIN_RDV ? pct(ok, r.length) : null, detail: `${ok} sur ${r.length}` };
  });
  const etapes = [
    { x: "Grossesse", v: mes.filter((b) => b.etape === "grossesse").length },
    { x: "Préparation", v: mes.filter((b) => b.etape === "preparation").length },
    { x: "Postnatal", v: postnatal.length },
  ];
  const taux = pct(rdv30.filter((r) => r.statut === "honore").length, rdv30.length);

  return (
    <div className="space-y-6">
      <EnTete titre="Mes statistiques" sous="Résultats de vos bénéficiaires et votre activité. Pour vous aider à organiser votre travail, pas pour vous évaluer." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icone="calendrier" valeur={taux === null ? "—" : `${taux} %`} libelle="Rendez-vous honorés" detail={`30 derniers jours · ${rdv30.length} vérifiés`} />
        <Kpi icone="coeur" valeur={postnatal.length ? `${pct(postSuivies.length, postnatal.length)} %` : "—"} libelle="Continuité postnatale" detail={`${postSuivies.length} sur ${postnatal.length} mères`} />
        <Kpi icone="telephone" valeur={compte((a) => a === "contact" || a === "appel_sans_reponse")} libelle="Appels enregistrés" detail="30 derniers jours" ton="neutre" />
        <Kpi icone="message" valeur={compte((a) => a === "rappel_envoye")} libelle="Rappels envoyés" detail={`${compte((a) => a.startsWith("orientation_"))} orientation(s) proposée(s)`} ton="neutre" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <CarteGraphique titre="Rendez-vous honorés par semaine" sous={`Vos bénéficiaires · ${SEMAINES} dernières semaines · semaines avec moins de ${MIN_RDV} rendez-vous non affichées`}>
          <Courbe points={hebdo} />
        </CarteGraphique>
        <CarteGraphique titre="Où en sont vos bénéficiaires" sous="Par étape du parcours">
          <Colonnes items={etapes} />
        </CarteGraphique>
      </div>
    </div>
  );
}
