import Link from "next/link";
import { AgendaListe, EnTete, Onglets, Panneau } from "@/components/pro";
import { db } from "@/lib/db";
import { addDays, today } from "@/lib/protocol";
import { exigerRole } from "@/lib/session";

const DUREES = [7, 14, 28];

export default async function Agenda({ searchParams }: PageProps<"/personnel/agenda">) {
  const s = await exigerRole("referente");
  const { jours } = (await searchParams) as Record<string, string | undefined>;
  const nb = DUREES.includes(Number(jours)) ? Number(jours) : 14;
  const base = db();
  const t = today();
  const ids = new Set(base.beneficiaires.filter((b) => b.referenteId === s.id && b.etape !== "cloture").map((b) => b.id));
  const rdvs = base.rendezVous.filter((r) => ids.has(r.beneficiaireId) && r.statut === "prevu" && r.date >= t && r.date < addDays(t, nb)).sort((a, b) => a.date.localeCompare(b.date));
  const prenom = (beneficiaireId: string) => {
    const b = base.beneficiaires.find((x) => x.id === beneficiaireId);
    return base.identites.find((i) => i.id === b?.identiteId)?.prenom ?? "";
  };
  const structure = (id: string) => base.structures.find((x) => x.id === id)?.nom ?? "";
  const nonConfirmes = rdvs.filter((r) => !r.confirmeParStructure).length;
  const rappels = rdvs.filter((r) => r.rappelEnvoyeLe).length;

  return (
    <div className="space-y-6">
      <EnTete titre="Agenda" sous={`${rdvs.length} rendez-vous sur ${nb} jours · ${nonConfirmes} en attente de confirmation · ${rappels} rappel(s) déjà envoyé(s)`} actions={<Onglets actif={String(nb)} onglets={DUREES.map((d) => ({ id: String(d), libelle: `${d} jours`, href: `/personnel/agenda?jours=${d}` }))} />} />
      <Panneau titre="Rendez-vous à venir" compteur={rdvs.length}>
        {rdvs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Aucun rendez-vous prévu sur cette période.</p>
        ) : (
          <AgendaListe
            elements={rdvs}
            nbJours={nb}
            masquerVides={nb > 7}
            date={(r) => r.date}
            rendu={(r) => (
              <Link href={`/personnel/beneficiaire/${r.beneficiaireId}`} className="flex min-w-64 items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm transition hover:border-brand">
                <span className={`size-2 shrink-0 rounded-full ${r.confirmeParStructure ? "bg-emerald-500" : "bg-amber-400"}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{prenom(r.beneficiaireId)} <span className="font-normal text-muted">· {r.libelle}</span></span>
                  <span className="block truncate text-xs text-muted">
                    {structure(r.structureId)} · {r.confirmeParStructure ? "confirmé" : "non confirmé"}{r.rappelEnvoyeLe ? " · rappel envoyé" : ""}
                  </span>
                </span>
              </Link>
            )}
          />
        )}
        <p className="mt-4 flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /> confirmé par la structure</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400" /> en attente de confirmation</span>
        </p>
      </Panneau>
    </div>
  );
}
