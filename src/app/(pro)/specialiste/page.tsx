import { Icone } from "@/components/Icone";
import { Avatar, EnTete, Kpi, Onglets, Panneau, Vide, ilYa } from "@/components/pro";
import { Badge, fmt, LIBELLES } from "@/components/ui";
import { corrigerDpa, majOrientation } from "@/lib/actions";
import { db } from "@/lib/db";
import { datePrevue, diffDays, today } from "@/lib/protocol";
import { exigerRole } from "@/lib/session";
import type { Orientation } from "@/lib/types";

const DELAI_ALERTE_JOURS = 3; // une orientation non prise en charge au-delà est signalée
const CANAL = { sms: "SMS", appel: "Appel", audio: "Message audio" } as const;

const GROUPES = {
  nouvelles: { libelle: "À prendre en charge", statuts: ["transmise", "acceptee"] },
  en_cours: { libelle: "En cours", statuts: ["prise_en_charge"] },
  terminees: { libelle: "Terminées", statuts: ["cloturee", "refusee"] },
} as const;
type Groupe = keyof typeof GROUPES;

export default async function EspaceSpecialiste({ searchParams }: PageProps<"/specialiste">) {
  const s = await exigerRole("specialiste");
  const { vue } = (await searchParams) as Record<string, string | undefined>;
  const groupe: Groupe = vue && vue in GROUPES ? (vue as Groupe) : "nouvelles";
  const base = db();
  const t = today();
  const moi = base.personnel.find((p) => p.id === s.id);
  const sensible = moi?.specialite === "psychosocial" || moi?.specialite === "protection";
  // Seules les orientations reçues avec consentement : pas d'accès au dossier complet.
  const recues = base.orientations.filter((o) => o.specialisteId === s.id && o.consentementLe);
  const dans = (g: Groupe) => recues.filter((o) => (GROUPES[g].statuts as readonly string[]).includes(o.statut));
  const liste = dans(groupe).sort((a, b) => a.creeLe.localeCompare(b.creeLe));
  const enRetard = dans("nouvelles").filter((o) => diffDays(t, o.creeLe) > DELAI_ALERTE_JOURS);
  const prises = recues.filter((o) => o.statut !== "transmise" && o.statut !== "acceptee" && o.statut !== "refusee");
  const delaiMoyen = prises.length ? Math.round(prises.reduce((n, o) => n + Math.max(0, diffDays(o.majLe, o.creeLe)), 0) / prises.length) : null;

  function Carte({ o }: { o: Orientation }) {
    const b = base.beneficiaires.find((x) => x.id === o.beneficiaireId);
    const ident = base.identites.find((i) => i.id === b?.identiteId);
    const dpa = datePrevue(b?.ddr, b?.dpaCorrigee);
    const retard = (o.statut === "transmise" || o.statut === "acceptee") && diffDays(t, o.creeLe) > DELAI_ALERTE_JOURS;
    const ouverte = o.statut !== "cloturee" && o.statut !== "refusee";
    return (
      <article className={`rounded-2xl border bg-card p-5 ${retard ? "border-orange-300 ring-1 ring-orange-200" : "border-border"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Avatar nom={ident?.prenom ?? "?"} ton={retard ? "alerte" : "marque"} />
            <div>
              <h3 className="font-semibold">{ident?.prenom} <span className="font-normal text-muted">· {b?.zone}</span></h3>
              <p className="text-xs text-muted">Reçue {ilYa(o.creeLe)} · consentement du {fmt(o.consentementLe)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {retard && <Badge ton="orange">En attente depuis {diffDays(t, o.creeLe)} j</Badge>}
            <Badge ton={o.statut === "prise_en_charge" ? "vert" : o.statut === "cloturee" ? "gris" : o.statut === "refusee" ? "rouge" : "bleu"}>{LIBELLES.orientation[o.statut]}</Badge>
          </div>
        </div>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-stone-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Motif de l&apos;orientation</p>
            <p className="mt-1">{o.motif || "—"}</p>
          </div>
          <div className="rounded-xl bg-stone-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Contact</p>
            <p className="mt-1">
              {ident?.telephone ? <a href={`tel:${ident.telephone.replace(/\s/g, "")}`} className="font-medium text-brand hover:underline">{ident.telephone}</a> : "—"}
              <span className="block text-xs text-muted">{b ? `${CANAL[b.canal]}, ${b.horaireContact}` : ""}{b?.messageDiscret ? " · rester discret" : ""}</span>
            </p>
          </div>
        </div>

        {moi?.specialite === "sage-femme" && b && ouverte && (
          <form action={corrigerDpa} className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-brand-soft/30 p-3 text-sm">
            <input type="hidden" name="beneficiaireId" value={b.id} />
            <span className="flex-1">Date prévue : <span className="font-semibold">{fmt(dpa?.date)}</span> <span className="text-xs text-muted">({dpa?.source ?? "non renseignée"})</span></span>
            <input type="date" name="dpa" className="field w-auto py-1 text-sm" />
            <button className="btn btn-sm">Corriger</button>
          </form>
        )}

        {ouverte && (
          <form action={majOrientation} className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            <input type="hidden" name="orientationId" value={o.id} />
            {o.statut !== "prise_en_charge" && <button name="statut" value="prise_en_charge" className="btn btn-sm">Prendre en charge</button>}
            <button name="statut" value="cloturee" className="btn-sec btn-sm">Clôturer</button>
            {o.statut !== "prise_en_charge" && <button name="statut" value="refusee" className="btn-sec btn-sm">Ne peut pas traiter</button>}
          </form>
        )}
      </article>
    );
  }

  return (
    <div className="space-y-6">
      <EnTete titre={`Bonjour ${moi?.prenom}`} sous={`${moi?.specialite ? LIBELLES.specialite[moi.specialite] : "Spécialiste"} · orientations reçues avec le consentement de la bénéficiaire`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icone="message" valeur={dans("nouvelles").length} libelle="À prendre en charge" detail={enRetard.length ? `${enRetard.length} depuis plus de ${DELAI_ALERTE_JOURS} jours` : "Aucune en retard"} ton={enRetard.length ? "alerte" : "marque"} href="/specialiste?vue=nouvelles" />
        <Kpi icone="coeur" valeur={dans("en_cours").length} libelle="En cours" detail="Prises en charge" href="/specialiste?vue=en_cours" />
        <Kpi icone="bouclier" valeur={dans("terminees").length} libelle="Terminées" detail="Clôturées ou réorientées" ton="neutre" href="/specialiste?vue=terminees" />
        <Kpi icone="calendrier" valeur={delaiMoyen === null ? "—" : `${delaiMoyen} j`} libelle="Délai moyen" detail="Entre réception et prise en charge" ton="succes" />
      </div>

      {sensible && (
        <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
          <Icone nom="cadenas" className="mt-0.5 size-4 shrink-0" />
          <p>Espace confidentiel. Vos notes de suivi ne sont jamais visibles par les référentes ni par les autres rôles. Elles sont tenues hors plateforme pendant la phase pilote.</p>
        </div>
      )}

      <Panneau
        titre={GROUPES[groupe].libelle}
        compteur={liste.length}
        action={<Onglets actif={groupe} onglets={(Object.keys(GROUPES) as Groupe[]).map((g) => ({ id: g, libelle: GROUPES[g].libelle, href: `/specialiste?vue=${g}`, compteur: dans(g).length }))} />}
      >
        {liste.length === 0 ? (
          <Vide icone="message" titre={groupe === "nouvelles" ? "Aucune nouvelle orientation" : "Rien dans cette liste"} texte="Les orientations apparaissent ici dès qu'une référente les transmet avec l'accord de la bénéficiaire." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">{liste.map((o) => <Carte key={o.id} o={o} />)}</div>
        )}
      </Panneau>
    </div>
  );
}
