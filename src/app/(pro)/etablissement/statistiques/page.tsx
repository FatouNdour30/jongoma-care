import { Barres, CarteGraphique, Colonnes } from "@/components/Graphiques";
import { EnTete, Kpi } from "@/components/pro";
import { LIBELLES } from "@/components/ui";
import { db } from "@/lib/db";
import { addDays, diffDays, today } from "@/lib/protocol";
import { exigerRole } from "@/lib/session";

const SEMAINES = 6;
const court = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

// Statistiques de la structure, sur ses seules demandes et rendez-vous.
export default async function StatistiquesEtablissement() {
  const s = await exigerRole("etablissement");
  const base = db();
  const t = today();
  const sid = base.comptesEtablissement.find((c) => c.id === s.id)?.structureId;
  const demandes = base.demandes.filter((d) => d.structureId === sid && d.statut !== "annulee");
  const traitees = demandes.filter((d) => !["envoyee", "recue", "en_attente"].includes(d.statut));
  const acceptees = traitees.filter((d) => d.statut === "acceptee" || d.statut === "autre_date");
  const delai = traitees.length ? (traitees.reduce((n, d) => n + Math.max(0, diffDays(d.majLe, d.creeLe)), 0) / traitees.length).toFixed(1) : null;
  const rdv = base.rendezVous.filter((r) => r.structureId === sid);
  const passes = rdv.filter((r) => r.date < t && (r.statut === "honore" || r.statut === "manque"));

  const aVenir = Array.from({ length: SEMAINES }, (_, i) => {
    const de = addDays(t, i * 7);
    return { x: court(de), v: rdv.filter((r) => r.statut === "prevu" && r.date >= de && r.date < addDays(de, 7)).length };
  });
  const statuts = (["envoyee", "en_attente", "acceptee", "autre_date", "refusee"] as const).map((st) => ({ libelle: LIBELLES.demande[st], v: demandes.filter((d) => d.statut === st).length, max: Math.max(1, demandes.length) }));

  return (
    <div className="space-y-6">
      <EnTete titre="Statistiques" sous="Activité de votre structure dans Jongoma Care." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icone="message" valeur={demandes.length} libelle="Demandes reçues" detail={`${traitees.length} traitée(s)`} />
        <Kpi icone="bouclier" valeur={traitees.length ? `${Math.round((acceptees.length / traitees.length) * 100)} %` : "—"} libelle="Demandes acceptées" detail="Acceptées ou autre date proposée" ton="succes" />
        <Kpi icone="calendrier" valeur={delai === null ? "—" : `${delai} j`} libelle="Délai moyen de réponse" detail="Entre réception et réponse" ton="neutre" />
        <Kpi icone="hopital" valeur={passes.length ? `${Math.round((passes.filter((r) => r.statut === "honore").length / passes.length) * 100)} %` : "—"} libelle="Rendez-vous honorés" detail={`${passes.length} rendez-vous vérifiés`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <CarteGraphique titre="Rendez-vous à venir" sous={`Par semaine · ${SEMAINES} prochaines semaines`}>
          <Colonnes items={aVenir} />
        </CarteGraphique>
        <CarteGraphique titre="Demandes par statut">
          <Barres items={statuts} />
        </CarteGraphique>
      </div>
    </div>
  );
}
