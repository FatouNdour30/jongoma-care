import { db, synchroniser } from "@/lib/db";
import { indicateurs, versCsv } from "@/lib/opendata";

export const dynamic = "force-dynamic";

export async function GET() {
  await synchroniser();
  const { lignes, total } = indicateurs(db());
  return new Response(versCsv([...lignes, total]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="jongoma-care-indicateurs.csv"',
    },
  });
}
