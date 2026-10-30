// Répertoire des structures, partagé entre la page publique et l'espace professionnel.
import { Icone } from "./Icone";
import { Alerte, Badge, fmt } from "./ui";
import { demanderMiseEnRelation, signalerStructure } from "@/lib/actions";
import { db } from "@/lib/db";
import type { LangueUI } from "@/lib/langue";
import { ZONES } from "@/lib/types";

const BESOINS = ["Consultation prénatale", "Consultation postnatale", "Information santé reproductive", "Planification familiale", "Soutien psychosocial"];

// Les services sont stockés en français ; seule leur étiquette affichée est traduite.
const SERVICES_EN: Record<string, string> = {
  "Consultation prénatale": "Antenatal care",
  "Consultation postnatale": "Postnatal care",
  "Information santé reproductive": "Reproductive health information",
  "Planification familiale": "Family planning",
  "Soutien psychosocial": "Psychosocial support",
  "Orientation protection": "Protection referral",
  Accouchement: "Delivery",
  Vaccination: "Vaccination",
};
const TYPES_EN: Record<string, string> = { Hôpital: "Hospital", "Centre de santé": "Health centre", "Poste de santé": "Health post", Maternité: "Maternity unit", Association: "Association" };

const T = {
  fr: { merci: "Merci, l'information sera vérifiée.", recherche: "Nom, quartier, service…", zones: "Toutes les zones", besoins: "Tous les besoins", filtrer: "Filtrer", structure: "structure", structures: "structures", aucune: "Aucune structure ne correspond. Essayez une autre zone ou un autre besoin.", signalement: "signalement", signalements: "signalements", verifiee: "Dernière vérification :", demander: "Demander un contact", signaler: "Signaler une information incorrecte", connecter: "Connectez-vous comme bénéficiaire pour demander une mise en relation.", statuts: { referencee: "Référencée", contactee: "Contactée", partenaire: "Partenaire confirmé" } },
  en: { merci: "Thank you, the information will be checked.", recherche: "Name, neighbourhood, service…", zones: "All areas", besoins: "All needs", filtrer: "Filter", structure: "facility", structures: "facilities", aucune: "No facility matches. Try another area or need.", signalement: "report", signalements: "reports", verifiee: "Last verified:", demander: "Request contact", signaler: "Report incorrect information", connecter: "Sign in as a beneficiary to request a referral.", statuts: { referencee: "Listed", contactee: "Contacted", partenaire: "Confirmed partner" } },
};

export function Repertoire({ chemin, filtres, estBeneficiaire, pro, langue = "fr" }: { chemin: string; filtres: Record<string, string | undefined>; estBeneficiaire?: boolean; pro?: boolean; langue?: LangueUI }) {
  const t = T[langue];
  const service = (s: string) => (langue === "en" ? SERVICES_EN[s] ?? s : s);
  const { zone, besoin, signale, q } = filtres;
  const recherche = q?.trim().toLowerCase();
  const liste = db()
    .structures.filter((s) => (!zone || s.zone === zone) && (!besoin || s.services.includes(besoin)))
    .filter((s) => !recherche || [s.nom, s.adresse, s.type, ...s.services, ...s.services.map(service)].some((x) => x.toLowerCase().includes(recherche)))
    // Partenaires confirmés d'abord : ce sont les seules structures qui confirment les rendez-vous.
    .sort((a, b) => Number(b.statut === "partenaire") - Number(a.statut === "partenaire") || a.nom.localeCompare(b.nom));

  return (
    <div>
      {signale && <Alerte>{t.merci}</Alerte>}
      <form action={chemin} className="card mb-5 grid gap-3 sm:grid-cols-4">
        <input name="q" defaultValue={q ?? ""} placeholder={t.recherche} className="field" />
        <select name="zone" defaultValue={zone ?? ""} className="field">
          <option value="">{t.zones}</option>
          {ZONES.map((z) => <option key={z}>{z}</option>)}
        </select>
        <select name="besoin" defaultValue={besoin ?? ""} className="field">
          <option value="">{t.besoins}</option>
          {BESOINS.map((b) => <option key={b} value={b}>{service(b)}</option>)}
        </select>
        <button className="btn">{t.filtrer}</button>
      </form>

      <p className="mb-3 text-sm text-muted">{liste.length} {liste.length > 1 ? t.structures : t.structure}</p>
      {liste.length === 0 && <p className="card text-sm text-muted">{t.aucune}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {liste.map((s) => (
          <article key={s.id} className="card space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="font-semibold">{s.nom}</h2>
              <div className="flex gap-1.5">
                {pro && s.signalements > 0 && <Badge ton="orange">{s.signalements} {s.signalements > 1 ? t.signalements : t.signalement}</Badge>}
                <Badge ton={s.statut === "partenaire" ? "vert" : s.statut === "contactee" ? "bleu" : "gris"}>{t.statuts[s.statut]}</Badge>
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-muted"><Icone nom="lieu" className="size-4 shrink-0" />{langue === "en" ? TYPES_EN[s.type] ?? s.type : s.type} · {s.adresse}</p>
            <p className="text-sm">{s.services.map(service).join(" · ")}</p>
            <p className="text-sm">{s.horaires} · <a href={`tel:${s.telephone.replace(/\s/g, "")}`} className="font-medium text-brand hover:underline">{s.telephone}</a></p>
            <p className="text-xs text-muted">{t.verifiee} {fmt(s.derniereVerification)}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {estBeneficiaire && (
                <form action={demanderMiseEnRelation} className="flex gap-2">
                  <input type="hidden" name="structureId" value={s.id} />
                  <select name="besoin" className="field py-1.5 text-sm" defaultValue={besoin || s.services[0]}>
                    {s.services.map((x) => <option key={x} value={x}>{service(x)}</option>)}
                  </select>
                  <button className="btn btn-sm">{t.demander}</button>
                </form>
              )}
              <form action={signalerStructure}>
                <input type="hidden" name="structureId" value={s.id} />
                <input type="hidden" name="retour" value={chemin} />
                <button className="text-xs text-muted underline">{t.signaler}</button>
              </form>
            </div>
          </article>
        ))}
      </div>
      {!estBeneficiaire && !pro && <p className="mt-4 text-sm text-muted">{t.connecter}</p>}
    </div>
  );
}
