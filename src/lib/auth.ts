// Chiffrement des secrets et jetons de session signés.
import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SECRET_DEV = "jongoma-care-secret-de-developpement-a-remplacer";
const CLE = process.env.SESSION_SECRET ?? SECRET_DEV;
// En ligne, le secret de développement (public dans le dépôt) permettrait de forger une session.
if (!process.env.SESSION_SECRET && process.env.VERCEL_ENV) {
  throw new Error("[jongoma] SESSION_SECRET doit être défini sur Vercel.");
}
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
  console.warn("[jongoma] SESSION_SECRET non défini : secret de développement utilisé.");
}

// scrypt (N=16384, r=8, p=1) avec un sel aléatoire de 16 octets.
export function chiffrerSecret(clair: string) {
  const sel = randomBytes(16).toString("hex");
  return `${sel}:${scryptSync(clair, sel, 32).toString("hex")}`;
}

export function verifierSecret(clair: string, stocke: string) {
  const [sel, empreinte] = stocke.split(":");
  if (!sel || !empreinte) return false;
  const attendu = Buffer.from(empreinte, "hex");
  const calcule = scryptSync(clair, sel, attendu.length);
  return timingSafeEqual(attendu, calcule);
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const signer = (charge: string) => createHmac("sha256", CLE).update(charge).digest("base64url");

export function creerJeton(donnees: object) {
  const charge = b64(JSON.stringify(donnees));
  return `${charge}.${signer(charge)}`;
}

export function lireJeton<T>(jeton: string): T | null {
  const [charge, signature] = jeton.split(".");
  if (!charge || !signature) return null;
  const attendue = Buffer.from(signer(charge));
  const recue = Buffer.from(signature);
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return null;
  try {
    return JSON.parse(Buffer.from(charge, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

// Limitation des tentatives : 5 échecs en 15 minutes bloquent l'identifiant (mémoire du serveur).
const ESSAIS_MAX = 5;
const BLOCAGE_MS = 15 * 60 * 1000;
const echecs = new Map<string, { n: number; depuis: number }>();

export function estBloque(identifiant: string) {
  const e = echecs.get(identifiant);
  if (!e) return false;
  if (Date.now() - e.depuis > BLOCAGE_MS) {
    echecs.delete(identifiant);
    return false;
  }
  return e.n >= ESSAIS_MAX;
}

export function noterEchec(identifiant: string) {
  const e = echecs.get(identifiant);
  if (!e || Date.now() - e.depuis > BLOCAGE_MS) echecs.set(identifiant, { n: 1, depuis: Date.now() });
  else e.n += 1;
}

export const effacerEchecs = (identifiant: string) => echecs.delete(identifiant);

// Normalisation des identifiants.
export const normaliserEmail = (s: string) => s.trim().toLowerCase();
export function normaliserTelephone(s: string) {
  const chiffres = s.replace(/\D/g, "").replace(/^(00)?221/, "");
  return /^\d{9}$/.test(chiffres) ? chiffres : undefined;
}
