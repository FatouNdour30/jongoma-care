import { EnTete, Panneau } from "@/components/pro";
import { Alerte } from "@/components/ui";
import { REGLES } from "@/lib/priority";
import { ACTIONS, PROGRAMMES } from "@/lib/programmes";
import { CALENDRIER_CPN, CALENDRIER_CPON, ESCALADE, ETAPES, METHODE_DPA } from "@/lib/protocol";

// Référentiel commun du personnel : calendrier, escalade, rôles et règles du score.
const ROLES = [
  { role: "Référente principale", fait: "Rappels, vérification des rendez-vous, aide pratique, orientation avec accord.", nefaitpas: "Aucun diagnostic, aucun avis clinique." },
  { role: "Sage-femme", fait: "Suivi clinique, calendrier de consultations, correction de la date prévue.", nefaitpas: "N'accède qu'aux orientations reçues." },
  { role: "Assistante sociale", fait: "Obstacles pratiques : transport, isolement, accès aux services.", nefaitpas: "N'accède qu'aux informations utiles à l'orientation." },
  { role: "Psychologue", fait: "Soutien psychosocial sur demande ou orientation.", nefaitpas: "Notes invisibles pour les autres rôles." },
  { role: "Référente protection", fait: "Accès discret aux services spécialisés.", nefaitpas: "Contacts adaptés à la sécurité de la femme." },
];

export default function Protocole() {
  return (
    <div className="space-y-6">
      <EnTete titre="Protocole de suivi" sous="Référentiel commun de l'équipe : calendrier de suivi, escalade, rôles et règles du score." />
      <Alerte ton="orange">Valeurs en cours de validation clinique. Ce protocole ne remplace pas les directives nationales ni l&apos;avis des professionnels de santé.</Alerte>

      <Panneau titre="Procédure d'escalade" sous="En cas de signe d'alerte signalé par une bénéficiaire" className="border-red-200">
        <p className="text-sm text-muted">{ESCALADE.avertissement}</p>
        <ol className="mt-4 space-y-3">
          {ESCALADE.etapes.map((e, i) => (
            <li key={e} className="flex gap-3 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">{i + 1}</span>
              <span className="pt-1">{e}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-900">Urgence : {ESCALADE.numeroUrgence}</p>
      </Panneau>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panneau titre="Consultations prénatales" sous="Semaines d'aménorrhée (modèle OMS à 8 contacts, à adapter au protocole national)">
          <ol className="flex flex-wrap gap-2">
            {CALENDRIER_CPN.map((s, i) => (
              <li key={s} className="rounded-xl bg-brand-soft/50 px-3 py-2 text-center">
                <span className="block text-[10px] font-semibold uppercase text-brand">CPN {i + 1}</span>
                <span className="font-semibold tabular-nums">{s} SA</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted">Date prévue d&apos;accouchement : {METHODE_DPA}. Toujours présentée comme une estimation ; corrigeable par la sage-femme.</p>
        </Panneau>
        <Panneau titre="Consultations postnatales" sous="Jours après l'accouchement">
          <ol className="space-y-2">
            {CALENDRIER_CPON.map((c) => (
              <li key={c.jours} className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 rounded-lg bg-stone-100 py-1 text-center font-semibold tabular-nums">J{c.jours}</span>
                {c.libelle}
              </li>
            ))}
          </ol>
        </Panneau>
      </div>

      <Panneau titre="Programmes de prévention et de dépistage" sous="Échéances indicatives, à aligner sur le protocole national. Aucun résultat d'examen n'est enregistré.">
        <div className="-mx-5 -my-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-5 py-2.5 font-semibold">Programme</th><th className="font-semibold">Action</th><th className="pr-5 font-semibold">À partir de</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ACTIONS.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-2 text-muted">{PROGRAMMES.find((x) => x.id === a.programme)?.court}</td>
                  <td className="py-2">{a.libelle}</td>
                  <td className="py-2 pr-5 tabular-nums">{a.echeance.phase === "grossesse" ? (a.echeance.sa === 0 ? "1re consultation" : `${a.echeance.sa} SA`) : `J${a.echeance.jours} après la naissance`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panneau>

      <Panneau titre="Étapes du plan de suivi individuel">
        <ol className="grid gap-3 sm:grid-cols-5">
          {ETAPES.map((e, i) => (
            <li key={e.id} className="rounded-xl border border-border p-3 text-sm">
              <span className="text-xs font-semibold text-brand">Étape {i + 1}</span>
              <p className="font-medium">{e.libelle}</p>
            </li>
          ))}
        </ol>
      </Panneau>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panneau titre="Qui fait quoi">
          <ul className="-my-2 divide-y divide-border text-sm">
            {ROLES.map((r) => (
              <li key={r.role} className="py-2.5">
                <p className="font-semibold">{r.role}</p>
                <p>{r.fait}</p>
                <p className="text-xs text-muted">{r.nefaitpas}</p>
              </li>
            ))}
          </ul>
        </Panneau>
        <Panneau titre="Règles du score de priorisation" sous="Organise les recontacts uniquement. Haute ≥ 50, moyenne 25–49.">
          <ul className="-my-2 divide-y divide-border text-sm">
            {REGLES.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                <span>{r.libelle}</span>
                <span className="shrink-0 rounded-full bg-brand-soft px-2 font-semibold tabular-nums text-brand">+{r.poids}</span>
              </li>
            ))}
          </ul>
        </Panneau>
      </div>
    </div>
  );
}
