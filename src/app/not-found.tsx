import Link from "next/link";

export default function Introuvable() {
  return (
    <div className="card mx-4 my-16 max-w-lg space-y-3 text-center sm:mx-auto">
      <h1 className="text-xl font-bold">Page introuvable</h1>
      <p className="text-sm text-muted">Cette page n&apos;existe pas, ou vous n&apos;y avez pas accès avec ce compte.</p>
      <div className="flex justify-center gap-2">
        <Link href="/" className="btn btn-sm">Accueil</Link>
        <Link href="/connexion" className="btn-sec btn-sm">Changer de compte</Link>
      </div>
    </div>
  );
}
