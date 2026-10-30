// Répertoire des structures dans l'espace bénéficiaire : même contenu que la page publique,
// sans quitter le tableau de bord (barre latérale conservée).
import Link from "next/link";
import { Repertoire } from "@/components/Repertoire";
import { Titre } from "@/components/ui";
import { getLangue } from "@/lib/langue";
import { exigerRole } from "@/lib/session";

const T = {
  fr: { titre: "Trouver une structure", sous: "Répertoire vérifié. Choisissez une structure et demandez un rendez-vous : elle seule le confirme.", retour: "← Retour à mon espace" },
  en: { titre: "Find a facility", sous: "Verified directory. Choose a facility and request an appointment: only the facility confirms it.", retour: "← Back to my space" },
};

export default async function StructuresBeneficiaire({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await exigerRole("beneficiaire");
  const filtres = await searchParams;
  const t = T[await getLangue()];
  return (
    <div>
      <Link href="/femme#calendrier" className="mb-3 inline-block text-sm text-muted hover:text-foreground">{t.retour}</Link>
      <Titre titre={t.titre} sous={t.sous} />
      <Repertoire chemin="/femme/structures" filtres={filtres} estBeneficiaire langue={await getLangue()} />
    </div>
  );
}
