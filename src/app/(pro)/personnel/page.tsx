import { nomLangue } from "@/lib/langues";
import Link from "next/link";
import { Copier } from "@/components/Copier";
import { Icone } from "@/components/Icone";
import { AgendaListe, Avatar, EnTete, Kpi, Panneau, Vide, ilYa } from "@/components/pro";
import { Badge, fmt, LIBELLES, tonPriorite } from "@/components/ui";
import { enregistrerContact, enregistrerSansReponse, marquerRappelEnvoye, verifierRdv } from "@/lib/actions";
import { db } from "@/lib/db";
import { calculerPriorite } from "@/lib/priority";
import { addDays, diffDays, today } from "@/lib/protocol";
import { DELAI_RAPPEL_JOURS, rappelsAEnvoyer, texteRappel, texteRappelVaccin, vaccinsARappeler } from "@/lib/rappels";
import { exigerRole } from "@/lib/session";

const CANAL = { sms: "SMS", appel: "Appel", audio: "Message audio" } as const;
const TAILLE_FILE = 6;
const SANS_CONTACT_JOURS = 14;

export default async function TableauReferente({ searchParams }: PageProps<"/personnel">) {
  const s = await exigerRole("referente");
  const { q = "", niveau = "", etape = "" } = (await searchParams) as Record<string, string | undefined>;
  const base = db();
  const moi = base.personnel.find((p) => p.id === s.id);
  const t = today();
  const ident = (identiteId: string) => base.identites.find((i) => i.id === identiteId);
  const prenom = (identiteId: string) => ident(identiteId)?.prenom ?? "";
  const benefDe = (id: string) => base.beneficiaires.find((b) => b.id === id)!;

  // F-29 : uniquement les bénéficiaires affectées à cette référente.
  const mesBenef = base.beneficiaires
    .filter((b) => b.referenteId === s.id && b.etape !== "cloture")
    .map((b) => ({ b, p: calculerPriorite(b, base) }))
    .sort((x, y) => y.p.score - x.p.score);
  const ids = new Set(mesBenef.map((x) => x.b.id));

  const fileAppels = mesBenef.filter(({ b, p }) => !p.iaRefusee && p.niveau !== "basse" && b.dernierContact !== t).slice(0, TAILLE_FILE);
  const aVerifier = base.rendezVous.filter((r) => ids.has(r.beneficiaireId) && r.statut === "prevu" && r.date < t).sort((a, b) => a.date.localeCompare(b.date));
  const aVenir = base.rendezVous.filter((r) => ids.has(r.beneficiaireId) && r.statut === "prevu" && r.date >= t && r.date <= addDays(t, 6)).sort((a, b) => a.date.localeCompare(b.date));
  const rappels = rappelsAEnvoyer(base, ids);
  const vaccins = vaccinsARappeler(base, ids);
  const sansContact = mesBenef.filter(({ b }) => !b.dernierContact || diffDays(t, b.dernierContact) > SANS_CONTACT_JOURS).length;
  const joignesAujourdhui = mesBenef.filter(({ b }) => b.dernierContact === t).length;

  const recherche = q.trim().toLowerCase();
  const filtrees = mesBenef.filter(
    ({ b, p }) =>
      (!recherche || prenom(b.identiteId).toLowerCase().includes(recherche)) &&
      (!niveau || (niveau === "non_calcule" ? p.iaRefusee : !p.iaRefusee && p.niveau === niveau)) &&
      (!etape || b.etape === etape),
  );
  const capacite = moi?.capaciteMax ?? 25;

  return (
    <div className="space-y-6">
      <EnTete
        titre={`Bonjour ${moi?.prenom}`}
        sous={`Référente principale · ${moi?.zones.join(", ")} · ${joignesAujourdhui} contact${joignesAujourdhui > 1 ? "s" : ""} aujourd'hui`}
        actions={
          <>
            <a href="#rdv" className="btn-sec btn-sm">Rendez-vous à vérifier</a>
            <a href="#liste" className="btn btn-sm">Toutes mes bénéficiaires</a>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icone="equipe" valeur={`${mesBenef.length}`} libelle="Bénéficiaires suivies" detail={`Capacité ${capacite}`} jauge={(mesBenef.length / capacite) * 100} />
        <Kpi icone="telephone" valeur={fileAppels.length} libelle="À appeler en priorité" detail={`${sansContact} sans contact depuis ${SANS_CONTACT_JOURS} j`} ton={fileAppels.length ? "alerte" : "succes"} href="#appels" />
        <Kpi icone="calendrier" valeur={aVerifier.length} libelle="Rendez-vous à vérifier" detail="Passés, statut inconnu" ton={aVerifier.length ? "alerte" : "succes"} href="#rdv" />
        <Kpi icone="message" valeur={rappels.length} libelle="Rappels à envoyer" detail={`Rendez-vous des ${DELAI_RAPPEL_JOURS} prochains jours`} href="#rappels" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <Panneau id="appels" titre="Ma file d'appels" sous="Ordre proposé par le score de priorisation. Il organise les appels, il ne décide rien." compteur={fileAppels.length}>
          {fileAppels.length === 0 ? (
            <Vide titre="Personne à rappeler en priorité" texte="Toutes vos bénéficiaires prioritaires ont été jointes aujourd'hui." />
          ) : (
            <ul className="-my-3 divide-y divide-border">
              {fileAppels.map(({ b, p }) => {
                const id = ident(b.identiteId);
                return (
                  <li key={b.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <Avatar nom={id?.prenom ?? "?"} ton={p.niveau === "haute" ? "alerte" : "marque"} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/personnel/beneficiaire/${b.id}`} className="font-semibold hover:text-brand">{id?.prenom}</Link>
                          <Badge ton={tonPriorite(p.niveau)}>{p.niveau} · {p.score}</Badge>
                          <span className="text-xs text-muted">{CANAL[b.canal]} · {b.horaireContact}{b.messageDiscret ? " · discret" : ""}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted">{p.motifs.join(" · ")}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5 pl-12 sm:pl-0">
                      {id?.telephone && (
                        <a href={`tel:${id.telephone.replace(/\s/g, "")}`} className="btn btn-sm" title={id.telephone}>
                          <Icone nom="telephone" className="size-3.5" /> Appeler
                        </a>
                      )}
                      <form action={enregistrerContact}>
                        <input type="hidden" name="beneficiaireId" value={b.id} />
                        <button className="btn-sec btn-sm" title="Contact établi aujourd'hui">Joint</button>
                      </form>
                      <form action={enregistrerSansReponse}>
                        <input type="hidden" name="beneficiaireId" value={b.id} />
                        <button className="btn-sec btn-sm" title="Appel sans réponse">Sans réponse</button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panneau>

        <Panneau titre="Cette semaine" sous="Rendez-vous prévus de vos bénéficiaires" compteur={aVenir.length}>
          <AgendaListe
            elements={aVenir}
            date={(r) => r.date}
            rendu={(r) => (
              <Link
                href={`/personnel/beneficiaire/${r.beneficiaireId}`}
                title={`${prenom(benefDe(r.beneficiaireId).identiteId)} — ${r.libelle}${r.confirmeParStructure ? "" : " (non confirmé)"}`}
                className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium hover:ring-brand ${r.confirmeParStructure ? "bg-card text-foreground ring-1 ring-border" : "bg-amber-100 text-amber-900"}`}
              >
                {prenom(benefDe(r.beneficiaireId).identiteId)} <span className="font-normal text-muted">· {r.type}</span>
              </Link>
            )}
          />
          <p className="mt-3 flex items-center gap-3 text-[11px] text-muted">
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-card ring-1 ring-border" /> confirmé</span>
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-amber-100" /> en attente de la structure</span>
          </p>
        </Panneau>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panneau id="rdv" titre="Rendez-vous passés à vérifier" sous="Confirmez avec la bénéficiaire si elle a pu s'y rendre." compteur={aVerifier.length}>
          {aVerifier.length === 0 ? (
            <Vide titre="Tout est à jour" texte="Aucun rendez-vous passé en attente de vérification." />
          ) : (
            <ul className="-my-3 divide-y divide-border text-sm">
              {aVerifier.map((r) => {
                const b = benefDe(r.beneficiaireId);
                return (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 sm:flex-nowrap">
                    <div className="min-w-0">
                      <Link href={`/personnel/beneficiaire/${b.id}`} className="font-medium hover:text-brand">{prenom(b.identiteId)}</Link>
                      <p className="text-xs text-muted">{r.libelle} · {fmt(r.date)} ({ilYa(r.date)})</p>
                    </div>
                    <form action={verifierRdv} className="flex shrink-0 gap-1.5">
                      <input type="hidden" name="rdvId" value={r.id} />
                      <button name="statut" value="honore" className="btn-sec btn-sm hover:!border-emerald-400 hover:!bg-emerald-50">✓ Honoré</button>
                      <button name="statut" value="manque" className="btn-sec btn-sm hover:!border-red-300 hover:!bg-red-50">✗ Manqué</button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </Panneau>

        <Panneau id="rappels" titre="Rappels à envoyer" sous="Bénéficiaires ayant accepté les rappels. Le texte respecte le mode discret." compteur={rappels.length}>
          {rappels.length === 0 ? (
            <Vide icone="message" titre="Aucun rappel en attente" />
          ) : (
            <ul className="space-y-3 text-sm">
              {rappels.map((r) => {
                const b = benefDe(r.beneficiaireId);
                const texte = texteRappel(r, base);
                return (
                  <li key={r.id} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/personnel/beneficiaire/${b.id}`} className="font-medium hover:text-brand">{prenom(b.identiteId)}</Link>
                      <span className="text-xs text-muted">{CANAL[b.canal]} · {b.horaireContact} · RDV {fmt(r.date)}</span>
                    </div>
                    <p className="my-2 rounded-lg bg-stone-50 p-2.5 text-xs leading-relaxed">{texte}</p>
                    <div className="flex gap-2">
                      <Copier texte={texte} />
                      <form action={marquerRappelEnvoye}>
                        <input type="hidden" name="rdvId" value={r.id} />
                        <button className="btn btn-sm">Marquer envoyé</button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panneau>

        <Panneau id="vaccins" titre="Vaccins à rappeler" sous="Bébés dont la prochaine vaccination est dans les 7 jours ou en retard (calendrier indicatif)." compteur={vaccins.length}>
          {vaccins.length === 0 ? (
            <Vide icone="calendrier" titre="Aucune vaccination à rappeler" />
          ) : (
            <ul className="space-y-3 text-sm">
              {vaccins.map(({ bebe, etape }) => {
                const b = benefDe(bebe.beneficiaireId);
                const texte = texteRappelVaccin(bebe, etape, base);
                return (
                  <li key={bebe.id} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/personnel/beneficiaire/${b.id}`} className="font-medium hover:text-brand">{prenom(b.identiteId)}</Link>
                      <span className="text-xs text-muted">{CANAL[b.canal]} · {etape.age} · {etape.enRetard ? <span className="font-semibold text-red-700">en retard</span> : `vers le ${fmt(etape.du)}`}</span>
                    </div>
                    <p className="my-2 rounded-lg bg-stone-50 p-2.5 text-xs leading-relaxed">{texte}</p>
                    <Copier texte={texte} />
                  </li>
                );
              })}
            </ul>
          )}
        </Panneau>
      </div>

      <Panneau
        id="liste"
        titre="Toutes mes bénéficiaires"
        compteur={mesBenef.length}
        action={
          <form className="flex flex-wrap gap-2">
            <input name="q" defaultValue={q} placeholder="Rechercher un prénom" className="field w-44 py-1.5 text-sm" />
            <select name="niveau" defaultValue={niveau} className="field w-auto py-1.5 text-sm">
              <option value="">Toutes priorités</option>
              <option value="haute">Haute</option>
              <option value="moyenne">Moyenne</option>
              <option value="basse">Basse</option>
              <option value="non_calcule">Non calculée</option>
            </select>
            <select name="etape" defaultValue={etape} className="field w-auto py-1.5 text-sm">
              <option value="">Toutes étapes</option>
              {(["grossesse", "preparation", "postnatal"] as const).map((e) => <option key={e} value={e}>{LIBELLES.etape[e]}</option>)}
            </select>
            <button className="btn btn-sm">Filtrer</button>
            {(q || niveau || etape) && <Link href="/personnel#liste" className="btn-sec btn-sm">Effacer</Link>}
          </form>
        }
      >
        <div className="-mx-5 -my-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Bénéficiaire</th>
                <th className="font-semibold">Priorité</th>
                <th className="font-semibold">Motifs</th>
                <th className="font-semibold">Étape</th>
                <th className="font-semibold">Prochain RDV</th>
                <th className="pr-5 font-semibold">Dernier contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtrees.map(({ b, p }) => {
                const prochain = base.rendezVous.filter((r) => r.beneficiaireId === b.id && r.statut === "prevu" && r.date >= t).sort((x, y) => x.date.localeCompare(y.date))[0];
                const ancien = !b.dernierContact || diffDays(t, b.dernierContact) > SANS_CONTACT_JOURS;
                return (
                  <tr key={b.id} className="align-top transition hover:bg-stone-50">
                    <td className="px-5 py-3">
                      <Link href={`/personnel/beneficiaire/${b.id}`} className="flex items-center gap-3">
                        <Avatar nom={prenom(b.identiteId)} ton="neutre" />
                        <span>
                          <span className="block font-medium hover:text-brand">{prenom(b.identiteId)}</span>
                          <span className="block text-xs text-muted">{b.zone} · {nomLangue(b.langue).toLowerCase()}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="py-3">{p.iaRefusee ? <Badge>Non calculée</Badge> : <Badge ton={tonPriorite(p.niveau)}>{p.niveau} · {p.score}</Badge>}</td>
                    <td className="max-w-64 py-3 text-xs text-muted">{p.motifs.join(" · ") || "—"}</td>
                    <td className="py-3"><span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium">{LIBELLES.etape[b.etape]}</span></td>
                    <td className="py-3 text-xs">{prochain ? <>{fmt(prochain.date)}{!prochain.confirmeParStructure && <span className="block text-amber-700">non confirmé</span>}</> : <span className="text-muted">—</span>}</td>
                    <td className={`py-3 pr-5 text-xs ${ancien ? "font-semibold text-accent" : "text-muted"}`}>{b.dernierContact ? ilYa(b.dernierContact) : "jamais"}</td>
                  </tr>
                );
              })}
              {filtrees.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted">Aucune bénéficiaire ne correspond à ces filtres.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panneau>
    </div>
  );
}
