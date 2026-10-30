// Stockage du prototype : base en mémoire, persistée dans .data/db.json quand le
// disque est accessible en écriture. En ligne (Vercel), le disque est en lecture seule :
// la base est alors persistée dans Redis (Upstash, API REST) si KV_REST_API_URL et
// KV_REST_API_TOKEN sont définis. À remplacer par PostgreSQL (voir README).
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { after } from "next/server";
import { creerComptesDemo } from "./comptes-demo";
import { creerBaseDemo, enfantsDemo, preventionsDemo } from "./seed";
import type { Base } from "./types";

const FICHIER = path.join(process.cwd(), ".data", "db.json");

const g = globalThis as unknown as { __jongoma?: Base; __jongomaVersion?: number; __jongomaEcriture?: Promise<void>; __jongomaSync?: Promise<void> };

// Migration : les bases créées avant l'authentification n'ont ni comptes ni préventions.
function migrer(base: Base): { base: Base; modifiee: boolean } {
  let modifiee = false;
  if (!base.comptes) {
    base.comptes = creerComptesDemo(base);
    modifiee = true;
  }
  if (!base.preventions) {
    base.preventions = preventionsDemo(base);
    modifiee = true;
  }
  if (!base.bebes || !base.vaccinations) {
    Object.assign(base, enfantsDemo(base));
    modifiee = true;
  }
  return { base, modifiee };
}

function charger(): Base {
  try {
    const { base, modifiee } = migrer(JSON.parse(fs.readFileSync(FICHIER, "utf8")) as Base);
    if (modifiee) sauver(base);
    return base;
  } catch {
    const base = creerBaseDemo();
    sauver(base);
    return base;
  }
}

function sauver(base: Base) {
  try {
    fs.mkdirSync(path.dirname(FICHIER), { recursive: true });
    fs.writeFileSync(FICHIER, JSON.stringify(base, null, 2));
  } catch {
    // Système de fichiers en lecture seule (ex. hébergement serverless) : mémoire seule, ou Redis.
  }
}

// ---------- Persistance distante (Redis via l'API REST d'Upstash, sans dépendance) ----------

const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
export const persistanceDistante = Boolean(REDIS_URL && REDIS_TOKEN);

const CLE_BASE = "jongoma:base";
const CLE_VERSION = "jongoma:version";

// Écriture conditionnelle : n'écrase la base que si personne ne l'a modifiée depuis notre lecture.
const SCRIPT_ECRITURE = `
local v = redis.call('GET', KEYS[2]) or '0'
if ARGV[3] == '1' or v == ARGV[2] then
  redis.call('SET', KEYS[1], ARGV[1])
  return redis.call('INCR', KEYS[2])
end
return -1`;

async function redis<T>(commande: (string | number)[]): Promise<T> {
  const r = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commande),
    cache: "no-store",
  });
  const json = (await r.json()) as { result?: T; error?: string };
  if (!r.ok || json.error) throw new Error(`Redis : ${json.error ?? r.status}`);
  return json.result as T;
}

async function lireDistante() {
  const brut = await redis<string | null>(["GET", CLE_BASE]);
  const version = Number((await redis<string | null>(["GET", CLE_VERSION])) ?? 0);
  if (!brut) {
    // Première mise en ligne : la base de démonstration devient la base distante.
    g.__jongoma = creerBaseDemo();
    g.__jongomaVersion = version;
    await publier(true);
    return;
  }
  g.__jongoma = migrer(JSON.parse(brut) as Base).base;
  g.__jongomaVersion = version;
}

async function publier(forcer = false) {
  if (!persistanceDistante || !g.__jongoma) return;
  const nouvelle = await redis<number>(["EVAL", SCRIPT_ECRITURE, 2, CLE_BASE, CLE_VERSION, JSON.stringify(g.__jongoma), String(g.__jongomaVersion ?? 0), forcer ? "1" : "0"]);
  if (nouvelle === -1) {
    // Une autre instance a écrit entre-temps : on recharge sa version (la modification locale est perdue).
    console.warn("[jongoma] conflit d'écriture Redis : base rechargée");
    await lireDistante();
    return;
  }
  g.__jongomaVersion = nouvelle;
}

function publierEnArrierePlan(forcer = false) {
  if (!persistanceDistante) return;
  const precedente = g.__jongomaEcriture ?? Promise.resolve();
  const ecriture = precedente.then(() => publier(forcer)).catch((e) => console.error("[jongoma] écriture Redis échouée", e));
  g.__jongomaEcriture = ecriture;
  try {
    after(() => ecriture); // la plateforme attend la fin de l'écriture avant de geler l'instance
  } catch {
    // Hors d'une requête : l'écriture continue simplement en arrière-plan.
  }
}

// À appeler au début de chaque requête : recharge la base si une autre instance l'a modifiée.
export async function synchroniser() {
  if (!persistanceDistante) return;
  // Une seule vérification à la fois par instance ; les appels simultanés partagent la même.
  g.__jongomaSync ??= (async () => {
    try {
      await g.__jongomaEcriture;
      const version = Number((await redis<string | null>(["GET", CLE_VERSION])) ?? 0);
      if (!g.__jongoma || version !== g.__jongomaVersion) await lireDistante();
    } catch (e) {
      console.error("[jongoma] lecture Redis échouée, base en mémoire conservée", e);
    } finally {
      g.__jongomaSync = undefined;
    }
  })();
  await g.__jongomaSync;
}

export function db(): Base {
  // Avec Redis, la base est chargée par synchroniser() ; sinon, depuis le fichier local.
  g.__jongoma ??= persistanceDistante ? creerBaseDemo() : charger();
  return g.__jongoma;
}

export function enregistrer(acteur: string, action: string, cible?: string) {
  const base = db();
  base.journal.unshift({ id: `j${Date.now()}${Math.random().toString(36).slice(2, 6)}`, date: new Date().toISOString(), acteur, action, cible });
  base.journal = base.journal.slice(0, 500);
  sauver(base);
  publierEnArrierePlan();
}

export function reinitialiser() {
  g.__jongoma = creerBaseDemo();
  sauver(g.__jongoma);
  publierEnArrierePlan(true);
}

export const newId = (prefixe: string) => `${prefixe}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
