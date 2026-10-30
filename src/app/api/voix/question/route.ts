// Question posée à voix haute par une bénéficiaire (prototype).
// Réponse uniquement avec une capsule existante ; sinon, demande de rappel transmise à la référente.
import { db, enregistrer } from "@/lib/db";
import { today } from "@/lib/protocol";
import { getSession } from "@/lib/session";
import { autoriser, orienter, transcrire, voixActive } from "@/lib/voix";

export const dynamic = "force-dynamic";

const TAILLE_MAX = 2_000_000; // environ 15 secondes d'audio compressé

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "beneficiaire") return Response.json({ erreur: "connexion" }, { status: 401 });
  if (!voixActive) return Response.json({ erreur: "prototype" }, { status: 503 });
  if (!autoriser(`question:${s.id}`)) return Response.json({ erreur: "trop_de_demandes" }, { status: 429 });
  const audio = (await req.formData()).get("audio");
  if (!(audio instanceof Blob) || audio.size === 0 || audio.size > TAILLE_MAX) return Response.json({ erreur: "audio" }, { status: 400 });

  // Seul l'audio part au service vocal ; il n'est conservé ni ici ni là-bas.
  const transcription = await transcrire(audio).catch(() => null);
  if (transcription === null) return Response.json({ erreur: "service" }, { status: 502 });

  const capsule = transcription ? orienter(transcription) : null;
  if (capsule) {
    return Response.json({ transcription, capsule: { id: capsule.id, titre: capsule.titre, texte: capsule.texte, audioWolof: capsule.texteWolof ? `/api/voix/synthese?capsule=${capsule.id}` : null } });
  }
  const b = db().beneficiaires.find((x) => x.id === s.id);
  if (b) {
    b.rappelDemandeLe = today();
    enregistrer(`beneficiaire:${b.id}`, "demande_rappel_vocal", b.id);
  }
  return Response.json({ transcription, transmis: true });
}
