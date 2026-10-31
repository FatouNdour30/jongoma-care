// Courbe de poids du bébé sur la zone habituelle de l'OMS (de -2 à +2 écarts-types, médiane en pointillé).
// Orientation seulement : la courbe ne pose aucun diagnostic.
import { fmt } from "./ui";
import { MENTION_OMS, moisDepuis, referenceOms, zonePoids } from "@/lib/enfants";
import { today } from "@/lib/protocol";
import type { Bebe } from "@/lib/types";

const L = 560, H = 250, G = { g: 40, d: 12, h: 24, b: 30 };

export function CourbeCroissance({ bebe }: { bebe: Bebe }) {
  const points = (bebe.mesures ?? []).filter((m) => m.poidsKg).map((m) => ({ ...m, mois: moisDepuis(bebe.dateNaissance, m.date) }));
  const ageMois = moisDepuis(bebe.dateNaissance, today());
  const maxMois = Math.min(24, Math.max(6, Math.ceil(Math.max(ageMois, ...points.map((p) => p.mois)) + 1)));
  const sexe = bebe.sexe;
  const maxPoids = Math.ceil(Math.max(sexe ? referenceOms(sexe, "p2", maxMois) : 0, ...points.map((p) => p.poidsKg!), 6) + 0.5);
  const x = (m: number) => G.g + (m / maxMois) * (L - G.g - G.d);
  const y = (kg: number) => H - G.b - (kg / maxPoids) * (H - G.h - G.b);
  const pas = Array.from({ length: maxMois * 2 + 1 }, (_, i) => i / 2);
  const serie = (s: "m2" | "med" | "p2") => pas.map((m) => [x(m), y(referenceOms(sexe!, s, m))] as const);
  const zone = zonePoids(bebe);
  const pasX = maxMois <= 6 ? 1 : maxMois <= 12 ? 2 : 3;
  const pasY = maxPoids <= 8 ? 1 : 2;

  return (
    <div>
      <svg viewBox={`0 0 ${L} ${H}`} className="w-full" role="img" aria-label={`Courbe de poids : ${points.length} mesure(s)${zone ? `, dernier poids ${zone === "dans" ? "dans" : zone === "dessous" ? "sous" : "au-dessus de"} la zone habituelle` : ""}.`}>
        {Array.from({ length: Math.floor(maxPoids / pasY) + 1 }, (_, i) => i * pasY).map((kg) => (
          <g key={kg}>
            <line x1={G.g} x2={L - G.d} y1={y(kg)} y2={y(kg)} stroke="var(--border)" strokeWidth={1} />
            <text x={G.g - 8} y={y(kg) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{kg}</text>
          </g>
        ))}
        {Array.from({ length: Math.floor(maxMois / pasX) + 1 }, (_, i) => i * pasX).map((m) => (
          <text key={m} x={x(m)} y={H - 10} textAnchor="middle" fontSize={11} fill="var(--muted)">{m} m</text>
        ))}
        <text x={G.g - 8} y={10} textAnchor="end" fontSize={10} fill="var(--muted)">kg</text>
        {sexe && (
          <>
            <path d={`M${serie("p2").map(([a, b]) => `${a},${b}`).join("L")}L${serie("m2").reverse().map(([a, b]) => `${a},${b}`).join("L")}Z`} fill="var(--brand-soft)" opacity={0.7} />
            <path d={`M${serie("med").map(([a, b]) => `${a},${b}`).join("L")}`} fill="none" stroke="var(--brand)" strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="5 4" />
          </>
        )}
        {points.length > 1 && <path d={`M${points.map((p) => `${x(p.mois)},${y(p.poidsKg!)}`).join("L")}`} fill="none" stroke="var(--brand)" strokeWidth={2} />}
        {points.map((p) => (
          <g key={p.date}>
            <circle cx={x(p.mois)} cy={y(p.poidsKg!)} r={5} fill="var(--brand)" stroke="var(--card)" strokeWidth={2} />
            <circle cx={x(p.mois)} cy={y(p.poidsKg!)} r={14} fill="transparent"><title>{`${fmt(p.date)} : ${String(p.poidsKg).replace(".", ",")} kg${p.tailleCm ? ` · ${p.tailleCm} cm` : ""}`}</title></circle>
          </g>
        ))}
      </svg>
      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full bg-brand" />Poids de bébé</span>
        {sexe ? (
          <>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded-sm bg-brand-soft" />Zone habituelle (OMS)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-4 border-t-2 border-dashed border-brand/50" />Médiane</span>
          </>
        ) : (
          <span>Indiquez le sexe du bébé pour afficher la zone de référence.</span>
        )}
      </p>
      {points.length === 0 && <p className="mt-2 text-sm text-muted">Aucune mesure pour l&apos;instant : elles sont recopiées du carnet de santé à chaque consultation.</p>}
      {zone && zone !== "dans" && (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Le dernier poids est {zone === "dessous" ? "en dessous" : "au-dessus"} de la zone habituelle. Ce n&apos;est pas un diagnostic : parlez-en à l&apos;agent de santé lors de la prochaine consultation.</p>
      )}
      {points.length > 0 && (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-muted underline">Voir les mesures</summary>
          <table className="mt-2 w-full text-sm tabular-nums">
            <thead className="text-left text-xs text-muted"><tr><th className="py-1 font-semibold">Date</th><th className="text-right font-semibold">Âge</th><th className="text-right font-semibold">Poids</th><th className="text-right font-semibold">Taille</th></tr></thead>
            <tbody className="divide-y divide-border">
              {points.map((p) => (
                <tr key={p.date}><td className="py-1">{fmt(p.date)}</td><td className="text-right">{p.mois.toFixed(1).replace(".", ",")} mois</td><td className="text-right">{String(p.poidsKg).replace(".", ",")} kg</td><td className="text-right">{p.tailleCm ? `${p.tailleCm} cm` : "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
      <p className="mt-2 text-xs text-muted">{MENTION_OMS}</p>
    </div>
  );
}
