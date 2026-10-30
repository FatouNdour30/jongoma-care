// Graphiques SVG rendus côté serveur : une seule série par graphique (couleur de marque),
// grille discrète, étiquettes directes sélectives, info-bulle au survol (<title>) et
// tableau de données accessible sous chaque graphique.
import type { ReactNode } from "react";
import { getLangue } from "@/lib/langue";

const SERIE = "var(--brand)";
const ENCRE = "var(--foreground)";
const SECONDAIRE = "var(--muted)";
const GRILLE = "var(--border)";

async function Tableau({ entetes, lignes }: { entetes: string[]; lignes: (string | number)[][] }) {
  const voir = (await getLangue()) === "en" ? "View data" : "Voir les données";
  return (
    <details className="mt-3 text-xs">
      <summary className="cursor-pointer text-muted hover:text-foreground">{voir}</summary>
      <table className="mt-2 w-full">
        <thead className="text-left text-muted">
          <tr>{entetes.map((e) => <th key={e} className="py-1 pr-2 font-medium">{e}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border tabular-nums">
          {lignes.map((l, i) => <tr key={i}>{l.map((c, j) => <td key={j} className="py-1 pr-2">{c}</td>)}</tr>)}
        </tbody>
      </table>
    </details>
  );
}

export function CarteGraphique({ titre, sous, children }: { titre: string; sous?: string; children: ReactNode }) {
  return (
    <section className="card">
      <h2 className="font-semibold">{titre}</h2>
      {sous && <p className="text-xs text-muted">{sous}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// Évolution d'un taux (0–100 %) dans le temps. Un point nul = pas assez de données.
export function Courbe({ points, unite = " %", hauteur = 200 }: { points: { x: string; v: number | null; detail?: string }[]; unite?: string; hauteur?: number }) {
  const L = 640, H = hauteur, g = 34, d = 24, h = 14, b = 26;
  const pw = L - g - d, ph = H - h - b;
  const px = (i: number) => g + (points.length === 1 ? pw / 2 : (i * pw) / (points.length - 1));
  const py = (v: number) => h + ph - (v / 100) * ph;
  const segments: string[] = [];
  let cur = "";
  points.forEach((p, i) => {
    if (p.v === null) {
      if (cur) segments.push(cur);
      cur = "";
    } else cur += `${cur ? "L" : "M"}${px(i).toFixed(1)},${py(p.v).toFixed(1)}`;
  });
  if (cur) segments.push(cur);
  const dernier = [...points].reverse().find((p) => p.v !== null);
  const iDernier = dernier ? points.lastIndexOf(dernier) : -1;

  return (
    <>
      <svg viewBox={`0 0 ${L} ${H}`} className="w-full" role="img" aria-label={`Courbe, dernière valeur ${dernier?.v ?? "—"}${unite}`}>
        {[0, 25, 50, 75, 100].map((t) => (
          <g key={t}>
            <line x1={g} x2={L - d} y1={py(t)} y2={py(t)} stroke={GRILLE} strokeWidth={1} />
            <text x={g - 6} y={py(t) + 3.5} textAnchor="end" fontSize={11} fill={SECONDAIRE}>{t}</text>
          </g>
        ))}
        {points.map((p, i) => (i % 2 === 0 || i === points.length - 1 ? <text key={p.x} x={px(i)} y={H - 8} textAnchor="middle" fontSize={11} fill={SECONDAIRE}>{p.x}</text> : null))}
        {segments.map((s) => <path key={s} d={s} fill="none" stroke={SERIE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />)}
        {points.map((p, i) =>
          p.v === null ? null : (
            <g key={p.x} className="group">
              <circle cx={px(i)} cy={py(p.v)} r={14} fill="transparent" />
              <circle cx={px(i)} cy={py(p.v)} r={4} fill={SERIE} stroke="var(--card)" strokeWidth={2} className="transition group-hover:[r:6]" />
              <title>{`${p.x} : ${p.v}${unite}${p.detail ? ` (${p.detail})` : ""}`}</title>
            </g>
          ),
        )}
        {dernier && <text x={px(iDernier) - 8} y={py(dernier.v!) - 10} textAnchor="end" fontSize={12} fontWeight={600} fill={ENCRE}>{dernier.v}{unite}</text>}
      </svg>
      <Tableau entetes={["Période", "Valeur", "Détail"]} lignes={points.map((p) => [p.x, p.v === null ? "données insuffisantes" : `${p.v}${unite}`, p.detail ?? ""])} />
    </>
  );
}

// Barres horizontales : valeur sur un maximum (ex. charge / capacité).
export function Barres({ items }: { items: { libelle: string; v: number; max: number; note?: string; alerte?: boolean }[] }) {
  return (
    <>
      <ul className="space-y-3">
        {items.map((it) => {
          const pct = Math.min(100, Math.round((it.v / it.max) * 100));
          return (
            <li key={it.libelle} title={`${it.libelle} : ${it.v} / ${it.max} (${pct} %)`}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{it.libelle} {it.note && <span className="text-xs font-normal text-muted">· {it.note}</span>}</span>
                <span className="tabular-nums text-muted"><span className="font-semibold text-foreground">{it.v}</span> / {it.max}</span>
              </div>
              <div className="h-2.5 rounded-full bg-stone-100">
                <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, background: it.alerte ? "var(--accent)" : SERIE }} />
              </div>
            </li>
          );
        })}
      </ul>
      <Tableau entetes={["", "Valeur", "Maximum"]} lignes={items.map((i) => [i.libelle, i.v, i.max])} />
    </>
  );
}

// Colonnes verticales pour des effectifs par catégorie ou par période.
export function Colonnes({ items, hauteur = 150 }: { items: { x: string; v: number }[]; hauteur?: number }) {
  const L = 440, H = hauteur, g = 4, d = 4, h = 18, b = 22;
  const max = Math.max(1, ...items.map((i) => i.v));
  const pas = (L - g - d) / items.length;
  const larg = Math.min(46, pas - 6);
  const py = (v: number) => h + (H - h - b) - (v / max) * (H - h - b);
  const etiqueter = items.length <= 8;
  return (
    <>
      <svg viewBox={`0 0 ${L} ${H}`} className="w-full" role="img" aria-label="Diagramme en colonnes">
        <line x1={g} x2={L - d} y1={H - b} y2={H - b} stroke={GRILLE} />
        {items.map((it, i) => {
          const x = g + i * pas + (pas - larg) / 2;
          const y = py(it.v);
          const hb = Math.max(0, H - b - y);
          return (
            <g key={it.x} className="group">
              <rect x={g + i * pas} y={h} width={pas} height={H - h - b} fill="transparent" />
              {hb > 0 && <path d={`M${x},${H - b} V${y + Math.min(4, hb)} q0,-4 4,-4 h${larg - 8} q4,0 4,4 V${H - b} Z`} fill={SERIE} className="opacity-90 transition group-hover:opacity-100" />}
              {(etiqueter || it.v === max) && it.v > 0 && <text x={x + larg / 2} y={y - 5} textAnchor="middle" fontSize={12} fontWeight={600} fill={ENCRE}>{it.v}</text>}
              {(etiqueter || i % 3 === 0) && <text x={x + larg / 2} y={H - 6} textAnchor="middle" fontSize={11} fill={SECONDAIRE}>{it.x}</text>}
              <title>{`${it.x} : ${it.v}`}</title>
            </g>
          );
        })}
      </svg>
      <Tableau entetes={["", "Effectif"]} lignes={items.map((i) => [i.x, i.v])} />
    </>
  );
}
