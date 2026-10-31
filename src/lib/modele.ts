// Modèle d'apprentissage automatique v0.2 : probabilité de manquer le prochain rendez-vous.
// Régression logistique entraînée sur l'historique des rendez-vous, explicable variable par variable.
// Mode OBSERVATION : il tourne à côté du score « règles » sans rien décider ; ses avis servent à
// comparer les deux approches avant toute mise en service, après validation humaine.
// Exclus des variables : zone, langue, âge, santé mentale, protection, contenu clinique. La zone, la
// langue et le statut « jeune fille » servent uniquement au contrôle d'équité. Les bénéficiaires opposées à l'IA sont exclues
// de l'entraînement comme des prédictions.
import { calculerPriorite } from "./priority";
import { today } from "./protocol";
import type { Base, Beneficiaire, RendezVous } from "./types";

export const VARIABLES = [
  { id: "distance", libelle: "Distance de la structure (par 10 km)" },
  { id: "manques", libelle: "Rendez-vous manqués auparavant (max. 3)" },
  { id: "dejaVenue", libelle: "A déjà honoré un rendez-vous" },
  { id: "postnatal", libelle: "Consultation postnatale" },
  { id: "appel", libelle: "Préfère être appelée" },
  { id: "rappels", libelle: "2 rappels ou plus sans réponse" },
] as const;

export const SEUIL_ELEVE = 0.4; // probabilité à partir de laquelle le modèle signale un risque élevé
const PART_TEST = 0.3; // les 30 % de rendez-vous les plus récents servent à l'évaluation
const MIN_EXEMPLES = 60;

type Vecteur = number[];

// Variables connues AVANT le rendez-vous : seul l'historique antérieur à sa date est utilisé.
function variables(b: Beneficiaire, r: Pick<RendezVous, "type" | "date">, historique: RendezVous[]): Vecteur {
  const avant = historique.filter((h) => h.date < r.date);
  return [
    (b.distanceKm ?? 0) / 10,
    Math.min(avant.filter((h) => h.statut === "manque").length, 3),
    avant.some((h) => h.statut === "honore") ? 1 : 0,
    r.type === "CPoN" ? 1 : 0,
    b.canal === "appel" ? 1 : 0,
    b.rappelsSansReponse >= 2 ? 1 : 0,
  ];
}

const sigmoide = (z: number) => 1 / (1 + Math.exp(-z));

// Aire sous la courbe ROC (probabilité qu'une absente soit mieux classée qu'une présente).
export function auc(scores: number[], y: number[]): number | null {
  const pos = scores.filter((_, i) => y[i] === 1);
  const neg = scores.filter((_, i) => y[i] === 0);
  if (pos.length < 3 || neg.length < 3) return null;
  let s = 0;
  for (const p of pos) for (const n of neg) s += p > n ? 1 : p === n ? 0.5 : 0;
  return s / (pos.length * neg.length);
}

interface Exemple { b: Beneficiaire; r: RendezVous; x: Vecteur; y: number }

export interface Modele {
  poids: number[]; // sur variables standardisées
  biais: number;
  moyenne: number[];
  ecart: number[];
}

function entrainer(xs: Vecteur[], ys: number[]): Modele {
  const d = xs[0].length;
  const moyenne = Array.from({ length: d }, (_, j) => xs.reduce((s, x) => s + x[j], 0) / xs.length);
  const ecart = moyenne.map((m, j) => Math.sqrt(xs.reduce((s, x) => s + (x[j] - m) ** 2, 0) / xs.length) || 1);
  const zs = xs.map((x) => x.map((v, j) => (v - moyenne[j]) / ecart[j]));
  const poids = new Array(d).fill(0);
  let biais = 0;
  // Descente de gradient avec régularisation L2 (évite les poids extrêmes sur de petits effectifs).
  for (let it = 0; it < 600; it++) {
    const g = new Array(d).fill(0);
    let gb = 0;
    zs.forEach((z, i) => {
      const e = sigmoide(biais + z.reduce((s, v, j) => s + v * poids[j], 0)) - ys[i];
      z.forEach((v, j) => (g[j] += e * v));
      gb += e;
    });
    for (let j = 0; j < d; j++) poids[j] -= 0.5 * (g[j] / zs.length + 0.01 * poids[j]);
    biais -= 0.5 * (gb / zs.length);
  }
  return { poids, biais, moyenne, ecart };
}

export function predire(m: Modele, x: Vecteur) {
  const contributions = x.map((v, j) => m.poids[j] * ((v - m.moyenne[j]) / m.ecart[j]));
  return { p: sigmoide(m.biais + contributions.reduce((s, c) => s + c, 0)), contributions };
}

// Explication lisible : les variables qui poussent le plus la probabilité vers le haut ou le bas.
export function expliquer(contributions: number[], n = 2) {
  return contributions
    .map((c, j) => ({ libelle: VARIABLES[j].libelle, c }))
    .filter((e) => Math.abs(e.c) > 0.05)
    .sort((a, b) => Math.abs(b.c) - Math.abs(a.c))
    .slice(0, n);
}

// Score « règles » réduit aux mêmes variables, pour comparer les deux approches à armes égales.
const scoreRegles = (x: Vecteur) => 30 * Math.min(x[1], 2) + (x[0] > 1 ? 15 : 0) + (x[5] ? 20 : 0);

export interface Evaluation {
  modele: Modele;
  nEntrainement: number;
  nTest: number;
  tauxManque: number;
  aucModele: number | null;
  aucRegles: number | null;
  brier: number;
  groupes: { type: string; nom: string; n: number; observe: number; predit: number; auc: number | null }[];
  observation: { b: Beneficiaire; p: number; niveauRegles: string; explication: ReturnType<typeof expliquer> }[];
}

export function evaluer(base: Base): Evaluation | null {
  const consentantes = new Map(base.beneficiaires.filter((b) => b.consentements.ia).map((b) => [b.id, b]));
  const parFemme = new Map<string, RendezVous[]>();
  for (const r of base.rendezVous) if (consentantes.has(r.beneficiaireId)) parFemme.set(r.beneficiaireId, [...(parFemme.get(r.beneficiaireId) ?? []), r]);

  const exemples: Exemple[] = [];
  for (const [id, rdvs] of parFemme) {
    const b = consentantes.get(id)!;
    for (const r of rdvs) if (r.statut === "honore" || r.statut === "manque") exemples.push({ b, r, x: variables(b, r, rdvs), y: r.statut === "manque" ? 1 : 0 });
  }
  if (exemples.length < MIN_EXEMPLES) return null;

  // Découpage temporel : on apprend sur le passé et on évalue sur les rendez-vous les plus récents.
  exemples.sort((a, b) => a.r.date.localeCompare(b.r.date));
  const coupe = Math.floor(exemples.length * (1 - PART_TEST));
  const entr = exemples.slice(0, coupe);
  const test = exemples.slice(coupe);
  const modele = entrainer(entr.map((e) => e.x), entr.map((e) => e.y));

  const p = test.map((e) => predire(modele, e.x).p);
  const y = test.map((e) => e.y);
  const moy = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0);
  const groupe = (type: string, nom: string, garder: (b: Beneficiaire) => boolean) => {
    const idx = test.map((e, i) => (garder(e.b) ? i : -1)).filter((i) => i >= 0);
    return { type, nom, n: idx.length, observe: moy(idx.map((i) => y[i])), predit: moy(idx.map((i) => p[i])), auc: auc(idx.map((i) => p[i]), idx.map((i) => y[i])) };
  };
  const zones = [...new Set(base.beneficiaires.map((b) => b.zone))];

  // Observation : avis du modèle sur le prochain rendez-vous prévu de chaque bénéficiaire active.
  const t = today();
  const observation = [...consentantes.values()]
    .filter((b) => b.etape !== "cloture")
    .flatMap((b) => {
      const rdvs = parFemme.get(b.id) ?? [];
      const prochain = rdvs.filter((r) => r.statut === "prevu" && r.date >= t).sort((a, c) => a.date.localeCompare(c.date))[0];
      if (!prochain) return [];
      const { p, contributions } = predire(modele, variables(b, prochain, rdvs));
      return [{ b, p, niveauRegles: calculerPriorite(b, base).niveau, explication: expliquer(contributions) }];
    })
    .sort((a, b) => b.p - a.p);

  return {
    modele,
    nEntrainement: entr.length,
    nTest: test.length,
    tauxManque: moy(exemples.map((e) => e.y)),
    aucModele: auc(p, y),
    aucRegles: auc(test.map((e) => scoreRegles(e.x)), y),
    brier: moy(p.map((v, i) => (v - y[i]) ** 2)),
    groupes: [
      ...zones.map((z) => groupe("Zone", z, (b) => b.zone === z)),
      groupe("Langue", "Wolof", (b) => b.langue === "wo"),
      groupe("Langue", "Français", (b) => b.langue === "fr"),
      groupe("Langue", "Autres langues", (b) => b.langue !== "wo" && b.langue !== "fr"),
      groupe("Âge", "Jeunes filles (< 20 ans)", (b) => !!b.jeuneFille),
    ],
    observation,
  };
}
