// Mention sobre affichée uniquement en environnement de démonstration, là où des chiffres
// pourraient être pris pour des résultats réels du pilote.
import { getLangue } from "@/lib/langue";
import { MODE_DEMO } from "@/lib/mode";

export async function DonneesExemple({ clair }: { clair?: boolean }) {
  if (!MODE_DEMO) return null;
  const langue = await getLangue();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold print:border print:border-stone-400 ${clair ? "bg-white/15 text-white ring-1 ring-white/30" : "bg-stone-100 text-stone-600 ring-1 ring-stone-200"}`}>
      <span className={`size-1.5 rounded-full ${clair ? "bg-white" : "bg-stone-400"}`} aria-hidden />
      {langue === "en" ? "Sample data" : "Données d'exemple"}
    </span>
  );
}
