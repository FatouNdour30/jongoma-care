import Link from "next/link";
import { AuthShell, ChampIcone } from "@/components/AuthShell";
import { Icone } from "@/components/Icone";
import { RemplirDemo } from "@/components/RemplirDemo";
import { Alerte } from "@/components/ui";
import { reinitialiserDemo, seConnecter } from "@/lib/actions";
import { MOT_DE_PASSE_DEMO, PIN_DEMO } from "@/lib/comptes-demo";
import { db } from "@/lib/db";
import { getLangue } from "@/lib/langue";
import { MODE_DEMO } from "@/lib/mode";
import { PHOTOS } from "@/lib/photos";

const T = {
  fr: {
    erreurs: {
      identifiants: "Identifiant ou code incorrect.",
      bloque: "Trop de tentatives. Réessayez dans 15 minutes ou contactez votre coordinatrice.",
      attente: "Votre demande d'accès est en attente de validation par une coordinatrice.",
      refuse: "Ce compte n'est pas actif. Contactez votre coordinatrice.",
      session: "Votre session a expiré. Merci de vous reconnecter.",
      acces: "Ce compte n'a pas accès à cette page.",
    } as Record<string, string>,
    beneficiaire: {
      accroche: "Votre suivi, vos rendez-vous et votre référente, au même endroit.",
      points: ["Vos prochains rendez-vous et vos rappels", "Des conseils à écouter en wolof ou en français", "Un code secret que vous seule connaissez"],
    },
    personnel: {
      accroche: "Moins de temps sur les listes, plus de temps auprès des femmes.",
      points: ["Les femmes à rappeler en priorité, avec les motifs", "Orientations et rendez-vous de votre structure", "Accès limité à votre rôle, chaque action tracée"],
    },
    espacePro: "Espace professionnel",
    espaceBenef: "Espace bénéficiaire",
    titre: "Connexion",
    pasDeCompte: "Pas encore de compte ?",
    demanderAcces: "Demander un accès",
    creerSuivi: "Créer mon suivi",
    ongletBenef: "Bénéficiaire",
    ongletPro: "Professionnelle",
    email: "Adresse e-mail",
    telephone: "Numéro de téléphone",
    motDePasse: "Mot de passe",
    code: "Code secret",
    oublie: "Oublié ? Voir votre coordinatrice",
    chiffres: "4 chiffres",
    seConnecter: "Se connecter",
    codeOublie: "Code oublié ? Votre référente ou l'agente communautaire peut vous aider.",
    essai: "Comptes d'essai",
    codeCourt: "Code",
    reinitialiser: "Réinitialiser les données d'exemple",
    roles: { referente: "Référente", coordinatrice: "Coordinatrice", etablissement: "Établissement", beneficiaire: "Bénéficiaire", specialiste: "Spécialiste" } as Record<string, string>,
    specialites: { "sage-femme": "Sage-femme", social: "Assistante sociale", psychosocial: "Soutien psychosocial", protection: "Référente protection" } as Record<string, string>,
  },
  en: {
    erreurs: {
      identifiants: "Incorrect identifier or code.",
      bloque: "Too many attempts. Try again in 15 minutes or contact your coordinator.",
      attente: "Your access request is awaiting approval by a coordinator.",
      refuse: "This account is not active. Contact your coordinator.",
      session: "Your session has expired. Please sign in again.",
      acces: "This account does not have access to that page.",
    } as Record<string, string>,
    beneficiaire: {
      accroche: "Your follow-up, your appointments and your agent, all in one place.",
      points: ["Your upcoming appointments and reminders", "Advice to listen to in Wolof or French", "A secret code only you know"],
    },
    personnel: {
      accroche: "Less time on lists, more time with women.",
      points: ["Women to call first, with the reasons", "Referrals and appointments for your facility", "Access limited to your role, every action logged"],
    },
    espacePro: "Professional space",
    espaceBenef: "Beneficiary space",
    titre: "Sign in",
    pasDeCompte: "No account yet?",
    demanderAcces: "Request access",
    creerSuivi: "Create my follow-up",
    ongletBenef: "Beneficiary",
    ongletPro: "Professional",
    email: "Email address",
    telephone: "Phone number",
    motDePasse: "Password",
    code: "Secret code",
    oublie: "Forgotten? Ask your coordinator",
    chiffres: "4 digits",
    seConnecter: "Sign in",
    codeOublie: "Forgot your code? Your follow-up agent or community health worker can help.",
    essai: "Test accounts",
    codeCourt: "Code",
    reinitialiser: "Reset sample data",
    roles: { referente: "Follow-up agent", coordinatrice: "Coordinator", etablissement: "Facility", beneficiaire: "Beneficiary", specialiste: "Specialist" } as Record<string, string>,
    specialites: { "sage-femme": "Midwife", social: "Social worker", psychosocial: "Psychosocial support", protection: "Protection officer" } as Record<string, string>,
  },
};

const ICONES = {
  beneficiaire: ["calendrier", "micro", "cadenas"] as const,
  personnel: ["etincelle", "equipe", "bouclier"] as const,
};

const formaterTel = (t: string) => t.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4");

export default async function Connexion({ searchParams }: PageProps<"/connexion">) {
  const { espace: e, erreur } = (await searchParams) as Record<string, string | undefined>;
  const t = T[await getLangue()];
  const espace = e === "personnel" ? "personnel" : "beneficiaire";
  const pro = espace === "personnel";
  const base = db();
  // Seuls les comptes d'essai générés (id « c-… ») sont proposés, jamais les comptes créés.
  const demo = base.comptes.filter((c) => c.id.startsWith("c-") && c.statut === "actif" && (pro ? c.role !== "beneficiaire" : c.role === "beneficiaire"));
  const detail = (role: string, refId?: string) => {
    const p = base.personnel.find((x) => x.id === refId);
    if (p?.specialite) return t.specialites[p.specialite];
    return t.roles[role] ?? role;
  };
  const panneau = t[espace];

  const onglet = (id: "beneficiaire" | "personnel", libelle: string) => (
    <Link
      href={`/connexion?espace=${id}`}
      aria-current={espace === id ? "page" : undefined}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${espace === id ? "bg-card text-brand shadow-sm ring-1 ring-black/5" : "text-muted hover:text-foreground"}`}
    >
      <Icone nom={id === "personnel" ? "equipe" : "coeur"} className="size-4" />
      {libelle}
    </Link>
  );

  return (
    <AuthShell
      photo={pro ? PHOTOS.medecin : PHOTOS.femmeTelephone}
      accroche={panneau.accroche}
      points={panneau.points.map((texte, i) => ({ icone: ICONES[espace][i], texte }))}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{pro ? t.espacePro : t.espaceBenef}</p>
      <h1 className="mt-2 text-4xl font-semibold">{t.titre}</h1>
      <p className="mt-2 text-muted">
        {t.pasDeCompte}{" "}
        <Link href={pro ? "/inscription/personnel" : "/femme/inscription"} className="font-semibold text-brand hover:underline">
          {pro ? t.demanderAcces : t.creerSuivi}
        </Link>
      </p>

      <div className="mt-8 flex gap-1 rounded-xl bg-stone-100 p-1">
        {onglet("beneficiaire", t.ongletBenef)}
        {onglet("personnel", t.ongletPro)}
      </div>

      {erreur && <div className="mt-6"><Alerte ton="orange">{t.erreurs[erreur] ?? t.erreurs.identifiants}</Alerte></div>}

      <form action={seConnecter} className="mt-6 space-y-5">
        <input type="hidden" name="espace" value={espace} />
        <div>
          <label className="label" htmlFor="identifiant">{pro ? t.email : t.telephone}</label>
          <ChampIcone icone={pro ? "email" : "telephone"}>
            <input
              id="identifiant"
              name="identifiant"
              required
              className="field pl-10"
              {...(pro ? { type: "email", autoComplete: "username", placeholder: "prenom@structure.sn" } : { type: "tel", inputMode: "tel" as const, autoComplete: "tel", placeholder: "77 123 45 67" })}
            />
          </ChampIcone>
        </div>
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <label className="label" htmlFor="secret">{pro ? t.motDePasse : t.code}</label>
            <span className="text-xs text-muted">{pro ? t.oublie : t.chiffres}</span>
          </div>
          <ChampIcone icone="cadenas">
            <input
              id="secret"
              name="secret"
              type="password"
              required
              autoComplete="current-password"
              className={`field pl-10 ${pro ? "" : "tracking-[0.4em]"}`}
              {...(pro ? {} : { inputMode: "numeric" as const, pattern: "\\d{4}", maxLength: 4, placeholder: "••••" })}
            />
          </ChampIcone>
        </div>
        <button className="btn w-full py-3 text-base shadow-lg shadow-brand/20">{t.seConnecter}</button>
        {!pro && <p className="text-center text-xs text-muted">{t.codeOublie}</p>}
      </form>

      {MODE_DEMO && (
        <div className="mt-10 rounded-2xl bg-stone-50 p-4 ring-1 ring-border">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">{t.essai}</p>
            <p className="text-xs text-muted">
              {pro ? t.motDePasse : t.codeCourt} : <code className="rounded bg-card px-1.5 py-0.5 font-semibold text-foreground ring-1 ring-border">{pro ? MOT_DE_PASSE_DEMO : PIN_DEMO}</code>
            </p>
          </div>
          <div className="-mx-1 mt-3 grid max-h-64 gap-2 overflow-y-auto px-1 py-0.5">
            {demo.map((c) => (
              <RemplirDemo
                key={c.id}
                identifiant={pro ? c.identifiant : formaterTel(c.identifiant)}
                secret={pro ? MOT_DE_PASSE_DEMO : PIN_DEMO}
                nom={c.nom}
                role={detail(c.role, c.refId)}
                detail={pro ? c.identifiant : formaterTel(c.identifiant)}
              />
            ))}
          </div>
          <form action={reinitialiserDemo} className="mt-3 text-center">
            <button className="text-xs text-muted underline hover:text-foreground">{t.reinitialiser}</button>
          </form>
        </div>
      )}
    </AuthShell>
  );
}
