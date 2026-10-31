// Jeu de données FICTIF pour la démonstration. Aucune personne ni structure réelle.
import { addDays, CALENDRIER_CPN, CALENDRIER_CPON, today } from "./protocol";
import { etatPreventions } from "./programmes";
import { etatVaccins } from "./enfants";
import type { Base, Bebe, Beneficiaire, Prevention, RendezVous, Structure, Vaccination, Zone } from "./types";
import { ZONES } from "./types";
import { creerComptesDemo } from "./comptes-demo";

// Générateur pseudo-aléatoire déterministe pour un jeu de démo reproductible.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const PRENOMS = [
  "Aïssatou", "Binta", "Coumba", "Dieynaba", "Fanta", "Haby", "Khadija", "Mame",
  "Ndèye", "Oumou", "Penda", "Ramatoulaye", "Seynabou", "Sokhna", "Yacine", "Astou",
  "Maimouna", "Adama", "Marième", "Arame", "Bineta", "Fatim", "Nafi", "Rokhaya",
];

export function creerBaseDemo(): Base {
  const r = rng(42);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const t = today();

  const structures: Structure[] = ZONES.flatMap((zone, i) => [
    {
      id: `s${i * 2 + 1}`,
      nom: `Centre de santé Démo ${zone}`,
      type: "Centre de santé" as const,
      zone,
      adresse: `Quartier fictif ${i + 1}, ${zone}`,
      telephone: `33 800 00 0${i}`,
      services: ["Consultation prénatale", "Consultation postnatale", "Planification familiale"],
      horaires: "Lun–Ven 8h–17h (à confirmer)",
      statut: i % 2 === 0 ? ("partenaire" as const) : ("referencee" as const),
      derniereVerification: addDays(t, -Math.floor(r() * 60)),
      signalements: 0,
    },
    {
      id: `s${i * 2 + 2}`,
      nom: `Poste de santé Démo ${zone} Nord`,
      type: "Poste de santé" as const,
      zone,
      adresse: `Rue fictive ${i + 10}, ${zone}`,
      telephone: `33 800 01 0${i}`,
      services: ["Consultation prénatale", "Information santé reproductive"],
      horaires: "Lun–Sam 8h–14h (à confirmer)",
      statut: i === 1 ? ("contactee" as const) : ("referencee" as const),
      derniereVerification: addDays(t, -Math.floor(r() * 120)),
      signalements: 0,
    },
  ]);
  structures.push({
    id: "s11",
    nom: "Association Démo d'écoute et d'orientation",
    type: "Association",
    zone: "Pikine",
    adresse: "Adresse communiquée lors du contact",
    telephone: "33 800 02 00",
    services: ["Soutien psychosocial", "Orientation protection"],
    horaires: "Lun–Ven 9h–16h (à confirmer)",
    statut: "referencee",
    derniereVerification: addDays(t, -20),
    signalements: 0,
  });

  const personnel: Base["personnel"] = [
    { id: "p1", prenom: "Awa", role: "referente", zones: ["Pikine", "Guédiawaye"], langues: ["wo", "fr"], capaciteMax: 25 },
    { id: "p2", prenom: "Fatou", role: "referente", zones: ["Rufisque", "Pikine"], langues: ["wo"], capaciteMax: 25 },
    { id: "p3", prenom: "Mariama", role: "referente", zones: ["Thiès", "Mbour"], langues: ["wo", "fr"], capaciteMax: 25 },
    { id: "p4", prenom: "Aminata", role: "coordinatrice", zones: ZONES, langues: ["wo", "fr"], capaciteMax: 0 },
    { id: "p5", prenom: "Khady", role: "specialiste", specialite: "sage-femme", zones: ZONES, langues: ["wo", "fr"], capaciteMax: 60 },
    { id: "p6", prenom: "Ndèye", role: "specialiste", specialite: "social", zones: ZONES, langues: ["wo", "fr"], capaciteMax: 40 },
    { id: "p7", prenom: "Coumba", role: "specialiste", specialite: "psychosocial", zones: ZONES, langues: ["wo", "fr"], capaciteMax: 30 },
    { id: "p8", prenom: "Rokhaya", role: "specialiste", specialite: "protection", zones: ZONES, langues: ["wo", "fr"], capaciteMax: 30 },
  ];

  const referentesParZone = (z: Zone) => personnel.filter((p) => p.role === "referente" && p.zones.includes(z));

  const identites: Base["identites"] = [];
  const beneficiaires: Beneficiaire[] = [];
  const rendezVous: RendezVous[] = [];

  for (let i = 1; i <= 48; i++) {
    const zone = pick(ZONES);
    const id = `b${i}`;
    identites.push({ id: `i${i}`, prenom: pick(PRENOMS), telephone: `77 000 ${String(1000 + i).slice(-4)}` });

    const postnatal = r() < 0.25;
    const sa = postnatal ? 40 : 6 + Math.floor(r() * 33); // semaines d'aménorrhée
    const accouchementIlYa = postnatal ? Math.floor(r() * 35) : 0;
    const ddr = addDays(t, -(sa * 7 + accouchementIlYa));
    const iaOk = r() > 0.08;
    const refs = referentesParZone(zone);
    const sansReferente = i % 13 === 0;
    const structure = structures.find((s) => s.zone === zone)!;

    const b: Beneficiaire = {
      id,
      identiteId: `i${i}`,
      zone,
      langue: r() < 0.7 ? "wo" : "fr",
      canal: pick(["sms", "appel", "audio"] as const),
      horaireContact: pick(["matin", "après-midi", "soir"]),
      messageDiscret: r() < 0.5,
      jeuneFille: i % 5 === 2 || undefined, // environ une sur cinq : jeunes filles de moins de 20 ans
      consentements: { service: true, rappels: true, accompagnement: !sansReferente || r() < 0.5, ia: iaOk, dateRecueil: addDays(t, -sa * 5) },
      ddr,
      dateAccouchement: postnatal ? addDays(t, -accouchementIlYa) : undefined,
      distanceKm: Math.round(r() * 18 * 10) / 10,
      referenteId: sansReferente ? undefined : pick(refs).id,
      etape: postnatal ? "postnatal" : sa >= 36 ? "preparation" : "grossesse",
      dernierContact: addDays(t, -Math.floor(r() * 30)),
      rappelsSansReponse: Math.floor(r() * r() * 4),
      creeLe: addDays(t, -sa * 5),
    };
    beneficiaires.push(b);

    // Données simulées : le risque de manquer un rendez-vous augmente avec la distance et les absences
    // précédentes (facteurs décrits dans la littérature), pour que le modèle d'apprentissage ait un signal
    // à retrouver. Un seul tirage par rendez-vous, comme avant.
    let manquesAnterieurs = 0;
    const statutPasse = (base: number) => {
      const p = Math.min(0.85, Math.max(0.03, base * (0.45 + (b.distanceKm ?? 0) / 10) + 0.18 * Math.min(manquesAnterieurs, 2)));
      const manque = r() < p;
      if (manque) manquesAnterieurs++;
      return manque ? ("manque" as const) : ("honore" as const);
    };

    // Consultations prénatales : passées (honorées ou manquées) et prochaine prévue.
    let prochaine = false;
    for (const semaine of CALENDRIER_CPN) {
      const date = addDays(ddr, semaine * 7);
      if (date < b.creeLe) continue;
      const passe = date < t;
      if (!passe && (prochaine || postnatal)) break;
      if (!passe) prochaine = true;
      rendezVous.push({
        id: `r${rendezVous.length + 1}`,
        beneficiaireId: id,
        structureId: structure.id,
        type: "CPN",
        libelle: `Consultation prénatale (${semaine} SA)`,
        date,
        statut: passe ? statutPasse(0.16) : "prevu",
        confirmeParStructure: passe || r() < 0.6,
      });
    }
    if (postnatal && b.dateAccouchement) {
      for (const c of CALENDRIER_CPON) {
        const date = addDays(b.dateAccouchement, c.jours);
        const passe = date < t;
        rendezVous.push({
          id: `r${rendezVous.length + 1}`,
          beneficiaireId: id,
          structureId: structure.id,
          type: "CPoN",
          libelle: c.libelle,
          date,
          statut: passe ? statutPasse(0.22) : "prevu",
          confirmeParStructure: passe || r() < 0.5,
        });
        if (!passe) break;
      }
    }
  }

  // Le rendez-vous passé le plus récent de quelques bénéficiaires reste à vérifier.
  for (const rdv of rendezVous) {
    if (rdv.date < t && rdv.date >= addDays(t, -7) && r() < 0.6) rdv.statut = "prevu";
  }

  const base: Base = {
    comptes: [],
    preventions: [],
    bebes: [],
    vaccinations: [],
    identites,
    beneficiaires,
    rendezVous,
    structures,
    demandes: [
      { id: "d1", beneficiaireId: "b1", structureId: structures.find((s) => s.zone === beneficiaires[0].zone)!.id, besoin: "Consultation prénatale", statut: "envoyee", creeLe: addDays(t, -2), majLe: addDays(t, -2) },
      { id: "d2", beneficiaireId: "b2", structureId: "s1", besoin: "Consultation postnatale", statut: "acceptee", dateProposee: addDays(t, 4), creeLe: addDays(t, -6), majLe: addDays(t, -4) },
    ],
    orientations: [
      { id: "o1", beneficiaireId: "b3", type: "social", specialisteId: "p6", motif: "Difficultés de transport vers la structure", consentementLe: addDays(t, -5), statut: "transmise", creeLe: addDays(t, -5), majLe: addDays(t, -5) },
      { id: "o2", beneficiaireId: "b5", type: "psychosocial", specialisteId: "p7", motif: "Demande de soutien", consentementLe: addDays(t, -3), statut: "prise_en_charge", creeLe: addDays(t, -3), majLe: addDays(t, -1) },
      { id: "o3", beneficiaireId: "b4", type: "sage-femme", specialisteId: "p5", motif: "Question sur le calendrier des consultations", consentementLe: addDays(t, -2), statut: "transmise", creeLe: addDays(t, -2), majLe: addDays(t, -2) },
      { id: "o4", beneficiaireId: "b6", type: "protection", specialisteId: "p8", motif: "Demande d'orientation", consentementLe: addDays(t, -1), statut: "transmise", creeLe: addDays(t, -1), majLe: addDays(t, -1) },
    ],
    personnel,
    comptesEtablissement: structures.filter((s) => s.statut === "partenaire").map((s, i) => ({ id: `e${i + 1}`, prenom: "Accueil", structureId: s.id })),
    journal: [],
  };
  base.comptes = creerComptesDemo(base);
  base.preventions = preventionsDemo(base);
  Object.assign(base, enfantsDemo(base));
  return base;
}

// Nouveau-nés d'exemple : un bébé par mère en postnatal ; les vaccins échus sont en majorité faits.
export function enfantsDemo(base: Base): Pick<Base, "bebes" | "vaccinations"> {
  const r = rng(11);
  const t = today();
  const bebes: Bebe[] = [];
  const vaccinations: Vaccination[] = [];
  for (const b of base.beneficiaires) {
    if (b.etape !== "postnatal" || !b.dateAccouchement) continue;
    const bebe: Bebe = { id: `bb${bebes.length + 1}`, beneficiaireId: b.id, dateNaissance: b.dateAccouchement, creeLe: b.dateAccouchement };
    bebes.push(bebe);
    for (const e of etatVaccins(bebe, { ...base, bebes, vaccinations: [] }, t)) {
      if (e.statut === "plus_tard" || e.statut === "a_faire") continue;
      if (r() < 0.82) vaccinations.push({ id: `vx${vaccinations.length + 1}`, bebeId: bebe.id, vaccinId: e.vaccin.id, statut: "fait", date: addDays(e.du, Math.floor(r() * 6)), source: "carnet", saisiPar: "demo" });
    }
  }
  return { bebes, vaccinations };
}

// Préventions d'exemple : une partie des actions échues est réalisée, quelques-unes refusées.
export function preventionsDemo(base: Base): Prevention[] {
  const r = rng(7);
  const t = today();
  const liste: Prevention[] = [];
  for (const b of base.beneficiaires) {
    for (const e of etatPreventions(b, { ...base, preventions: [] }, t)) {
      if (e.statut === "plus_tard") continue;
      const x = r();
      const id = `pv${liste.length + 1}`;
      if (x < 0.72) liste.push({ id, beneficiaireId: b.id, actionId: e.action.id, statut: "fait", date: addDays(t, -Math.floor(r() * 40)), source: r() < 0.5 ? "carnet" : "structure", saisiPar: "demo" });
      else if (x < 0.77) liste.push({ id, beneficiaireId: b.id, actionId: e.action.id, statut: "refuse", date: addDays(t, -Math.floor(r() * 40)), source: "declaration", saisiPar: "demo" });
    }
  }
  return liste;
}
