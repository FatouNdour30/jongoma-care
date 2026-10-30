import { EnTete } from "@/components/pro";
import { Repertoire } from "@/components/Repertoire";
import { getLangue } from "@/lib/langue";

const T = {
  fr: { titre: "Répertoire des structures", sous: "Structures vérifiées pour orienter les bénéficiaires. Le statut indique si un partenariat est formalisé." },
  en: { titre: "Facility directory", sous: "Verified facilities for referring beneficiaries. The status shows whether a partnership is formalised." },
};

// Répertoire consulté depuis l'espace professionnel : même contenu, sans quitter le tableau de bord.
export default async function RepertoirePro({ searchParams }: PageProps<"/espace/repertoire">) {
  const filtres = (await searchParams) as Record<string, string | undefined>;
  const langue = await getLangue();
  return (
    <div className="space-y-6">
      <EnTete titre={T[langue].titre} sous={T[langue].sous} />
      <Repertoire chemin="/espace/repertoire" filtres={filtres} pro langue={langue} />
    </div>
  );
}
