import { nomLangue } from "@/lib/langues";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PanneauBebe } from "@/components/Bebe";
import { PanneauPrevention } from "@/components/Prevention";
import { Alerte, Badge, fmt, LIBELLES, libelleAction, Titre, tonPriorite, tonRdv } from "@/components/ui";
import { ajouterRdv, changerEtape, enregistrerContact, enregistrerSansReponse, escalader, proposerOrientation, verifierRdv } from "@/lib/actions";
import { db, enregistrer } from "@/lib/db";
import { calculerPriorite } from "@/lib/priority";
import { datePrevue, ESCALADE, ETAPES, today } from "@/lib/protocol";
import { exigerRole } from "@/lib/session";

// Les motifs des orientations sensibles ne sont visibles que par la spécialiste.
const SENSIBLES = new Set(["psychosocial", "protection"]);

export default async function PlanDeSuivi({ params, searchParams }: PageProps<"/personnel/beneficiaire/[id]">) {
  const s = await exigerRole("referente", "coordinatrice");
  const { id } = await params;
  const { escalade } = await searchParams;
  const base = db();
  const b = base.beneficiaires.find((x) => x.id === id);
  if (!b || (s.role === "referente" && b.referenteId !== s.id)) notFound();
  enregistrer(`${s.role}:${s.id}`, "consultation_dossier", b.id); // journalisation des accès

  const ident = base.identites.find((i) => i.id === b.identiteId);
  const p = calculerPriorite(b, base);
  const dpa = datePrevue(b.ddr, b.dpaCorrigee);
  const t = today();
  const rdvs = base.rendezVous.filter((r) => r.beneficiaireId === b.id).sort((a, c) => a.date.localeCompare(c.date));
  const orientations = base.orientations.filter((o) => o.beneficiaireId === b.id);
  const structures = base.structures.filter((x) => x.zone === b.zone);
  const nomStructure = (sid: string) => base.structures.find((x) => x.id === sid)?.nom ?? "";
  const etapeIdx = ETAPES.findIndex((e) => e.id === b.etape);
  const rdvIds = new Set(rdvs.map((r) => r.id));
  const orientationIds = new Set(orientations.map((o) => o.id));
  // Historique sans les simples consultations du dossier, qui n'informent pas le suivi.
  const historique = base.journal
    .filter((j) => j.action !== "consultation_dossier" && j.cible && (j.cible === b.id || rdvIds.has(j.cible) || orientationIds.has(j.cible)))
    .slice(0, 20);

  return (
    <div className="space-y-5">
      <Link href={s.role === "referente" ? "/personnel" : "/coordination"} className="text-sm text-muted underline">← Retour</Link>
      <Titre
        titre={ident?.prenom ?? "Bénéficiaire"}
        sous={`${b.zone} · ${nomLangue(b.langue).toLowerCase()} · contact ${b.canal}, ${b.horaireContact}${b.messageDiscret ? " · messages discrets" : ""}${b.jeuneFille ? " · jeune fille (< 20 ans) : accompagnement adapté" : ""}`}
        action={
          <div className="flex flex-wrap gap-2">
            <form action={enregistrerContact}>
              <input type="hidden" name="beneficiaireId" value={b.id} />
              <button className="btn">J&apos;ai eu un contact aujourd&apos;hui</button>
            </form>
            <form action={enregistrerSansReponse}>
              <input type="hidden" name="beneficiaireId" value={b.id} />
              <button className="btn-sec">Appel sans réponse</button>
            </form>
          </div>
        }
      />
      {escalade && <Alerte ton="orange">Escalade enregistrée. Suivez la procédure ci-dessous.</Alerte>}
      {b.aideConfidentielleLe && <Alerte ton="orange">Elle demande à être rappelée <strong>discrètement</strong> (depuis le {fmt(b.aideConfidentielleLe)}). Appelez quand elle peut parler seule, ne laissez aucun message détaillé ; si elle évoque des violences, proposez une orientation vers la référente protection.</Alerte>}
      {b.souhaitSageFemmeLe && <Alerte>Elle souhaite parler à une sage-femme de sa santé de femme (depuis le {fmt(b.souhaitSageFemmeLe)}). Proposez-lui une orientation, avec son accord.</Alerte>}

      <section className="card">
        <h2 className="mb-3 font-semibold">Plan de suivi individuel</h2>
        <ol className="flex flex-wrap gap-2">
          {ETAPES.map((e, i) => (
            <li key={e.id}>
              <form action={changerEtape}>
                <input type="hidden" name="beneficiaireId" value={b.id} />
                <input type="hidden" name="etape" value={e.id} />
                <button className={`rounded-full px-3 py-1 text-xs font-medium ${i === etapeIdx ? "bg-brand text-white" : i < etapeIdx ? "bg-brand-soft text-brand" : "bg-stone-100 text-muted"}`}>
                  {i + 1}. {e.libelle}
                </button>
              </form>
            </li>
          ))}
        </ol>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div><span className="text-muted">Téléphone :</span> {ident?.telephone || "—"}</div>
          <div><span className="text-muted">Date prévue (estimation) :</span> {fmt(dpa?.date)}</div>
          <div><span className="text-muted">Distance structure :</span> {b.distanceKm ? `${b.distanceKm} km` : "—"}</div>
          <div><span className="text-muted">Dernier contact :</span> {fmt(b.dernierContact)}</div>
          <div><span className="text-muted">Appels sans réponse :</span> {b.rappelsSansReponse}</div>
          <div><span className="text-muted">Rappels :</span> {b.consentements.rappels ? "acceptés" : "refusés"}</div>
        </div>
        <div className="mt-3 text-sm">
          <span className="text-muted">Priorité de recontact : </span>
          {p.iaRefusee ? <Badge>Opposition à l&apos;IA</Badge> : <Badge ton={tonPriorite(p.niveau)}>{p.niveau} ({p.score})</Badge>}
          <span className="ml-2 text-xs text-muted">{p.motifs.join(" · ")}</span>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Rendez-vous</h2>
        <ul className="divide-y divide-border text-sm">
          {rdvs.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                <span className="font-medium">{fmt(r.date)}</span> — {r.libelle}
                <span className="block text-xs text-muted">{nomStructure(r.structureId)} · {r.confirmeParStructure ? "confirmé par la structure" : "non confirmé"}</span>
              </span>
              {r.statut === "prevu" && r.date < t ? (
                <form action={verifierRdv} className="flex flex-wrap items-center gap-1">
                  <input type="hidden" name="rdvId" value={r.id} />
                  <button name="statut" value="honore" className="btn-sec btn-sm">Honoré</button>
                  <button name="statut" value="manque" className="btn-sec btn-sm">Manqué</button>
                  <input type="date" name="nouvelleDate" className="field w-auto py-1 text-xs" />
                  <button name="statut" value="reporte" className="btn-sec btn-sm">Reporté</button>
                  <button name="statut" value="annule" className="btn-sec btn-sm">Annulé</button>
                </form>
              ) : (
                <Badge ton={tonRdv(r.statut)}>{LIBELLES.rdv[r.statut]}</Badge>
              )}
            </li>
          ))}
        </ul>
        <form action={ajouterRdv} className="mt-4 grid gap-2 sm:grid-cols-4">
          <input type="hidden" name="beneficiaireId" value={b.id} />
          <input name="libelle" placeholder="Consultation" className="field" />
          <input type="date" name="date" min={t} className="field" required />
          <select name="structureId" className="field">
            {structures.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
          </select>
          <button className="btn">Ajouter</button>
        </form>
        <p className="mt-2 text-xs text-muted">Le calendrier clinique est fixé par la sage-femme. Un rendez-vous ajouté reste « non confirmé » tant que la structure ne l&apos;a pas validé.</p>
      </section>

      <PanneauPrevention b={b} />

      <PanneauBebe b={b} />

      <section className="card">
        <h2 className="mb-3 font-semibold">Orientations</h2>
        <ul className="mb-4 divide-y divide-border text-sm">
          {orientations.length === 0 && <li className="py-2 text-muted">Aucune orientation.</li>}
          {orientations.map((o) => (
            <li key={o.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>
                {LIBELLES.specialite[o.type]}
                <span className="block text-xs text-muted">{SENSIBLES.has(o.type) ? "Motif confidentiel" : o.motif} · {o.consentementLe ? `consentement du ${fmt(o.consentementLe)}` : "consentement non recueilli"}</span>
              </span>
              <Badge ton={o.statut === "prise_en_charge" ? "vert" : "orange"}>{LIBELLES.orientation[o.statut]}</Badge>
            </li>
          ))}
        </ul>
        <form action={proposerOrientation} className="grid gap-2 sm:grid-cols-[auto_1fr_auto]">
          <input type="hidden" name="beneficiaireId" value={b.id} />
          <select name="type" className="field">
            {Object.entries(LIBELLES.specialite).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input name="motif" placeholder="Besoin pratique (pas de détail médical)" className="field" />
          <button className="btn">Proposer</button>
          <label className="flex items-center gap-2 text-sm sm:col-span-3">
            <input type="checkbox" name="consentement" /> La bénéficiaire a donné son accord explicite pour cette orientation
          </label>
          <p className="text-xs text-muted sm:col-span-3">Sans case cochée, l&apos;orientation reste « proposée » : la bénéficiaire peut l&apos;accepter ou la refuser depuis son espace.</p>
        </form>
      </section>

      <section className="card border-red-200">
        <h2 className="font-semibold">Signe d&apos;alerte signalé</h2>
        <p className="mt-1 text-sm text-muted">{ESCALADE.avertissement}</p>
        <ol className="my-3 list-decimal space-y-1 pl-5 text-sm">
          {ESCALADE.etapes.map((e) => <li key={e}>{e}</li>)}
        </ol>
        <p className="mb-3 text-sm">Urgence : {ESCALADE.numeroUrgence}</p>
        <form action={escalader}>
          <input type="hidden" name="beneficiaireId" value={b.id} />
          <button className="btn bg-red-700">Déclencher la procédure d&apos;escalade</button>
        </form>
        <p className="mt-2 text-xs text-muted">Procédure provisoire, à remplacer par celle validée par les professionnels de santé locaux.</p>
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Historique du suivi</h2>
        {historique.length === 0 && <p className="text-sm text-muted">Aucune action enregistrée.</p>}
        <ul className="space-y-1 text-sm">
          {historique.map((j) => (
            <li key={j.id} className="flex flex-wrap gap-x-2">
              <span className="text-muted tabular-nums">{new Date(j.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
              <span>{libelleAction(j.action)}</span>
              <span className="text-xs text-muted">· {j.acteur.split(":")[0]}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
