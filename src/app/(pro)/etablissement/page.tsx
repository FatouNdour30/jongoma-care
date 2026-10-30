import { Avatar, EnTete, Kpi, Panneau, Semaine, Vide, ilYa } from "@/components/pro";
import { Badge, fmt, LIBELLES } from "@/components/ui";
import { confirmerRdv, replanifierRdv, repondreDemande } from "@/lib/actions";
import { db } from "@/lib/db";
import { addDays, today } from "@/lib/protocol";
import { exigerRole } from "@/lib/session";

const OUVERTES = ["envoyee", "recue", "en_attente"];

export default async function EspaceEtablissement() {
  const s = await exigerRole("etablissement");
  const base = db();
  const compte = base.comptesEtablissement.find((c) => c.id === s.id);
  const structure = base.structures.find((x) => x.id === compte?.structureId);
  if (!structure) return null;
  const t = today();
  const prenom = (beneficiaireId: string) => {
    const b = base.beneficiaires.find((x) => x.id === beneficiaireId);
    return base.identites.find((i) => i.id === b?.identiteId)?.prenom ?? "";
  };
  // Accès limité aux demandes et rendez-vous adressés à cette structure.
  const demandes = base.demandes.filter((d) => d.structureId === structure.id).sort((a, b) => b.creeLe.localeCompare(a.creeLe));
  const ouvertes = demandes.filter((d) => OUVERTES.includes(d.statut));
  const traitees = demandes.filter((d) => !OUVERTES.includes(d.statut) && d.statut !== "annulee");
  const rdvStructure = base.rendezVous.filter((r) => r.structureId === structure.id && r.statut === "prevu" && r.date >= t);
  const aConfirmer = rdvStructure.filter((r) => !r.confirmeParStructure).sort((a, b) => a.date.localeCompare(b.date));
  const semaine = rdvStructure.filter((r) => r.date <= addDays(t, 6));
  const confirmes14 = rdvStructure.filter((r) => r.confirmeParStructure && r.date <= addDays(t, 14)).length;
  const tauxReponse = demandes.length ? Math.round((traitees.length / demandes.filter((d) => d.statut !== "annulee").length) * 100) : null;

  return (
    <div className="space-y-6">
      <EnTete
        titre={structure.nom}
        sous={`Espace établissement partenaire · ${structure.zone} · ${structure.horaires}`}
        actions={<a href="#demandes" className="btn btn-sm">Traiter les demandes</a>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icone="message" valeur={ouvertes.length} libelle="Demandes à traiter" detail="Mises en relation reçues" ton={ouvertes.length ? "alerte" : "succes"} href="#demandes" />
        <Kpi icone="calendrier" valeur={aConfirmer.length} libelle="Rendez-vous à confirmer" detail="Seule la structure confirme" ton={aConfirmer.length ? "alerte" : "succes"} href="#confirmer" />
        <Kpi icone="hopital" valeur={confirmes14} libelle="Confirmés sur 14 jours" detail="Agenda à venir" />
        <Kpi icone="graphique" valeur={tauxReponse === null ? "—" : `${tauxReponse} %`} libelle="Taux de réponse" detail={`${traitees.length} demande(s) traitée(s)`} ton="succes" />
      </div>

      <Panneau titre="Cette semaine" sous="Rendez-vous prévus dans votre structure" compteur={semaine.length}>
        <Semaine
          elements={semaine}
          date={(r) => r.date}
          vide="—"
          rendu={(r) => (
            <div title={`${prenom(r.beneficiaireId)} — ${r.libelle}`} className={`truncate rounded-md px-1.5 py-1 text-[11px] font-medium ${r.confirmeParStructure ? "bg-card ring-1 ring-border" : "bg-amber-100 text-amber-900"}`}>
              {prenom(r.beneficiaireId)}
            </div>
          )}
        />
        <p className="mt-3 flex items-center gap-3 text-[11px] text-muted">
          <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-card ring-1 ring-border" /> confirmé</span>
          <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-amber-100" /> à confirmer</span>
        </p>
      </Panneau>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panneau id="demandes" titre="Demandes de mise en relation" sous="Acceptez, proposez une autre date ou indiquez que vous ne pouvez pas traiter la demande." compteur={ouvertes.length}>
          {ouvertes.length === 0 ? (
            <Vide titre="Aucune demande en attente" texte="Les nouvelles demandes des bénéficiaires apparaîtront ici." />
          ) : (
            <ul className="space-y-3">
              {ouvertes.map((d) => (
                <li key={d.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar nom={prenom(d.beneficiaireId)} />
                      <div>
                        <p className="font-semibold">{prenom(d.beneficiaireId)} <span className="font-normal text-muted">— {d.besoin}</span></p>
                        <p className="text-xs text-muted">Reçue {ilYa(d.creeLe)}</p>
                      </div>
                    </div>
                    <Badge ton="orange">{LIBELLES.demande[d.statut]}</Badge>
                  </div>
                  <form action={repondreDemande} className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <input type="hidden" name="demandeId" value={d.id} />
                    <input type="date" name="date" defaultValue={addDays(t, 3)} min={t} className="field w-auto py-1.5 text-sm" aria-label="Date du rendez-vous" />
                    <button name="statut" value="acceptee" className="btn btn-sm">Accepter à cette date</button>
                    <button name="statut" value="autre_date" className="btn-sec btn-sm">Proposer cette date</button>
                    <button name="statut" value="refusee" className="btn-sec btn-sm">Ne peut pas traiter</button>
                    {d.statut !== "en_attente" && <button name="statut" value="en_attente" className="btn-sec btn-sm">Mettre en attente</button>}
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Panneau>

        <Panneau id="confirmer" titre="Rendez-vous à confirmer" sous="Aucun rendez-vous n'est confirmé automatiquement." compteur={aConfirmer.length}>
          {aConfirmer.length === 0 ? (
            <Vide icone="calendrier" titre="Tous les rendez-vous sont confirmés" />
          ) : (
            <ul className="-my-3 divide-y divide-border text-sm">
              {aConfirmer.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{prenom(r.beneficiaireId)}</p>
                    <p className="text-xs text-muted">{r.libelle} · {fmt(r.date)}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <form action={confirmerRdv}>
                      <input type="hidden" name="rdvId" value={r.id} />
                      <button className="btn btn-sm">Confirmer</button>
                    </form>
                    <form action={replanifierRdv} className="flex gap-1">
                      <input type="hidden" name="rdvId" value={r.id} />
                      <input type="date" name="date" min={t} required className="field w-auto py-1 text-xs" aria-label="Nouvelle date" />
                      <button className="btn-sec btn-sm">Déplacer</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panneau>
      </div>

      <Panneau titre="Historique des demandes" compteur={traitees.length}>
        {traitees.length === 0 ? (
          <Vide icone="message" titre="Aucune demande traitée pour le moment" />
        ) : (
          <div className="-mx-5 -my-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-muted">
                <tr><th className="px-5 py-2.5 font-semibold">Bénéficiaire</th><th className="font-semibold">Besoin</th><th className="font-semibold">Date proposée</th><th className="font-semibold">Réponse</th><th className="pr-5 font-semibold">Mise à jour</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {traitees.map((d) => (
                  <tr key={d.id}>
                    <td className="px-5 py-2.5 font-medium">{prenom(d.beneficiaireId)}</td>
                    <td>{d.besoin}</td>
                    <td>{fmt(d.dateProposee)}</td>
                    <td><Badge ton={d.statut === "acceptee" ? "vert" : d.statut === "refusee" ? "rouge" : "orange"}>{LIBELLES.demande[d.statut]}</Badge></td>
                    <td className="pr-5 text-muted">{ilYa(d.majLe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panneau>
    </div>
  );
}
