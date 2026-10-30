import Link from "next/link";
import type { ReactNode } from "react";
import { AuthShell, ChampIcone } from "@/components/AuthShell";
import { Alerte } from "@/components/ui";
import { demanderAcces } from "@/lib/actions";
import { getLangue } from "@/lib/langue";
import { PHOTOS } from "@/lib/photos";
import { ZONES } from "@/lib/types";

const T = {
  fr: {
    erreurs: {
      champs: "Merci de renseigner votre nom et le rôle demandé.",
      email: "Adresse e-mail invalide.",
      motdepasse: "Le mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre.",
      confirmation: "Les deux mots de passe ne correspondent pas.",
      engagement: "L'engagement de confidentialité est obligatoire.",
      existe: "Un compte existe déjà avec cette adresse e-mail.",
    } as Record<string, string>,
    erreurDefaut: "Merci de vérifier le formulaire.",
    roles: [["referente", "Référente principale (agente de suivi)"], ["sage-femme", "Sage-femme / professionnel de santé"], ["social", "Assistante sociale / référente communautaire"], ["psychosocial", "Psychologue / soutien psychosocial"], ["protection", "Référente protection"], ["etablissement", "Structure de santé partenaire"]],
    accroche: "Rejoignez l'équipe qui accompagne chaque femme, de la grossesse au postnatal.",
    points: ["Accès vérifié et validé par une coordinatrice", "Vous ne voyez que ce qui relève de votre rôle", "Tableau de bord, priorités et orientations"],
    envoyeTitre: "Demande envoyée",
    envoyeTexte: "Une coordinatrice va vérifier votre identité et votre fonction. Vous pourrez vous connecter dès qu'elle aura validé votre accès.",
    allerConnexion: "Aller à la connexion",
    retour: "← Choisir un autre profil",
    surtitre: "Espace professionnel",
    titre: "Demander un accès",
    sous: "Votre compte sera actif après validation. Déjà un compte ?",
    connecter: "Se connecter",
    identite: "Identité",
    prenom: "Prénom",
    nom: "Nom",
    email: "Adresse e-mail professionnelle",
    rattachement: "Rôle et rattachement",
    role: "Rôle demandé",
    choisir: "Choisir",
    zone: "Zone d'intervention",
    fonction: "Fonction / diplôme",
    fonctionEx: "ex. Sage-femme d'État",
    structure: "Structure de rattachement",
    structureEx: "ex. Centre de santé de…",
    securite: "Sécurité",
    motDePasse: "Mot de passe",
    confirmer: "Confirmer",
    regles: "8 caractères minimum, dont une lettre et un chiffre.",
    engagement: "Je m'engage à respecter la confidentialité des informations des bénéficiaires, à n'accéder qu'aux dossiers relevant de ma mission et à ne poser aucun diagnostic hors de mes compétences.",
    envoyer: "Envoyer ma demande",
  },
  en: {
    erreurs: {
      champs: "Please enter your name and the role requested.",
      email: "Invalid email address.",
      motdepasse: "The password must have at least 8 characters, including a letter and a number.",
      confirmation: "The two passwords do not match.",
      engagement: "The confidentiality commitment is required.",
      existe: "An account already exists with this email address.",
    } as Record<string, string>,
    erreurDefaut: "Please check the form.",
    roles: [["referente", "Primary follow-up agent"], ["sage-femme", "Midwife / health professional"], ["social", "Social worker / community agent"], ["psychosocial", "Psychologist / psychosocial support"], ["protection", "Protection officer"], ["etablissement", "Partner health facility"]],
    accroche: "Join the team that supports every woman, from pregnancy to postnatal care.",
    points: ["Access verified and approved by a coordinator", "You only see what falls within your role", "Dashboard, priorities and referrals"],
    envoyeTitre: "Request sent",
    envoyeTexte: "A coordinator will verify your identity and role. You will be able to sign in as soon as your access is approved.",
    allerConnexion: "Go to sign in",
    retour: "← Choose another profile",
    surtitre: "Professional space",
    titre: "Request access",
    sous: "Your account will be active once approved. Already have an account?",
    connecter: "Sign in",
    identite: "Identity",
    prenom: "First name",
    nom: "Last name",
    email: "Professional email address",
    rattachement: "Role and affiliation",
    role: "Role requested",
    choisir: "Choose",
    zone: "Area of work",
    fonction: "Position / qualification",
    fonctionEx: "e.g. State-registered midwife",
    structure: "Affiliated facility",
    structureEx: "e.g. Health centre of…",
    securite: "Security",
    motDePasse: "Password",
    confirmer: "Confirm",
    regles: "At least 8 characters, including a letter and a number.",
    engagement: "I commit to keeping beneficiaries' information confidential, accessing only the records within my remit, and making no diagnosis outside my competence.",
    envoyer: "Send my request",
  },
};

function Groupe({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{titre}</legend>
      {children}
    </fieldset>
  );
}

export default async function InscriptionPersonnel({ searchParams }: PageProps<"/inscription/personnel">) {
  const { erreur, envoye } = (await searchParams) as Record<string, string | undefined>;
  const t = T[await getLangue()];
  const shell = {
    photo: PHOTOS.soignante,
    accroche: t.accroche,
    points: [
      { icone: "bouclier" as const, texte: t.points[0] },
      { icone: "cadenas" as const, texte: t.points[1] },
      { icone: "graphique" as const, texte: t.points[2] },
    ],
  };

  if (envoye) {
    return (
      <AuthShell {...shell}>
        <div className="py-10 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</span>
          <h1 className="mt-6 text-3xl font-semibold">{t.envoyeTitre}</h1>
          <p className="mt-3 text-muted">{t.envoyeTexte}</p>
          <Link href="/connexion?espace=personnel" className="btn mt-8 px-6 py-3">{t.allerConnexion}</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell {...shell} large>
      <Link href="/inscription" className="text-sm text-muted hover:text-foreground">{t.retour}</Link>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{t.surtitre}</p>
      <h1 className="mt-2 text-4xl font-semibold">{t.titre}</h1>
      <p className="mt-2 text-muted">
        {t.sous} <Link href="/connexion?espace=personnel" className="font-semibold text-brand hover:underline">{t.connecter}</Link>
      </p>
      {erreur && <div className="mt-6"><Alerte ton="orange">{t.erreurs[erreur] ?? t.erreurDefaut}</Alerte></div>}

      <form action={demanderAcces} className="mt-8 space-y-8">
        <Groupe titre={t.identite}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="prenom">{t.prenom}</label>
              <ChampIcone icone="personne"><input id="prenom" name="prenom" required className="field pl-10" autoComplete="given-name" /></ChampIcone>
            </div>
            <div>
              <label className="label" htmlFor="nom">{t.nom}</label>
              <input id="nom" name="nom" required className="field" autoComplete="family-name" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="email">{t.email}</label>
            <ChampIcone icone="email"><input id="email" name="email" type="email" required className="field pl-10" autoComplete="email" placeholder="prenom@structure.sn" /></ChampIcone>
          </div>
        </Groupe>

        <Groupe titre={t.rattachement}>
          <div>
            <label className="label" htmlFor="role">{t.role}</label>
            <select id="role" name="role" required className="field" defaultValue="">
              <option value="" disabled>{t.choisir}</option>
              {t.roles.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="zone">{t.zone}</label>
              <ChampIcone icone="lieu">
                <select id="zone" name="zone" className="field pl-10">
                  {ZONES.map((z) => <option key={z}>{z}</option>)}
                </select>
              </ChampIcone>
            </div>
            <div>
              <label className="label" htmlFor="fonction">{t.fonction}</label>
              <input id="fonction" name="fonction" className="field" placeholder={t.fonctionEx} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="structure">{t.structure}</label>
            <ChampIcone icone="hopital"><input id="structure" name="structure" className="field pl-10" placeholder={t.structureEx} /></ChampIcone>
          </div>
        </Groupe>

        <Groupe titre={t.securite}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="motDePasse">{t.motDePasse}</label>
              <ChampIcone icone="cadenas"><input id="motDePasse" name="motDePasse" type="password" required minLength={8} className="field pl-10" autoComplete="new-password" /></ChampIcone>
            </div>
            <div>
              <label className="label" htmlFor="confirmation">{t.confirmer}</label>
              <ChampIcone icone="cadenas"><input id="confirmation" name="confirmation" type="password" required minLength={8} className="field pl-10" autoComplete="new-password" /></ChampIcone>
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted">{t.regles}</p>
          <label className="flex cursor-pointer gap-3 rounded-xl bg-stone-50 p-4 text-sm ring-1 ring-border has-[:checked]:bg-brand-soft/30 has-[:checked]:ring-brand/40">
            <input type="checkbox" name="engagement" required className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]" />
            <span>{t.engagement}</span>
          </label>
        </Groupe>

        <button className="btn w-full py-3.5 text-base shadow-lg shadow-brand/20">{t.envoyer}</button>
      </form>
    </AuthShell>
  );
}
