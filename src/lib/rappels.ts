// File des rappels de rendez-vous (F-07). En attendant la passerelle SMS agréée,
// la référente envoie le message elle-même puis le marque comme envoyé.
// Mode discret : aucun mot lié à la grossesse ni nom de structure dans le texte.
import { BIENTOT_JOURS, nomBebe, prochaineEtape } from "./enfants";
import { addDays, diffDays, today } from "./protocol";
import type { Base, Bebe, RendezVous } from "./types";

export const DELAI_RAPPEL_JOURS = 3;

const jour = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export function texteRappel(rdv: RendezVous, base: Base): string {
  const b = base.beneficiaires.find((x) => x.id === rdv.beneficiaireId);
  const prenom = base.identites.find((i) => i.id === b?.identiteId)?.prenom ?? "";
  const ref = base.personnel.find((p) => p.id === b?.referenteId)?.prenom;
  const structure = base.structures.find((s) => s.id === rdv.structureId)?.nom ?? "";
  if (b?.messageDiscret) return `Bonjour ${prenom}, n'oubliez pas votre rendez-vous du ${jour(rdv.date)}.${ref ? ` ${ref}` : ""}`;
  return `Bonjour ${prenom}, rappel : ${rdv.libelle} le ${jour(rdv.date)} à ${structure}.${ref ? ` Votre référente ${ref} reste joignable.` : ""}`;
}

// Rendez-vous prévus dans les prochains jours, pour des bénéficiaires ayant accepté les rappels.
export function rappelsAEnvoyer(base: Base, beneficiaireIds: Set<string>): RendezVous[] {
  const t = today();
  const limite = addDays(t, DELAI_RAPPEL_JOURS);
  const accepte = new Set(base.beneficiaires.filter((b) => b.consentements.rappels).map((b) => b.id));
  return base.rendezVous
    .filter((r) => beneficiaireIds.has(r.beneficiaireId) && accepte.has(r.beneficiaireId) && r.statut === "prevu" && r.date >= t && r.date <= limite && !r.rappelEnvoyeLe)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Vaccins du bébé à rappeler : prochaine étape du calendrier dans les 7 jours, ou en retard.
// Mêmes règles que les rendez-vous : accord pour les rappels, mode discret respecté.
export function vaccinsARappeler(base: Base, beneficiaireIds: Set<string>, t = today()) {
  const accepte = new Set(base.beneficiaires.filter((b) => b.consentements.rappels).map((b) => b.id));
  return base.bebes
    .filter((x) => beneficiaireIds.has(x.beneficiaireId) && accepte.has(x.beneficiaireId))
    .map((bebe) => ({ bebe, etape: prochaineEtape(bebe, base, t) }))
    .filter((x): x is { bebe: Bebe; etape: NonNullable<ReturnType<typeof prochaineEtape>> } => !!x.etape && diffDays(x.etape.du, t) <= BIENTOT_JOURS)
    .sort((a, b) => a.etape.du.localeCompare(b.etape.du));
}

export function texteRappelVaccin(bebe: Bebe, etape: NonNullable<ReturnType<typeof prochaineEtape>>, base: Base): string {
  const b = base.beneficiaires.find((x) => x.id === bebe.beneficiaireId);
  const prenom = base.identites.find((i) => i.id === b?.identiteId)?.prenom ?? "";
  const ref = base.personnel.find((p) => p.id === b?.referenteId)?.prenom;
  const quand = etape.enRetard ? "dès que possible" : `vers le ${jour(etape.du)}`;
  if (b?.messageDiscret) return `Bonjour ${prenom}, pensez au rendez-vous de votre enfant ${quand}, avec son carnet.${ref ? ` ${ref}` : ""}`;
  return `Bonjour ${prenom}, la vaccination de ${nomBebe(bebe) === "Bébé" ? "votre bébé" : nomBebe(bebe)} (${etape.vaccins.map((e) => e.vaccin.nom).join(", ")}) est prévue ${quand}. Apportez le carnet de santé.${ref ? ` Votre référente ${ref} reste joignable.` : ""}`;
}
