import Link from "next/link";
import type { ReactNode } from "react";
import { AuthShell, ChampIcone } from "@/components/AuthShell";
import { Ecouter } from "@/components/Ecouter";
import { Alerte } from "@/components/ui";
import { inscrire } from "@/lib/actions";
import { getLangue } from "@/lib/langue";
import { PHOTOS } from "@/lib/photos";
import { ZONES } from "@/lib/types";

const T = {
  fr: {
    limites: "Jongoma Care vous aide à organiser votre suivi. Ce service ne pose pas de diagnostic et ne remplace pas la sage-femme ou le médecin. En cas d'urgence, allez à la structure de santé la plus proche.",
    donnees: "Nous demandons seulement votre prénom, un numéro pour les rappels, votre zone et, si vous le voulez, la date de vos dernières règles. Vous pouvez retirer votre accord à tout moment.",
    erreurs: {
      zone: "Merci de choisir votre zone.",
      telephone: "Numéro invalide : 9 chiffres, par ex. 77 123 45 67.",
      ddr: "Date des dernières règles invalide (ni future, ni à plus de 44 semaines).",
      consentement: "Votre accord pour utiliser Jongoma Care est nécessaire pour créer votre suivi.",
      existe: "Ce numéro a déjà un compte. Connectez-vous avec votre code, ou demandez de l'aide à votre référente.",
      pin: "Le code secret doit comporter exactement 4 chiffres.",
      pinConfirmation: "Les deux codes ne sont pas identiques.",
    } as Record<string, string>,
    erreurDefaut: "Merci de compléter les champs obligatoires.",
    supprime: "Vos données ont été supprimées. Vous pouvez vous réinscrire à tout moment.",
    accroche: "Une référente à vos côtés, de la grossesse jusqu'après la naissance.",
    points: ["Rappels de vos consultations", "Une référente qui vous appelle", "Des structures de santé vérifiées"],
    retour: "← Choisir un autre profil",
    titre: "Créer mon suivi",
    sous: "Environ 5 minutes. Vous pouvez vous faire aider par une agente communautaire. Déjà inscrite ?",
    connecter: "Se connecter",
    obligatoire: "obligatoire",
    facultatif: "(facultatif)",
    e1: ["Votre langue", "Pour les rappels et les conseils audio."],
    langues: [["wo", "Wolof"], ["fr", "Français"]],
    e2: ["Ce que fait le service", "Écoutez ou lisez avant de continuer."],
    ecouter: "Écouter l'explication",
    e3: ["Votre accord", "Vous pouvez changer d'avis à tout moment."],
    accords: [
      ["c_service", "J'accepte d'utiliser Jongoma Care", "Nécessaire pour créer votre suivi."],
      ["c_rappels", "Recevoir des rappels de rendez-vous", "Par le canal et à l'heure que vous choisissez."],
      ["c_accompagnement", "Être accompagnée par une référente", "Une personne vous appelle pour vous aider. Vous pouvez la changer ou refuser."],
      ["c_ia", "Aide de l'ordinateur pour organiser les appels", "Un calcul aide la référente à savoir qui rappeler en premier. Il ne décide rien. Si vous refusez, vous gardez tout le service."],
    ],
    e4: ["Vos informations", "Seulement ce qui est nécessaire à votre suivi."],
    prenom: "Prénom",
    telephone: "Téléphone",
    aideTel: "Le numéro sert aux rappels et à vous reconnecter. Il peut être celui d'un proche de confiance.",
    zone: "Zone",
    choisir: "Choisir",
    ddr: "Dernières règles",
    aideDdr: "La date des dernières règles sert à estimer la date prévue d'accouchement. La sage-femme peut la corriger.",
    canal: "Être contactée par",
    canaux: [["sms", "SMS"], ["appel", "Appel"], ["audio", "Message audio"]],
    moment: "De préférence le",
    moments: [["matin", "matin"], ["après-midi", "après-midi"], ["soir", "soir"]],
    discret1: "Mon téléphone peut être utilisé par d'autres personnes : ",
    discret2: "envoyer des messages discrets",
    e5: ["Votre code secret", "4 chiffres faciles à retenir pour vous, difficiles à deviner. Ne le donnez à personne."],
    code: "Code",
    repeter: "Répéter le code",
    creer: "Créer mon suivi",
    pied: "En créant votre suivi, vous acceptez les accords cochés ci-dessus. Vous pourrez les modifier dans « Mes préférences ».",
  },
  en: {
    limites: "Jongoma Care helps you organise your follow-up. This service makes no diagnosis and does not replace the midwife or the doctor. In an emergency, go to the nearest health facility.",
    donnees: "We only ask for your first name, a number for reminders, your area and, if you wish, the date of your last period. You can withdraw your consent at any time.",
    erreurs: {
      zone: "Please choose your area.",
      telephone: "Invalid number: 9 digits, e.g. 77 123 45 67.",
      ddr: "Invalid date of last period (not in the future, nor more than 44 weeks ago).",
      consentement: "Your consent to use Jongoma Care is required to create your follow-up.",
      existe: "This number already has an account. Sign in with your code, or ask your follow-up agent for help.",
      pin: "The secret code must have exactly 4 digits.",
      pinConfirmation: "The two codes do not match.",
    } as Record<string, string>,
    erreurDefaut: "Please complete the required fields.",
    supprime: "Your data has been deleted. You can register again at any time.",
    accroche: "A follow-up agent by your side, from pregnancy until after the birth.",
    points: ["Reminders for your visits", "An agent who calls you", "Verified health facilities"],
    retour: "← Choose another profile",
    titre: "Create my follow-up",
    sous: "About 5 minutes. A community health worker can help you. Already registered?",
    connecter: "Sign in",
    obligatoire: "required",
    facultatif: "(optional)",
    e1: ["Your language", "For reminders and audio advice."],
    langues: [["wo", "Wolof"], ["fr", "French"]],
    e2: ["What the service does", "Listen or read before continuing."],
    ecouter: "Listen to the explanation",
    e3: ["Your consent", "You can change your mind at any time."],
    accords: [
      ["c_service", "I agree to use Jongoma Care", "Required to create your follow-up."],
      ["c_rappels", "Receive appointment reminders", "Through the channel and at the time you choose."],
      ["c_accompagnement", "Be supported by a follow-up agent", "Someone calls you to help. You can change agent or decline."],
      ["c_ia", "Computer help to organise calls", "A calculation helps the agent know whom to call first. It decides nothing. If you decline, you keep the full service."],
    ],
    e4: ["Your information", "Only what is needed for your follow-up."],
    prenom: "First name",
    telephone: "Phone",
    aideTel: "The number is used for reminders and to sign in again. It can belong to a trusted relative.",
    zone: "Area",
    choisir: "Choose",
    ddr: "Last period",
    aideDdr: "The date of the last period is used to estimate the due date. The midwife can correct it.",
    canal: "Contact me by",
    canaux: [["sms", "SMS"], ["appel", "Call"], ["audio", "Voice message"]],
    moment: "Preferably in the",
    moments: [["matin", "morning"], ["après-midi", "afternoon"], ["soir", "evening"]],
    discret1: "My phone may be used by other people: ",
    discret2: "send discreet messages",
    e5: ["Your secret code", "4 digits that are easy for you to remember and hard to guess. Never share it."],
    code: "Code",
    repeter: "Repeat the code",
    creer: "Create my follow-up",
    pied: "By creating your follow-up, you accept the consents ticked above. You can change them in “My preferences”.",
  },
};

function Etape({ n, titre, sous, children }: { n: number; titre: string; sous?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
      <legend className="sr-only">{titre}</legend>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{n}</span>
        <div>
          <h2 className="text-lg font-semibold leading-tight">{titre}</h2>
          {sous && <p className="text-sm text-muted">{sous}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

function Consentement({ name, titre, texte, requis, libelleRequis }: { name: string; titre: string; texte: string; requis?: boolean; libelleRequis: string }) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl p-3 ring-1 ring-border transition has-[:checked]:bg-brand-soft/30 has-[:checked]:ring-brand/40">
      <input type="checkbox" name={name} defaultChecked required={requis} className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]" />
      <span>
        <span className="font-medium">{titre}</span>
        {requis && <span className="ml-1 text-xs font-semibold text-accent">{libelleRequis}</span>}
        <span className="block text-sm text-muted">{texte}</span>
      </span>
    </label>
  );
}

export default async function Inscription({ searchParams }: PageProps<"/femme/inscription">) {
  const { erreur, supprime } = (await searchParams) as Record<string, string | undefined>;
  const langue = await getLangue();
  const t = T[langue];
  return (
    <AuthShell
      large
      photo={PHOTOS.mereNouveauNe}
      accroche={t.accroche}
      points={[
        { icone: "calendrier", texte: t.points[0] },
        { icone: "personne", texte: t.points[1] },
        { icone: "lieu", texte: t.points[2] },
      ]}
    >
      <Link href="/inscription" className="text-sm text-muted hover:text-foreground">{t.retour}</Link>
      <h1 className="mt-3 text-4xl font-semibold">{t.titre}</h1>
      <p className="mt-2 text-muted">
        {t.sous} <Link href="/connexion" className="font-semibold text-brand hover:underline">{t.connecter}</Link>
      </p>

      <div className="mt-6">
        {supprime && <Alerte>{t.supprime}</Alerte>}
        {erreur && <Alerte ton="orange">{t.erreurs[erreur] ?? t.erreurDefaut}</Alerte>}
      </div>

      <form action={inscrire} className="space-y-5">
        <Etape n={1} titre={t.e1[0]} sous={t.e1[1]}>
          <div className="grid grid-cols-2 gap-3">
            {t.langues.map(([v, l]) => (
              <label key={v} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl p-4 text-lg font-medium ring-1 ring-border transition has-[:checked]:bg-brand-soft/40 has-[:checked]:text-brand has-[:checked]:ring-2 has-[:checked]:ring-brand">
                <input type="radio" name="langue" value={v} defaultChecked={v === "wo"} className="sr-only" /> {l}
              </label>
            ))}
          </div>
        </Etape>

        <Etape n={2} titre={t.e2[0]} sous={t.e2[1]}>
          <div className="space-y-2 rounded-xl bg-stone-50 p-4 text-sm leading-relaxed">
            <p>{t.limites}</p>
            <p>{t.donnees}</p>
          </div>
          <Ecouter texte={`${t.limites} ${t.donnees}`} libelle={t.ecouter} langue={langue} />
        </Etape>

        <Etape n={3} titre={t.e3[0]} sous={t.e3[1]}>
          {t.accords.map(([name, titre, texte]) => (
            <Consentement key={name} name={name} titre={titre} texte={texte} requis={name === "c_service"} libelleRequis={t.obligatoire} />
          ))}
        </Etape>

        <Etape n={4} titre={t.e4[0]} sous={t.e4[1]}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="prenom">{t.prenom}</label>
              <ChampIcone icone="personne">
                <input id="prenom" name="prenom" className="field pl-10" autoComplete="given-name" />
              </ChampIcone>
            </div>
            <div>
              <label className="label" htmlFor="telephone">{t.telephone} <span className="text-xs font-semibold text-accent">{t.obligatoire}</span></label>
              <ChampIcone icone="telephone">
                <input id="telephone" name="telephone" required className="field pl-10" type="tel" inputMode="tel" autoComplete="tel" placeholder="77 123 45 67" />
              </ChampIcone>
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted">{t.aideTel}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="zone">{t.zone} <span className="text-xs font-semibold text-accent">{t.obligatoire}</span></label>
              <ChampIcone icone="lieu">
                <select id="zone" name="zone" className="field pl-10" required defaultValue="">
                  <option value="" disabled>{t.choisir}</option>
                  {ZONES.map((z) => <option key={z}>{z}</option>)}
                </select>
              </ChampIcone>
            </div>
            <div>
              <label className="label" htmlFor="ddr">{t.ddr} <span className="text-xs text-muted">{t.facultatif}</span></label>
              <input id="ddr" name="ddr" type="date" className="field" />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted">{t.aideDdr}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="canal">{t.canal}</label>
              <select id="canal" name="canal" className="field">
                {t.canaux.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="horaire">{t.moment}</label>
              <select id="horaire" name="horaire" className="field">
                {t.moments.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <label className="flex cursor-pointer gap-3 rounded-xl p-3 text-sm ring-1 ring-border has-[:checked]:bg-brand-soft/30 has-[:checked]:ring-brand/40">
            <input type="checkbox" name="discret" defaultChecked className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]" />
            <span>{t.discret1}<span className="font-medium">{t.discret2}</span></span>
          </label>
        </Etape>

        <Etape n={5} titre={t.e5[0]} sous={t.e5[1]}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="pin">{t.code}</label>
              <input id="pin" name="pin" type="password" required inputMode="numeric" pattern="\d{4}" maxLength={4} autoComplete="new-password" placeholder="••••" className="field text-center text-2xl tracking-[0.5em]" />
            </div>
            <div>
              <label className="label" htmlFor="pinConfirmation">{t.repeter}</label>
              <input id="pinConfirmation" name="pinConfirmation" type="password" required inputMode="numeric" pattern="\d{4}" maxLength={4} autoComplete="new-password" placeholder="••••" className="field text-center text-2xl tracking-[0.5em]" />
            </div>
          </div>
        </Etape>

        <button className="btn w-full py-3.5 text-base shadow-lg shadow-brand/20">{t.creer}</button>
        <p className="text-center text-xs text-muted">{t.pied}</p>
      </form>
    </AuthShell>
  );
}
