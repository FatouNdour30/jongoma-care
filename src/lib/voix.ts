// Brique vocale wolof — PROTOTYPE (phase pilote).
// Le site délègue la voix à un service open source auto-hébergé (dossier services/voix-wolof) :
//   - synthèse vocale wolof : Adia_TTS (CONCREE, Apache-2.0) ;
//   - reconnaissance vocale wolof (et wolof-français mélangés) : Whosper-large-v2 (CAYTU, Apache-2.0).
// Protection des données : aucun nom, téléphone ni élément du dossier n'est envoyé au service.
// La synthèse ne reçoit que le texte wolof VALIDÉ d'une capsule ; la reconnaissance, l'audio de la
// question, qui n'est pas conservé. Sans VOIX_SERVICE_URL et VOIX_SERVICE_TOKEN, la brique est inactive.
import "server-only";
import { CAPSULES, type Capsule } from "./contenus";

const SERVICE = process.env.VOIX_SERVICE_URL?.replace(/\/$/, "");
const JETON = process.env.VOIX_SERVICE_TOKEN;
export const voixActive = Boolean(SERVICE && JETON);

const DELAI_MS = 30_000;

async function appeler(chemin: string, init: RequestInit) {
  const r = await fetch(`${SERVICE}${chemin}`, { ...init, headers: { ...init.headers, Authorization: `Bearer ${JETON}` }, signal: AbortSignal.timeout(DELAI_MS), cache: "no-store" });
  if (!r.ok) throw new Error(`Service vocal : ${r.status}`);
  return r;
}

// Le service vocal limite chaque synthèse à 200 caractères : le texte est découpé côté service.
export async function synthetiser(texteWolof: string): Promise<ArrayBuffer> {
  const r = await appeler("/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texte: texteWolof }) });
  return r.arrayBuffer();
}

export async function transcrire(audio: Blob): Promise<string> {
  const corps = new FormData();
  corps.append("audio", audio, "question.webm");
  const r = await appeler("/asr", { method: "POST", body: corps });
  const { texte } = (await r.json()) as { texte?: string };
  return (texte ?? "").trim();
}

// Limite de débit par personne (mémoire de l'instance) : la route est coûteuse en calcul.
const g = globalThis as unknown as { __voixQuota?: Map<string, number[]> };
export function autoriser(cle: string, max = 6, fenetreMs = 60_000) {
  g.__voixQuota ??= new Map();
  const maintenant = Date.now();
  const recents = (g.__voixQuota.get(cle) ?? []).filter((t) => maintenant - t < fenetreMs);
  if (recents.length >= max) return false;
  recents.push(maintenant);
  g.__voixQuota.set(cle, recents);
  return true;
}

// L'assistant ne répond qu'avec une capsule existante ; sinon il passe la main à la référente.
const normaliser = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ");
const VIDES = new Set(["pourquoi", "comment", "aller", "votre", "avec", "dans", "pour", "apres", "quand", "faire", "demander"]);

export function orienter(question: string): Capsule | null {
  const mots = new Set(normaliser(question).split(/\s+/).filter((m) => m.length > 3));
  let meilleure: { c: Capsule; score: number } | null = null;
  for (const c of CAPSULES) {
    const cles = [...(c.motsCles ?? []), ...normaliser(c.titre).split(/\s+/).filter((m) => m.length > 4 && !VIDES.has(m))].map(normaliser);
    const score = cles.filter((k) => mots.has(k.trim())).length;
    if (score > 0 && (!meilleure || score > meilleure.score)) meilleure = { c, score };
  }
  return meilleure?.c ?? null;
}
