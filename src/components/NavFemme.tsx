"use client";
// Menu de l'espace bénéficiaire : barre latérale sur ordinateur, bandeau défilant sur téléphone.
// La section visible à l'écran est mise en évidence pendant le défilement.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icone, type NomIcone } from "./Icone";

export interface LienFemme {
  href: string;
  libelle: string;
  icone: NomIcone;
  compteur?: number;
}

// Les sections sont des ancres de la page d'accueil de l'espace (« /femme#agenda ») : depuis une autre
// page de l'espace, le lien y ramène ; sur l'accueil, il fait simplement défiler.
const ancre = (href: string) => href.slice(href.indexOf("#"));

export function NavFemme({ sections, autres, titres }: { sections: LienFemme[]; autres: LienFemme[]; titres: [string, string] }) {
  const chemin = usePathname();
  const surAccueil = chemin === "/femme";
  const [actif, setActif] = useState(sections[0]?.href);

  // Section active = la dernière dont le haut a franchi une ligne fixe sous le haut de l'écran ;
  // tout en haut de la page, c'est toujours la première. Recalculée au chargement et au défilement.
  useEffect(() => {
    if (!surAccueil) return;
    let image = 0;
    const calculer = () => {
      image = 0;
      const ligne = Math.min(160, window.innerHeight * 0.3);
      let courant = sections[0]?.href;
      if (window.scrollY >= 50) {
        for (const s of sections) {
          const e = document.querySelector(ancre(s.href));
          if (e && e.getBoundingClientRect().top <= ligne) courant = s.href;
        }
        // Bas de page atteint : la dernière section est forcément celle qu'on regarde.
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) courant = sections.at(-1)?.href ?? courant;
      }
      setActif(courant);
    };
    const planifier = () => {
      if (!image) image = requestAnimationFrame(calculer);
    };
    calculer();
    window.addEventListener("scroll", planifier, { passive: true });
    window.addEventListener("resize", planifier);
    return () => {
      window.removeEventListener("scroll", planifier);
      window.removeEventListener("resize", planifier);
      if (image) cancelAnimationFrame(image);
    };
  }, [sections, surAccueil]);

  const lien = (l: LienFemme, estSection: boolean) => {
    const estActif = estSection ? surAccueil && actif === l.href : chemin.startsWith(l.href);
    const classe = `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${estActif ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-stone-100 hover:text-foreground"}`;
    const contenu = (
      <>
        <Icone nom={l.icone} className="size-[18px]" />
        <span className="flex-1">{l.libelle}</span>
        {!!l.compteur && <span className={`rounded-full px-1.5 text-xs font-bold ${estActif ? "bg-white/20" : "bg-accent text-white"}`}>{l.compteur}</span>}
      </>
    );
    return estSection && surAccueil ? (
      <a key={l.href} href={ancre(l.href)} onClick={() => setActif(l.href)} aria-current={estActif ? "location" : undefined} className={classe}>{contenu}</a>
    ) : (
      <Link key={l.href} href={l.href} aria-current={estActif ? "page" : undefined} className={classe}>{contenu}</Link>
    );
  };

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto" aria-label={titres[0]}>
      <p className="hidden px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted lg:block">{titres[0]}</p>
      {sections.map((l) => lien(l, true))}
      <p className="hidden px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-muted lg:block">{titres[1]}</p>
      {autres.map((l) => lien(l, false))}
    </nav>
  );
}
