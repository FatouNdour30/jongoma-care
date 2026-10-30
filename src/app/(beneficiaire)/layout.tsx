// Espace bénéficiaire : application avec barre latérale (comme l'espace professionnel),
// sans le menu du site public. En mode discret, la barre n'affiche ni le nom ni le logo du service.
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChoixLangue } from "@/components/ChoixLangue";
import { Icone } from "@/components/Icone";
import { Marque } from "@/components/Marque";
import { NavFemme, type LienFemme } from "@/components/NavFemme";
import { seDeconnecter } from "@/lib/actions";
import { db } from "@/lib/db";
import { etatVaccins } from "@/lib/enfants";
import { getLangue } from "@/lib/langue";
import { etatPreventions } from "@/lib/programmes";
import { getSession } from "@/lib/session";

const T = {
  fr: { sections: ["Mon espace", "Aller plus loin"] as [string, string], accueil: "Accueil", agenda: "Agenda", bebe: "Mon bébé", sante: "Ma santé", ecouter: "Écouter", compte: "Mon compte", structures: "Trouver une structure", site: "Site public", deconnecter: "Se déconnecter", quitter: "Quitter", role: "Mon suivi", confidentialite: "Vos données restent confidentielles et ne sont jamais vendues." },
  en: { sections: ["My space", "More"] as [string, string], accueil: "Home", agenda: "Calendar", bebe: "My baby", sante: "My health", ecouter: "Listen", compte: "My account", structures: "Find a facility", site: "Public site", deconnecter: "Sign out", quitter: "Sign out", role: "My follow-up", confidentialite: "Your data stays confidential and is never sold." },
};

export default async function EspaceBeneficiaire({ children }: LayoutProps<"/">) {
  const [session, langue] = await Promise.all([getSession(), getLangue()]);
  if (session?.role !== "beneficiaire") redirect("/connexion?espace=beneficiaire");
  const t = T[langue];
  const base = db();
  const b = base.beneficiaires.find((x) => x.id === session.id);
  const prenom = base.identites.find((i) => i.id === b?.identiteId)?.prenom ?? "";
  const bebe = b ? base.bebes.find((x) => x.beneficiaireId === b.id) : undefined;
  const discret = !!b?.messageDiscret;

  // Petits compteurs : ce qui attend une action dans chaque section.
  const proposees = b ? base.orientations.filter((o) => o.beneficiaireId === b.id && o.statut === "proposee").length : 0;
  const vaccinsRetard = bebe ? etatVaccins(bebe, base).filter((e) => e.statut === "en_retard").length : 0;
  const preventionsAFaire = b ? etatPreventions(b, base).filter((e) => e.statut === "a_faire" || e.statut === "en_retard").length : 0;

  const sections: LienFemme[] = [
    { href: "/femme#accueil", libelle: t.accueil, icone: "coeur", compteur: proposees },
    { href: "/femme#calendrier", libelle: t.agenda, icone: "calendrier" },
    ...(bebe ? [{ href: "/femme#bebe", libelle: t.bebe, icone: "personne", compteur: vaccinsRetard } satisfies LienFemme] : []),
    { href: "/femme#sante", libelle: t.sante, icone: "bouclier", compteur: preventionsAFaire },
    { href: "/femme#ecouter", libelle: t.ecouter, icone: "micro" },
    { href: "/femme#compte", libelle: t.compte, icone: "cadenas" },
  ];
  // Tout reste dans l'espace : le répertoire s'ouvre ici, avec la même barre latérale.
  const autres: LienFemme[] = [{ href: "/femme/structures", libelle: t.structures, icone: "lieu" }];

  const marque = discret ? (
    <span className="flex items-center gap-2.5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-stone-200 text-stone-700"><Icone nom="calendrier" className="size-5" /></span>
      <span className="text-lg font-semibold">Agenda</span>
    </span>
  ) : (
    <Marque taille="sm" />
  );

  return (
    <div className="flex flex-1 flex-col bg-stone-100/60 lg:flex-row">
      <aside className="sticky top-0 z-20 border-b border-border bg-card print:hidden lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:shrink-0 lg:px-5 lg:py-5">
          <a href="/femme#accueil" className="flex min-w-0 items-center">{marque}</a>
          <div className="flex items-center gap-2 lg:hidden">
            <ChoixLangue langue={langue} />
            <form action={seDeconnecter}><button className="btn-sec btn-sm whitespace-nowrap">{t.quitter}</button></form>
          </div>
        </div>
        <NavFemme sections={sections} autres={autres} titres={t.sections} />
        <div className="hidden border-t border-border p-4 lg:block lg:shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">{prenom.slice(0, 1).toUpperCase() || "?"}</span>
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold">{prenom}</p>
              <p className="truncate text-xs text-muted">{t.role}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <ChoixLangue langue={langue} />
            <form action={seDeconnecter} className="flex-1">
              <button className="btn-sec btn-sm w-full">{t.deconnecter}</button>
            </form>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        <footer className="border-t border-border bg-card print:hidden">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 text-xs text-muted lg:px-8">
            <span>© {new Date().getFullYear()} Jongoma Tech</span>
            <span className="flex items-center gap-1.5"><Icone nom="cadenas" className="size-3.5" />{t.confidentialite}</span>
            <Link href="/femme/structures" className="hover:text-foreground">{t.structures}</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
