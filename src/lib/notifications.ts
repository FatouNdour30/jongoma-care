// Notifications calculées à la volée à partir des données, par rôle (rien n'est stocké).
import { calculerPriorite } from "./priority";
import { enRetard } from "./programmes";
import { addDays, diffDays, today } from "./protocol";
import { rappelsAEnvoyer } from "./rappels";
import type { Session } from "./session";
import type { Base } from "./types";

export type Niveau = "urgent" | "important" | "info";

export interface Notification {
  niveau: Niveau;
  titre: string;
  detail: string;
  href: string;
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

export function notifications(s: Session, base: Base): Notification[] {
  const t = today();
  const liste: Notification[] = [];
  const ajouter = (n: number, niveau: Niveau, titre: string, detail: string, href: string) => {
    if (n > 0) liste.push({ niveau, titre, detail, href });
  };

  if (s.role === "referente") {
    const mes = base.beneficiaires.filter((b) => b.referenteId === s.id && b.etape !== "cloture");
    const ids = new Set(mes.map((b) => b.id));
    const hautes = mes.filter((b) => {
      const p = calculerPriorite(b, base);
      return !p.iaRefusee && p.niveau === "haute" && b.dernierContact !== t;
    }).length;
    const aVerifier = base.rendezVous.filter((r) => ids.has(r.beneficiaireId) && r.statut === "prevu" && r.date < t).length;
    const postSansRdv = mes.filter((b) => b.etape === "postnatal" && !base.rendezVous.some((r) => r.beneficiaireId === b.id && r.type === "CPoN" && r.statut === "prevu" && r.date >= t)).length;
    const orientAttente = base.orientations.filter((o) => ids.has(o.beneficiaireId) && o.statut === "transmise" && diffDays(t, o.creeLe) > 3).length;
    const alertesBebe = base.bebes.filter((x) => ids.has(x.beneficiaireId) && x.alerteDangerLe).length;
    ajouter(alertesBebe, "urgent", `Signe de danger signalé pour ${pluriel(alertesBebe, "bébé")}`, "La mère a vu un signe de danger : appelez-la tout de suite.", "/personnel#liste");
    ajouter(hautes, "urgent", `${pluriel(hautes, "bénéficiaire")} en priorité haute`, "À rappeler aujourd'hui.", "/personnel#appels");
    const rappelsDemandes = mes.filter((b) => b.rappelDemandeLe).length;
    ajouter(rappelsDemandes, "urgent", `${pluriel(rappelsDemandes, "bénéficiaire")} demande${rappelsDemandes > 1 ? "nt" : ""} à être rappelée${rappelsDemandes > 1 ? "s" : ""}`, "Question posée à l'assistant vocal, sans réponse validée : rappelez-la.", "/personnel#liste");
    ajouter(aVerifier, "important", `${pluriel(aVerifier, "rendez-vous")} à vérifier`, "Rendez-vous passés dont le statut est inconnu.", "/personnel#rdv");
    ajouter(postSansRdv, "important", `${pluriel(postSansRdv, "mère")} sans consultation postnatale prévue`, "Organiser la prochaine consultation avec la structure.", "/personnel");
    ajouter(rappelsAEnvoyer(base, ids).length, "info", `${pluriel(rappelsAEnvoyer(base, ids).length, "rappel")} à envoyer`, "Rendez-vous des 3 prochains jours.", "/personnel#rappels");
    const prevRetard = mes.filter((b) => enRetard(b, base).length > 0).length;
    ajouter(prevRetard, "important", `${pluriel(prevRetard, "bénéficiaire")} avec une prévention en retard`, "Paludisme, anémie, dépistages… à aborder lors du prochain contact.", "/personnel");
    ajouter(orientAttente, "info", `${pluriel(orientAttente, "orientation")} sans réponse depuis 3 jours`, "La spécialiste n'a pas encore pris en charge.", "/personnel/orientations");
  }

  if (s.role === "coordinatrice") {
    const actives = base.beneficiaires.filter((b) => b.etape !== "cloture");
    const sansRef = actives.filter((b) => b.consentements.accompagnement && !b.referenteId).length;
    const sansContact = actives.filter((b) => b.referenteId && (!b.dernierContact || diffDays(t, b.dernierContact) > 21)).length;
    const comptes = base.comptes.filter((c) => c.statut === "en_attente").length;
    const signalees = base.structures.filter((x) => x.signalements > 0).length;
    const saturees = base.personnel.filter((p) => p.role === "referente" && actives.filter((b) => b.referenteId === p.id).length / p.capaciteMax > 0.9).length;
    const escalades = base.journal.filter((j) => j.action === "escalade_signe_alerte" && j.date.slice(0, 10) >= addDays(t, -7)).length;
    const alertesBebe = base.bebes.filter((x) => x.alerteDangerLe && diffDays(t, x.alerteDangerLe.slice(0, 10)) >= 1).length;
    ajouter(alertesBebe, "urgent", `${pluriel(alertesBebe, "alerte bébé")} non levée${alertesBebe > 1 ? "s" : ""} depuis plus d'un jour`, "Signe de danger signalé par une mère : vérifier que la référente l'a jointe.", "/coordination/affectations");
    ajouter(escalades, "urgent", `${pluriel(escalades, "escalade")} cette semaine`, "Signes d'alerte signalés par des référentes : vérifier la prise en charge.", "/coordination/journal");
    ajouter(sansRef, "urgent", `${pluriel(sansRef, "bénéficiaire")} sans référente`, "Consentantes, en attente d'affectation.", "/coordination/affectations");
    ajouter(comptes, "important", `${pluriel(comptes, "demande")} d'accès à valider`, "Vérifier l'identité et la fonction.", "/coordination/comptes");
    ajouter(saturees, "important", `${pluriel(saturees, "référente")} proche de la capacité maximale`, "Plus de 90 % de la charge : envisager une réaffectation.", "/coordination/equipe");
    ajouter(sansContact, "info", `${pluriel(sansContact, "bénéficiaire")} sans contact depuis 21 jours`, "Relancer la référente concernée.", "/coordination/affectations");
    ajouter(signalees, "info", `${pluriel(signalees, "structure")} signalée(s)`, "Informations du répertoire à revérifier.", "/coordination/structures");
  }

  if (s.role === "specialiste") {
    const recues = base.orientations.filter((o) => o.specialisteId === s.id && o.consentementLe);
    const retard = recues.filter((o) => (o.statut === "transmise" || o.statut === "acceptee") && diffDays(t, o.creeLe) > 3).length;
    const nouvelles = recues.filter((o) => o.statut === "transmise" || o.statut === "acceptee").length;
    ajouter(retard, "urgent", `${pluriel(retard, "orientation")} en attente depuis plus de 3 jours`, "Prendre contact avec la bénéficiaire.", "/specialiste?vue=nouvelles");
    ajouter(nouvelles - retard, "important", `${pluriel(nouvelles - retard, "nouvelle orientation")}`, "Reçue(s) avec le consentement de la bénéficiaire.", "/specialiste?vue=nouvelles");
  }

  if (s.role === "etablissement") {
    const compte = base.comptesEtablissement.find((c) => c.id === s.id);
    const sid = compte?.structureId;
    const demandes = base.demandes.filter((d) => d.structureId === sid && ["envoyee", "recue", "en_attente"].includes(d.statut));
    const anciennes = demandes.filter((d) => diffDays(t, d.creeLe) > 2).length;
    const aConfirmer = base.rendezVous.filter((r) => r.structureId === sid && r.statut === "prevu" && r.date >= t && r.date <= addDays(t, 3) && !r.confirmeParStructure).length;
    const st = base.structures.find((x) => x.id === sid);
    ajouter(anciennes, "urgent", `${pluriel(anciennes, "demande")} sans réponse depuis 2 jours`, "La bénéficiaire attend une réponse.", "/etablissement#demandes");
    ajouter(demandes.length - anciennes, "important", `${pluriel(demandes.length - anciennes, "nouvelle demande")}`, "Mise(s) en relation reçue(s).", "/etablissement#demandes");
    ajouter(aConfirmer, "important", `${pluriel(aConfirmer, "rendez-vous")} à confirmer d'ici 3 jours`, "Seule la structure peut confirmer.", "/etablissement#confirmer");
    ajouter(st && diffDays(t, st.derniereVerification) > 90 ? 1 : 0, "info", "Fiche à mettre à jour", "Vos informations datent de plus de 90 jours.", "/etablissement/fiche");
  }

  const ordre: Record<Niveau, number> = { urgent: 0, important: 1, info: 2 };
  return liste.sort((a, b) => ordre[a.niveau] - ordre[b.niveau]);
}
