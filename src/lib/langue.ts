// Langue de l'interface (français par défaut, anglais pour les partenaires internationaux).
// Mémorisée dans un cookie ; le wolof est porté par les contenus audio, pas par l'interface écrite.
import "server-only";
import { cookies } from "next/headers";
import { synchroniser } from "./db";

export type LangueUI = "fr" | "en";
export const COOKIE_LANGUE = "jc_langue";

// Appelée par toutes les pages publiques : point d'entrée commun pour recharger la base partagée.
export async function getLangue(): Promise<LangueUI> {
  await synchroniser();
  return (await cookies()).get(COOKIE_LANGUE)?.value === "en" ? "en" : "fr";
}

export const locale = (l: LangueUI) => (l === "en" ? "en-GB" : "fr-FR");
