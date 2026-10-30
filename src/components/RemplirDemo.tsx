"use client";
// Remplit le formulaire de connexion avec un compte de démonstration puis l'envoie.
export function RemplirDemo({ identifiant, secret, nom, role, detail }: { identifiant: string; secret: string; nom: string; role: string; detail: string }) {
  function remplir() {
    const id = document.getElementById("identifiant") as HTMLInputElement | null;
    const mdp = document.getElementById("secret") as HTMLInputElement | null;
    if (id && mdp) {
      id.value = identifiant;
      mdp.value = secret;
      mdp.form?.requestSubmit();
    }
  }
  const initiales = nom.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();
  return (
    <button type="button" onClick={remplir} className="group flex w-full items-center gap-3 rounded-xl bg-card px-3 py-2 text-left text-sm ring-1 ring-border transition hover:ring-brand">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">{initiales}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{nom} <span className="font-normal text-muted">· {role}</span></span>
        <span className="block truncate text-xs text-muted">{detail}</span>
      </span>
      <span className="shrink-0 text-brand opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden>→</span>
    </button>
  );
}
