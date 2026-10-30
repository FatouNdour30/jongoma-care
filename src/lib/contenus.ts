// Capsules audio. CONTENU PROVISOIRE : à faire valider par une sage-femme et enregistrer
// en wolof par une locutrice native avant tout usage réel. Aucun conseil clinique ici.
export type Theme = "grossesse" | "prevention" | "accouchement" | "postnatal" | "service";

export interface Capsule {
  id: string;
  theme: Theme;
  titre: string;
  texte: string;
  dureeSecondes: number;
  validation: "en_attente" | "validee";
  // Texte wolof écrit et validé par des locutrices natives : sert à la synthèse vocale wolof.
  // Vide tant qu'il n'a pas été rédigé et validé (aucune traduction automatique).
  texteWolof?: string;
  // Mots (français ou wolof, tels que prononcés) qui orientent une question vocale vers cette capsule.
  motsCles?: string[];
}

export const THEMES: Record<Theme, string> = {
  grossesse: "Pendant la grossesse",
  prevention: "Prévention des maladies",
  accouchement: "Préparer l'accouchement",
  postnatal: "Après la naissance",
  service: "Le service Jongoma Care",
};

export const CAPSULES: Capsule[] = [
  { id: "c1", theme: "grossesse", titre: "Pourquoi aller aux consultations prénatales", texte: "Les consultations permettent à la sage-femme de vérifier que vous et votre bébé allez bien. Allez à chaque rendez-vous, même si vous vous sentez bien.", dureeSecondes: 25, validation: "en_attente" },
  { id: "c2", theme: "grossesse", titre: "Organiser ses déplacements", texte: "Prévoyez à l'avance comment vous rendre à votre consultation. Si le transport est difficile, parlez-en à votre référente : elle peut vous orienter vers une aide.", dureeSecondes: 22, validation: "en_attente" },
  { id: "p1", theme: "prevention", titre: "Dormir sous moustiquaire", texte: "Pendant la grossesse, dormez chaque nuit sous une moustiquaire imprégnée. Elle protège du paludisme, dangereux pour vous et pour votre bébé. Demandez-la à votre structure de santé.", dureeSecondes: 20, validation: "en_attente" },
  { id: "p2", theme: "prevention", titre: "Les dépistages de la grossesse", texte: "La sage-femme vous propose des tests pour le VIH, la syphilis et l'hépatite B. Ils permettent de protéger votre bébé. Les résultats restent confidentiels, entre vous et la sage-femme.", dureeSecondes: 22, validation: "en_attente" },
  { id: "p3", theme: "prevention", titre: "Le fer et le vaccin", texte: "La sage-femme peut vous donner du fer et de l'acide folique, et vous proposer le vaccin contre le tétanos. Ils vous protègent, vous et votre nouveau-né.", dureeSecondes: 18, validation: "en_attente" },
  { id: "p4", theme: "prevention", titre: "Le dépistage du cancer du col", texte: "Après la naissance, un dépistage simple du cancer du col de l'utérus peut vous être proposé. Repéré tôt, il se soigne bien.", dureeSecondes: 18, validation: "en_attente" },
  { id: "v1", theme: "postnatal", titre: "Vacciner son bébé", texte: "Les vaccins protègent votre bébé contre des maladies graves comme la tuberculose, la polio ou la rougeole. Le premier vaccin se fait à la naissance, puis à 6, 10 et 14 semaines et à 9 mois. Apportez toujours le carnet de santé.", dureeSecondes: 22, validation: "en_attente", motsCles: ["vaccin", "vaccination", "piqûre", "carnet", "bcg", "polio", "penta"] },
  { id: "c3", theme: "accouchement", titre: "Préparer le jour de l'accouchement", texte: "Sachez à l'avance dans quelle structure vous irez, comment vous y rendre, et gardez le numéro de votre référente.", dureeSecondes: 18, validation: "en_attente" },
  { id: "c4", theme: "accouchement", titre: "Quand demander de l'aide", texte: "Si vous vous inquiétez pour vous ou pour votre bébé, n'attendez pas : allez à la structure de santé la plus proche ou appelez votre sage-femme.", dureeSecondes: 20, validation: "en_attente" },
  { id: "c5", theme: "postnatal", titre: "Après la naissance", texte: "Après l'accouchement, des consultations sont prévues pour vous et votre bébé. Votre référente vous aide à les organiser.", dureeSecondes: 18, validation: "en_attente" },
  { id: "c6", theme: "postnatal", titre: "Prendre soin de soi", texte: "Après la naissance, vous pouvez vous sentir fatiguée ou triste. C'est fréquent. Vous pouvez en parler à votre référente, qui peut vous proposer un soutien.", dureeSecondes: 22, validation: "en_attente" },
  { id: "c7", theme: "service", titre: "Ce que fait votre référente", texte: "Votre référente vous appelle pour vos rendez-vous et vous aide à trouver des services. Elle ne pose pas de diagnostic : pour les questions de santé, elle vous oriente vers la sage-femme.", dureeSecondes: 24, validation: "en_attente" },
  { id: "c8", theme: "service", titre: "Vos données et vos droits", texte: "Vos informations restent confidentielles. Vous pouvez changer vos accords, changer de référente ou supprimer vos données à tout moment.", dureeSecondes: 20, validation: "en_attente" },
];
