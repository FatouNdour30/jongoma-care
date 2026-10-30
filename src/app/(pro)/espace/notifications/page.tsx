import Link from "next/link";
import { Icone } from "@/components/Icone";
import { EnTete, Panneau, Vide } from "@/components/pro";
import { db } from "@/lib/db";
import { notifications, type Niveau } from "@/lib/notifications";
import { exigerRole } from "@/lib/session";

const STYLE: Record<Niveau, { libelle: string; puce: string; cadre: string }> = {
  urgent: { libelle: "Urgent", puce: "bg-red-600", cadre: "border-red-200 bg-red-50/60" },
  important: { libelle: "Important", puce: "bg-amber-500", cadre: "border-amber-200 bg-amber-50/50" },
  info: { libelle: "Information", puce: "bg-sky-500", cadre: "border-border bg-card" },
};

export default async function Notifications() {
  const s = await exigerRole("referente", "coordinatrice", "specialiste", "etablissement");
  const liste = notifications(s, db());

  return (
    <div className="space-y-6">
      <EnTete titre="Notifications" sous="Ce qui demande votre attention, calculé en temps réel à partir de votre périmètre." />
      <Panneau titre="À traiter" compteur={liste.length}>
        {liste.length === 0 ? (
          <Vide titre="Tout est à jour" texte="Aucune action en attente pour le moment." />
        ) : (
          <ul className="space-y-3">
            {liste.map((n) => (
              <li key={n.titre}>
                <Link href={n.href} className={`flex items-center gap-4 rounded-2xl border p-4 transition hover:shadow-md ${STYLE[n.niveau].cadre}`}>
                  <span className={`size-2.5 shrink-0 rounded-full ${STYLE[n.niveau].puce}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{n.titre}</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{STYLE[n.niveau].libelle}</span>
                    </span>
                    <span className="block text-sm text-muted">{n.detail}</span>
                  </span>
                  <Icone nom="lien" className="size-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panneau>
    </div>
  );
}
