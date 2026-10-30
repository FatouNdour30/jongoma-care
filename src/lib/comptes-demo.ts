// Comptes de DÉMONSTRATION, affichés sur la page de connexion. Jamais en production.
import { chiffrerSecret, normaliserTelephone } from "./auth";
import { addDays, today } from "./protocol";
import type { Base, Compte } from "./types";

export const MOT_DE_PASSE_DEMO = "Demo2026!";
export const PIN_DEMO = "1234";
export const DOMAINE_DEMO = "demo.jongoma.care";

const sansAccent = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function creerComptesDemo(base: Base): Compte[] {
  const t = today();
  const comptes: Compte[] = [];
  const motDePasse = chiffrerSecret(MOT_DE_PASSE_DEMO);
  const pin = chiffrerSecret(PIN_DEMO);

  for (const p of base.personnel) {
    comptes.push({ id: `c-${p.id}`, identifiant: `${sansAccent(p.prenom)}@${DOMAINE_DEMO}`, secret: motDePasse, role: p.role, refId: p.id, nom: p.prenom, statut: "actif", creeLe: addDays(t, -90) });
  }
  for (const e of base.comptesEtablissement) {
    const s = base.structures.find((x) => x.id === e.structureId);
    comptes.push({ id: `c-${e.id}`, identifiant: `accueil.${sansAccent(s?.zone ?? e.id)}@${DOMAINE_DEMO}`, secret: motDePasse, role: "etablissement", refId: e.id, nom: s?.nom ?? "Établissement", statut: "actif", creeLe: addDays(t, -90) });
  }
  // Les trois premières bénéficiaires peuvent se connecter avec leur numéro et le code PIN de démo.
  for (const b of base.beneficiaires.slice(0, 3)) {
    const ident = base.identites.find((i) => i.id === b.identiteId);
    const tel = ident && normaliserTelephone(ident.telephone);
    if (tel) comptes.push({ id: `c-${b.id}`, identifiant: tel, secret: pin, role: "beneficiaire", refId: b.id, nom: ident.prenom, statut: "actif", creeLe: b.creeLe });
  }
  // Une demande d'accès en attente de validation par la coordinatrice.
  comptes.push({
    id: "c-attente-1",
    identifiant: `seynabou@${DOMAINE_DEMO}`,
    secret: motDePasse,
    role: "specialiste",
    nom: "Seynabou Diallo",
    statut: "en_attente",
    demande: { roleSouhaite: "specialiste", specialite: "sage-femme", zone: "Rufisque", structure: "Centre de santé Démo Rufisque", fonction: "Sage-femme d'État" },
    creeLe: addDays(t, -1),
  });
  return comptes;
}
