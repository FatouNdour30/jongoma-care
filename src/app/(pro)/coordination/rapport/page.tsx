import { DonneesExemple } from "@/components/DonneesExemple";
import { Imprimer } from "@/components/Imprimer";
import { EnTete } from "@/components/pro";
import { db } from "@/lib/db";
import { indicateurs, SEUIL_MIN } from "@/lib/opendata";
import { addDays, today } from "@/lib/protocol";
import { exigerRole } from "@/lib/session";

// Rapport d'activité imprimable pour les partenaires et financeurs : données agrégées uniquement.
const JOURS = 30;
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)} %` : "—");
const masque = (x: number | null, s = "") => (x === null ? "masqué" : `${x}${s}`);

export default async function Rapport() {
  await exigerRole("coordinatrice");
  const base = db();
  const t = today();
  const debut = addDays(t, -JOURS);
  const { lignes, total } = indicateurs(base);
  const rdv = base.rendezVous.filter((r) => r.date >= debut && r.date < t && (r.statut === "honore" || r.statut === "manque"));
  const inscrites = base.beneficiaires.filter((b) => b.creeLe >= debut).length;
  const journal = base.journal.filter((j) => j.date.slice(0, 10) >= debut);
  const compte = (f: (a: string) => boolean) => journal.filter((j) => f(j.action)).length;
  const orientations = base.orientations.filter((o) => o.creeLe >= debut);
  const periode = `${new Date(debut).toLocaleDateString("fr-FR")} – ${new Date(t).toLocaleDateString("fr-FR")}`;

  const blocs = [
    { titre: "Couverture", lignes: [["Femmes inscrites (total)", masque(total.inscrites)], ["Nouvelles inscriptions sur la période", inscrites], ["Consentantes avec une référente", masque(total.avecReferente, " %")]] },
    { titre: "Suivi des rendez-vous", lignes: [["Rendez-vous vérifiés sur la période", rdv.length], ["Rendez-vous honorés", pct(rdv.filter((r) => r.statut === "honore").length, rdv.length)], ["Continuité postnatale", masque(total.continuitePostnatale, " %")]] },
    { titre: "Accompagnement", lignes: [["Appels enregistrés", compte((a) => a === "contact" || a === "appel_sans_reponse")], ["Rappels envoyés", compte((a) => a === "rappel_envoye")], ["Orientations proposées", orientations.length], ["Orientations prises en charge", orientations.filter((o) => o.statut === "prise_en_charge" || o.statut === "cloturee").length]] },
    { titre: "Réseau", lignes: [["Structures référencées", base.structures.length], ["Partenaires confirmés", base.structures.filter((s) => s.statut === "partenaire").length], ["Demandes de mise en relation", base.demandes.filter((d) => d.creeLe >= debut).length]] },
  ];

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <EnTete titre="Rapport d'activité" sous="Document imprimable ou enregistrable en PDF pour les partenaires et financeurs. Aucune donnée individuelle." actions={<Imprimer />} />
      </div>

      <article className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-5 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none sm:p-12">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Rapport d&apos;activité · pilote</p>
            <h1 className="mt-2 text-3xl font-semibold">Jongoma Care</h1>
            <p className="mt-1 text-sm text-muted">Période : {periode} ({JOURS} jours)</p>
            <div className="mt-2"><DonneesExemple /></div>
          </div>
          <div className="text-right text-xs text-muted">
            <p className="font-semibold text-foreground">Jongoma Tech</p>
            <p>Sénégal</p>
            <p>Édité le {new Date(t).toLocaleDateString("fr-FR")}</p>
          </div>
        </header>


        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          {blocs.map((b) => (
            <div key={b.titre} className="break-inside-avoid">
              <h2 className="text-lg font-semibold">{b.titre}</h2>
              <dl className="mt-2 divide-y divide-border text-sm">
                {b.lignes.map(([l, v]) => (
                  <div key={String(l)} className="flex justify-between gap-4 py-2">
                    <dt className="text-muted">{l}</dt>
                    <dd className="font-semibold tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </section>

        <section className="mt-10 break-inside-avoid">
          <h2 className="text-lg font-semibold">Indicateurs par zone</h2>
          <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <tr><th className="py-2">Zone</th><th className="text-right">Inscrites</th><th className="text-right">Avec référente</th><th className="text-right">RDV honorés</th><th className="text-right">Continuité postnatale</th></tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {[...lignes, total].map((l) => (
                <tr key={l.zone} className={l.zone === "Total" ? "font-semibold" : ""}>
                  <td className="py-2">{l.zone}</td>
                  <td className="text-right">{masque(l.inscrites)}</td>
                  <td className="text-right">{masque(l.avecReferente, " %")}</td>
                  <td className="text-right">{masque(l.rdvHonores, " %")}</td>
                  <td className="text-right">{masque(l.continuitePostnatale, " %")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>

        <footer className="mt-10 border-t border-border pt-4 text-xs leading-relaxed text-muted">
          <p><span className="font-semibold text-foreground">Méthode.</span> Indicateurs agrégés ; toute valeur calculée sur moins de {SEUIL_MIN} personnes est masquée. Les rendez-vous honorés sont ceux vérifiés par la référente selon le protocole. Aucune donnée individuelle n&apos;est partagée avec les financeurs.</p>
          <p className="mt-2">Jongoma Care ne pose aucun diagnostic. Aucun impact médical n&apos;est revendiqué avant une évaluation appropriée.</p>
        </footer>
      </article>
    </div>
  );
}
