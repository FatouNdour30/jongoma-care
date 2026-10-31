// Jongoma Baby Journey : les 1 000 premiers jours, de la grossesse aux 2 ans de l'enfant, en un seul parcours.
import { PARCOURS_1000 } from "@/lib/enfants";

export function Parcours1000({ actuelle }: { actuelle: (typeof PARCOURS_1000)[number]["id"] }) {
  const i = PARCOURS_1000.findIndex((e) => e.id === actuelle);
  return (
    <ol className="grid gap-3 sm:grid-cols-4" aria-label="Les 1 000 premiers jours">
      {PARCOURS_1000.map((e, k) => (
        <li key={e.id} aria-current={k === i ? "step" : undefined} className={`rounded-2xl p-4 ring-1 ${k === i ? "bg-brand text-white ring-brand" : k < i ? "bg-brand-soft/50 ring-brand/20" : "bg-card ring-border"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${k === i ? "text-white/80" : "text-brand"}`}>{k < i ? "Passé" : k === i ? "Vous êtes ici" : "À venir"}</p>
          <p className="mt-1 font-semibold">{e.titre}</p>
          <p className={`mt-1 text-sm ${k === i ? "text-white/85" : "text-muted"}`}>{e.texte}</p>
        </li>
      ))}
    </ol>
  );
}
