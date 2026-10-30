// Score de priorisation du suivi (F-33), version « règles ».
// Il ordonne uniquement les recontacts : il ne sert jamais à refuser ou réduire un service.
// Poids provisoires, à valider par le référent clinique et le référent données.
// N'utilise aucune donnée de santé mentale ni de protection, ni l'âge.
import { addDays, diffDays, semainesAmenorrhee, today } from "./protocol";
import { etatVaccins, RETARD_JOURS } from "./enfants";
import { enRetard } from "./programmes";
import type { Base, Beneficiaire } from "./types";

export type Niveau = "haute" | "moyenne" | "basse";

export interface Priorite {
  score: number;
  niveau: Niveau;
  motifs: string[];
  iaRefusee: boolean;
}

export const REGLES = [
  { id: "manque", poids: 30, libelle: "Rendez-vous manqué au cours des 60 derniers jours (par rendez-vous, max. 2)" },
  { id: "rappels", poids: 20, libelle: "2 rappels ou plus sans réponse" },
  { id: "contact", poids: 20, libelle: "Aucun contact depuis plus de 14 jours" },
  { id: "distance", poids: 15, libelle: "Structure à plus de 10 km" },
  { id: "fin", poids: 15, libelle: "36 SA ou plus sans rendez-vous prévu" },
  { id: "postnatal", poids: 25, libelle: "Postnatal sans consultation prévue ni honorée" },
  { id: "verifier", poids: 10, libelle: "Rendez-vous passé à vérifier" },
  { id: "prevention", poids: 10, libelle: "Prévention ou dépistage en retard (paludisme, anémie, tétanos, dépistages proposés ; hors santé mentale)" },
  { id: "vaccin", poids: 15, libelle: `Vaccin du bébé en retard de plus de ${RETARD_JOURS} jours (calendrier indicatif)` },
] as const;

const poids = (id: (typeof REGLES)[number]["id"]) => REGLES.find((r) => r.id === id)!.poids;

export function calculerPriorite(b: Beneficiaire, base: Base): Priorite {
  if (!b.consentements.ia) return { score: 0, niveau: "basse", motifs: ["Bénéficiaire opposée au traitement par l'IA : suivi selon le calendrier"], iaRefusee: true };

  const t = today();
  const rdvs = base.rendezVous.filter((r) => r.beneficiaireId === b.id);
  const motifs: string[] = [];
  let score = 0;

  const manques = rdvs.filter((r) => r.statut === "manque" && r.date >= addDays(t, -60)).length;
  if (manques) {
    score += poids("manque") * Math.min(manques, 2);
    motifs.push(`${manques} rendez-vous manqué${manques > 1 ? "s" : ""} récemment`);
  }
  if (b.rappelsSansReponse >= 2) {
    score += poids("rappels");
    motifs.push(`${b.rappelsSansReponse} rappels sans réponse`);
  }
  if (!b.dernierContact || diffDays(t, b.dernierContact) > 14) {
    score += poids("contact");
    motifs.push(b.dernierContact ? `Pas de contact depuis ${diffDays(t, b.dernierContact)} jours` : "Jamais contactée");
  }
  if ((b.distanceKm ?? 0) > 10) {
    score += poids("distance");
    motifs.push(`Structure à ${b.distanceKm} km`);
  }
  const aVenir = rdvs.some((r) => r.statut === "prevu" && r.date >= t);
  if (b.etape !== "postnatal" && b.ddr && semainesAmenorrhee(b.ddr) >= 36 && !aVenir) {
    score += poids("fin");
    motifs.push("Fin de grossesse sans rendez-vous prévu");
  }
  if (b.etape === "postnatal" && !rdvs.some((r) => r.type === "CPoN" && (r.statut === "honore" || (r.statut === "prevu" && r.date >= t)))) {
    score += poids("postnatal");
    motifs.push("Aucune consultation postnatale prévue ni honorée");
  }
  if (rdvs.some((r) => r.statut === "prevu" && r.date < t)) {
    score += poids("verifier");
    motifs.push("Rendez-vous passé à vérifier");
  }

  // Le programme « santé mentale » est exclu : aucune donnée de santé mentale dans le score.
  const retards = enRetard(b, base).filter((e) => e.action.programme !== "mental").length;
  if (retards) {
    score += poids("prevention");
    motifs.push(`${retards} prévention${retards > 1 ? "s" : ""} en retard`);
  }

  // Vaccination du nouveau-né : seul le fait qu'un vaccin soit en retard compte, jamais l'état de santé.
  const vaccinsEnRetard = base.bebes.filter((x) => x.beneficiaireId === b.id).flatMap((x) => etatVaccins(x, base, t)).filter((e) => e.statut === "en_retard").length;
  if (vaccinsEnRetard) {
    score += poids("vaccin");
    motifs.push(`${vaccinsEnRetard} vaccin${vaccinsEnRetard > 1 ? "s" : ""} du bébé en retard`);
  }

  const niveau: Niveau = score >= 50 ? "haute" : score >= 25 ? "moyenne" : "basse";
  return { score, niveau, motifs, iaRefusee: false };
}
