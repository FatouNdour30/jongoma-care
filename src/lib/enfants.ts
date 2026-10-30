// Suivi du nouveau-né : naissance et vaccination de routine.
// Données minimales : date de naissance, prénom facultatif ; un vaccin = « fait » ou « refusé » + une date,
// d'après le carnet de santé. Aucune donnée clinique (poids, diagnostic) n'est enregistrée.
// Le suivi du bébé fait partie de l'accompagnement auquel la mère a consenti.
//
// CALENDRIER INDICATIF, inspiré du Programme élargi de vaccination (PEV) du Sénégal et du calendrier
// de l'OMS : À VALIDER par le PEV et des professionnels de santé avant tout usage réel.
import { addDays, diffDays, today } from "./protocol";
import type { Base, Bebe } from "./types";

export const MENTION_A_VALIDER = "Calendrier indicatif, à valider par le Programme élargi de vaccination et des professionnels de santé.";

export interface Vaccin {
  id: string;
  nom: string;
  jours: number; // âge recommandé, en jours
  age: string;
}

export const VACCINS: Vaccin[] = [
  { id: "bcg", nom: "BCG (tuberculose)", jours: 0, age: "Naissance" },
  { id: "vpo0", nom: "Polio oral (VPO 0)", jours: 0, age: "Naissance" },
  { id: "hepb0", nom: "Hépatite B (naissance)", jours: 0, age: "Naissance" },
  { id: "penta1", nom: "Penta 1", jours: 42, age: "6 semaines" },
  { id: "vpo1", nom: "Polio oral (VPO 1)", jours: 42, age: "6 semaines" },
  { id: "pcv1", nom: "Pneumocoque (PCV 1)", jours: 42, age: "6 semaines" },
  { id: "rota1", nom: "Rotavirus 1", jours: 42, age: "6 semaines" },
  { id: "penta2", nom: "Penta 2", jours: 70, age: "10 semaines" },
  { id: "vpo2", nom: "Polio oral (VPO 2)", jours: 70, age: "10 semaines" },
  { id: "pcv2", nom: "Pneumocoque (PCV 2)", jours: 70, age: "10 semaines" },
  { id: "rota2", nom: "Rotavirus 2", jours: 70, age: "10 semaines" },
  { id: "penta3", nom: "Penta 3", jours: 98, age: "14 semaines" },
  { id: "vpo3", nom: "Polio oral (VPO 3)", jours: 98, age: "14 semaines" },
  { id: "pcv3", nom: "Pneumocoque (PCV 3)", jours: 98, age: "14 semaines" },
  { id: "vpi", nom: "Polio injectable (VPI)", jours: 98, age: "14 semaines" },
  { id: "rr1", nom: "Rougeole-rubéole (RR 1)", jours: 270, age: "9 mois" },
  { id: "vaa", nom: "Fièvre jaune (VAA)", jours: 270, age: "9 mois" },
  { id: "rr2", nom: "Rougeole-rubéole (RR 2)", jours: 450, age: "15 mois" },
];

// Délai de tolérance avant de considérer un vaccin « en retard ».
export const RETARD_JOURS = 14;
// Fenêtre « à faire bientôt » : rappel possible dans les 7 jours qui précèdent.
export const BIENTOT_JOURS = 7;

export type StatutVaccin = "fait" | "refuse" | "en_retard" | "a_faire" | "plus_tard";

export const LIBELLE_VACCIN: Record<StatutVaccin, string> = {
  fait: "Fait",
  refuse: "Refusé",
  en_retard: "En retard",
  a_faire: "À faire",
  plus_tard: "Plus tard",
};

export interface EtatVaccin {
  vaccin: Vaccin;
  du: string; // date recommandée
  statut: StatutVaccin;
  date?: string; // date de réalisation ou de refus
}

export function etatVaccins(bebe: Bebe, base: Base, t = today()): EtatVaccin[] {
  return VACCINS.map((vaccin) => {
    const du = addDays(bebe.dateNaissance, vaccin.jours);
    const v = base.vaccinations.find((x) => x.bebeId === bebe.id && x.vaccinId === vaccin.id);
    if (v) return { vaccin, du, statut: v.statut, date: v.date };
    const ecart = diffDays(t, du);
    const statut: StatutVaccin = ecart > RETARD_JOURS ? "en_retard" : ecart >= -BIENTOT_JOURS ? "a_faire" : "plus_tard";
    return { vaccin, du, statut };
  });
}

// Prochaine étape du calendrier qui n'est pas encore réalisée (groupée par âge).
export function prochaineEtape(bebe: Bebe, base: Base, t = today()) {
  const restants = etatVaccins(bebe, base, t).filter((e) => e.statut === "en_retard" || e.statut === "a_faire" || e.statut === "plus_tard");
  if (!restants.length) return null;
  const premier = restants.reduce((a, e) => (e.du < a.du ? e : a));
  return { du: premier.du, age: premier.vaccin.age, vaccins: restants.filter((e) => e.du === premier.du), enRetard: premier.statut === "en_retard" };
}

export function ageBebe(dateNaissance: string, t = today()) {
  const j = diffDays(t, dateNaissance);
  if (j < 14) return `${j} jour${j > 1 ? "s" : ""}`;
  if (j < 92) return `${Math.floor(j / 7)} semaines`;
  return `${Math.floor(j / 30.4)} mois`;
}

export const nomBebe = (b: Bebe) => b.prenom || "Bébé";
