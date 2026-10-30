import Link from "next/link";
import { Icone } from "@/components/Icone";
import { Marque } from "@/components/Marque";
import type { LangueUI } from "@/lib/langue";

const T = {
  fr: {
    accroche: "Accompagnement humain des femmes et des filles, de la grossesse au postnatal, au Sénégal.",
    colonnes: [
      { titre: "Femmes et familles", liens: [["S'inscrire", "/inscription"], ["Mon suivi", "/femme"], ["Trouver une structure", "/structures"]] },
      { titre: "Professionnels", liens: [["Se connecter", "/connexion"], ["Demander un accès", "/inscription/personnel"], ["Établissements partenaires", "/structures"]] },
      { titre: "Le projet", liens: [["À propos", "/a-propos"], ["Données ouvertes", "/donnees"]] },
    ],
    droits: "Jongoma Tech · Dakar, Sénégal",
    confidentialite: "Vos données restent confidentielles et ne sont jamais vendues.",
  },
  en: {
    accroche: "Human support for women and girls, from pregnancy to postnatal care, in Senegal.",
    colonnes: [
      { titre: "Women and families", liens: [["Sign up", "/inscription"], ["My follow-up", "/femme"], ["Find a facility", "/structures"]] },
      { titre: "Professionals", liens: [["Sign in", "/connexion"], ["Request access", "/inscription/personnel"], ["Partner facilities", "/structures"]] },
      { titre: "The project", liens: [["About", "/a-propos"], ["Open data", "/donnees"]] },
    ],
    droits: "Jongoma Tech · Dakar, Senegal",
    confidentialite: "Your data stays confidential and is never sold.",
  },
} as const;

const PRO = {
  fr: [["Protocole", "/espace/protocole"], ["Répertoire", "/espace/repertoire"], ["Données ouvertes", "/espace/donnees"], ["Site public", "/"]],
  en: [["Protocol", "/espace/protocole"], ["Directory", "/espace/repertoire"], ["Open data", "/espace/donnees"], ["Public site", "/"]],
} as const;

// Espace professionnel : barre discrète sous le contenu, la navigation est déjà dans la barre latérale.
export function PiedDePagePro({ langue }: { langue: LangueUI }) {
  return (
    <footer className="border-t border-border bg-card print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 text-xs text-muted lg:px-8">
        <span>© {new Date().getFullYear()} {T[langue].droits}</span>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          {PRO[langue].map(([libelle, href]) => (
            <Link key={href} href={href} className="hover:text-foreground">{libelle}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export function PiedDePage({ langue }: { langue: LangueUI }) {
  const t = T[langue];
  return (
    <footer className="mt-10 border-t border-border bg-card">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Link href="/" className="inline-flex">
            <Marque />
          </Link>
          <p className="max-w-xs text-sm text-muted">{t.accroche}</p>
        </div>
        {t.colonnes.map((c) => (
          <nav key={c.titre} aria-label={c.titre}>
            <h2 className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">{c.titre}</h2>
            <ul className="space-y-2 text-sm text-muted">
              {c.liens.map(([libelle, href]) => (
                <li key={libelle}>
                  <Link href={href} className="hover:text-foreground">{libelle}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted">
          <span>© {new Date().getFullYear()} {t.droits}</span>
          <span className="flex items-center gap-1.5">
            <Icone nom="cadenas" className="size-3.5" />
            {t.confidentialite}
          </span>
        </div>
      </div>
    </footer>
  );
}
