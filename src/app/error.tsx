"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function Erreur({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card mx-4 my-16 max-w-lg space-y-3 text-center sm:mx-auto">
      <h1 className="text-xl font-bold">Une erreur est survenue</h1>
      <p className="text-sm text-muted">L&apos;action n&apos;a pas pu aboutir. Vos données n&apos;ont pas été modifiées par cette erreur.</p>
      <div className="flex justify-center gap-2">
        <button onClick={() => retry()} className="btn btn-sm">Réessayer</button>
        <Link href="/" className="btn-sec btn-sm">Accueil</Link>
      </div>
    </div>
  );
}
