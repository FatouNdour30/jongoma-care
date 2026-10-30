import { Copier } from "@/components/Copier";
import { Ecouter } from "@/components/Ecouter";
import { EnTete, Onglets, Panneau } from "@/components/pro";
import { Badge } from "@/components/ui";
import { CAPSULES, THEMES, type Theme } from "@/lib/contenus";

// Bibliothèque des capsules : à écouter avec la bénéficiaire ou à lui transmettre.
export default async function Contenus({ searchParams }: PageProps<"/espace/contenus">) {
  const { theme } = (await searchParams) as Record<string, string | undefined>;
  const actif = theme && theme in THEMES ? (theme as Theme) : "tous";
  const liste = CAPSULES.filter((c) => actif === "tous" || c.theme === actif);
  const duree = CAPSULES.reduce((n, c) => n + c.dureeSecondes, 0);

  return (
    <div className="space-y-6">
      <EnTete titre="Contenus audio" sous={`${CAPSULES.length} capsules · ${Math.round(duree / 60)} minutes d'écoute · à écouter avec les bénéficiaires ou à leur transmettre`} />
      <Onglets
        actif={actif}
        onglets={[
          { id: "tous", libelle: "Toutes", href: "/espace/contenus", compteur: CAPSULES.length },
          ...(Object.keys(THEMES) as Theme[]).map((t) => ({ id: t, libelle: THEMES[t], href: `/espace/contenus?theme=${t}`, compteur: CAPSULES.filter((c) => c.theme === t).length })),
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {liste.map((c) => (
          <Panneau key={c.id} titre={c.titre} sous={`${THEMES[c.theme]} · ${c.dureeSecondes} s`} action={<Badge ton={c.validation === "validee" ? "vert" : "orange"}>{c.validation === "validee" ? "Validée" : "En attente de validation"}</Badge>}>
            <p className="text-sm leading-relaxed">{c.texte}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Ecouter texte={c.texte} libelle="Écouter (français)" />
              <Copier texte={`${c.titre} — ${c.texte}`} />
              <span className="self-center text-xs text-muted">Wolof : enregistrement natif à venir</span>
            </div>
          </Panneau>
        ))}
      </div>
    </div>
  );
}
