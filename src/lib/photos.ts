// Photos sous licence Unsplash (usage libre, attribution non obligatoire mais faite).
// Photos d'illustration : les personnes représentées ne sont pas des bénéficiaires.
// À remplacer par des photos du pilote prises avec consentement écrit.
// `focus` = point d'intérêt (object-position) pour que les visages restent dans le cadre.
export const PHOTOS = {
  mereNouveauNe: { src: "/images/mere-nouveau-ne.jpg", alt: "Une mère tient son nouveau-né devant un centre de santé", auteur: "Richard Nyoni", url: "https://unsplash.com/photos/sgjI2jzC1wg", focus: "68% 52%" },
  sageFemme: { src: "/images/sage-femme-consultation.jpg", alt: "Une sage-femme examine une femme enceinte pendant une consultation prénatale", auteur: "Iwaria Inc.", url: "https://unsplash.com/photos/e_4u1tobpbg", focus: "55% 35%" },
  centreDeSante: { src: "/images/centre-de-sante.jpg", alt: "Une sage-femme accompagne une femme enceinte et sa proche dans un centre de santé", auteur: "Iwaria Inc.", url: "https://unsplash.com/photos/q7PY6bXbmzk", focus: "50% 40%" },
  medecin: { src: "/images/medecin-bureau.jpg", alt: "Une médecin reçoit une jeune patiente à son bureau", auteur: "Francisco Venâncio", url: "https://unsplash.com/photos/M4Xloxsg0Gw", focus: "40% 35%" },
  soignante: { src: "/images/soignante.jpg", alt: "Une soignante souriante en blouse blanche avec un stéthoscope", auteur: "Ato Aikins", url: "https://unsplash.com/photos/TPT4pevJEmQ", focus: "45% 20%" },
  femmeTelephone: { src: "/images/femme-telephone-sourire.jpg", alt: "Une femme sourit en lisant un message sur son téléphone", auteur: "Ninthgrid", url: "https://unsplash.com/photos/aCAxMbGlr2A", focus: "50% 28%" },
  femmeCommerce: { src: "/images/femme-commerce-telephone.jpg", alt: "Une commerçante consulte son téléphone dans sa boutique", auteur: "Ali Mkumbwa", url: "https://unsplash.com/photos/lbV3PAoYyek", focus: "30% 60%" },
  femmeChamp: { src: "/images/femme-champ.jpg", alt: "Une femme souriante, son bébé dans le dos, travaille au champ", auteur: "Annie Spratt", url: "https://unsplash.com/photos/m0DUL38R49Y", focus: "45% 35%" },
  mereBebe: { src: "/images/mere-bebe.jpg", alt: "Une mère souriante tient son bébé dans ses bras", auteur: "Andrae Ricketts", url: "https://unsplash.com/photos/3Qi0PkM_Wes", focus: "65% 45%" },
  communaute: { src: "/images/communaute.jpg", alt: "Une femme portant un foulard, son bébé contre elle", auteur: "Annie Spratt", url: "https://unsplash.com/photos/yrzBgqapG1I", focus: "55% 50%" },
  famille: { src: "/images/famille.jpg", alt: "Une femme sourit à un jeune enfant à la maison", auteur: "Moses Sichach", url: "https://unsplash.com/photos/AdWkBmVCB9Q", focus: "45% 50%" },
} as const;

export type Photo = (typeof PHOTOS)[keyof typeof PHOTOS];
