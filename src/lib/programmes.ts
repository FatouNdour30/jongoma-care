// Programmes de santé ciblés : prévention et dépistage des maladies prioritaires en santé maternelle.
// Jongoma Care ne pose aucun diagnostic et n'enregistre JAMAIS de résultat d'examen :
// seulement si une action de prévention a été réalisée, est à faire ou a été refusée.
// ÉCHÉANCES PROVISOIRES, à valider avec le protocole national et le référent clinique.
import { diffDays, semainesAmenorrhee, today } from "./protocol";
import type { Base, Beneficiaire } from "./types";

export type IdProgramme = "paludisme" | "anemie" | "triple" | "hypertension" | "tetanos" | "mental" | "col";

export interface ActionPrevention {
  id: string;
  programme: IdProgramme;
  libelle: string;
  // Échéance : à partir de N semaines d'aménorrhée (grossesse) ou de N jours après l'accouchement.
  echeance: { phase: "grossesse"; sa: number } | { phase: "postnatal"; jours: number };
}

export interface Programme {
  id: IdProgramme;
  nom: string;
  court: string;
  pourquoi: string;
  sensible?: boolean; // aucun détail ne sort de la structure de santé
}

export const PROGRAMMES: Programme[] = [
  { id: "paludisme", nom: "Paludisme pendant la grossesse", court: "Paludisme", pourquoi: "Le paludisme expose la mère à l'anémie et le bébé à un faible poids de naissance. Moustiquaire imprégnée et traitement préventif réduisent ce risque." },
  { id: "anemie", nom: "Anémie maternelle", court: "Anémie", pourquoi: "L'anémie fatigue la mère et augmente les risques à l'accouchement. Le fer et l'acide folique la préviennent." },
  { id: "triple", nom: "Triple élimination : VIH, syphilis, hépatite B", court: "VIH · syphilis · hépatite B", pourquoi: "Le dépistage pendant la grossesse permet une prise en charge qui protège le bébé de la transmission mère-enfant.", sensible: true },
  { id: "hypertension", nom: "Hypertension et prééclampsie", court: "Hypertension", pourquoi: "La tension trop élevée pendant la grossesse peut devenir grave. Elle se repère simplement lors des consultations." },
  { id: "tetanos", nom: "Tétanos maternel et néonatal", court: "Tétanos", pourquoi: "La vaccination de la mère protège aussi le nouveau-né." },
  { id: "mental", nom: "Santé mentale après la naissance", court: "Bien-être mental", pourquoi: "Fatigue, tristesse ou anxiété après la naissance sont fréquentes. En parler permet d'être soutenue.", sensible: true },
  { id: "col", nom: "Cancer du col de l'utérus", court: "Cancer du col", pourquoi: "Le dépistage permet de repérer tôt des lésions qui se soignent bien." },
];

export const ACTIONS: ActionPrevention[] = [
  { id: "moustiquaire", programme: "paludisme", libelle: "Moustiquaire imprégnée remise", echeance: { phase: "grossesse", sa: 0 } },
  { id: "tpi1", programme: "paludisme", libelle: "Traitement préventif (TPI) – 1re dose", echeance: { phase: "grossesse", sa: 13 } },
  { id: "tpi2", programme: "paludisme", libelle: "Traitement préventif (TPI) – 2e dose", echeance: { phase: "grossesse", sa: 20 } },
  { id: "tpi3", programme: "paludisme", libelle: "Traitement préventif (TPI) – 3e dose", echeance: { phase: "grossesse", sa: 28 } },
  { id: "fer", programme: "anemie", libelle: "Fer et acide folique démarrés", echeance: { phase: "grossesse", sa: 0 } },
  { id: "hemoglobine", programme: "anemie", libelle: "Contrôle de l'hémoglobine", echeance: { phase: "grossesse", sa: 24 } },
  { id: "vih", programme: "triple", libelle: "Dépistage du VIH proposé", echeance: { phase: "grossesse", sa: 0 } },
  { id: "syphilis", programme: "triple", libelle: "Dépistage de la syphilis proposé", echeance: { phase: "grossesse", sa: 0 } },
  { id: "hepatiteb", programme: "triple", libelle: "Dépistage de l'hépatite B proposé", echeance: { phase: "grossesse", sa: 0 } },
  { id: "tension", programme: "hypertension", libelle: "Tension et protéinurie contrôlées au 3e trimestre", echeance: { phase: "grossesse", sa: 28 } },
  { id: "vat", programme: "tetanos", libelle: "Vaccination antitétanique", echeance: { phase: "grossesse", sa: 0 } },
  { id: "bienetre", programme: "mental", libelle: "Échange sur le bien-être proposé", echeance: { phase: "postnatal", jours: 10 } },
  { id: "col", programme: "col", libelle: "Dépistage du cancer du col proposé", echeance: { phase: "postnatal", jours: 42 } },
];

export type StatutPrevention = "fait" | "refuse" | "en_retard" | "a_faire" | "plus_tard";

export const LIBELLE_STATUT: Record<StatutPrevention, string> = {
  fait: "Fait",
  refuse: "Refusé",
  en_retard: "En retard",
  a_faire: "À faire",
  plus_tard: "Plus tard",
};

// Délai de grâce après l'échéance avant de considérer l'action « en retard ».
const GRACE_SA = 4;
const GRACE_JOURS = 14;

export interface EtatAction {
  action: ActionPrevention;
  statut: StatutPrevention;
  date?: string;
}

export function etatPreventions(b: Beneficiaire, base: Base, t = today()): EtatAction[] {
  const sa = b.ddr ? semainesAmenorrhee(b.ddr, t) : null;
  const joursApres = b.dateAccouchement ? diffDays(t, b.dateAccouchement) : null;
  const enregistrees = base.preventions.filter((p) => p.beneficiaireId === b.id);
  return ACTIONS.map((action) => {
    const e = enregistrees.find((p) => p.actionId === action.id);
    if (e) return { action, statut: e.statut, date: e.date };
    const ech = action.echeance;
    if (ech.phase === "grossesse") {
      if (b.etape === "postnatal") return { action, statut: "en_retard" as const }; // non réalisée pendant la grossesse
      const age = sa ?? diffDays(t, b.creeLe) / 7; // sans date des règles : on compte depuis l'inscription
      if (age < ech.sa) return { action, statut: "plus_tard" as const };
      return { action, statut: age >= ech.sa + GRACE_SA ? ("en_retard" as const) : ("a_faire" as const) };
    }
    if (joursApres === null || joursApres < ech.jours) return { action, statut: "plus_tard" as const };
    return { action, statut: joursApres >= ech.jours + GRACE_JOURS ? ("en_retard" as const) : ("a_faire" as const) };
  });
}

export const enRetard = (b: Beneficiaire, base: Base) => etatPreventions(b, base).filter((e) => e.statut === "en_retard");
