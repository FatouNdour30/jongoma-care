import { DonneesExemple } from "@/components/DonneesExemple";
import { DonneesOuvertes as Contenu } from "@/components/DonneesOuvertes";
import { Titre } from "@/components/ui";
import { getLangue, locale } from "@/lib/langue";
import { today } from "@/lib/protocol";

const T = {
  fr: { titre: "Données ouvertes", sous: "Indicateurs agrégés et anonymisés · mis à jour le", csv: "Télécharger en CSV" },
  en: { titre: "Open data", sous: "Aggregated, anonymised indicators · updated on", csv: "Download CSV" },
};

export default async function DonneesOuvertes() {
  const langue = await getLangue();
  const t = T[langue];
  return (
    <div className="space-y-5">
      <Titre
        titre={t.titre}
        sous={`${t.sous} ${new Date(today()).toLocaleDateString(locale(langue))}`}
        action={<div className="flex items-center gap-3"><DonneesExemple /><a href="/api/donnees" className="btn">{t.csv}</a></div>}
      />
      <Contenu langue={langue} />
    </div>
  );
}
