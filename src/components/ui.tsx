import type { ReactNode } from "react";

const TONS = {
  vert: "bg-emerald-100 text-emerald-800",
  orange: "bg-amber-100 text-amber-800",
  rouge: "bg-red-100 text-red-800",
  gris: "bg-stone-100 text-stone-700",
  bleu: "bg-sky-100 text-sky-800",
} as const;

export function Badge({ ton = "gris", children }: { ton?: keyof typeof TONS; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TONS[ton]}`}>{children}</span>;
}

export function Titre({ titre, sous, action }: { titre: string; sous?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{titre}</h1>
        {sous && <p className="mt-1 text-sm text-muted">{sous}</p>}
      </div>
      {action}
    </div>
  );
}

export function Alerte({ children, ton = "vert" }: { children: ReactNode; ton?: "vert" | "orange" }) {
  const c = ton === "vert" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900";
  return <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${c}`}>{children}</div>;
}

export const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const LIBELLES = {
  rdv: { prevu: "Prévu", honore: "Honoré", manque: "Manqué", reporte: "Reporté", annule: "Annulé" },
  demande: { envoyee: "Envoyée", recue: "Reçue", acceptee: "Acceptée", autre_date: "Autre date proposée", refusee: "Refusée", en_attente: "En attente", annulee: "Annulée" },
  orientation: { proposee: "Proposée", acceptee: "Acceptée", transmise: "Transmise", prise_en_charge: "Prise en charge", cloturee: "Clôturée", refusee: "Refusée" },
  partenariat: { referencee: "Référencée", contactee: "Contactée", partenaire: "Partenaire confirmé" },
  specialite: { "sage-femme": "Sage-femme", social: "Assistante sociale", psychosocial: "Soutien psychosocial", protection: "Référente protection" },
  etape: { inscription: "Inscription", grossesse: "Grossesse", preparation: "Préparation", postnatal: "Postnatal", cloture: "Clôturé" },
} as const;

// Libellés lisibles du journal d'audit ; une action inconnue est affichée telle quelle.
const ACTIONS: Record<string, string> = {
  inscription: "Inscription",
  prevention_fait: "Prévention enregistrée comme faite",
  naissance_enregistree: "Naissance enregistrée",
  vaccin_fait: "Vaccin noté comme fait (carnet)",
  vaccin_refuse: "Vaccin refusé",
  vaccin_annuler: "Vaccin remis à faire",
  demande_rappel_vocal: "Demande de rappel (assistant vocal)",
  prevention_refuse: "Prévention refusée par la bénéficiaire",
  prevention_annuler: "Prévention remise à faire",
  mot_de_passe_change: "Mot de passe modifié",
  structure_ajoutee: "Structure ajoutée au répertoire",
  structure_partenaire: "Structure : partenaire confirmé",
  structure_contactee: "Structure : contactée",
  structure_referencee: "Structure : référencée",
  fiche_mise_a_jour: "Fiche établissement mise à jour",
  connexion: "Connexion",
  demande_acces: "Demande d'accès professionnel",
  compte_valide: "Accès validé",
  compte_refuse: "Accès refusé",
  maj_preferences: "Préférences modifiées",
  changement_referente: "Changement de référente",
  demande_mise_en_relation: "Demande de mise en relation",
  demande_annulee: "Demande annulée",
  orientation_acceptee_beneficiaire: "Orientation acceptée par la bénéficiaire",
  orientation_refusee_beneficiaire: "Orientation refusée par la bénéficiaire",
  export_donnees: "Export de ses données",
  suppression_donnees: "Suppression de ses données",
  signalement_repertoire: "Signalement du répertoire",
  consultation_dossier: "Consultation du dossier",
  contact: "Contact établi",
  appel_sans_reponse: "Appel sans réponse",
  rappel_envoye: "Rappel envoyé",
  ajout_rdv: "Rendez-vous ajouté",
  orientation_transmise: "Orientation transmise",
  orientation_proposee: "Orientation proposée",
  escalade_signe_alerte: "Escalade (signe d'alerte)",
  affectation: "Affectation",
  affectation_auto: "Affectation automatique",
  verification_structure: "Structure vérifiée",
  correction_dpa: "Date prévue corrigée",
  confirmation_rdv: "Rendez-vous confirmé",
  replanification_rdv: "Rendez-vous replanifié",
};

export const libelleAction = (a: string) =>
  ACTIONS[a] ??
  a.replace(/^verification_rdv_/, "Rendez-vous vérifié : ").replace(/^etape_/, "Étape : ").replace(/^demande_/, "Demande : ").replace(/^orientation_/, "Orientation : ").replaceAll("_", " ");

export const tonRdv =(s: string) => (s === "honore" ? "vert" : s === "manque" ? "rouge" : s === "reporte" ? "orange" : "gris");
export const tonPriorite = (n: string) => (n === "haute" ? "rouge" : n === "moyenne" ? "orange" : "gris");
