import { EnTete, Panneau } from "@/components/pro";
import { db } from "@/lib/db";
import { addDays, today } from "@/lib/protocol";
import { exigerRole } from "@/lib/session";
import type { Zone } from "@/lib/types";
import { ZONES } from "@/lib/types";

// Cartographie agrégée des besoins (F-38), version schématique : positions approximatives,
// aucune donnée géographique individuelle.
const POSITIONS: Record<Zone, { x: number; y: number }> = {
  Guédiawaye: { x: 165, y: 95 },
  Pikine: { x: 245, y: 245 },
  Rufisque: { x: 375, y: 200 },
  Thiès: { x: 500, y: 95 },
  Mbour: { x: 480, y: 330 },
};

// Rampe séquentielle à une teinte (clair → foncé) pour le taux de rendez-vous honorés.
const RAMPE = ["#ccfbf1", "#99f6e4", "#5eead4", "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e", "#115e59"];
const couleur = (taux: number | null) => (taux === null ? "#e7e5e4" : RAMPE[Math.min(RAMPE.length - 1, Math.max(0, Math.floor(((taux - 40) / 60) * RAMPE.length)))]);

export default async function CarteBesoins() {
  await exigerRole("coordinatrice");
  const base = db();
  const t = today();
  const debut = addDays(t, -60);
  const donnees = ZONES.map((z) => {
    const bs = base.beneficiaires.filter((b) => b.zone === z && b.etape !== "cloture");
    const ids = new Set(bs.map((b) => b.id));
    const rdv = base.rendezVous.filter((r) => ids.has(r.beneficiaireId) && r.date >= debut && r.date < t && (r.statut === "honore" || r.statut === "manque"));
    const structures = base.structures.filter((s) => s.zone === z);
    const loin = bs.filter((b) => (b.distanceKm ?? 0) > 10).length;
    return {
      zone: z,
      actives: bs.length,
      taux: rdv.length >= 3 ? Math.round((rdv.filter((r) => r.statut === "honore").length / rdv.length) * 100) : null,
      structures: structures.length,
      partenaires: structures.filter((s) => s.statut === "partenaire").length,
      loin,
      sansRef: bs.filter((b) => b.consentements.accompagnement && !b.referenteId).length,
    };
  });
  const max = Math.max(1, ...donnees.map((d) => d.actives));
  const rayon = (n: number) => 18 + Math.sqrt(n / max) * 42;
  const prioritaires = [...donnees].filter((d) => d.taux !== null).sort((a, b) => (a.taux ?? 0) - (b.taux ?? 0)).slice(0, 2);

  return (
    <div className="space-y-6">
      <EnTete titre="Carte des besoins" sous="Vue agrégée par zone · 60 derniers jours. Carte schématique : positions approximatives, aucune donnée individuelle." />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panneau titre="Zones du pilote" sous="Taille : bénéficiaires actives · couleur : part des rendez-vous honorés">
          <svg viewBox="0 0 600 440" className="w-full" role="img" aria-label="Carte schématique des zones du pilote">
            <defs>
              <pattern id="mer" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#bae6fd" strokeWidth="1.5" />
              </pattern>
            </defs>
            <path d="M0,0 H95 C85,80 60,130 85,190 C110,250 170,300 300,330 C370,350 380,400 370,440 H0 Z" fill="url(#mer)" opacity="0.7" />
            <text x="25" y="330" fontSize="12" fill="#0369a1" fontStyle="italic">Océan Atlantique</text>
            <text x="88" y="205" fontSize="11" fill="var(--muted)">Dakar</text>
            {donnees.map((d) => {
              const p = POSITIONS[d.zone];
              const r = rayon(d.actives);
              return (
                <g key={d.zone}>
                  <circle cx={p.x} cy={p.y} r={r} fill={couleur(d.taux)} stroke="var(--card)" strokeWidth={2} />
                  <title>{`${d.zone} : ${d.actives} bénéficiaires actives · RDV honorés ${d.taux === null ? "données insuffisantes" : `${d.taux} %`} · ${d.structures} structure(s)`}</title>
                  <text x={p.x} y={p.y + r + 16} textAnchor="middle" fontSize="13" fontWeight={600} fill="var(--foreground)">{d.zone}</text>
                  <text x={p.x} y={p.y + r + 31} textAnchor="middle" fontSize="11" fill="var(--muted)">{d.actives} actives · {d.taux === null ? "—" : `${d.taux} %`}</text>
                  {Array.from({ length: d.structures }, (_, i) => (
                    <rect key={i} x={p.x - (d.structures * 9) / 2 + i * 9} y={p.y - 4} width={7} height={7} rx={1.5} fill="var(--card)" stroke="var(--foreground)" strokeWidth={1} opacity={0.85} />
                  ))}
                </g>
              );
            })}
          </svg>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-2">
              RDV honorés
              <span className="flex h-2.5 w-32 overflow-hidden rounded-full">{RAMPE.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</span>
              <span>40 % → 100 %</span>
            </span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-foreground/70 bg-card" /> structure référencée</span>
          </div>
        </Panneau>

        <div className="space-y-6">
          <Panneau titre="Zones à renforcer" sous="Plus faibles taux de rendez-vous honorés">
            <ul className="space-y-3">
              {prioritaires.map((d) => (
                <li key={d.zone} className="rounded-xl border border-orange-200 bg-orange-50/50 p-3 text-sm">
                  <p className="font-semibold">{d.zone} · {d.taux} % honorés</p>
                  <p className="text-xs text-muted">{d.loin} bénéficiaire(s) à plus de 10 km d&apos;une structure · {d.partenaires} partenaire(s) confirmé(s) sur {d.structures}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Pistes : renforcer les rappels, aide au transport, nouvelle structure partenaire dans la zone.</p>
          </Panneau>
          <Panneau titre="Prochaine étape" sous="Phase 2">
            <p className="text-sm text-muted">Carte géographique réelle avec temps de trajet estimés et zones mal desservies, à partir de données agrégées (OpenStreetMap), sous réserve des accords de données.</p>
          </Panneau>
        </div>
      </div>

      <Panneau titre="Détail par zone">
        <div className="-mx-5 -my-5 overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-5 py-2.5 font-semibold">Zone</th><th className="text-right font-semibold">Actives</th><th className="text-right font-semibold">RDV honorés</th><th className="text-right font-semibold">À plus de 10 km</th><th className="text-right font-semibold">Structures</th><th className="text-right font-semibold">Partenaires</th><th className="pr-5 text-right font-semibold">Sans référente</th></tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {donnees.map((d) => (
                <tr key={d.zone}>
                  <td className="px-5 py-2.5 font-medium">{d.zone}</td>
                  <td className="text-right">{d.actives}</td>
                  <td className="text-right">{d.taux === null ? "—" : `${d.taux} %`}</td>
                  <td className="text-right">{d.loin}</td>
                  <td className="text-right">{d.structures}</td>
                  <td className="text-right">{d.partenaires}</td>
                  <td className="pr-5 text-right">{d.sansRef || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panneau>
    </div>
  );
}
