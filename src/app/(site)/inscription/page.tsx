import Link from "next/link";
import { Icone, type NomIcone } from "@/components/Icone";
import { Photo } from "@/components/Photo";
import { getLangue } from "@/lib/langue";
import { PHOTOS } from "@/lib/photos";

type Choix = { href: string; photo: (typeof PHOTOS)[keyof typeof PHOTOS]; etiquette: string; titre: string; texte: string; points: { icone: NomIcone; texte: string }[]; cta: string; duree: string };

const T: Record<"fr" | "en", { surtitre: string; titre: string; choisir: string; deja: string; connecter: string; environ: string; pied: string; choix: Choix[] }> = {
  fr: {
    surtitre: "Inscription",
    titre: "Rejoindre Jongoma Care",
    choisir: "Choisissez votre profil.",
    deja: "Déjà un compte ?",
    connecter: "Se connecter",
    environ: "Environ",
    pied: "Jongoma Care ne pose aucun diagnostic. Vos données sont utilisées uniquement pour votre suivi et ne sont jamais vendues ni partagées avec les financeurs.",
    choix: [
      { href: "/femme/inscription", photo: PHOTOS.mereBebe, etiquette: "Bénéficiaire", titre: "Je suis enceinte ou jeune maman", texte: "Une référente vous accompagne de la grossesse jusqu'après la naissance.", points: [{ icone: "coeur", texte: "Gratuit et confidentiel" }, { icone: "micro", texte: "En wolof ou en français, à écouter" }, { icone: "cadenas", texte: "Un code secret à 4 chiffres" }], cta: "Créer mon suivi", duree: "5 minutes" },
      { href: "/inscription/personnel", photo: PHOTOS.soignante, etiquette: "Professionnelle", titre: "Je travaille dans la santé ou l'accompagnement", texte: "Référente, sage-femme, assistante sociale, psychologue ou structure de santé.", points: [{ icone: "bouclier", texte: "Accès validé par une coordinatrice" }, { icone: "equipe", texte: "Vous ne voyez que ce qui relève de votre rôle" }, { icone: "etincelle", texte: "Tableau de bord et priorités de suivi" }], cta: "Demander un accès", duree: "3 minutes" },
    ],
  },
  en: {
    surtitre: "Sign up",
    titre: "Join Jongoma Care",
    choisir: "Choose your profile.",
    deja: "Already have an account?",
    connecter: "Sign in",
    environ: "About",
    pied: "Jongoma Care makes no diagnosis. Your data is used only for your follow-up and is never sold or shared with funders.",
    choix: [
      { href: "/femme/inscription", photo: PHOTOS.mereBebe, etiquette: "Beneficiary", titre: "I am pregnant or a young mother", texte: "A follow-up agent supports you from pregnancy until after the birth.", points: [{ icone: "coeur", texte: "Free and confidential" }, { icone: "micro", texte: "In Wolof or French, to listen to" }, { icone: "cadenas", texte: "A 4-digit secret code" }], cta: "Create my follow-up", duree: "5 minutes" },
      { href: "/inscription/personnel", photo: PHOTOS.soignante, etiquette: "Professional", titre: "I work in health or social support", texte: "Follow-up agent, midwife, social worker, psychologist or health facility.", points: [{ icone: "bouclier", texte: "Access approved by a coordinator" }, { icone: "equipe", texte: "You only see what falls within your role" }, { icone: "etincelle", texte: "Dashboard and follow-up priorities" }], cta: "Request access", duree: "3 minutes" },
    ],
  },
};

export default async function Inscription() {
  const t = T[await getLangue()];
  return (
    <div className="py-4 sm:py-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{t.surtitre}</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{t.titre}</h1>
        <p className="mt-3 text-lg text-muted">
          {t.choisir} {t.deja} <Link href="/connexion" className="font-semibold text-brand hover:underline">{t.connecter}</Link>
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {t.choix.map((c) => (
          <Link key={c.href} href={c.href} className="group flex flex-col overflow-hidden rounded-[2rem] bg-card shadow-sm ring-1 ring-border transition hover:-translate-y-1 hover:shadow-xl">
            <div className="relative aspect-[3/2]">
              <div className="absolute inset-0 transition duration-500 group-hover:scale-[1.03]">
                <Photo photo={c.photo} className="h-full" sizes="(min-width: 768px) 480px, 100vw" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand shadow-sm backdrop-blur">{c.etiquette}</span>
              <h2 className="absolute inset-x-0 bottom-0 p-6 text-2xl font-semibold leading-tight text-white">{c.titre}</h2>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <p className="text-muted">{c.texte}</p>
              <ul className="mt-5 flex-1 space-y-3 text-sm">
                {c.points.map((p) => (
                  <li key={p.texte} className="flex items-center gap-3">
                    <span className="rounded-lg bg-brand-soft p-1.5 text-brand"><Icone nom={p.icone} className="size-4" /></span>
                    {p.texte}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center justify-between gap-3">
                <span className="text-xs text-muted">{t.environ} {c.duree}</span>
                <span className="btn px-5 group-hover:shadow-lg group-hover:shadow-brand/20">{c.cta} →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-xl text-center text-xs text-muted">{t.pied}</p>
    </div>
  );
}
