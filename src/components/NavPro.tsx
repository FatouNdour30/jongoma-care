"use client";
// Navigation de l'espace professionnel : barre latérale sur ordinateur, défilante sur mobile.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone, type NomIcone } from "./Icone";

export interface LienNav {
  href: string;
  libelle: string;
  icone: NomIcone;
  compteur?: number;
}

function Lien({ l, actif }: { l: LienNav; actif: boolean }) {
  return (
    <Link
      href={l.href}
      aria-current={actif ? "page" : undefined}
      className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${actif ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-stone-100 hover:text-foreground"}`}
    >
      <Icone nom={l.icone} className="size-[18px]" />
      <span className="flex-1">{l.libelle}</span>
      {!!l.compteur && <span className={`rounded-full px-1.5 text-xs font-bold ${actif ? "bg-white/20" : "bg-accent text-white"}`}>{l.compteur}</span>}
    </Link>
  );
}

export function NavPro({ principal, general, titres = ["Espace de travail", "Ressources"] }: { principal: LienNav[]; general: LienNav[]; titres?: [string, string] }) {
  const chemin = usePathname();
  // Le lien le plus spécifique qui correspond au chemin est actif.
  const actif = [...principal, ...general].filter((l) => chemin === l.href || chemin.startsWith(`${l.href}/`)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:px-3">
      <p className="hidden px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted lg:block">{titres[0]}</p>
      {principal.map((l) => <Lien key={l.href} l={l} actif={actif === l.href} />)}
      <p className="hidden px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-muted lg:block">{titres[1]}</p>
      {general.map((l) => <Lien key={l.href} l={l} actif={actif === l.href} />)}
    </nav>
  );
}
