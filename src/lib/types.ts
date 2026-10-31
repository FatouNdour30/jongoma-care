// Modèle de données de Jongoma Care.
// L'identité (nom, téléphone) est séparée du suivi : le suivi ne référence que l'id.

export type Langue = "wo" | "fr";
export type Canal = "sms" | "appel" | "audio";
export type Zone = "Pikine" | "Guédiawaye" | "Rufisque" | "Thiès" | "Mbour";

export const ZONES: Zone[] = ["Pikine", "Guédiawaye", "Rufisque", "Thiès", "Mbour"];

export type Role =
  | "beneficiaire"
  | "referente"
  | "coordinatrice"
  | "etablissement"
  | "specialiste";

export interface Identite {
  id: string;
  prenom: string;
  telephone: string; // jamais affiché dans les vues agrégées
}

export interface Consentements {
  service: boolean;
  rappels: boolean;
  accompagnement: boolean; // suivi individuel par une référente
  ia: boolean; // score de priorisation ; refus sans perte de service (F-39)
  dateRecueil: string;
}

export type Etape = "inscription" | "grossesse" | "preparation" | "postnatal" | "cloture";

export interface Beneficiaire {
  id: string;
  identiteId: string;
  zone: Zone;
  langue: Langue;
  canal: Canal;
  horaireContact: string; // ex. "matin"
  messageDiscret: boolean; // libellé neutre si téléphone partagé
  // Jeune fille de moins de 20 ans (déclaré par elle-même, sans date de naissance) : accompagnement adapté.
  // Jamais utilisé par le score ni par le modèle d'IA ; sert seulement à adapter le suivi et au contrôle d'équité.
  jeuneFille?: boolean;
  consentements: Consentements;
  ddr?: string; // date des dernières règles (facultatif)
  dpaCorrigee?: string; // date prévue corrigée par un professionnel (F-05)
  dateAccouchement?: string;
  distanceKm?: number;
  referenteId?: string;
  etape: Etape;
  dernierContact?: string;
  rappelsSansReponse: number;
  // Demande de rappel laissée par l'assistant vocal quand il ne peut pas répondre (levée au prochain contact).
  rappelDemandeLe?: string;
  creeLe: string;
}

export type StatutRdv = "prevu" | "honore" | "manque" | "reporte" | "annule";

export interface RendezVous {
  id: string;
  beneficiaireId: string;
  structureId: string;
  type: "CPN" | "CPoN" | "autre";
  libelle: string;
  date: string;
  statut: StatutRdv;
  confirmeParStructure: boolean; // F-22 : jamais confirmé automatiquement
  rappelEnvoyeLe?: string;
}

export type StatutPartenariat = "referencee" | "contactee" | "partenaire";

export interface Structure {
  id: string;
  nom: string;
  type: "Hôpital" | "Centre de santé" | "Poste de santé" | "Maternité" | "Association";
  zone: Zone;
  adresse: string;
  telephone: string;
  services: string[];
  horaires: string;
  statut: StatutPartenariat;
  derniereVerification: string;
  signalements: number;
}

export type StatutDemande = "envoyee" | "recue" | "acceptee" | "autre_date" | "refusee" | "en_attente" | "annulee";

export interface DemandeMiseEnRelation {
  id: string;
  beneficiaireId: string;
  structureId: string;
  besoin: string;
  statut: StatutDemande;
  dateProposee?: string;
  creeLe: string;
  majLe: string;
}

export type TypeSpecialiste = "sage-femme" | "social" | "psychosocial" | "protection";
export type StatutOrientation = "proposee" | "acceptee" | "transmise" | "prise_en_charge" | "cloturee" | "refusee";

export interface Orientation {
  id: string;
  beneficiaireId: string;
  type: TypeSpecialiste;
  specialisteId: string;
  motif: string; // non visible par la référente pour psychosocial / protection
  consentementLe?: string;
  statut: StatutOrientation;
  creeLe: string;
  majLe: string;
}

export interface Personnel {
  id: string;
  prenom: string;
  role: "referente" | "coordinatrice" | "specialiste";
  specialite?: TypeSpecialiste;
  zones: Zone[];
  langues: Langue[];
  capaciteMax: number;
}

export interface CompteEtablissement {
  id: string;
  prenom: string;
  structureId: string;
}

export interface JournalEntree {
  id: string;
  date: string;
  acteur: string;
  action: string;
  cible?: string; // id uniquement, jamais de contenu de santé
}

// Compte de connexion. Bénéficiaire : téléphone + code PIN. Personnel : e-mail + mot de passe.
// Le personnel s'inscrit par une demande d'accès, validée par une coordinatrice.
export type StatutCompte = "actif" | "en_attente" | "refuse";

export interface DemandeAcces {
  roleSouhaite: "referente" | "specialiste" | "etablissement";
  specialite?: TypeSpecialiste;
  zone?: Zone;
  structure?: string;
  fonction: string;
}

export interface Compte {
  id: string;
  identifiant: string; // e-mail en minuscules, ou téléphone en 9 chiffres
  secret: string; // scrypt "sel:empreinte", jamais le mot de passe en clair
  role: Role;
  refId?: string; // id de la bénéficiaire, du personnel ou du compte établissement
  nom: string;
  statut: StatutCompte;
  demande?: DemandeAcces;
  creeLe: string;
  derniereConnexion?: string;
}

// Action de prévention ou de dépistage : uniquement le fait qu'elle ait été réalisée ou refusée,
// jamais le résultat d'un examen.
export interface Prevention {
  id: string;
  beneficiaireId: string;
  actionId: string;
  statut: "fait" | "refuse";
  date: string;
  source: "carnet" | "structure" | "declaration";
  saisiPar: string;
}

// Nouveau-né : données minimales (date de naissance, prénom facultatif). Aucune donnée clinique.
export interface Bebe {
  id: string;
  beneficiaireId: string;
  prenom?: string;
  dateNaissance: string;
  creeLe: string;
}

// Vaccination : uniquement le fait qu'elle ait été réalisée ou refusée, d'après le carnet de santé.
export interface Vaccination {
  id: string;
  bebeId: string;
  vaccinId: string;
  statut: "fait" | "refuse";
  date: string;
  source: "carnet" | "structure" | "declaration";
  saisiPar: string;
}

export interface Base {
  comptes: Compte[];
  preventions: Prevention[];
  bebes: Bebe[];
  vaccinations: Vaccination[];
  identites: Identite[];
  beneficiaires: Beneficiaire[];
  rendezVous: RendezVous[];
  structures: Structure[];
  demandes: DemandeMiseEnRelation[];
  orientations: Orientation[];
  personnel: Personnel[];
  comptesEtablissement: CompteEtablissement[];
  journal: JournalEntree[];
}
