import { AgendaListe, EnTete, Onglets, Panneau } from "@/components/pro";
import { confirmerRdv } from "@/lib/actions";
import { db } from "@/lib/db";
import { addDays, today } from "@/lib/protocol";
import { exigerRole } from "@/lib/session";

const DUREES = [7, 14, 28];

export default async function AgendaEtablissement({ searchParams }: PageProps<"/etablissement/agenda">) {
  const s = await exigerRole("etablissement");
  const { jours } = (await searchParams) as Record<string, string | undefined>;
  const nb = DUREES.includes(Number(jours)) ? Number(jours) : 14;
  const base = db();
  const t = today();
  const compte = base.comptesEtablissement.find((c) => c.id === s.id);
  // Seuls les rendez-vous de cette structure.
  const rdvs = base.rendezVous.filter((r) => r.structureId === compte?.structureId && r.statut === "prevu" && r.date >= t && r.date < addDays(t, nb)).sort((a, b) => a.date.localeCompare(b.date));
  const prenom = (beneficiaireId: string) => {
    const b = base.beneficiaires.find((x) => x.id === beneficiaireId);
    return base.identites.find((i) => i.id === b?.identiteId)?.prenom ?? "";
  };
  const aConfirmer = rdvs.filter((r) => !r.confirmeParStructure).length;

  return (
    <div className="space-y-6">
      <EnTete titre="Agenda" sous={`${rdvs.length} rendez-vous sur ${nb} jours · ${aConfirmer} à confirmer`} actions={<Onglets actif={String(nb)} onglets={DUREES.map((d) => ({ id: String(d), libelle: `${d} jours`, href: `/etablissement/agenda?jours=${d}` }))} />} />
      <Panneau titre="Rendez-vous de la structure" compteur={rdvs.length}>
        {rdvs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Aucun rendez-vous prévu sur cette période.</p>
        ) : (
          <AgendaListe
            elements={rdvs}
            nbJours={nb}
            masquerVides={nb > 7}
            date={(r) => r.date}
            rendu={(r) => (
              <div className="flex min-w-64 items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm">
                <span className={`size-2 shrink-0 rounded-full ${r.confirmeParStructure ? "bg-emerald-500" : "bg-amber-400"}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{prenom(r.beneficiaireId)}</span>
                  <span className="block truncate text-xs text-muted">{r.libelle}</span>
                </span>
                {!r.confirmeParStructure && (
                  <form action={confirmerRdv}>
                    <input type="hidden" name="rdvId" value={r.id} />
                    <button className="btn btn-sm">Confirmer</button>
                  </form>
                )}
              </div>
            )}
          />
        )}
      </Panneau>
    </div>
  );
}
