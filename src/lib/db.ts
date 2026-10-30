// Stockage du prototype : base en mémoire, persistée dans .data/db.json quand le
// disque est accessible en écriture. En ligne (Vercel), le disque est en lecture seule :
// la base est alors persistée dans un magasin distant (Vercel Blob privé, ou Redis) : voir plus bas.
// À remplacer par PostgreSQL pour le pilote (voir README).
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { after } from "next/server";
import { creerComptesDemo } from "./comptes-demo";
import { creerBaseDemo, enfantsDemo, preventionsDemo } from "./seed";
import type { Base } from "./types";

const FICHIER = path.join(process.cwd(), ".data", "db.json");

const g = globalThis as unknown as { __jongoma?: Base; __jongomaVersion?: string | null; __jongomaEcriture?: Promise<void>; __jongomaSync?: Promise<void> };

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

// ---------- Persistance distante ----------
// Deux magasins possibles, choisis par les variables d'environnement :
//   - Vercel Blob privé (BLOB_READ_WRITE_TOKEN), branché en production ;
//   - Redis via l'API REST d'Upstash (KV_REST_API_URL + KV_REST_API_TOKEN).
// Chacun expose une « version » (ETag pour Blob, compteur pour Redis) qui permet de recharger la base
// quand une autre instance l'a modifiée, et d'écrire seulement si personne n'a écrit entre-temps.

interface Magasin {
  nom: string;
  version(): Promise<string | null>;
  lire(): Promise<{ brut: string; version: string } | null>;
  // Renvoie la nouvelle version, ou null si une autre instance a écrit depuis `attendue`.
  ecrire(brut: string, attendue: string | null, forcer: boolean): Promise<string | null>;
}

// Un fichier par environnement : un test sur une preview n'écrase jamais la production.
const CHEMIN_BLOB = `jongoma/${process.env.VERCEL_ENV ?? "local"}/base.json`;

function magasinBlob(): Magasin {
  return {
    nom: "Blob",
    async version() {
      const { head, BlobNotFoundError } = await import("@vercel/blob");
      try {
        return (await head(CHEMIN_BLOB)).etag;
      } catch (e) {
        if (e instanceof BlobNotFoundError) return null;
        throw e;
      }
    },
    // La version retenue est l'ETag de l'API (head/put) : celui de l'en-tête HTTP renvoyé par get()
    // n'a pas le même format (guillemets) et ferait échouer toutes les écritures conditionnelles.
    async lire() {
      const { get, head, BlobNotFoundError } = await import("@vercel/blob");
      const norme = (e: string) => e.replace(/^W\//, "").replace(/^"|"$/g, "");
      for (let essai = 0; essai < 3; essai++) {
        let version: string;
        try {
          version = (await head(CHEMIN_BLOB)).etag;
        } catch (e) {
          if (e instanceof BlobNotFoundError) return null;
          throw e;
        }
        const r = await get(CHEMIN_BLOB, { access: "private", useCache: false });
        if (!r || r.statusCode !== 200 || !r.stream) return null;
        const brut = await new Response(r.stream).text();
        // Contenu et version lus au même instant : sinon une écriture est passée entre les deux, on relit.
        if (norme(r.blob.etag) === norme(version)) return { brut, version };
      }
      throw new Error("Blob : base modifiée pendant la lecture, réessayez");
    },
    async ecrire(brut, attendue, forcer) {
      const { put, BlobPreconditionFailedError } = await import("@vercel/blob");
      try {
        const r = await put(CHEMIN_BLOB, brut, {
          access: "private",
          addRandomSuffix: false,
          contentType: "application/json",
          ...(forcer || !attendue ? { allowOverwrite: true } : { ifMatch: attendue }),
        });
        return r.etag;
      } catch (e) {
        if (e instanceof BlobPreconditionFailedError) return null;
        throw e;
      }
    },
  };
}

const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
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

function magasinRedis(): Magasin {
  return {
    nom: "Redis",
    async version() {
      return (await redis<string | null>(["GET", CLE_VERSION])) ?? null;
    },
    async lire() {
      const brut = await redis<string | null>(["GET", CLE_BASE]);
      return brut ? { brut, version: (await redis<string | null>(["GET", CLE_VERSION])) ?? "0" } : null;
    },
    async ecrire(brut, attendue, forcer) {
      const n = await redis<number>(["EVAL", SCRIPT_ECRITURE, 2, CLE_BASE, CLE_VERSION, brut, attendue ?? "0", forcer ? "1" : "0"]);
      return n === -1 ? null : String(n);
    },
  };
}

const magasin: Magasin | null = process.env.BLOB_READ_WRITE_TOKEN ? magasinBlob() : REDIS_URL && REDIS_TOKEN ? magasinRedis() : null;
export const persistanceDistante = magasin !== null;

async function lireDistante() {
  const lu = await magasin!.lire();
  if (!lu) {
    // Première mise en ligne : la base de démonstration devient la base distante.
    g.__jongoma = creerBaseDemo();
    g.__jongomaVersion = null;
    await publier(true);
    return;
  }
  g.__jongoma = migrer(JSON.parse(lu.brut) as Base).base;
  g.__jongomaVersion = lu.version;
}

async function publier(forcer = false) {
  if (!magasin || !g.__jongoma) return;
  const nouvelle = await magasin.ecrire(JSON.stringify(g.__jongoma), g.__jongomaVersion ?? null, forcer);
  if (nouvelle === null) {
    // Une autre instance a écrit entre-temps : on recharge sa version (la modification locale est perdue).
    console.warn(`[jongoma] conflit d'écriture (${magasin.nom}) : base rechargée`);
    await lireDistante();
    return;
  }
  g.__jongomaVersion = nouvelle;
}

function publierEnArrierePlan(forcer = false) {
  if (!persistanceDistante) return;
  const precedente = g.__jongomaEcriture ?? Promise.resolve();
  const ecriture = precedente.then(() => publier(forcer)).catch((e) => console.error("[jongoma] écriture distante échouée", e));
  g.__jongomaEcriture = ecriture;
  try {
    after(() => ecriture); // la plateforme attend la fin de l'écriture avant de geler l'instance
  } catch {
    // Hors d'une requête : l'écriture continue simplement en arrière-plan.
  }
}

// Attend que les écritures en cours soient enregistrées dans le magasin distant. À appeler avant de
// rediriger quand la page suivante doit absolument voir le changement (compte créé, connexion…),
// car elle peut être servie par une autre instance.
export async function ecritureTerminee() {
  await g.__jongomaEcriture;
}

// À appeler au début de chaque requête : recharge la base si une autre instance l'a modifiée.
export async function synchroniser() {
  if (!persistanceDistante) return;
  // Une seule vérification à la fois par instance ; les appels simultanés partagent la même.
  g.__jongomaSync ??= (async () => {
    try {
      await g.__jongomaEcriture;
      const version = await magasin!.version();
      if (!g.__jongoma || version === null || version !== g.__jongomaVersion) await lireDistante();
    } catch (e) {
      console.error("[jongoma] lecture distante échouée, base en mémoire conservée", e);
    } finally {
      g.__jongomaSync = undefined;
    }
  })();
  await g.__jongomaSync;
}

export function db(): Base {
  // Avec un magasin distant, la base est chargée par synchroniser() ; sinon, depuis le fichier local.
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
