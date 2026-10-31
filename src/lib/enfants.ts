// Suivi du nouveau-né : naissance et vaccination de routine.
// Données minimales : date de naissance, prénom facultatif ; un vaccin = « fait » ou « refusé » + une date,
// d'après le carnet de santé ; poids et taille recopiés du carnet. Aucun diagnostic n'est enregistré.
// Le suivi du bébé fait partie de l'accompagnement auquel la mère a consenti.
//
// CALENDRIER INDICATIF, inspiré du Programme élargi de vaccination (PEV) du Sénégal et du calendrier
// de l'OMS : À VALIDER par le PEV et des professionnels de santé avant tout usage réel.
import { addDays, diffDays, today } from "./protocol";
import type { Base, Bebe, Beneficiaire, EtapeVisite } from "./types";

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
  { jusqua: 730, periode: "De 15 mois à 2 ans", texte: "Deuxième dose contre la rougeole vers 15 mois. Bébé mange au plat familial, en petits morceaux, avec des légumes, des œufs ou du poisson. Continuez l'allaitement si vous le pouvez." },
];

export function conseilDuMoment(dateNaissance: string, t = today()) {
  const jours = diffDays(t, dateNaissance);
  return CONSEILS_BEBE.find((c) => jours <= c.jusqua);
}

// L'allaitement exclusif ne se demande qu'entre 0 et 6 mois.
export const ALLAITEMENT_JOURS_MAX = 182;

// ---------- Les 1 000 premiers jours : un parcours continu mère-bébé ----------
export const PARCOURS_1000 = [
  { id: "grossesse", titre: "Pendant la grossesse", texte: "Consultations prénatales, préparation à la naissance et au suivi du bébé." },
  { id: "j28", titre: "0 à 28 jours", texte: "Nouveau-né : allaitement, consultations postnatales, visites à domicile et signes de danger." },
  { id: "m6", titre: "1 à 6 mois", texte: "Vaccinations, croissance, allaitement exclusif et accompagnement de la mère." },
  { id: "m24", titre: "6 à 24 mois", texte: "Alimentation complémentaire, croissance, développement et rappels de vaccins." },
] as const;
export const PROMESSE = "We care for her. We care for her baby. We care for their future.";

export function etapeParcours(b: Beneficiaire, bebe?: Bebe, t = today()) {
  if (!bebe) return b.etape === "postnatal" || b.etape === "cloture" ? "j28" : "grossesse";
  const j = diffDays(t, bebe.dateNaissance);
  return j <= 28 ? "j28" : j <= 182 ? "m6" : "m24";
}

// ---------- Visites à domicile après la naissance (référente communautaire) ----------
// Repères indicatifs inspirés des recommandations de l'OMS sur les soins postnatals : à valider.
export const VISITES: { id: EtapeVisite; libelle: string; jours: number }[] = [
  { id: "j3", libelle: "Visite des 3 premiers jours", jours: 3 },
  { id: "j7", libelle: "Visite entre 7 et 14 jours", jours: 7 },
  { id: "s6", libelle: "Visite vers 6 semaines", jours: 42 },
];

// ---------- Croissance : poids pour l'âge, références OMS ----------
// Valeurs ARRONDIES des standards de croissance de l'OMS (2006), poids pour l'âge, en kg, de 0 à 24 mois :
// médiane, -2 et +2 écarts-types. À VÉRIFIER contre les tables officielles avant tout usage réel.
// La courbe ne pose aucun diagnostic : un point hors de la zone habituelle invite à en parler à un agent de santé.
export const MOIS_OMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 21, 24];
export const POIDS_OMS: Record<"F" | "M", { m2: number[]; med: number[]; p2: number[] }> = {
  F: {
    m2: [2.4, 3.2, 3.9, 4.5, 5.0, 5.4, 5.7, 6.0, 6.3, 6.5, 6.7, 6.9, 7.0, 7.6, 8.1, 8.6, 9.0],
    med: [3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9, 9.6, 10.2, 10.9, 11.5],
    p2: [4.2, 5.5, 6.6, 7.5, 8.2, 8.8, 9.3, 9.8, 10.2, 10.5, 10.9, 11.2, 11.5, 12.4, 13.2, 14.0, 14.8],
  },
  M: {
    m2: [2.5, 3.4, 4.3, 5.0, 5.6, 6.0, 6.4, 6.7, 6.9, 7.1, 7.4, 7.6, 7.7, 8.3, 8.8, 9.2, 9.7],
    med: [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 10.3, 10.9, 11.5, 12.2],
    p2: [4.4, 5.8, 7.1, 8.0, 8.7, 9.3, 9.8, 10.3, 10.7, 11.0, 11.4, 11.7, 12.0, 12.8, 13.7, 14.5, 15.3],
  },
};
export const MENTION_OMS = "Zone habituelle d'après les standards de croissance de l'OMS (valeurs arrondies, à vérifier). Cette courbe ne pose aucun diagnostic.";

// Valeur de référence interpolée à un âge donné (en mois).
export function referenceOms(sexe: "F" | "M", serie: "m2" | "med" | "p2", mois: number) {
  const v = POIDS_OMS[sexe][serie];
  const i = MOIS_OMS.findIndex((m) => m >= mois);
  if (i === -1) return v[v.length - 1];
  if (i === 0) return v[0];
  const k = (mois - MOIS_OMS[i - 1]) / (MOIS_OMS[i] - MOIS_OMS[i - 1]);
  return v[i - 1] + k * (v[i] - v[i - 1]);
}

export const moisDepuis = (dateNaissance: string, date: string) => diffDays(date, dateNaissance) / 30.4375;

// Le dernier poids est-il dans la zone habituelle ? Orientation seulement, jamais un diagnostic.
export function zonePoids(bebe: Bebe): "dans" | "dessous" | "dessus" | null {
  const m = [...(bebe.mesures ?? [])].filter((x) => x.poidsKg).sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  if (!m || !bebe.sexe) return null;
  const mois = moisDepuis(bebe.dateNaissance, m.date);
  if (mois > 24) return null;
  if (m.poidsKg! < referenceOms(bebe.sexe, "m2", mois)) return "dessous";
  if (m.poidsKg! > referenceOms(bebe.sexe, "p2", mois)) return "dessus";
  return "dans";
}

// ---------- First Cry : les 72 premières heures ----------
// Gestes essentiels du nouveau-né (inspirés des soins essentiels du nouveau-né de l'OMS), à valider.
export const PREMIERES_HEURES = [
  { id: "sein", moment: "1re heure", texte: "Bébé mis au sein dans l'heure qui suit la naissance" },
  { id: "chaud", moment: "1re heure", texte: "Peau à peau, bébé séché et gardé au chaud" },
  { id: "vaccins", moment: "Avant la sortie", texte: "BCG, polio 0 et hépatite B demandés avant de quitter la maternité" },
  { id: "cordon", moment: "Chaque jour", texte: "Cordon propre et sec, sans rien mettre dessus" },
  { id: "h24", moment: "24 h", texte: "Signes de danger vérifiés (bébé et maman)" },
  { id: "h48", moment: "48 h", texte: "Signes de danger vérifiés (bébé et maman)" },
  { id: "h72", moment: "72 h", texte: "Signes de danger vérifiés, puis visite de la référente" },
] as const;
export const FIRST_CRY_JOURS = 3;

// Signes de danger pour la mère après l'accouchement (indicatifs, à valider) : aller tout de suite au centre de santé.
export const SIGNES_DANGER_MERE = [
  "Saignement abondant",
  "Forte fièvre ou frissons",
  "Maux de tête violents ou vue trouble",
  "Convulsions",
  "Difficulté à respirer",
  "Douleur au ventre qui ne passe pas, pertes qui sentent mauvais",
];

// ---------- Baby Guardian : le cercle de soutien ----------
export const LIENS_GARDIEN = {
  partenaire: "Conjoint ou partenaire",
  mere: "Mère",
  belle_mere: "Belle-mère",
  soeur: "Sœur",
  amie: "Amie ou voisine",
  bajenu_gox: "Bajenu gox (marraine de quartier)",
  autre: "Autre proche",
} as const;
export const CERCLE_MAX = 3;
