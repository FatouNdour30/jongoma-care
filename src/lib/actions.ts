"use server";
// Actions serveur. Chacune vérifie le rôle ET le périmètre de la personne connectée (F-29).
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, enregistrer, newId, reinitialiser, synchroniser } from "./db";
import { addDays, CALENDRIER_CPN, CALENDRIER_CPON, diffDays, ETAPES, today } from "./protocol";
import { COOKIE_LANGUE } from "./langue";
import { ACTIONS } from "./programmes";
import { VACCINS } from "./enfants";
import { chiffrerSecret, effacerEchecs, estBloque, normaliserEmail, normaliserTelephone, noterEchec, verifierSecret } from "./auth";
import { exigerRole, setSession } from "./session";
import type { Beneficiaire, Langue, Role, TypeSpecialiste, Zone } from "./types";
import { ZONES } from "./types";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const coche = (f: FormData, k: string) => f.get(k) === "on";

// Les valeurs venant d'un formulaire ne sont jamais crues sur parole.
function parmi<T extends string>(f: FormData, k: string, valeurs: readonly T[]): T | undefined {
  const v = str(f, k);
  return (valeurs as readonly string[]).includes(v) ? (v as T) : undefined;
}
const dateIso = (f: FormData, k: string) => {
  const v = str(f, k);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : undefined;
};

const CANAUX = ["sms", "appel", "audio"] as const;
const HORAIRES = ["matin", "après-midi", "soir"] as const;
const DUREE_MAX_GROSSESSE_JOURS = 44 * 7;

// Numéro sénégalais : 9 chiffres, indicatif 221 facultatif. Renvoie "" si vide, undefined si invalide.
function telephone(f: FormData) {
  const brut = str(f, "telephone");
  if (!brut) return "";
  const chiffres = brut.replace(/\D/g, "").replace(/^(00)?221/, "");
  return /^\d{9}$/.test(chiffres) ? chiffres.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4") : undefined;
}

const ACCUEIL: Record<Role, string> = {
  beneficiaire: "/femme",
  referente: "/personnel",
  coordinatrice: "/coordination",
  etablissement: "/etablissement",
  specialiste: "/specialiste",
};

// Connexion : bénéficiaire (téléphone + PIN) ou personnel (e-mail + mot de passe).
// Message d'erreur identique que l'identifiant existe ou non, pour ne rien révéler.
export async function seConnecter(f: FormData) {
  await synchroniser();
  const espace = str(f, "espace") === "personnel" ? "personnel" : "beneficiaire";
  const retour = `/connexion?espace=${espace}`;
  const identifiant = espace === "personnel" ? normaliserEmail(str(f, "identifiant")) : normaliserTelephone(str(f, "identifiant"));
  const secret = String(f.get("secret") ?? "");
  if (!identifiant || !secret) redirect(`${retour}&erreur=identifiants`);
  if (estBloque(identifiant)) redirect(`${retour}&erreur=bloque`);

  const compte = db().comptes.find((c) => c.identifiant === identifiant && (espace === "personnel" ? c.role !== "beneficiaire" : c.role === "beneficiaire"));
  if (!compte || !verifierSecret(secret, compte.secret)) {
    noterEchec(identifiant);
    redirect(`${retour}&erreur=identifiants`);
  }
  if (compte.statut === "en_attente") redirect(`${retour}&erreur=attente`);
  if (compte.statut !== "actif" || !compte.refId) redirect(`${retour}&erreur=refuse`);

  effacerEchecs(identifiant);
  compte.derniereConnexion = new Date().toISOString();
  enregistrer(`${compte.role}:${compte.refId}`, "connexion", compte.id);
  await setSession({ role: compte.role, id: compte.refId, compteId: compte.id });
  redirect(ACCUEIL[compte.role]);
}

// Inscription du personnel : demande d'accès, active seulement après validation (F-15).
export async function demanderAcces(f: FormData) {
  await synchroniser();
  const retour = "/inscription/personnel";
  const email = normaliserEmail(str(f, "email"));
  const nom = `${str(f, "prenom")} ${str(f, "nom")}`.trim().slice(0, 80);
  const motDePasse = String(f.get("motDePasse") ?? "");
  const role = parmi(f, "role", ["referente", "sage-femme", "social", "psychosocial", "protection", "etablissement"] as const);
  if (!nom || !role) redirect(`${retour}?erreur=champs`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(`${retour}?erreur=email`);
  if (motDePasse.length < 8 || !/\d/.test(motDePasse) || !/[a-zA-Z]/.test(motDePasse)) redirect(`${retour}?erreur=motdepasse`);
  if (motDePasse !== String(f.get("confirmation") ?? "")) redirect(`${retour}?erreur=confirmation`);
  if (!coche(f, "engagement")) redirect(`${retour}?erreur=engagement`);
  const base = db();
  if (base.comptes.some((c) => c.identifiant === email)) redirect(`${retour}?erreur=existe`);

  const specialiste = role !== "referente" && role !== "etablissement";
  base.comptes.push({
    id: newId("c"),
    identifiant: email,
    secret: chiffrerSecret(motDePasse),
    role: specialiste ? "specialiste" : role,
    nom,
    statut: "en_attente",
    demande: { roleSouhaite: specialiste ? "specialiste" : role, specialite: specialiste ? role : undefined, zone: parmi<Zone>(f, "zone", ZONES), structure: str(f, "structure").slice(0, 120) || undefined, fonction: str(f, "fonction").slice(0, 80) },
    creeLe: today(),
  });
  enregistrer("public", "demande_acces", email.replace(/@.*/, "@…"));
  redirect(`${retour}?envoye=1`);
}

// Validation d'une demande d'accès par la coordinatrice : crée la fiche du personnel.
export async function traiterDemandeAcces(f: FormData) {
  const s = await exigerRole("coordinatrice");
  const base = db();
  const c = base.comptes.find((x) => x.id === str(f, "compteId") && x.statut === "en_attente");
  if (!c?.demande) return;
  if (str(f, "decision") === "refuser") {
    c.statut = "refuse";
  } else if (c.demande.roleSouhaite === "etablissement") {
    const structure = base.structures.find((x) => x.id === str(f, "structureId"));
    if (!structure) redirect("/coordination/comptes?erreur=structure");
    const e = { id: newId("e"), prenom: c.nom.split(" ")[0], structureId: structure.id };
    base.comptesEtablissement.push(e);
    Object.assign(c, { statut: "actif", refId: e.id, role: "etablissement" });
  } else {
    const zone = c.demande.zone ?? "Pikine";
    const p = {
      id: newId("p"),
      prenom: c.nom.split(" ")[0],
      role: c.demande.roleSouhaite as "referente" | "specialiste",
      specialite: c.demande.specialite,
      zones: c.demande.roleSouhaite === "referente" ? [zone] : ZONES,
      langues: ["wo", "fr"] as Langue[],
      capaciteMax: c.demande.roleSouhaite === "referente" ? 25 : 40,
    };
    base.personnel.push(p);
    Object.assign(c, { statut: "actif", refId: p.id });
  }
  enregistrer(`coordinatrice:${s.id}`, c.statut === "actif" ? "compte_valide" : "compte_refuse", c.id);
  revalidatePath("/coordination/comptes");
}

export async function seDeconnecter() {
  await setSession(null);
  redirect("/");
}

export async function reinitialiserDemo() {
  reinitialiser();
  await setSession(null);
  redirect("/");
}

// Choix de la référente : zone, langue, puis charge la plus faible sous la capacité (5.8).
function choisirReferente(zone: Zone, langue: Langue, exclure?: string) {
  const base = db();
  const charge = (id: string) => base.beneficiaires.filter((b) => b.referenteId === id && b.etape !== "cloture").length;
  return base.personnel
    .filter((p) => p.role === "referente" && p.id !== exclure && p.zones.includes(zone) && charge(p.id) < p.capaciteMax)
    .sort((a, b) => Number(b.langues.includes(langue)) - Number(a.langues.includes(langue)) || charge(a.id) - charge(b.id))[0];
}

// ---------- Bénéficiaire ----------

export async function inscrire(f: FormData) {
  await synchroniser();
  if (!coche(f, "c_service")) redirect("/femme/inscription?erreur=consentement");
  const base = db();
  const zone = parmi<Zone>(f, "zone", ZONES);
  const langue = parmi<Langue>(f, "langue", ["wo", "fr"]) ?? "wo";
  if (!zone) redirect("/femme/inscription?erreur=zone");
  const tel = telephone(f);
  if (!tel) redirect("/femme/inscription?erreur=telephone");
  const identifiant = normaliserTelephone(tel)!;
  if (base.comptes.some((c) => c.identifiant === identifiant)) redirect("/femme/inscription?erreur=existe");
  const pin = String(f.get("pin") ?? "");
  if (!/^\d{4}$/.test(pin)) redirect("/femme/inscription?erreur=pin");
  if (pin !== String(f.get("pinConfirmation") ?? "")) redirect("/femme/inscription?erreur=pinConfirmation");
  const ddr = dateIso(f, "ddr");
  if (str(f, "ddr") && (!ddr || ddr > today() || diffDays(today(), ddr) > DUREE_MAX_GROSSESSE_JOURS)) redirect("/femme/inscription?erreur=ddr");

  const n = base.beneficiaires.length + 1;
  const identiteId = newId("i");
  base.identites.push({ id: identiteId, prenom: str(f, "prenom").slice(0, 60) || `Bénéficiaire ${n}`, telephone: tel });

  const accompagnement = coche(f, "c_accompagnement");
  const b: Beneficiaire = {
    id: newId("b"),
    identiteId,
    zone,
    langue,
    canal: parmi(f, "canal", CANAUX) ?? "sms",
    horaireContact: parmi(f, "horaire", HORAIRES) ?? "matin",
    messageDiscret: coche(f, "discret"),
    consentements: { service: true, rappels: coche(f, "c_rappels"), accompagnement, ia: coche(f, "c_ia"), dateRecueil: today() },
    ddr,
    distanceKm: Number(str(f, "distance")) || undefined,
    referenteId: accompagnement ? choisirReferente(zone, langue)?.id : undefined,
    etape: "grossesse",
    rappelsSansReponse: 0,
    creeLe: today(),
  };
  base.beneficiaires.push(b);

  // Calendrier prénatal proposé selon le protocole ; non confirmé tant que la structure ne l'a pas validé.
  const structure = base.structures.find((s) => s.zone === zone && s.statut === "partenaire") ?? base.structures.find((s) => s.zone === zone);
  if (b.ddr && structure) {
    for (const semaine of CALENDRIER_CPN) {
      const date = addDays(b.ddr, semaine * 7);
      if (date < today()) continue;
      base.rendezVous.push({ id: newId("r"), beneficiaireId: b.id, structureId: structure.id, type: "CPN", libelle: `Consultation prénatale (${semaine} SA)`, date, statut: "prevu", confirmeParStructure: false });
    }
  }
  const compte = { id: newId("c"), identifiant, secret: chiffrerSecret(pin), role: "beneficiaire" as const, refId: b.id, nom: base.identites.find((i) => i.id === identiteId)!.prenom, statut: "actif" as const, creeLe: today(), derniereConnexion: new Date().toISOString() };
  base.comptes.push(compte);
  enregistrer(`beneficiaire:${b.id}`, "inscription", b.id);
  await setSession({ role: "beneficiaire", id: b.id, compteId: compte.id });
  redirect("/femme?bienvenue=1");
}

export async function majPreferences(f: FormData) {
  const s = await exigerRole("beneficiaire");
  const b = db().beneficiaires.find((x) => x.id === s.id);
  if (!b) redirect("/connexion");
  b.canal = parmi(f, "canal", CANAUX) ?? b.canal;
  b.horaireContact = parmi(f, "horaire", HORAIRES) ?? b.horaireContact;
  b.messageDiscret = coche(f, "discret");
  b.consentements.rappels = coche(f, "c_rappels");
  b.consentements.ia = coche(f, "c_ia");
  const accompagnement = coche(f, "c_accompagnement");
  if (!accompagnement) b.referenteId = undefined;
  else if (!b.referenteId) b.referenteId = choisirReferente(b.zone, b.langue)?.id;
  b.consentements.accompagnement = accompagnement;
  enregistrer(`beneficiaire:${b.id}`, "maj_preferences", b.id);
  revalidatePath("/femme");
  redirect("/femme?enregistre=1");
}

// F-31 : changement de référente sans justification.
export async function changerReferente() {
  const s = await exigerRole("beneficiaire");
  const b = db().beneficiaires.find((x) => x.id === s.id);
  if (!b?.referenteId) redirect("/femme");
  const nouvelle = choisirReferente(b.zone, b.langue, b.referenteId);
  // Aucune autre référente disponible dans la zone : on le dit plutôt que de prétendre l'avoir changée.
  if (!nouvelle) redirect("/femme?referente=indisponible");
  b.referenteId = nouvelle.id;
  enregistrer(`beneficiaire:${b.id}`, "changement_referente", b.id);
  redirect("/femme?referente=changee");
}

const DEMANDES_OUVERTES = ["envoyee", "recue", "en_attente"];

export async function demanderMiseEnRelation(f: FormData) {
  const s = await exigerRole("beneficiaire");
  const structure = db().structures.find((x) => x.id === str(f, "structureId"));
  if (!structure) redirect("/structures");
  const besoin = structure.services.find((x) => x === str(f, "besoin")) ?? structure.services[0] ?? "Consultation";
  // Pas de doublon : une seule demande ouverte par structure et par besoin.
  const doublon = db().demandes.some((d) => d.beneficiaireId === s.id && d.structureId === structure.id && d.besoin === besoin && DEMANDES_OUVERTES.includes(d.statut));
  if (doublon) redirect("/femme?demande=doublon");
  db().demandes.push({ id: newId("d"), beneficiaireId: s.id, structureId: structure.id, besoin, statut: "envoyee", creeLe: today(), majLe: today() });
  enregistrer(`beneficiaire:${s.id}`, "demande_mise_en_relation", structure.id);
  redirect("/femme?demande=envoyee");
}

export async function annulerDemande(f: FormData) {
  const s = await exigerRole("beneficiaire");
  const d = db().demandes.find((x) => x.id === str(f, "demandeId") && x.beneficiaireId === s.id);
  if (!d || !DEMANDES_OUVERTES.includes(d.statut)) redirect("/femme");
  d.statut = "annulee";
  d.majLe = today();
  enregistrer(`beneficiaire:${s.id}`, "demande_annulee", d.id);
  redirect("/femme?demande=annulee");
}

// F-28 : la bénéficiaire peut donner (ou refuser) elle-même son accord à une orientation proposée.
export async function repondreOrientation(f: FormData) {
  const s = await exigerRole("beneficiaire");
  const o = db().orientations.find((x) => x.id === str(f, "orientationId") && x.beneficiaireId === s.id);
  const reponse = parmi(f, "reponse", ["accepter", "refuser"] as const);
  if (!o || o.statut !== "proposee" || !reponse) redirect("/femme");
  if (reponse === "accepter") {
    o.consentementLe = today();
    o.statut = "transmise";
  } else o.statut = "refusee";
  o.majLe = today();
  enregistrer(`beneficiaire:${s.id}`, reponse === "accepter" ? "orientation_acceptee_beneficiaire" : "orientation_refusee_beneficiaire", o.id);
  redirect(`/femme?orientation=${reponse === "accepter" ? "acceptee" : "refusee"}`);
}

// Droit à l'effacement : suppression de l'identité et de tout le suivi. Le journal ne garde que des identifiants.
export async function supprimerMesDonnees(f: FormData) {
  const s = await exigerRole("beneficiaire");
  if (str(f, "confirmation").toUpperCase() !== "SUPPRIMER") redirect("/femme?suppression=confirmer");
  const base = db();
  const b = base.beneficiaires.find((x) => x.id === s.id);
  if (b) {
    base.identites = base.identites.filter((i) => i.id !== b.identiteId);
    base.beneficiaires = base.beneficiaires.filter((x) => x.id !== b.id);
    base.rendezVous = base.rendezVous.filter((r) => r.beneficiaireId !== b.id);
    base.demandes = base.demandes.filter((d) => d.beneficiaireId !== b.id);
    base.orientations = base.orientations.filter((o) => o.beneficiaireId !== b.id);
    base.comptes = base.comptes.filter((c) => c.refId !== b.id);
    base.preventions = base.preventions.filter((p) => p.beneficiaireId !== b.id);
    const bebes = new Set(base.bebes.filter((x) => x.beneficiaireId === b.id).map((x) => x.id));
    base.vaccinations = base.vaccinations.filter((v) => !bebes.has(v.bebeId));
    base.bebes = base.bebes.filter((x) => x.beneficiaireId !== b.id);
    enregistrer(`beneficiaire:${b.id}`, "suppression_donnees", b.id);
  }
  await setSession(null);
  redirect("/femme/inscription?supprime=1");
}

export async function signalerStructure(f: FormData) {
  await synchroniser();
  const st = db().structures.find((x) => x.id === str(f, "structureId"));
  if (st) {
    st.signalements += 1;
    enregistrer("public", "signalement_repertoire", st.id);
  }
  // Retour vers la page d'origine (publique ou espace pro), jamais vers une adresse arbitraire.
  const retour = (["/espace/repertoire", "/femme/structures"] as const).find((x) => x === str(f, "retour")) ?? "/structures";
  redirect(`${retour}?signale=1`);
}

// ---------- Référente ----------

async function beneficiaireDeLaReferente(id: string) {
  const s = await exigerRole("referente", "coordinatrice");
  const b = db().beneficiaires.find((x) => x.id === id);
  if (!b || (s.role === "referente" && b.referenteId !== s.id)) throw new Error("Accès refusé");
  return { s, b };
}

export async function verifierRdv(f: FormData) {
  const rdv = db().rendezVous.find((r) => r.id === str(f, "rdvId"));
  if (!rdv) return;
  const { s, b } = await beneficiaireDeLaReferente(rdv.beneficiaireId);
  const statut = parmi(f, "statut", ["honore", "manque", "reporte", "annule"] as const);
  if (!statut || rdv.statut !== "prevu") return;
  rdv.statut = statut;
  if (statut === "reporte") {
    const nouvelle = dateIso(f, "nouvelleDate") ?? addDays(today(), 7);
    db().rendezVous.push({ ...rdv, id: newId("r"), date: nouvelle, statut: "prevu", confirmeParStructure: false, rappelEnvoyeLe: undefined });
  }
  b.dernierContact = today();
  enregistrer(`${s.role}:${s.id}`, `verification_rdv_${statut}`, rdv.id);
  revalidatePath(`/personnel/beneficiaire/${b.id}`);
  revalidatePath("/personnel");
}

export async function enregistrerContact(f: FormData) {
  const { s, b } = await beneficiaireDeLaReferente(str(f, "beneficiaireId"));
  b.dernierContact = today();
  b.rappelsSansReponse = 0;
  b.rappelDemandeLe = undefined;
  enregistrer(`${s.role}:${s.id}`, "contact", b.id);
  revalidatePath(`/personnel/beneficiaire/${b.id}`);
  revalidatePath("/personnel");
}

// Un appel ou un rappel resté sans réponse alimente le score de priorisation (règle « rappels »).
export async function enregistrerSansReponse(f: FormData) {
  const { s, b } = await beneficiaireDeLaReferente(str(f, "beneficiaireId"));
  b.rappelsSansReponse += 1;
  enregistrer(`${s.role}:${s.id}`, "appel_sans_reponse", b.id);
  revalidatePath(`/personnel/beneficiaire/${b.id}`);
  revalidatePath("/personnel");
}

export async function marquerRappelEnvoye(f: FormData) {
  const rdv = db().rendezVous.find((r) => r.id === str(f, "rdvId"));
  if (!rdv) return;
  const { s, b } = await beneficiaireDeLaReferente(rdv.beneficiaireId);
  if (!b.consentements.rappels) return;
  rdv.rappelEnvoyeLe = today();
  enregistrer(`${s.role}:${s.id}`, "rappel_envoye", rdv.id);
  revalidatePath("/personnel");
}

export async function changerEtape(f: FormData) {
  const { s, b } = await beneficiaireDeLaReferente(str(f, "beneficiaireId"));
  const etape = parmi(f, "etape", ETAPES.map((e) => e.id));
  if (!etape || etape === b.etape) return;
  b.etape = etape;
  const rdvs = db().rendezVous.filter((r) => r.beneficiaireId === b.id);
  if (etape === "postnatal") {
    b.dateAccouchement ??= today();
    // Le suivi du nouveau-né démarre avec le postnatal (date de naissance seulement).
    if (!db().bebes.some((x) => x.beneficiaireId === b.id)) {
      db().bebes.push({ id: newId("bb"), beneficiaireId: b.id, dateNaissance: b.dateAccouchement, creeLe: today() });
    }
    // Les consultations prénatales encore à venir n'ont plus lieu d'être.
    for (const r of rdvs) if (r.type === "CPN" && r.statut === "prevu" && r.date >= today()) r.statut = "annule";
    // Calendrier postnatal proposé selon le protocole, à confirmer par la structure.
    const structureId = rdvs.at(-1)?.structureId ?? db().structures.find((x) => x.zone === b.zone)?.id;
    if (structureId && !rdvs.some((r) => r.type === "CPoN")) {
      for (const c of CALENDRIER_CPON) {
        const date = addDays(b.dateAccouchement, c.jours);
        if (date < today()) continue;
        db().rendezVous.push({ id: newId("r"), beneficiaireId: b.id, structureId, type: "CPoN", libelle: c.libelle, date, statut: "prevu", confirmeParStructure: false });
      }
    }
  }
  enregistrer(`${s.role}:${s.id}`, `etape_${b.etape}`, b.id);
  revalidatePath(`/personnel/beneficiaire/${b.id}`);
}

export async function ajouterRdv(f: FormData) {
  const { s, b } = await beneficiaireDeLaReferente(str(f, "beneficiaireId"));
  const structure = db().structures.find((x) => x.id === str(f, "structureId"));
  const date = dateIso(f, "date");
  if (!structure || !date || date < today()) return;
  db().rendezVous.push({
    id: newId("r"),
    beneficiaireId: b.id,
    structureId: structure.id,
    type: b.etape === "postnatal" ? "CPoN" : "CPN",
    libelle: str(f, "libelle").slice(0, 120) || "Consultation",
    date,
    statut: "prevu",
    confirmeParStructure: false,
  });
  enregistrer(`${s.role}:${s.id}`, "ajout_rdv", b.id);
  revalidatePath(`/personnel/beneficiaire/${b.id}`);
}

const SPECIALITES: TypeSpecialiste[] = ["sage-femme", "social", "psychosocial", "protection"];

// F-28 : orientation uniquement avec consentement explicite enregistré.
export async function proposerOrientation(f: FormData) {
  const { s, b } = await beneficiaireDeLaReferente(str(f, "beneficiaireId"));
  const type = parmi(f, "type", SPECIALITES);
  const specialiste = db().personnel.find((p) => p.role === "specialiste" && p.specialite === type);
  if (!type || !specialiste) return;
  const consent = coche(f, "consentement");
  db().orientations.push({
    id: newId("o"),
    beneficiaireId: b.id,
    type,
    specialisteId: specialiste.id,
    motif: str(f, "motif"),
    consentementLe: consent ? today() : undefined,
    statut: consent ? "transmise" : "proposee",
    creeLe: today(),
    majLe: today(),
  });
  enregistrer(`${s.role}:${s.id}`, consent ? "orientation_transmise" : "orientation_proposee", b.id);
  revalidatePath(`/personnel/beneficiaire/${b.id}`);
}

export async function escalader(f: FormData) {
  const { s, b } = await beneficiaireDeLaReferente(str(f, "beneficiaireId"));
  enregistrer(`${s.role}:${s.id}`, "escalade_signe_alerte", b.id);
  redirect(`/personnel/beneficiaire/${b.id}?escalade=1`);
}

// ---------- Coordinatrice ----------

export async function affecter(f: FormData) {
  const s = await exigerRole("coordinatrice");
  const b = db().beneficiaires.find((x) => x.id === str(f, "beneficiaireId"));
  const ref = db().personnel.find((p) => p.id === str(f, "referenteId") && p.role === "referente");
  if (!b || !ref || !b.consentements.accompagnement || !ref.zones.includes(b.zone)) return;
  b.referenteId = ref.id;
  enregistrer(`coordinatrice:${s.id}`, "affectation", b.id);
  revalidatePath("/coordination/affectations");
}

// Affecte toutes les bénéficiaires en attente selon la règle zone / langue / charge.
export async function affecterAutomatiquement() {
  const s = await exigerRole("coordinatrice");
  let n = 0;
  for (const b of db().beneficiaires.filter((x) => x.consentements.accompagnement && !x.referenteId && x.etape !== "cloture")) {
    const ref = choisirReferente(b.zone, b.langue);
    if (!ref) continue;
    b.referenteId = ref.id;
    enregistrer(`coordinatrice:${s.id}`, "affectation_auto", b.id);
    n++;
  }
  redirect(`/coordination/affectations?affectees=${n}`);
}

// Traitement d'un signalement du répertoire : informations revérifiées.
export async function verifierStructure(f: FormData) {
  const s = await exigerRole("coordinatrice");
  const st = db().structures.find((x) => x.id === str(f, "structureId"));
  if (!st) return;
  st.signalements = 0;
  st.derniereVerification = today();
  enregistrer(`coordinatrice:${s.id}`, "verification_structure", st.id);
  revalidatePath("/coordination/affectations");
}

// ---------- Spécialiste ----------

export async function majOrientation(f: FormData) {
  const s = await exigerRole("specialiste");
  const o = db().orientations.find((x) => x.id === str(f, "orientationId"));
  const statut = parmi(f, "statut", ["prise_en_charge", "cloturee", "refusee"] as const);
  if (!o || !statut || o.specialisteId !== s.id || !o.consentementLe) return;
  o.statut = statut;
  o.majLe = today();
  enregistrer(`specialiste:${s.id}`, `orientation_${o.statut}`, o.id);
  revalidatePath("/specialiste");
}

// F-05 : seule une sage-femme peut corriger la date prévue.
export async function corrigerDpa(f: FormData) {
  const s = await exigerRole("specialiste");
  const moi = db().personnel.find((p) => p.id === s.id);
  const b = db().beneficiaires.find((x) => x.id === str(f, "beneficiaireId"));
  const orientee = db().orientations.some((o) => o.beneficiaireId === b?.id && o.specialisteId === s.id && o.consentementLe);
  if (moi?.specialite !== "sage-femme" || !b || !orientee) return;
  b.dpaCorrigee = dateIso(f, "dpa");
  enregistrer(`specialiste:${s.id}`, "correction_dpa", b.id);
  revalidatePath("/specialiste");
}

// ---------- Établissement partenaire ----------

async function structureDuCompte() {
  const s = await exigerRole("etablissement");
  const compte = db().comptesEtablissement.find((c) => c.id === s.id);
  if (!compte) redirect("/connexion");
  return { s, structureId: compte.structureId };
}

export async function repondreDemande(f: FormData) {
  const { s, structureId } = await structureDuCompte();
  const d = db().demandes.find((x) => x.id === str(f, "demandeId"));
  const statut = parmi(f, "statut", ["acceptee", "autre_date", "refusee", "en_attente"] as const);
  if (!d || !statut || d.structureId !== structureId || !DEMANDES_OUVERTES.includes(d.statut)) return;
  const date = dateIso(f, "date");
  const avecDate = statut === "acceptee" || statut === "autre_date";
  if (avecDate && (!date || date < today())) return;
  d.statut = statut;
  if (avecDate) d.dateProposee = date;
  d.majLe = today();
  // F-22 : le rendez-vous n'est confirmé que par l'établissement.
  if (avecDate && d.dateProposee) {
    db().rendezVous.push({ id: newId("r"), beneficiaireId: d.beneficiaireId, structureId, type: "autre", libelle: d.besoin, date: d.dateProposee, statut: "prevu", confirmeParStructure: d.statut === "acceptee" });
  }
  enregistrer(`etablissement:${s.id}`, `demande_${d.statut}`, d.id);
  revalidatePath("/etablissement");
}

export async function confirmerRdv(f: FormData) {
  const { s, structureId } = await structureDuCompte();
  const rdv = db().rendezVous.find((r) => r.id === str(f, "rdvId"));
  if (!rdv || rdv.structureId !== structureId || rdv.statut !== "prevu") return;
  rdv.confirmeParStructure = true;
  enregistrer(`etablissement:${s.id}`, "confirmation_rdv", rdv.id);
  revalidatePath("/etablissement");
}

// La structure fixe elle-même une autre date : le rendez-vous est donc confirmé à cette date.
export async function replanifierRdv(f: FormData) {
  const { s, structureId } = await structureDuCompte();
  const rdv = db().rendezVous.find((r) => r.id === str(f, "rdvId"));
  const date = dateIso(f, "date");
  if (!rdv || rdv.structureId !== structureId || rdv.statut !== "prevu" || !date || date < today()) return;
  rdv.date = date;
  rdv.confirmeParStructure = true;
  rdv.rappelEnvoyeLe = undefined;
  enregistrer(`etablissement:${s.id}`, "replanification_rdv", rdv.id);
  revalidatePath("/etablissement");
}

// ---------- Gestion du répertoire (coordinatrice) ----------

// F-23 : distinguer référencée, contactée et partenaire ayant formalisé son accord.
export async function majStatutStructure(f: FormData) {
  const s = await exigerRole("coordinatrice");
  const st = db().structures.find((x) => x.id === str(f, "structureId"));
  const statut = parmi(f, "statut", ["referencee", "contactee", "partenaire"] as const);
  if (!st || !statut) return;
  st.statut = statut;
  st.derniereVerification = today();
  enregistrer(`coordinatrice:${s.id}`, `structure_${statut}`, st.id);
  revalidatePath("/coordination/structures");
}

export async function reverifierStructure(f: FormData) {
  const s = await exigerRole("coordinatrice");
  const st = db().structures.find((x) => x.id === str(f, "structureId"));
  if (!st) return;
  st.signalements = 0;
  st.derniereVerification = today();
  enregistrer(`coordinatrice:${s.id}`, "verification_structure", st.id);
  revalidatePath("/coordination/structures");
}

export async function ajouterStructure(f: FormData) {
  const s = await exigerRole("coordinatrice");
  const nom = str(f, "nom").slice(0, 120);
  const zone = parmi<Zone>(f, "zone", ZONES);
  const type = parmi(f, "type", ["Hôpital", "Centre de santé", "Poste de santé", "Maternité", "Association"] as const);
  if (!nom || !zone || !type) redirect("/coordination/structures?erreur=champs");
  const services = str(f, "services").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 10);
  const id = newId("s");
  db().structures.push({
    id,
    nom,
    type,
    zone,
    adresse: str(f, "adresse").slice(0, 160) || "À compléter",
    telephone: str(f, "telephone").slice(0, 30) || "À compléter",
    services: services.length ? services : ["Consultation prénatale"],
    horaires: str(f, "horaires").slice(0, 80) || "À confirmer",
    statut: "referencee",
    derniereVerification: today(),
    signalements: 0,
  });
  enregistrer(`coordinatrice:${s.id}`, "structure_ajoutee", id);
  redirect("/coordination/structures?ajoutee=1");
}

// ---------- Fiche de l'établissement (F-21 : mettre à jour les informations de service) ----------

export async function majFicheEtablissement(f: FormData) {
  const { s, structureId } = await structureDuCompte();
  const st = db().structures.find((x) => x.id === structureId);
  if (!st) return;
  const services = f.getAll("services").map(String).filter(Boolean);
  const autres = str(f, "autres").split(",").map((x) => x.trim()).filter(Boolean);
  st.telephone = str(f, "telephone").slice(0, 30) || st.telephone;
  st.horaires = str(f, "horaires").slice(0, 80) || st.horaires;
  st.adresse = str(f, "adresse").slice(0, 160) || st.adresse;
  st.services = [...new Set([...services, ...autres])].slice(0, 12);
  st.derniereVerification = today();
  enregistrer(`etablissement:${s.id}`, "fiche_mise_a_jour", st.id);
  redirect("/etablissement/fiche?enregistre=1");
}

// ---------- Mon compte ----------

export async function changerMotDePasse(f: FormData) {
  const s = await exigerRole("referente", "coordinatrice", "specialiste", "etablissement");
  const compte = db().comptes.find((c) => c.id === s.compteId);
  const actuel = String(f.get("actuel") ?? "");
  const nouveau = String(f.get("nouveau") ?? "");
  if (!compte || !verifierSecret(actuel, compte.secret)) redirect("/espace/compte?erreur=actuel");
  if (nouveau.length < 8 || !/\d/.test(nouveau) || !/[a-zA-Z]/.test(nouveau)) redirect("/espace/compte?erreur=regles");
  if (nouveau !== String(f.get("confirmation") ?? "")) redirect("/espace/compte?erreur=confirmation");
  if (nouveau === actuel) redirect("/espace/compte?erreur=identique");
  compte.secret = chiffrerSecret(nouveau);
  enregistrer(`${s.role}:${s.id}`, "mot_de_passe_change", compte.id);
  redirect("/espace/compte?ok=1");
}

// ---------- Programmes de santé : prévention et dépistage ----------

// Enregistre qu'une action a été réalisée ou refusée. Aucun résultat d'examen n'est jamais saisi.
export async function enregistrerPrevention(f: FormData) {
  const s = await exigerRole("referente", "coordinatrice", "specialiste");
  const base = db();
  const b = base.beneficiaires.find((x) => x.id === str(f, "beneficiaireId"));
  const actionId = str(f, "actionId");
  const statut = parmi(f, "statut", ["fait", "refuse", "annuler"] as const);
  if (!b || !statut || !ACTIONS.some((a) => a.id === actionId)) return;
  const autorise =
    s.role === "coordinatrice" ||
    (s.role === "referente" && b.referenteId === s.id) ||
    (s.role === "specialiste" && base.personnel.find((p) => p.id === s.id)?.specialite === "sage-femme" && base.orientations.some((o) => o.beneficiaireId === b.id && o.specialisteId === s.id && o.consentementLe));
  if (!autorise) return;
  base.preventions = base.preventions.filter((p) => !(p.beneficiaireId === b.id && p.actionId === actionId));
  if (statut !== "annuler") {
    base.preventions.push({
      id: newId("pv"),
      beneficiaireId: b.id,
      actionId,
      statut,
      date: dateIso(f, "date") ?? today(),
      source: s.role === "specialiste" ? "structure" : parmi(f, "source", ["carnet", "structure", "declaration"] as const) ?? "carnet",
      saisiPar: `${s.role}:${s.id}`,
    });
  }
  enregistrer(`${s.role}:${s.id}`, `prevention_${statut}`, b.id);
  revalidatePath(`/personnel/beneficiaire/${b.id}`);
  revalidatePath("/personnel");
}

// ---------- Nouveau-né ----------

// Enregistre (ou corrige) la naissance : date et prénom facultatif, rien d'autre.
export async function enregistrerNaissance(f: FormData) {
  const { s, b } = await beneficiaireDeLaReferente(str(f, "beneficiaireId"));
  const date = dateIso(f, "date");
  if (!date || date > today() || diffDays(today(), date) > 400) return;
  const prenom = str(f, "prenom").slice(0, 40) || undefined;
  const bebe = db().bebes.find((x) => x.beneficiaireId === b.id);
  if (bebe) Object.assign(bebe, { dateNaissance: date, prenom });
  else db().bebes.push({ id: newId("bb"), beneficiaireId: b.id, prenom, dateNaissance: date, creeLe: today() });
  b.dateAccouchement ??= date;
  enregistrer(`${s.role}:${s.id}`, "naissance_enregistree", b.id);
  revalidatePath(`/personnel/beneficiaire/${b.id}`);
}

// Un vaccin = fait ou refusé, d'après le carnet de santé ; jamais d'autre information.
export async function enregistrerVaccin(f: FormData) {
  const s = await exigerRole("referente", "coordinatrice", "specialiste");
  const base = db();
  const bebe = base.bebes.find((x) => x.id === str(f, "bebeId"));
  const b = base.beneficiaires.find((x) => x.id === bebe?.beneficiaireId);
  const vaccinId = str(f, "vaccinId");
  const statut = parmi(f, "statut", ["fait", "refuse", "annuler"] as const);
  if (!bebe || !b || !statut || !VACCINS.some((v) => v.id === vaccinId)) return;
  const autorise =
    s.role === "coordinatrice" ||
    (s.role === "referente" && b.referenteId === s.id) ||
    (s.role === "specialiste" && base.personnel.find((p) => p.id === s.id)?.specialite === "sage-femme" && base.orientations.some((o) => o.beneficiaireId === b.id && o.specialisteId === s.id && o.consentementLe));
  if (!autorise) return;
  base.vaccinations = base.vaccinations.filter((v) => !(v.bebeId === bebe.id && v.vaccinId === vaccinId));
  if (statut !== "annuler") {
    base.vaccinations.push({ id: newId("vx"), bebeId: bebe.id, vaccinId, statut, date: dateIso(f, "date") ?? today(), source: s.role === "specialiste" ? "structure" : "carnet", saisiPar: `${s.role}:${s.id}` });
  }
  enregistrer(`${s.role}:${s.id}`, `vaccin_${statut}`, b.id);
  revalidatePath(`/personnel/beneficiaire/${b.id}`);
  revalidatePath("/personnel");
}

// ---------- Langue de l'interface ----------

export async function choisirLangue(langue: "fr" | "en") {
  const jar = await cookies();
  jar.set(COOKIE_LANGUE, langue === "en" ? "en" : "fr", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
