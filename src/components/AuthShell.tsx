// Mise en page des pages de connexion et d'inscription : panneau photo fixe à gauche
// (ordinateur) ou bandeau compact (mobile), contenu centré à droite.
import type { ReactNode } from "react";
import { Icone, type NomIcone } from "./Icone";
import { Photo } from "./Photo";
import type { Photo as P } from "@/lib/photos";

export interface PointCle {
  icone: NomIcone;
  texte: string;
}

export function AuthShell({ photo, accroche, points, children, large }: { photo: P; accroche: string; points: PointCle[]; children: ReactNode; large?: boolean }) {
  return (
    <div className="relative left-1/2 -my-6 grid w-screen -translate-x-1/2 lg:min-h-[calc(100vh-4.45rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Panneau photo (ordinateur) : la colonne a la hauteur du formulaire et la photo, à la taille
          de l'écran, reste fixée pendant le défilement. Pas d'overflow-hidden ici : il casserait le sticky. */}
      <aside className="relative hidden bg-encre lg:block">
        <div className="sticky top-0 h-screen max-h-full overflow-hidden">
          <div className="absolute inset-0"><Photo photo={photo} priority sizes="(min-width: 1024px) 42vw, 1px" className="h-full" /></div>
          <div className="absolute inset-0 bg-gradient-to-t from-encre/90 via-encre/30 to-encre/10" />
          <div className="absolute inset-x-0 bottom-[4.45rem] px-10 pb-4 text-white xl:px-12">
            <p className="max-w-md font-display text-3xl font-semibold leading-tight">{accroche}</p>
            <ul className="mt-6 space-y-3">
              {points.map((p) => (
                <li key={p.texte} className="flex items-center gap-3 text-sm text-white/90">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur">
                    <Icone nom={p.icone} className="size-4" />
                  </span>
                  {p.texte}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Contenu */}
      <section className="flex min-w-0 flex-col bg-card">
        <div className="relative h-44 overflow-hidden lg:hidden">
          <div className="absolute inset-0"><Photo photo={photo} priority sizes="100vw" className="h-full" /></div>
          <div className="absolute inset-0 bg-gradient-to-t from-encre/85 to-encre/10" />
          <p className="absolute inset-x-0 bottom-0 px-5 pb-4 font-display text-xl font-semibold leading-snug text-white">{accroche}</p>
        </div>
        <div className={`mx-auto w-full flex-1 px-5 py-8 sm:px-8 lg:py-12 ${large ? "max-w-2xl" : "max-w-md"}`}>{children}</div>
      </section>
    </div>
  );
}

// Champ de formulaire avec icône à gauche.
export function ChampIcone({ icone, children }: { icone: NomIcone; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
        <Icone nom={icone} className="size-[18px]" />
      </span>
      {children}
    </div>
  );
}
