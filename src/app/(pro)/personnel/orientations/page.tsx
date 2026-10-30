import Link from "next/link";
import { EnTete, Onglets, Panneau, Vide, ilYa } from "@/components/pro";
import { Badge, LIBELLES } from "@/components/ui";
import { db } from "@/lib/db";
import { diffDays, today } from "@/lib/protocol";
import { exigerRole } from "@/lib/session";

// Les motifs des orientations sensibles ne sont visibles que par la spécialiste.
const SENSIBLES = new Set(["psychosocial", "protection"]);
const DELAI_ALERTE_JOURS = 3;

export default async function MesOrientations({ searchParams }: PageProps<"/personnel/orientations">) {
  const s = await exigerRole("referente");
  const { vue } = (await searchParams) as Record<string, string | undefined>;
  const ouvertes = vue !== "terminees";
  const base = db();
  const t = today();
  const ids = new Set(base.beneficiaires.filter((b) => b.referenteId === s.id).map((b) => b.id));
  const toutes = base.orientations.filter((o) => ids.has(o.beneficiaireId)).sort((a, b) => b.creeLe.localeCompare(a.creeLe));
  const estOuverte = (statut: string) => !["cloturee", "refusee"].includes(statut);
  const liste = toutes.filter((o) => estOuverte(o.statut) === ouvertes);
  const prenom = (beneficiaireId: string) => {
    const b = base.beneficiaires.find((x) => x.id === beneficiaireId);
    return base.identites.find((i) => i.id === b?.identiteId)?.prenom ?? "";
  };
  const specialiste = (id: string) => base.personnel.find((p) => p.id === id)?.prenom ?? "";

  return (
    <div className="space-y-6">
      <EnTete titre="Mes orientations" sous="Suivi des orientations proposées à vos bénéficiaires. Les motifs psychosociaux et de protection restent confidentiels." />
      <Panneau
        titre={ouvertes ? "En cours" : "Terminées"}
        compteur={liste.length}
        action={
          <Onglets
            actif={ouvertes ? "ouvertes" : "terminees"}
            onglets={[
              { id: "ouvertes", libelle: "En cours", href: "/personnel/orientations", compteur: toutes.filter((o) => estOuverte(o.statut)).length },
              { id: "terminees", libelle: "Terminées", href: "/personnel/orientations?vue=terminees", compteur: toutes.filter((o) => !estOuverte(o.statut)).length },
            ]}
          />
        }
      >
        {liste.length === 0 ? (
          <Vide icone="message" titre="Aucune orientation dans cette liste" texte="Proposez une orientation depuis le dossier d'une bénéficiaire, avec son accord." />
        ) : (
          <div className="-mx-5 -my-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-muted">
                <tr><th className="px-5 py-2.5 font-semibold">Bénéficiaire</th><th className="font-semibold">Vers</th><th className="font-semibold">Motif</th><th className="font-semibold">Consentement</th><th className="font-semibold">Statut</th><th className="pr-5 font-semibold">Depuis</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {liste.map((o) => {
                  const attente = o.statut === "transmise" && diffDays(t, o.creeLe) > DELAI_ALERTE_JOURS;
                  return (
                    <tr key={o.id} className="hover:bg-stone-50">
                      <td className="px-5 py-3"><Link href={`/personnel/beneficiaire/${o.beneficiaireId}`} className="font-medium hover:text-brand">{prenom(o.beneficiaireId)}</Link></td>
                      <td>{LIBELLES.specialite[o.type]}<span className="block text-xs text-muted">{specialiste(o.specialisteId)}</span></td>
                      <td className="max-w-56 text-muted">{SENSIBLES.has(o.type) ? <span className="italic">Confidentiel</span> : o.motif || "—"}</td>
                      <td>{o.consentementLe ? <Badge ton="vert">Recueilli</Badge> : <Badge ton="orange">À recueillir</Badge>}</td>
                      <td><Badge ton={o.statut === "prise_en_charge" ? "vert" : o.statut === "refusee" ? "rouge" : attente ? "orange" : "bleu"}>{LIBELLES.orientation[o.statut]}</Badge></td>
                      <td className={`pr-5 text-xs ${attente ? "font-semibold text-accent" : "text-muted"}`}>{ilYa(o.creeLe)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panneau>
    </div>
  );
}
