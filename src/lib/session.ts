// Session signée (HMAC) stockée dans un cookie httpOnly. Expire après 2 heures
// d'inactivité : chaque action serveur la prolonge.
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { creerJeton, lireJeton } from "./auth";
import { db, synchroniser } from "./db";
import type { Role } from "./types";

export interface Session {
  role: Role;
  id: string; // refId : bénéficiaire, personnel ou compte établissement
  compteId: string;
}

const COOKIE = "jc_session";
const DUREE_S = 2 * 60 * 60;

interface Jeton extends Session {
  exp: number;
}

export async function getSession(): Promise<Session | null> {
  await synchroniser();
  const brut = (await cookies()).get(COOKIE)?.value;
  const j = brut ? lireJeton<Jeton>(brut) : null;
  if (!j || j.exp < Date.now()) return null;
  // Un compte désactivé ou supprimé perd immédiatement l'accès.
  const compte = db().comptes.find((c) => c.id === j.compteId);
  if (!compte || compte.statut !== "actif" || compte.refId !== j.id) return null;
  return { role: j.role, id: j.id, compteId: j.compteId };
}

export async function setSession(s: Session | null) {
  const jar = await cookies();
  if (!s) {
    jar.delete(COOKIE);
    return;
  }
  const jeton = creerJeton({ ...s, exp: Date.now() + DUREE_S * 1000 });
  jar.set(COOKIE, jeton, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: DUREE_S });
}

// Cloisonnement des accès (F-29) : chaque page et chaque action vérifie le rôle.
export async function exigerRole(...roles: Role[]): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/connexion?erreur=session");
  if (!roles.includes(s.role)) redirect("/connexion?erreur=acces");
  try {
    await setSession(s); // prolonge la session (possible uniquement dans une action)
  } catch {
    // Rendu d'une page : les cookies sont en lecture seule.
  }
  return s;
}
