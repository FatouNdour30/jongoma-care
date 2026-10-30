// Briques communes des tableaux de bord professionnels.
import Link from "next/link";
import type { ReactNode } from "react";
import { getLangue, locale } from "@/lib/langue";
import { addDays, today } from "@/lib/protocol";
import { Icone, type NomIcone } from "./Icone";

export const dateLongue = (iso: string, loc = "fr-FR") => new Date(iso).toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
export const ilYa = (iso: string) => {
  const j = Math.round((new Date(today()).getTime() - new Date(iso).getTime()) / 864e5);
  return j <= 0 ? "aujourd'hui" : j === 1 ? "hier" : `il y a ${j} jours`;
};
export const initiales = (nom: string) => nom.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase();

export async function EnTete({ surtitre, titre, sous, actions }: { surtitre?: string; titre: string; sous?: string; actions?: ReactNode }) {
  const langue = await getLangue();
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-muted first-letter:uppercase">{surtitre ?? dateLongue(today(), locale(langue))}</p>
        <h1 className="mt-0.5 text-3xl font-semibold">{titre}</h1>
        {sous && <p className="mt-1 text-sm text-muted">{sous}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

const TONS = {
  marque: "bg-brand-soft text-brand",
  alerte: "bg-orange-100 text-accent",
  neutre: "bg-stone-100 text-stone-600",
  succes: "bg-emerald-100 text-emerald-700",
} as const;

// La jauge passe en couleur d'alerte au-delà de `seuilAlerte` (ex. capacité presque pleine).
export async function Kpi({ icone, valeur, libelle, detail, href, ton = "marque", jauge, seuilAlerte = 90 }: { icone: NomIcone; valeur: ReactNode; libelle: string; detail?: string; href?: string; ton?: keyof typeof TONS; jauge?: number; seuilAlerte?: number }) {
  const voir = (await getLangue()) === "en" ? "View →" : "Voir →";
  const corps = (
    <>
      <div className="flex items-start justify-between">
        <span className={`rounded-xl p-2 ${TONS[ton]}`}><Icone nom={icone} className="size-5" /></span>
        {href && <span className="text-xs text-muted transition group-hover:text-brand">{voir}</span>}
      </div>
      <div className="mt-3 font-display text-3xl font-semibold tabular-nums">{valeur}</div>
      <div className="text-sm font-medium">{libelle}</div>
      {detail && <div className="text-xs text-muted">{detail}</div>}
      {jauge !== undefined && (
        <div className="mt-3 h-1.5 rounded-full bg-stone-100" role="img" aria-label={`${Math.round(jauge)} %`}>
          <div className={`h-1.5 rounded-full ${jauge > seuilAlerte ? "bg-accent" : "bg-brand"}`} style={{ width: `${Math.min(100, jauge)}%` }} />
        </div>
      )}
    </>
  );
  return href ? (
    <Link href={href} className="card group transition hover:-translate-y-0.5 hover:shadow-md">{corps}</Link>
  ) : (
    <div className="card">{corps}</div>
  );
}

export function Panneau({ titre, sous, compteur, action, children, id, className = "" }: { titre: string; sous?: string; compteur?: number; action?: ReactNode; children: ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-6 overflow-hidden rounded-2xl border border-border bg-card ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            {titre}
            {compteur !== undefined && <span className={`rounded-full px-2 text-xs font-bold ${compteur ? "bg-brand text-white" : "bg-stone-100 text-muted"}`}>{compteur}</span>}
          </h2>
          {sous && <p className="text-xs text-muted">{sous}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Vide({ icone = "bouclier", titre, texte }: { icone?: NomIcone; titre: string; texte?: string }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600"><Icone nom={icone} className="size-6" /></span>
      <p className="mt-3 text-sm font-medium">{titre}</p>
      {texte && <p className="mt-1 max-w-xs text-xs text-muted">{texte}</p>}
    </div>
  );
}

export function Onglets({ onglets, actif }: { onglets: { id: string; libelle: string; href: string; compteur?: number }[]; actif: string }) {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1" aria-label="Filtres">
      {onglets.map((o) => (
        <Link
          key={o.id}
          href={o.href}
          aria-current={o.id === actif ? "page" : undefined}
          className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${o.id === actif ? "bg-card text-foreground shadow-sm ring-1 ring-black/5" : "text-muted hover:text-foreground"}`}
        >
          {o.libelle}
          {o.compteur !== undefined && <span className="rounded-full bg-stone-200/80 px-1.5 text-xs tabular-nums">{o.compteur}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function Avatar({ nom, ton = "marque" }: { nom: string; ton?: "marque" | "alerte" | "neutre" }) {
  const c = ton === "alerte" ? "bg-orange-100 text-accent" : ton === "neutre" ? "bg-stone-100 text-stone-600" : "bg-brand-soft text-brand";
  return <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${c}`}>{initiales(nom)}</span>;
}

// Agenda des 7 prochains jours en liste : une ligne par jour, adapté aux colonnes étroites.
export function AgendaListe<T>({ elements, date, rendu, nbJours = 7, masquerVides }: { elements: T[]; date: (e: T) => string; rendu: (e: T) => ReactNode; nbJours?: number; masquerVides?: boolean }) {
  const t = today();
  const jours = Array.from({ length: nbJours }, (_, i) => addDays(t, i)).filter((j) => !masquerVides || elements.some((e) => date(e) === j));
  return (
    <ol className="-my-1 divide-y divide-border">
      {jours.map((j, i) => {
        const du = elements.filter((e) => date(e) === j);
        return (
          <li key={j} className="flex items-start gap-3 py-2">
            <div className={`w-12 shrink-0 rounded-lg py-1 text-center ${j === t ? "bg-brand text-white" : "bg-stone-100"}`}>
              <div className={`text-[10px] font-semibold uppercase ${i === 0 ? "text-white/80" : "text-muted"}`}>{j === t ? "auj." : new Date(j).toLocaleDateString("fr-FR", { weekday: "short" })}</div>
              <div className="text-sm font-bold leading-tight tabular-nums">{new Date(j).getDate()}</div>
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5 pt-1">
              {du.length === 0 ? <span className="pt-0.5 text-xs text-muted/70">Aucun rendez-vous</span> : du.map((e, k) => <span key={k}>{rendu(e)}</span>)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Agenda des 7 prochains jours : nombre d'éléments par jour, aujourd'hui mis en avant.
export function Semaine<T>({ elements, date, rendu, vide = "Rien de prévu" }: { elements: T[]; date: (e: T) => string; rendu: (e: T) => ReactNode; vide?: string }) {
  const t = today();
  const jours = Array.from({ length: 7 }, (_, i) => addDays(t, i));
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {jours.map((j, i) => {
        const du = elements.filter((e) => date(e) === j);
        return (
          <div key={j} className={`flex min-h-28 flex-col rounded-xl p-2 ${i === 0 ? "bg-brand-soft/60 ring-1 ring-brand/30" : "bg-stone-50"}`}>
            <div className="text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">{new Date(j).toLocaleDateString("fr-FR", { weekday: "short" })}</div>
              <div className={`text-lg font-semibold tabular-nums ${i === 0 ? "text-brand" : ""}`}>{new Date(j).getDate()}</div>
            </div>
            <div className="mt-1 space-y-1">
              {du.slice(0, 3).map((e, k) => <div key={k}>{rendu(e)}</div>)}
              {du.length > 3 && <div className="text-center text-[10px] font-semibold text-muted">+{du.length - 3}</div>}
              {du.length === 0 && <div className="pt-2 text-center text-[10px] text-muted/70">{vide}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
