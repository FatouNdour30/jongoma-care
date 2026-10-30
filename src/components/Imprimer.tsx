"use client";
// Ouvre la boîte d'impression du navigateur (impression papier ou « Enregistrer en PDF »).
export function Imprimer({ libelle = "Imprimer / PDF" }: { libelle?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-sm print:hidden">
      {libelle}
    </button>
  );
}
