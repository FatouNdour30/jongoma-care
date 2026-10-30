// Audio wolof d'une capsule validée (prototype). Seul le texte wolof validé est envoyé au service.
import { CAPSULES } from "@/lib/contenus";
import { getSession } from "@/lib/session";
import { autoriser, synthetiser, voixActive } from "@/lib/voix";

export const dynamic = "force-dynamic";

const g = globalThis as unknown as { __voixCache?: Map<string, ArrayBuffer> };

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return new Response("Connexion requise", { status: 401 });
  if (!voixActive) return new Response("Prototype : service vocal non connecté", { status: 503 });
  const capsule = CAPSULES.find((c) => c.id === new URL(req.url).searchParams.get("capsule"));
  if (!capsule?.texteWolof || capsule.validation !== "validee") return new Response("Pas de texte wolof validé pour cette capsule", { status: 404 });
  g.__voixCache ??= new Map();
  let audio = g.__voixCache.get(capsule.id);
  if (!audio) {
    if (!autoriser(`synthese:${s.id}`, 10)) return new Response("Trop de demandes", { status: 429 });
    audio = await synthetiser(capsule.texteWolof);
    g.__voixCache.set(capsule.id, audio);
  }
  return new Response(audio, { headers: { "Content-Type": "audio/wav", "Cache-Control": "private, max-age=86400" } });
}
