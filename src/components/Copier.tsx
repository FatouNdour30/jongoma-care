"use client";
import { useState } from "react";

export function Copier({ texte }: { texte: string }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé) : le texte reste sélectionnable.
    }
  }

  return (
    <button type="button" onClick={copier} className="btn-sec btn-sm">
      {copie ? "Copié" : "Copier"}
    </button>
  );
}
