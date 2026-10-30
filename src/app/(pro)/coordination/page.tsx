import Link from "next/link";
import { Barres, CarteGraphique, Colonnes, Courbe } from "@/components/Graphiques";
import { EnTete, Kpi, Onglets } from "@/components/pro";
import { db } from "@/lib/db";
import { getLangue, locale } from "@/lib/langue";
import { calculerPriorite } from "@/lib/priority";
import { addDays, diffDays, today } from "@/lib/protocol";
import { exigerRole } from "@/lib/session";
import { ZONES } from "@/lib/types";

const SANS_CONTACT_JOURS = 21;
const PERIODES = [4, 12, 26];
const MIN_RDV_SEMAINE = 3; // en dessous, le taux hebdomadaire n'est pas affiché

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : null);
const lundi = (iso: string) => addDays(iso, -((new Date(iso).getDay() + 6) % 7));

const T = {
  fr: {
    bonjour: "Bonjour",
    sous: "Coordination des référentes · vue d'ensemble du pilote",
    gerer: "Gérer les affectations",
    exporter: "Exporter les indicateurs (CSV)",
    actives: "Bénéficiaires actives",
    accompagnement: (n: number) => `${n} avec accompagnement individuel`,
    rdv: "Rendez-vous honorés",
    rdvDetail: (n: number) => `30 derniers jours · ${n} vérifiés`,
    continuite: "Continuité postnatale",
    continuiteDetail: (a: number, b: number) => `${a} sur ${b} en postnatal`,
    haute: "Priorité haute",
    hauteDetail: "à recontacter en premier",
    evolution: "Évolution",
    semaines: (n: number) => `${n} semaines`,
    aTraiter: "À traiter aujourd'hui",
    alertes: ["bénéficiaire(s) consentante(s) sans référente", `sans contact depuis plus de ${SANS_CONTACT_JOURS} jours`, "demande(s) d'accès à valider", "structure(s) signalée(s) à revérifier", "rendez-vous passés non vérifiés"],
    honores: (ok: number, n: number) => `${ok} honorés sur ${n}`,
    gHebdo: "Rendez-vous honorés par semaine",
    gHebdoSous: (n: number) => `Part des rendez-vous vérifiés qui ont été honorés · ${n} dernières semaines · semaines avec moins de ${MIN_RDV_SEMAINE} rendez-vous non affichées`,
    gCharge: "Charge des référentes",
    gChargeSous: "Bénéficiaires actives suivies / capacité maximale",
    gInscriptions: "Nouvelles inscriptions",
    gInscriptionsSous: (n: number) => `Par semaine · ${n} dernières semaines`,
    gEtapes: "Où en sont les bénéficiaires",
    gEtapesSous: "Bénéficiaires actives par étape du parcours",
    etapes: ["Grossesse", "Préparation", "Postnatal", "Inscription"],
    parZone: "Par zone",
    parZoneSous: "Usage interne de pilotage. Les indicateurs publics sont publiés avec masquage des petits effectifs.",
    colonnes: ["Zone", "Actives", "Priorité haute", "RDV honorés (30 j)", "Sans référente"],
  },
  en: {
    bonjour: "Hello",
    sous: "Follow-up agent coordination · pilot overview",
    gerer: "Manage assignments",
    exporter: "Export indicators (CSV)",
    actives: "Active beneficiaries",
    accompagnement: (n: number) => `${n} with individual follow-up`,
    rdv: "Appointments attended",
    rdvDetail: (n: number) => `Last 30 days · ${n} verified`,
    continuite: "Postnatal continuity",
    continuiteDetail: (a: number, b: number) => `${a} of ${b} in postnatal care`,
    haute: "High priority",
    hauteDetail: "to call back first",
    evolution: "Trends",
    semaines: (n: number) => `${n} weeks`,
    aTraiter: "To handle today",
    alertes: ["consenting beneficiary(ies) without an agent", `with no contact for more than ${SANS_CONTACT_JOURS} days`, "access request(s) to approve", "facility(ies) reported, to re-verify", "past appointments not verified"],
    honores: (ok: number, n: number) => `${ok} attended out of ${n}`,
    gHebdo: "Appointments attended per week",
    gHebdoSous: (n: number) => `Share of verified appointments that were attended · last ${n} weeks · weeks with fewer than ${MIN_RDV_SEMAINE} appointments not shown`,
    gCharge: "Agent caseload",
    gChargeSous: "Active beneficiaries followed / maximum capacity",
    gInscriptions: "New registrations",
    gInscriptionsSous: (n: number) => `Per week · last ${n} weeks`,
    gEtapes: "Where beneficiaries are",
    gEtapesSous: "Active beneficiaries by stage of care",
    etapes: ["Pregnancy", "Preparation", "Postnatal", "Registration"],
    parZone: "By area",
    parZoneSous: "Internal management use. Public indicators are published with small-count suppression.",
    colonnes: ["Area", "Active", "High priority", "Attended (30 d)", "Without an agent"],
  },
};

export default async function TableauDeBord({ searchParams }: PageProps<"/coordination">) {
  const s = await exigerRole("coordinatrice");
  const { semaines } = (await searchParams) as Record<string, string | undefined>;
  const langue = await getLangue();
  const L = T[langue];
  const court = (iso: string) => new Date(iso).toLocaleDateString(locale(langue), { day: "numeric", month: "short" });
  const SEMAINES = PERIODES.includes(Number(semaines)) ? Number(semaines) : 12;
  const base = db();
  const t = today();
  const moi = base.personnel.find((p) => p.id === s.id);
  const actives = base.beneficiaires.filter((b) => b.etape !== "cloture");
  const consentantes = actives.filter((b) => b.consentements.accompagnement);
  const priorites = actives.map((b) => ({ b, p: calculerPriorite(b, base) }));
  const verifies = (depuis: string) => base.rendezVous.filter((r) => r.date >= depuis && r.date < t && (r.statut === "honore" || r.statut === "manque"));
  const rdv30 = verifies(addDays(t, -30));
  const postnatal = actives.filter((b) => b.etape === "postnatal");
  const postSuivies = postnatal.filter((b) => base.rendezVous.some((r) => r.beneficiaireId === b.id && r.type === "CPoN" && r.statut === "honore"));

  const alertes = [
    { n: consentantes.filter((b) => !b.referenteId).length, texte: L.alertes[0], href: "/coordination/affectations" },
    { n: actives.filter((b) => b.referenteId && (!b.dernierContact || diffDays(t, b.dernierContact) > SANS_CONTACT_JOURS)).length, texte: L.alertes[1], href: "/coordination/affectations" },
    { n: base.comptes.filter((c) => c.statut === "en_attente").length, texte: L.alertes[2], href: "/coordination/comptes" },
    { n: base.structures.filter((x) => x.signalements > 0).length, texte: L.alertes[3], href: "/coordination/structures" },
    { n: base.rendezVous.filter((r) => r.statut === "prevu" && r.date < t).length, texte: L.alertes[4], href: "/coordination/affectations" },
  ].filter((a) => a.n > 0);

  // Taux de rendez-vous honorés par semaine (rendez-vous vérifiés uniquement).
  const debut = lundi(addDays(t, -7 * (SEMAINES - 1)));
  const hebdo = Array.from({ length: SEMAINES }, (_, i) => {
    const de = addDays(debut, i * 7);
    const rdvs = base.rendezVous.filter((r) => r.date >= de && r.date < addDays(de, 7) && r.date < t && (r.statut === "honore" || r.statut === "manque"));
    const ok = rdvs.filter((r) => r.statut === "honore").length;
    return { x: court(de), v: rdvs.length >= MIN_RDV_SEMAINE ? pct(ok, rdvs.length) : null, detail: L.honores(ok, rdvs.length) };
  });

  const inscriptions = Array.from({ length: SEMAINES }, (_, i) => {
    const de = addDays(debut, i * 7);
    return { x: court(de), v: base.beneficiaires.filter((b) => b.creeLe >= de && b.creeLe < addDays(de, 7)).length };
  });

  const referentes = base.personnel.filter((p) => p.role === "referente");
  const charges = referentes.map((r) => {
    const n = actives.filter((b) => b.referenteId === r.id).length;
    return { libelle: r.prenom, v: n, max: r.capaciteMax, note: r.zones.join(", "), alerte: n / r.capaciteMax > 0.9 };
  });

  const etapes = (["grossesse", "preparation", "postnatal", "inscription"] as const)
    .map((e, i) => ({ x: L.etapes[i], v: actives.filter((b) => b.etape === e).length }))
    .filter((e) => e.v > 0);

  const parZone = ZONES.map((z) => {
    const bs = priorites.filter((x) => x.b.zone === z);
    const ids = new Set(bs.map((x) => x.b.id));
    const r = rdv30.filter((x) => ids.has(x.beneficiaireId));
    return {
      zone: z,
      actives: bs.length,
      haute: bs.filter((x) => !x.p.iaRefusee && x.p.niveau === "haute").length,
      taux: pct(r.filter((x) => x.statut === "honore").length, r.length),
      sansRef: bs.filter((x) => x.b.consentements.accompagnement && !x.b.referenteId).length,
    };
  });

  const tauxRdv = pct(rdv30.filter((r) => r.statut === "honore").length, rdv30.length);

  return (
    <div className="space-y-6">
      <EnTete
        titre={`${L.bonjour} ${moi?.prenom}`}
        sous={L.sous}
        actions={
          <>
            <Link href="/coordination/affectations" className="btn-sec btn-sm">{L.gerer}</Link>
            <a href="/api/donnees" className="btn btn-sm">{L.exporter}</a>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icone="equipe" valeur={actives.length} libelle={L.actives} detail={L.accompagnement(consentantes.length)} jauge={(actives.filter((b) => b.referenteId).length / Math.max(1, consentantes.length)) * 100} seuilAlerte={100} />
        <Kpi icone="calendrier" valeur={tauxRdv === null ? "—" : `${tauxRdv} %`} libelle={L.rdv} detail={L.rdvDetail(rdv30.length)} />
        <Kpi icone="coeur" valeur={postnatal.length ? `${pct(postSuivies.length, postnatal.length)} %` : "—"} libelle={L.continuite} detail={L.continuiteDetail(postSuivies.length, postnatal.length)} />
        <Kpi icone="etincelle" valeur={priorites.filter((x) => !x.p.iaRefusee && x.p.niveau === "haute").length} libelle={L.haute} detail={L.hauteDetail} href="/coordination/affectations" ton="alerte" />
      </div>

      {alertes.length > 0 && (
        <section className="card border-amber-200 bg-amber-50/60">
          <h2 className="font-semibold">{L.aTraiter}</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {alertes.map((a) => (
              <li key={a.texte}>
                <Link href={a.href} className="flex items-center gap-3 rounded-xl bg-card px-3 py-2 text-sm ring-1 ring-amber-200 hover:ring-amber-400">
                  <span className="min-w-8 rounded-lg bg-accent px-2 py-0.5 text-center font-bold text-white">{a.n}</span>
                  <span className="flex-1">{a.texte}</span>
                  <span className="text-muted">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{L.evolution}</h2>
        <Onglets actif={String(SEMAINES)} onglets={PERIODES.map((n) => ({ id: String(n), libelle: L.semaines(n), href: `/coordination?semaines=${n}` }))} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <CarteGraphique titre={L.gHebdo} sous={L.gHebdoSous(SEMAINES)}>
          <Courbe points={hebdo} />
        </CarteGraphique>
        <CarteGraphique titre={L.gCharge} sous={L.gChargeSous}>
          <Barres items={charges} />
        </CarteGraphique>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CarteGraphique titre={L.gInscriptions} sous={L.gInscriptionsSous(SEMAINES)}>
          <Colonnes items={inscriptions} />
        </CarteGraphique>
        <CarteGraphique titre={L.gEtapes} sous={L.gEtapesSous}>
          <Colonnes items={etapes} />
        </CarteGraphique>
      </div>

      <section className="card overflow-x-auto">
        <h2 className="font-semibold">{L.parZone}</h2>
        <p className="text-xs text-muted">{L.parZoneSous}</p>
        <table className="mt-3 w-full min-w-[520px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>{L.colonnes.map((c, i) => <th key={c} className={i === 0 ? "py-2" : "text-right"}>{c}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border tabular-nums">
            {parZone.map((z) => (
              <tr key={z.zone}>
                <td className="py-2 font-medium">{z.zone}</td>
                <td className="text-right">{z.actives}</td>
                <td className="text-right">{z.haute}</td>
                <td className="text-right">{z.taux === null ? "—" : `${z.taux} %`}</td>
                <td className="text-right">{z.sansRef || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
