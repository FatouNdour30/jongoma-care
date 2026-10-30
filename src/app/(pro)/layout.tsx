import Link from "next/link";
import { redirect } from "next/navigation";
import { ChoixLangue } from "@/components/ChoixLangue";
import { Marque } from "@/components/Marque";
import { NavPro, type LienNav } from "@/components/NavPro";
import { PiedDePagePro } from "@/components/PiedDePage";
import { LIBELLES } from "@/components/ui";
import { seDeconnecter } from "@/lib/actions";
import { db } from "@/lib/db";
import { getLangue } from "@/lib/langue";
import { notifications } from "@/lib/notifications";
import { getSession } from "@/lib/session";
import type { Role } from "@/lib/types";

function liens(role: Role, enAttente: number): LienNav[] {
  switch (role) {
    case "coordinatrice":
      return [
        { href: "/coordination", libelle: "Tableau de bord", icone: "graphique" },
        { href: "/coordination/affectations", libelle: "Affectations", icone: "personne" },
        { href: "/coordination/equipe", libelle: "Équipe", icone: "equipe" },
        { href: "/coordination/structures", libelle: "Structures", icone: "hopital" },
        { href: "/coordination/programmes", libelle: "Programmes de santé", icone: "coeur" },
        { href: "/coordination/carte", libelle: "Carte des besoins", icone: "carte" },
        { href: "/coordination/ia", libelle: "IA et équité", icone: "etincelle" },
        { href: "/coordination/comptes", libelle: "Comptes et accès", icone: "cadenas", compteur: enAttente },
        { href: "/coordination/rapport", libelle: "Rapport", icone: "document" },
        { href: "/coordination/journal", libelle: "Journal d'audit", icone: "bouclier" },
      ];
    case "referente":
      return [
        { href: "/personnel", libelle: "Aujourd'hui", icone: "equipe" },
        { href: "/personnel/agenda", libelle: "Agenda", icone: "calendrier" },
        { href: "/personnel/orientations", libelle: "Orientations", icone: "partage" },
        { href: "/personnel/statistiques", libelle: "Mes statistiques", icone: "graphique" },
      ];
    case "specialiste":
      return [{ href: "/specialiste", libelle: "Orientations reçues", icone: "message" }];
    case "etablissement":
      return [
        { href: "/etablissement", libelle: "Demandes et rendez-vous", icone: "message" },
        { href: "/etablissement/agenda", libelle: "Agenda", icone: "calendrier" },
        { href: "/etablissement/statistiques", libelle: "Statistiques", icone: "graphique" },
        { href: "/etablissement/fiche", libelle: "Ma fiche", icone: "hopital" },
      ];
    default:
      return [];
  }
}

// Libellés anglais de la navigation, indexés par adresse (le français reste la source ci-dessus).
const NAV_EN: Record<string, string> = {
  "/coordination": "Dashboard", "/coordination/affectations": "Assignments", "/coordination/equipe": "Team", "/coordination/structures": "Facilities",
  "/coordination/programmes": "Health programmes", "/coordination/carte": "Needs map", "/coordination/ia": "AI and fairness", "/coordination/comptes": "Accounts and access",
  "/coordination/rapport": "Report", "/coordination/journal": "Audit log", "/personnel": "Today", "/personnel/agenda": "Calendar", "/personnel/orientations": "Referrals",
  "/personnel/statistiques": "My statistics", "/specialiste": "Referrals received", "/etablissement": "Requests and appointments", "/etablissement/agenda": "Calendar",
  "/etablissement/statistiques": "Statistics", "/etablissement/fiche": "My profile", "/espace/notifications": "Notifications", "/espace/repertoire": "Directory",
  "/espace/contenus": "Audio content", "/espace/protocole": "Protocol", "/espace/donnees": "Open data", "/espace/compte": "My account",
};

const T = {
  fr: { roles: { referente: "Référente principale", coordinatrice: "Coordinatrice", etablissement: "Établissement partenaire", specialiste: "Spécialiste" } as Record<string, string>, specialites: LIBELLES.specialite as Record<string, string>, sections: ["Espace de travail", "Ressources"] as [string, string], deconnecter: "Se déconnecter", deconnexion: "Déconnexion", monTableau: "Mon tableau de bord" },
  en: { roles: { referente: "Primary follow-up agent", coordinatrice: "Coordinator", etablissement: "Partner facility", specialiste: "Specialist" } as Record<string, string>, specialites: { "sage-femme": "Midwife", social: "Social worker", psychosocial: "Psychosocial support", protection: "Protection officer" } as Record<string, string>, sections: ["Workspace", "Resources"] as [string, string], deconnecter: "Sign out", deconnexion: "Sign out", monTableau: "My dashboard" },
};

export default async function ProLayout({ children }: LayoutProps<"/">) {
  const [session, langue] = await Promise.all([getSession(), getLangue()]);
  const t = T[langue];
  if (!session) redirect("/connexion?espace=personnel&erreur=session");
  if (session.role === "beneficiaire") redirect("/femme");

  const base = db();
  const compte = base.comptes.find((c) => c.id === session.compteId);
  const personnel = base.personnel.find((p) => p.id === session.id);
  const sousRole = personnel?.specialite ? t.specialites[personnel.specialite] : t.roles[session.role];
  const enAttente = base.comptes.filter((c) => c.statut === "en_attente").length;
  const traduire = (l: LienNav): LienNav => (langue === "en" ? { ...l, libelle: NAV_EN[l.href] ?? l.libelle } : l);
  const nav = liens(session.role, enAttente).map(traduire);
  const general: LienNav[] = ([
    { href: "/espace/notifications", libelle: "Notifications", icone: "message", compteur: notifications(session, base).length },
    { href: "/espace/repertoire", libelle: "Répertoire", icone: "lieu" },
    { href: "/espace/contenus", libelle: "Contenus audio", icone: "micro" },
    { href: "/espace/protocole", libelle: "Protocole", icone: "livre" },
    { href: "/espace/donnees", libelle: "Données ouvertes", icone: "graphique" },
    { href: "/espace/compte", libelle: "Mon compte", icone: "personne" },
  ] satisfies LienNav[]).map(traduire);
  const initiales = (compte?.nom ?? "?").split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-1 flex-col bg-stone-100/60 lg:flex-row">
      <aside className="border-b border-border bg-card print:hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:shrink-0 lg:px-5 lg:py-5">
          <Link href={nav[0]?.href ?? "/"} className="flex items-center" title={t.monTableau}>
            <Marque taille="sm" />
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <ChoixLangue langue={langue} />
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand lg:hidden">Pro</span>
          </div>
        </div>
        <NavPro principal={nav} general={general} titres={t.sections} />
        <div className="hidden border-t border-border p-4 lg:block lg:shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">{initiales}</span>
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold">{compte?.nom}</p>
              <p className="truncate text-xs text-muted">{sousRole}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <ChoixLangue langue={langue} />
            <form action={seDeconnecter} className="flex-1">
              <button className="btn-sec btn-sm w-full">{t.deconnecter}</button>
            </form>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5 text-sm print:hidden lg:hidden">
          <span className="truncate"><span className="font-semibold">{compte?.nom}</span> · <span className="text-muted">{sousRole}</span></span>
          <form action={seDeconnecter}><button className="text-muted underline">{t.deconnexion}</button></form>
        </div>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        <PiedDePagePro langue={langue} />
      </div>
    </div>
  );
}
