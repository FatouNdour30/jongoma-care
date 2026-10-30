import Link from "next/link";
import { ChoixLangue } from "@/components/ChoixLangue";
import { Marque } from "@/components/Marque";
import { PiedDePage } from "@/components/PiedDePage";
import { seDeconnecter } from "@/lib/actions";
import { getLangue } from "@/lib/langue";
import { getSession } from "@/lib/session";

const ACCUEIL_ROLE: Record<string, string> = {
  beneficiaire: "/femme",
  referente: "/personnel",
  coordinatrice: "/coordination",
  etablissement: "/etablissement",
  specialiste: "/specialiste",
};

const T = {
  fr: { structures: "Structures", donnees: "Données ouvertes", apropos: "À propos", suivi: "Mon suivi", tableau: "Mon tableau de bord", deconnexion: "Se déconnecter", connexion: "Se connecter", inscription: "S'inscrire" },
  en: { structures: "Facilities", donnees: "Open data", apropos: "About", suivi: "My follow-up", tableau: "My dashboard", deconnexion: "Sign out", connexion: "Sign in", inscription: "Sign up" },
};

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [session, langue] = await Promise.all([getSession(), getLangue()]);
  const t = T[langue];
  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <Link href="/" className="flex items-center">
            <Marque taille="sm" />
          </Link>
          <nav className="order-last flex w-full gap-4 overflow-x-auto whitespace-nowrap text-sm text-muted sm:order-none sm:w-auto sm:flex-1">
            <Link href="/structures" className="hover:text-foreground">{t.structures}</Link>
            <Link href="/donnees" className="hover:text-foreground">{t.donnees}</Link>
            <Link href="/a-propos" className="hover:text-foreground">{t.apropos}</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ChoixLangue langue={langue} />
            {session ? (
              <form action={seDeconnecter} className="flex items-center gap-3 text-sm">
                <Link href={ACCUEIL_ROLE[session.role]} className="btn btn-sm">{session.role === "beneficiaire" ? t.suivi : t.tableau}</Link>
                <button className="text-muted hover:text-foreground">{t.deconnexion}</button>
              </form>
            ) : (
              <>
                <Link href="/connexion" className="btn-sec btn-sm">{t.connexion}</Link>
                <Link href="/inscription" className="btn btn-sm">{t.inscription}</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      <PiedDePage langue={langue} />
    </>
  );
}
