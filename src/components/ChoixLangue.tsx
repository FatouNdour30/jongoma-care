"use client";
// Sélecteur de langue FR | EN : le choix est enregistré côté serveur, puis la page est rafraîchie.
import { useTransition } from "react";
import { choisirLangue } from "@/lib/actions";

export function ChoixLangue({ langue, sombre }: { langue: "fr" | "en"; sombre?: boolean }) {
  const [enCours, demarrer] = useTransition();

  return (
    <div role="group" aria-label="Langue / Language" className={`flex rounded-lg p-0.5 text-xs font-semibold ${sombre ? "bg-white/10" : "bg-stone-100"} ${enCours ? "opacity-60" : ""}`}>
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => l !== langue && demarrer(() => choisirLangue(l))}
          aria-pressed={l === langue}
          lang={l}
          className={`rounded-md px-2 py-1 uppercase transition ${l === langue ? (sombre ? "bg-white text-brand" : "bg-card text-brand shadow-sm") : sombre ? "text-white/70 hover:text-white" : "text-muted hover:text-foreground"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
