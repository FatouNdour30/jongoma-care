// Droit d'accès et de portabilité : la bénéficiaire télécharge tout ce qui la concerne.
import { db, enregistrer } from "@/lib/db";
import { today } from "@/lib/protocol";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (s?.role !== "beneficiaire") return new Response("Connexion requise", { status: 401 });
  const base = db();
  const b = base.beneficiaires.find((x) => x.id === s.id);
  if (!b) return new Response("Compte introuvable", { status: 404 });

  const rdvIds = new Set(base.rendezVous.filter((r) => r.beneficiaireId === b.id).map((r) => r.id));
  const export_ = {
    exporteLe: today(),
    identite: base.identites.find((i) => i.id === b.identiteId),
    suivi: b,
    referente: base.personnel.find((p) => p.id === b.referenteId)?.prenom ?? null,
    rendezVous: base.rendezVous.filter((r) => rdvIds.has(r.id)),
    demandes: base.demandes.filter((d) => d.beneficiaireId === b.id),
    orientations: base.orientations.filter((o) => o.beneficiaireId === b.id),
    bebes: base.bebes.filter((x) => x.beneficiaireId === b.id),
    vaccinations: base.vaccinations.filter((v) => base.bebes.some((x) => x.id === v.bebeId && x.beneficiaireId === b.id)),
    historique: base.journal.filter((j) => j.cible === b.id || (j.cible && rdvIds.has(j.cible))),
  };
  enregistrer(`beneficiaire:${b.id}`, "export_donnees", b.id);
  return new Response(JSON.stringify(export_, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="jongoma-care-mes-donnees.json"',
      "Cache-Control": "no-store",
    },
  });
}
