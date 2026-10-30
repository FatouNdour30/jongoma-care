import { Repertoire } from "@/components/Repertoire";
import { Titre } from "@/components/ui";
import { getLangue } from "@/lib/langue";
import { getSession } from "@/lib/session";

const T = {
  fr: { titre: "Structures de santé", sous: "Répertoire vérifié. Le statut indique si la structure a formalisé un partenariat." },
  en: { titre: "Health facilities", sous: "Verified directory. The status shows whether the facility has formalised a partnership." },
};

export default async function Structures({ searchParams }: PageProps<"/structures">) {
  const filtres = (await searchParams) as Record<string, string | undefined>;
  const [session, langue] = await Promise.all([getSession(), getLangue()]);
  return (
    <div>
      <Titre titre={T[langue].titre} sous={T[langue].sous} />
      <Repertoire chemin="/structures" filtres={filtres} estBeneficiaire={session?.role === "beneficiaire"} langue={langue} />
    </div>
  );
}
