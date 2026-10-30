import { Avatar, EnTete, Kpi, Panneau, ilYa } from "@/components/pro";
import { LIBELLES } from "@/components/ui";
import { db } from "@/lib/db";
import { today } from "@/lib/protocol";
import { exigerRole } from "@/lib/session";

const JOURS = 7;

export default async function Equipe() {
  await exigerRole("coordinatrice");
  const base = db();
  const t = today();
  const depuis = new Date(Date.parse(t) - JOURS * 864e5).toISOString();
  const recent = base.journal.filter((j) => j.date >= depuis);
  const actions = (acteur: string, filtre: (a: string) => boolean) => recent.filter((j) => j.acteur === acteur && filtre(j.action)).length;
  const actives = base.beneficiaires.filter((b) => b.etape !== "cloture");

  const referentes = base.personnel.filter((p) => p.role === "referente").map((p) => {
    const acteur = `referente:${p.id}`;
    const charge = actives.filter((b) => b.referenteId === p.id).length;
    return {
      p,
      charge,
      contacts: actions(acteur, (a) => a === "contact" || a === "appel_sans_reponse"),
      verifs: actions(acteur, (a) => a.startsWith("verification_rdv_")),
      rappels: actions(acteur, (a) => a === "rappel_envoye"),
      orientations: actions(acteur, (a) => a.startsWith("orientation_")),
      connexion: base.comptes.find((c) => c.refId === p.id)?.derniereConnexion,
    };
  });
  const specialistes = base.personnel.filter((p) => p.role === "specialiste").map((p) => {
    const recues = base.orientations.filter((o) => o.specialisteId === p.id && o.consentementLe);
    return {
      p,
      enAttente: recues.filter((o) => o.statut === "transmise" || o.statut === "acceptee").length,
      enCours: recues.filter((o) => o.statut === "prise_en_charge").length,
      terminees: recues.filter((o) => o.statut === "cloturee" || o.statut === "refusee").length,
      connexion: base.comptes.find((c) => c.refId === p.id)?.derniereConnexion,
    };
  });
  const total = (k: "contacts" | "verifs" | "rappels") => referentes.reduce((n, r) => n + r[k], 0);

  return (
    <div className="space-y-6">
      <EnTete titre="Équipe" sous={`Activité des ${JOURS} derniers jours, issue du journal d'audit. Usage interne de pilotage, jamais pour juger une personne.`} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icone="equipe" valeur={base.personnel.length} libelle="Membres de l'équipe" detail={`${referentes.length} référentes · ${specialistes.length} spécialistes`} />
        <Kpi icone="telephone" valeur={total("contacts")} libelle="Appels enregistrés" detail={`${JOURS} derniers jours`} />
        <Kpi icone="calendrier" valeur={total("verifs")} libelle="Rendez-vous vérifiés" detail={`${JOURS} derniers jours`} />
        <Kpi icone="message" valeur={total("rappels")} libelle="Rappels envoyés" detail={`${JOURS} derniers jours`} />
      </div>

      <Panneau titre="Référentes" compteur={referentes.length}>
        <div className="-mx-5 -my-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-5 py-2.5 font-semibold">Référente</th><th className="font-semibold">Charge</th><th className="text-right font-semibold">Appels</th><th className="text-right font-semibold">RDV vérifiés</th><th className="text-right font-semibold">Rappels</th><th className="text-right font-semibold">Orientations</th><th className="pr-5 text-right font-semibold">Connexion</th></tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {referentes.map((r) => (
                <tr key={r.p.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar nom={r.p.prenom} />
                      <div><p className="font-medium">{r.p.prenom}</p><p className="text-xs text-muted">{r.p.zones.join(", ")} · {r.p.langues.join(", ")}</p></div>
                    </div>
                  </td>
                  <td className="w-44">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-stone-100"><div className={`h-1.5 rounded-full ${r.charge / r.p.capaciteMax > 0.9 ? "bg-accent" : "bg-brand"}`} style={{ width: `${Math.min(100, (r.charge / r.p.capaciteMax) * 100)}%` }} /></div>
                      <span className="text-xs">{r.charge}/{r.p.capaciteMax}</span>
                    </div>
                  </td>
                  <td className="text-right">{r.contacts}</td>
                  <td className="text-right">{r.verifs}</td>
                  <td className="text-right">{r.rappels}</td>
                  <td className="text-right">{r.orientations}</td>
                  <td className="pr-5 text-right text-xs text-muted">{r.connexion ? ilYa(r.connexion.slice(0, 10)) : "jamais"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panneau>

      <Panneau titre="Spécialistes" compteur={specialistes.length}>
        <div className="-mx-5 -my-5 overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-5 py-2.5 font-semibold">Spécialiste</th><th className="font-semibold">Spécialité</th><th className="text-right font-semibold">En attente</th><th className="text-right font-semibold">En cours</th><th className="text-right font-semibold">Terminées</th><th className="pr-5 text-right font-semibold">Connexion</th></tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {specialistes.map((x) => (
                <tr key={x.p.id}>
                  <td className="px-5 py-3"><div className="flex items-center gap-3"><Avatar nom={x.p.prenom} ton="neutre" /><span className="font-medium">{x.p.prenom}</span></div></td>
                  <td>{x.p.specialite ? LIBELLES.specialite[x.p.specialite] : "—"}</td>
                  <td className={`text-right ${x.enAttente ? "font-semibold text-accent" : ""}`}>{x.enAttente}</td>
                  <td className="text-right">{x.enCours}</td>
                  <td className="text-right">{x.terminees}</td>
                  <td className="pr-5 text-right text-xs text-muted">{x.connexion ? ilYa(x.connexion.slice(0, 10)) : "jamais"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panneau>
    </div>
  );
}
