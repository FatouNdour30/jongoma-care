// Indicateurs publics agrégés, partagés entre la page publique et l'espace professionnel.
import { db } from "@/lib/db";
import type { LangueUI } from "@/lib/langue";
import { indicateurs, SEUIL_MIN } from "@/lib/opendata";

const T = {
  fr: { masque: "masqué", tuiles: ["Femmes inscrites", "Consentantes avec une référente", "Rendez-vous honorés", "Continuité postnatale"], parZone: "Par zone", colonnes: ["Zone", "Inscrites", "Avec référente", "RDV honorés", "Continuité postnatale", "Orientations abouties"], enfants: "Nouveau-nés", enfantsSous: "Vaccination d'après le carnet de santé. Calendrier indicatif, à valider par le Programme élargi de vaccination.", colEnfants: ["Zone", "Nouveau-nés suivis", "BCG dans les 14 jours", "Penta 3 à temps (18 semaines)", "Naissances déclarées à l'état civil"], methode: "Méthode", texte: (n: number) => `Aucune donnée individuelle n'est publiée. Toute valeur calculée sur moins de ${n} personnes est masquée. Les rendez-vous honorés sont ceux vérifiés par la référente selon le protocole. Le code de calcul est public (fichier src/lib/opendata.ts).` },
  en: { masque: "suppressed", tuiles: ["Women registered", "Consenting women with an agent", "Appointments attended", "Postnatal continuity"], parZone: "By area", colonnes: ["Area", "Registered", "With an agent", "Appointments attended", "Postnatal continuity", "Completed referrals"], enfants: "Newborns", enfantsSous: "Vaccination as recorded in the child health card. Indicative schedule, pending validation by the Expanded Programme on Immunization.", colEnfants: ["Area", "Newborns followed", "BCG within 14 days", "Penta 3 on time (18 weeks)", "Births registered"], methode: "Method", texte: (n: number) => `No individual data is published. Any value computed on fewer than ${n} people is suppressed. Attended appointments are those verified by the follow-up agent according to the protocol. The calculation code is public (file src/lib/opendata.ts).` },
};

export function DonneesOuvertes({ langue = "fr" }: { langue?: LangueUI }) {
  const t = T[langue];
  const v = (x: number | null, suffixe = "") => (x === null ? <span className="text-muted">{t.masque}</span> : `${x}${suffixe}`);
  const { lignes, total } = indicateurs(db());
  const tuiles = [v(total.inscrites), v(total.avecReferente, " %"), v(total.rdvHonores, " %"), v(total.continuitePostnatale, " %")];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tuiles.map((x, i) => (
          <div key={t.tuiles[i]} className="card">
            <div className="font-display text-3xl font-semibold tabular-nums">{x}</div>
            <div className="text-xs text-muted">{t.tuiles[i]}</div>
          </div>
        ))}
      </div>
      <section className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold">{t.parZone}</h2>
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>
              {t.colonnes.map((c, i) => <th key={c} className={i === 0 ? "py-2" : "text-right"}>{c}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border tabular-nums">
            {lignes.map((l) => (
              <tr key={l.zone}>
                <td className="py-2">{l.zone}</td>
                <td className="text-right">{v(l.inscrites)}</td>
                <td className="text-right">{v(l.avecReferente, " %")}</td>
                <td className="text-right">{v(l.rdvHonores, " %")}</td>
                <td className="text-right">{v(l.continuitePostnatale, " %")}</td>
                <td className="text-right">{v(l.orientationsAbouties)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card overflow-x-auto">
        <h2 className="font-semibold">{t.enfants}</h2>
        <p className="mb-3 text-xs text-muted">{t.enfantsSous}</p>
        <table className="w-full min-w-[520px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>
              {t.colEnfants.map((c, i) => <th key={c} className={i === 0 ? "py-2" : "text-right"}>{c}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border tabular-nums">
            {[...lignes, total].map((l) => (
              <tr key={l.zone} className={l === total ? "font-semibold" : undefined}>
                <td className="py-2">{l.zone}</td>
                <td className="text-right">{v(l.nouveauNes)}</td>
                <td className="text-right">{v(l.bcgATemps, " %")}</td>
                <td className="text-right">{v(l.penta3ATemps, " %")}</td>
                <td className="text-right">{v(l.etatCivil, " %")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card text-sm text-muted">
        <h2 className="mb-2 font-semibold text-foreground">{t.methode}</h2>
        <p>{t.texte(SEUIL_MIN)}</p>
      </section>
    </div>
  );
}
