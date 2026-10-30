import { DonneesExemple } from "@/components/DonneesExemple";
import { DonneesOuvertes } from "@/components/DonneesOuvertes";
import { EnTete } from "@/components/pro";
import { getLangue } from "@/lib/langue";

const T = {
  fr: { titre: "Données ouvertes", sous: "Indicateurs publiés en continu, agrégés et anonymisés", csv: "Télécharger en CSV" },
  en: { titre: "Open data", sous: "Indicators published continuously, aggregated and anonymised", csv: "Download CSV" },
};

// Indicateurs publics consultés depuis l'espace professionnel.
export default async function DonneesPro() {
  const langue = await getLangue();
  const t = T[langue];
  return (
    <div className="space-y-6">
      <EnTete titre={t.titre} sous={t.sous} actions={<><DonneesExemple /><a href="/api/donnees" className="btn btn-sm">{t.csv}</a></>} />
      <DonneesOuvertes langue={langue} />
    </div>
  );
}
