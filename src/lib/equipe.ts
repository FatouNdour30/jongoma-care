// Équipe de Jongoma Tech sur le projet Jongoma Care : une équipe entièrement féminine, du terrain à la direction.
export interface Membre {
  nom: string;
  photo: string;
  role: { fr: string; en: string };
  mission: { fr: string; en: string };
}

export const FONDATRICE: Membre = {
  nom: "Ndeye Fatou Ndour",
  photo: "/equipe/ndeye-fatou-ndour.jpg",
  role: { fr: "Fondatrice et directrice générale", en: "Founder and CEO" },
  mission: {
    fr: "Fondatrice de Jongoma Tech et d'AFATECH (femmes et technologie), elle porte Jongoma Care : une technologie qui n'oublie aucune femme, en particulier celles qui lisent peu ou parlent surtout leur langue.",
    en: "Founder of Jongoma Tech and of AFATECH (women and technology), she leads Jongoma Care: technology that leaves no woman behind, especially those who read little or mainly speak their own language.",
  },
};

export const EQUIPE: Membre[] = [
  { nom: "Maguette Sy", photo: "/equipe/maguette-sy.jpg", role: { fr: "Directrice du programme", en: "Programme director" }, mission: { fr: "Pilote le projet Jongoma Care sur le terrain : calendrier du pilote, coordination des référentes et des structures.", en: "Runs Jongoma Care in the field: pilot schedule, coordination of referents and facilities." } },
  { nom: "Niako Kébé", photo: "/equipe/niako-kebe.jpg", role: { fr: "Produit et plateforme", en: "Product and platform" }, mission: { fr: "Priorités du produit, tests avec les femmes et qualité de la plateforme.", en: "Product priorities, testing with women and platform quality." } },
  { nom: "Khady Ndour", photo: "/equipe/khady-ndour.jpg", role: { fr: "Suivi, évaluation et impact", en: "Monitoring, evaluation and impact" }, mission: { fr: "Indicateurs du pilote, données ouvertes et contrôle d'équité de l'IA.", en: "Pilot indicators, open data and AI fairness checks." } },
  { nom: "Maya Danfakha", photo: "/equipe/maya-danfakha.jpg", role: { fr: "Formation des référentes", en: "Referent training" }, mission: { fr: "Modules de formation : accueil, signes de danger, confidentialité, accompagnement des jeunes filles.", en: "Training modules: welcome, danger signs, confidentiality, supporting young girls." } },
  { nom: "Khadidiatou Sène", photo: "/equipe/khadidiatou-sene.jpg", role: { fr: "Communauté et mentorat", en: "Community and mentoring" }, mission: { fr: "Anime le réseau des référentes et des bajenu gox, et le cercle de soutien Baby Guardian.", en: "Leads the network of referents and bajenu gox, and the Baby Guardian support circle." } },
  { nom: "Adja Gaïta Ndour", photo: "/equipe/adja-gaita-ndour.jpg", role: { fr: "Partenariats et développement", en: "Partnerships and development" }, mission: { fr: "Districts sanitaires, structures de santé, sages-femmes et bailleurs.", en: "Health districts, facilities, midwives and funders." } },
  { nom: "Mareme Ndour", photo: "/equipe/mareme-ndour.jpg", role: { fr: "Communication et sensibilisation", en: "Communication and outreach" }, mission: { fr: "Capsules audio Voice of Mama et campagnes de sensibilisation dans les quartiers.", en: "Voice of Mama audio capsules and neighbourhood awareness campaigns." } },
  { nom: "Mame Sainabou Ndour", photo: "/equipe/mame-sainabou-ndour.jpg", role: { fr: "Administration et finances", en: "Administration and finance" }, mission: { fr: "Gestion financière, contrats avec les partenaires et conformité (protection des données).", en: "Financial management, partner contracts and compliance (data protection)." } },
];
