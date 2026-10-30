// État de la brique vocale wolof (prototype) : le client affiche le micro seulement si elle est active.
import { voixActive } from "@/lib/voix";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ active: voixActive });
}
