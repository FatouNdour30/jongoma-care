import { Badge, libelleAction, Titre } from "@/components/ui";
import { db } from "@/lib/db";
import { exigerRole } from "@/lib/session";

export default async function Journal() {
  await exigerRole("coordinatrice");
  const { journal } = db();
  return (
    <div className="space-y-6">
      <Titre titre="Journal d'audit" sous="Actions et consultations de dossiers. Le journal ne contient que des identifiants, jamais de contenu de santé." />
      <section className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr><th className="py-2">Date</th><th>Acteur</th><th>Action</th><th>Cible</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {journal.slice(0, 200).map((j) => (
              <tr key={j.id}>
                <td className="whitespace-nowrap py-2 text-muted">{new Date(j.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" })}</td>
                <td>{j.acteur}</td>
                <td>{libelleAction(j.action)}</td>
                <td>{j.cible && <Badge>{j.cible}</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {journal.length === 0 && <p className="py-4 text-sm text-muted">Aucune action enregistrée.</p>}
      </section>
    </div>
  );
}
