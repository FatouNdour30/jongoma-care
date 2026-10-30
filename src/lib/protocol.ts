// Protocole de suivi. VALEURS PAR DÉFAUT À VALIDER par le référent clinique
// avant tout usage réel (cahier des charges, section 12).

const JOUR = 24 * 60 * 60 * 1000;

export const addDays = (iso: string, jours: number) =>
  new Date(new Date(iso).getTime() + jours * JOUR).toISOString().slice(0, 10);

export const diffDays = (a: string, b: string) =>
  Math.round((new Date(a).getTime() - new Date(b).getTime()) / JOUR);

export const today = () => new Date().toISOString().slice(0, 10);

// Règle de Naegele : DDR + 280 jours. Estimation indicative, jamais une date certaine.
export const METHODE_DPA = "Règle de Naegele (date des dernières règles + 280 jours)";

export function datePrevue(ddr?: string, corrigee?: string): { date: string; source: string } | null {
  if (corrigee) return { date: corrigee, source: "Corrigée par un professionnel de santé" };
  if (!ddr) return null;
  return { date: addDays(ddr, 280), source: METHODE_DPA };
}

export function semainesAmenorrhee(ddr: string, ref = today()) {
  return Math.floor(diffDays(ref, ddr) / 7);
}

// Calendrier des consultations prénatales (semaines d'aménorrhée).
// Inspiré du modèle OMS à 8 contacts ; à adapter au protocole national.
export const CALENDRIER_CPN = [12, 20, 26, 30, 34, 36, 38, 40];

// Consultations postnatales (jours après l'accouchement).
export const CALENDRIER_CPON = [
  { jours: 3, libelle: "Consultation postnatale mère et bébé (J3)" },
  { jours: 10, libelle: "Consultation postnatale mère et bébé (J7–J14)" },
  { jours: 42, libelle: "Consultation postnatale mère et bébé (6 semaines)" },
];

export const ETAPES = [
  { id: "inscription", libelle: "Inscription" },
  { id: "grossesse", libelle: "Suivi de grossesse" },
  { id: "preparation", libelle: "Préparation à l'accouchement" },
  { id: "postnatal", libelle: "Postnatal" },
  { id: "cloture", libelle: "Clôture du suivi" },
] as const;

// Procédure d'escalade : contenu provisoire, à remplacer par la procédure
// validée par les professionnels de santé locaux (F-32).
export const ESCALADE = {
  avertissement:
    "La référente ne pose aucun diagnostic. En cas de signe d'alerte signalé, elle applique cette procédure.",
  etapes: [
    "Orienter immédiatement vers la structure de santé la plus proche ou les urgences.",
    "Prévenir la sage-femme référente de la bénéficiaire.",
    "Noter l'heure de l'escalade dans le plan de suivi (sans détail clinique).",
  ],
  numeroUrgence: "[Numéro d'urgence à vérifier localement]",
};
