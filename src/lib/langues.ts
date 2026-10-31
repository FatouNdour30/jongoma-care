// Langues des bénéficiaires : langues nationales du Sénégal et grandes langues africaines.
// L'interface est en français et en anglais ; l'accompagnement se fait dans la langue de la femme :
// une référente qui la parle, et des capsules audio enregistrées par des locutrices natives.
// Aucune traduction automatique des contenus de santé.
//   - « disponible » : voix utilisable aujourd'hui ;
//   - « test » : voix de synthèse open source, en cours de test (wolof) ;
//   - « a_enregistrer » : capsules à enregistrer par des locutrices natives, puis validées par une sage-femme.
export type StatutVoix = "disponible" | "test" | "a_enregistrer";

export const LANGUES = [
  { code: "wo", nom: "Wolof", region: "Sénégal", voix: "test" },
  { code: "fr", nom: "Français", region: "Sénégal", voix: "disponible" },
  { code: "ff", nom: "Pulaar", region: "Sénégal", voix: "a_enregistrer" },
  { code: "srr", nom: "Seereer", region: "Sénégal", voix: "a_enregistrer" },
  { code: "dyo", nom: "Joola", region: "Sénégal", voix: "a_enregistrer" },
  { code: "mnk", nom: "Mandinka", region: "Sénégal", voix: "a_enregistrer" },
  { code: "snk", nom: "Soninké", region: "Sénégal", voix: "a_enregistrer" },
  { code: "mey", nom: "Hassaniya", region: "Sénégal", voix: "a_enregistrer" },
  { code: "bm", nom: "Bambara", region: "Afrique", voix: "a_enregistrer" },
  { code: "ha", nom: "Haoussa", region: "Afrique", voix: "a_enregistrer" },
  { code: "yo", nom: "Yoruba", region: "Afrique", voix: "a_enregistrer" },
  { code: "sw", nom: "Swahili", region: "Afrique", voix: "a_enregistrer" },
  { code: "ln", nom: "Lingala", region: "Afrique", voix: "a_enregistrer" },
  { code: "am", nom: "Amharique", region: "Afrique", voix: "a_enregistrer" },
  { code: "ar", nom: "Arabe", region: "Afrique", voix: "a_enregistrer" },
  { code: "en", nom: "Anglais", region: "Afrique", voix: "disponible" },
  { code: "pt", nom: "Portugais", region: "Afrique", voix: "a_enregistrer" },
] as const satisfies readonly { code: string; nom: string; region: "Sénégal" | "Afrique"; voix: StatutVoix }[];

export type CodeLangue = (typeof LANGUES)[number]["code"];
export const CODES_LANGUES = LANGUES.map((l) => l.code) as CodeLangue[];

export const langue = (code: string) => LANGUES.find((l) => l.code === code);
export const nomLangue = (code: string) => langue(code)?.nom ?? code;

export const LIBELLE_VOIX: Record<StatutVoix, string> = {
  disponible: "Voix disponible",
  test: "Voix en test",
  a_enregistrer: "Capsules à enregistrer",
};
