import Link from "next/link";
import { Alerte, Badge, fmt, Titre } from "@/components/ui";
import { affecter, affecterAutomatiquement, verifierStructure } from "@/lib/actions";
import { db } from "@/lib/db";
import { diffDays, today } from "@/lib/protocol";
import { exigerRole } from "@/lib/session";

const SANS_CONTACT_JOURS = 21;

export default async function Affectations({ searchParams }: PageProps<"/coordination/affectations">) {
  await exigerRole("coordinatrice");
  const { affectees } = (await searchParams) as Record<string, string | undefined>;
  const base = db();
  const t = today();
  const referentes = base.personnel.filter((p) => p.role === "referente");
  const actives = base.beneficiaires.filter((b) => b.etape !== "cloture");
  const prenom = (identiteId: string) => base.identites.find((i) => i.id === identiteId)?.prenom ?? "";
  const nonAffectees = actives.filter((b) => b.consentements.accompagnement && !b.referenteId);
  const sansContact = actives.filter((b) => b.referenteId && (!b.dernierContact || diffDays(t, b.dernierContact) > SANS_CONTACT_JOURS));
  const refusAccompagnement = actives.filter((b) => !b.consentements.accompagnement).length;
  const signalees = base.structures.filter((x) => x.signalements > 0).sort((a, b) => b.signalements - a.signalements);

  return (
    <div className="space-y-5">
      <Titre titre="Affectations" sous={`${actives.length} bénéficiaires actives · ${refusAccompagnement} ont refusé l'accompagnement individuel`} />
      {affectees !== undefined && (
        <Alerte ton={affectees === "0" ? "orange" : "vert"}>
          {affectees === "0" ? "Aucune affectation possible : pas de référente disponible dans ces zones (capacité atteinte)." : `${affectees} bénéficiaire(s) affectée(s) automatiquement.`}
        </Alerte>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        {referentes.map((r) => {
          const charge = actives.filter((b) => b.referenteId === r.id).length;
          const pct = Math.round((charge / r.capaciteMax) * 100);
          return (
            <div key={r.id} className="card">
              <div className="flex justify-between">
                <span className="font-semibold">{r.prenom}</span>
                <span className="text-sm text-muted">{charge} / {r.capaciteMax}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-stone-100">
                <div className={`h-2 rounded-full ${pct > 90 ? "bg-accent" : "bg-brand"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted">{r.zones.join(", ")} · {r.langues.join(", ")}</p>
            </div>
          );
        })}
      </section>

      <section className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">À affecter ({nonAffectees.length})</h2>
          {nonAffectees.length > 0 && (
            <form action={affecterAutomatiquement}>
              <button className="btn btn-sm">Affecter automatiquement</button>
            </form>
          )}
        </div>
        <p className="mb-2 text-xs text-muted">Règle automatique : zone, puis langue, puis charge la plus faible sous la capacité.</p>
        {nonAffectees.length === 0 && <p className="text-sm text-muted">Toutes les bénéficiaires consentantes ont une référente.</p>}
        <ul className="divide-y divide-border text-sm">
          {nonAffectees.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{prenom(b.identiteId)} · {b.zone} · {b.langue} <span className="text-xs text-muted">inscrite le {fmt(b.creeLe)}</span></span>
              <form action={affecter} className="flex gap-2">
                <input type="hidden" name="beneficiaireId" value={b.id} />
                <select name="referenteId" className="field py-1.5 text-sm">
                  {referentes.filter((r) => r.zones.includes(b.zone)).map((r) => <option key={r.id} value={r.id}>{r.prenom}</option>)}
                </select>
                <button className="btn btn-sm">Affecter</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Sans contact depuis plus de {SANS_CONTACT_JOURS} jours ({sansContact.length})</h2>
        <ul className="divide-y divide-border text-sm">
          {sansContact.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <Link href={`/personnel/beneficiaire/${b.id}`} className="underline">{prenom(b.identiteId)}</Link>
              <span className="text-muted">Référente : {referentes.find((r) => r.id === b.referenteId)?.prenom} · dernier contact {fmt(b.dernierContact)}</span>
              <form action={affecter} className="flex gap-2">
                <input type="hidden" name="beneficiaireId" value={b.id} />
                <select name="referenteId" defaultValue={b.referenteId} className="field py-1.5 text-sm">
                  {referentes.filter((r) => r.zones.includes(b.zone)).map((r) => <option key={r.id} value={r.id}>{r.prenom}</option>)}
                </select>
                <button className="btn-sec btn-sm">Réaffecter</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Signalements du répertoire ({signalees.length})</h2>
        {signalees.length === 0 && <p className="text-sm text-muted">Aucune information signalée comme incorrecte.</p>}
        <ul className="divide-y divide-border text-sm">
          {signalees.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                {x.nom} <Badge ton="orange">{x.signalements} signalement{x.signalements > 1 ? "s" : ""}</Badge>
                <span className="block text-xs text-muted">{x.telephone} · dernière vérification {fmt(x.derniereVerification)}</span>
              </span>
              <form action={verifierStructure}>
                <input type="hidden" name="structureId" value={x.id} />
                <button className="btn-sec btn-sm">Informations revérifiées</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}
