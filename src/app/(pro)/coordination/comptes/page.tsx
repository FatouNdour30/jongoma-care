import { Alerte, Badge, fmt, LIBELLES, Titre } from "@/components/ui";
import { traiterDemandeAcces } from "@/lib/actions";
import { db } from "@/lib/db";
import { exigerRole } from "@/lib/session";

const ROLE: Record<string, string> = { referente: "Référente", coordinatrice: "Coordinatrice", etablissement: "Établissement", specialiste: "Spécialiste", beneficiaire: "Bénéficiaire" };

export default async function Comptes({ searchParams }: PageProps<"/coordination/comptes">) {
  await exigerRole("coordinatrice");
  const { erreur } = (await searchParams) as Record<string, string | undefined>;
  const base = db();
  const enAttente = base.comptes.filter((c) => c.statut === "en_attente");
  const personnel = base.comptes.filter((c) => c.role !== "beneficiaire" && c.statut !== "en_attente");
  const nbBenef = base.comptes.filter((c) => c.role === "beneficiaire").length;

  return (
    <div className="space-y-6">
      <Titre titre="Comptes et accès" sous={`${personnel.length} comptes professionnels · ${nbBenef} bénéficiaires avec un compte`} />
      {erreur && <Alerte ton="orange">Choisissez la structure à rattacher avant de valider.</Alerte>}

      <section className="card">
        <h2 className="font-semibold">Demandes d&apos;accès ({enAttente.length})</h2>
        <p className="text-xs text-muted">Vérifiez l&apos;identité et la fonction avant de valider. La personne n&apos;accèdera qu&apos;aux informations de son rôle.</p>
        {enAttente.length === 0 && <p className="mt-3 text-sm text-muted">Aucune demande en attente.</p>}
        <ul className="mt-3 space-y-3">
          {enAttente.map((c) => (
            <li key={c.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{c.nom}</p>
                  <p className="text-sm text-muted">{c.identifiant} · demande du {fmt(c.creeLe)}</p>
                </div>
                <Badge ton="orange">{c.demande?.specialite ? LIBELLES.specialite[c.demande.specialite] : ROLE[c.demande?.roleSouhaite ?? c.role]}</Badge>
              </div>
              <p className="mt-2 text-sm">{[c.demande?.fonction, c.demande?.structure, c.demande?.zone].filter(Boolean).join(" · ") || "—"}</p>
              <form action={traiterDemandeAcces} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="compteId" value={c.id} />
                {c.demande?.roleSouhaite === "etablissement" && (
                  <select name="structureId" className="field w-auto py-1.5 text-sm" required>
                    {base.structures.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
                  </select>
                )}
                <button name="decision" value="valider" className="btn btn-sm">Valider l&apos;accès</button>
                <button name="decision" value="refuser" className="btn-sec btn-sm">Refuser</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold">Comptes professionnels</h2>
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr><th className="py-2">Nom</th><th>Identifiant</th><th>Rôle</th><th>Statut</th><th>Dernière connexion</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {personnel.map((c) => {
              const p = base.personnel.find((x) => x.id === c.refId);
              return (
                <tr key={c.id}>
                  <td className="py-2 font-medium">{c.nom}</td>
                  <td className="text-muted">{c.identifiant}</td>
                  <td>{p?.specialite ? LIBELLES.specialite[p.specialite] : ROLE[c.role]}</td>
                  <td><Badge ton={c.statut === "actif" ? "vert" : "rouge"}>{c.statut === "actif" ? "Actif" : "Refusé"}</Badge></td>
                  <td className="text-muted">{c.derniereConnexion ? new Date(c.derniereConnexion).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
