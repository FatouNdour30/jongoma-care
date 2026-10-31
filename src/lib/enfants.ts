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

// ---------- Signes de danger, état civil, conseils selon l'âge ----------
// Contenus INDICATIFS, inspirés des signes de danger du nouveau-né de l'OMS (PCIME) : à valider par une
// sage-femme et le district avant tout usage réel. Ils ne posent aucun diagnostic : ils disent quand aller
// tout de suite au centre de santé.
export const MENTION_CONSEILS = "Conseils indicatifs, à valider par une sage-femme. En cas de doute, allez au centre de santé.";
export const NUMERO_URGENCE = "1515"; // SAMU national du Sénégal

export const SIGNES_DANGER = [
  "Ne tète plus ou ne boit plus",
  "Convulsions (le corps se raidit ou tremble)",
  "Respire très vite, ou la poitrine se creuse en respirant",
  "Corps très chaud, ou au contraire froid",
  "Très endormi, ne bouge que si on le stimule, ou plus du tout",
  "Peau ou yeux jaunes, surtout la paume des mains et la plante des pieds",
  "Cordon rouge, qui coule ou sent mauvais",
  "Vomit tout ce qu'il boit, ou diarrhée avec du sang",
];

export const ETAT_CIVIL =
  "Déclarez la naissance au centre d'état civil le plus tôt possible : l'acte de naissance protège votre enfant et lui sera demandé pour l'école et les examens. Renseignez-vous sur le délai légal auprès de la mairie.";

// Conseils selon l'âge du bébé (en jours) : un seul à la fois, celui de la période en cours.
export const CONSEILS_BEBE: { jusqua: number; periode: string; texte: string }[] = [
  { jusqua: 7, periode: "Première semaine", texte: "Mettez bébé au sein dès que possible, puis à la demande, jour et nuit. Gardez le cordon propre et sec, sans rien mettre dessus. Le peau à peau le garde au chaud." },
  { jusqua: 42, periode: "Jusqu'à 6 semaines", texte: "Le lait maternel suffit : ni eau ni tisane avant 6 mois. Faites dormir bébé sous une moustiquaire imprégnée. À 6 semaines : consultation postnatale pour vous deux et premiers vaccins, apportez le carnet." },
  { jusqua: 120, periode: "De 6 semaines à 4 mois", texte: "Vaccins à 6, 10 et 14 semaines : apportez toujours le carnet de santé. Continuez l'allaitement exclusif. Parlez et souriez à bébé : il apprend déjà." },
  { jusqua: 182, periode: "De 4 à 6 mois", texte: "Encore du lait maternel seulement jusqu'à 6 mois. Préparez avec votre référente le passage aux premières bouillies." },
  { jusqua: 270, periode: "De 6 à 9 mois", texte: "À 6 mois, en plus du lait maternel, donnez de petites bouillies enrichies, plusieurs fois par jour. Demandez au centre de santé la vitamine A selon le calendrier." },
  { jusqua: 456, periode: "De 9 à 15 mois", texte: "Vers 9 mois : vaccins contre la rougeole et la fièvre jaune. Continuez l'allaitement et variez les repas. Lavez-vous les mains avant de préparer à manger." },
];

export function conseilDuMoment(dateNaissance: string, t = today()) {
  const jours = diffDays(t, dateNaissance);
  return CONSEILS_BEBE.find((c) => jours <= c.jusqua);
}

// L'allaitement exclusif ne se demande qu'entre 0 et 6 mois.
export const ALLAITEMENT_JOURS_MAX = 182;
