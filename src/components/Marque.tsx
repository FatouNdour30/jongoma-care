// Marque Jongoma Care, marque fille de Jongoma Tech : symbole de la maison mère (femme au turban
// formant le « J ») décliné en vert, « JONGOMA » en capitales romaines, « CARE » espacé (comme
// « TECH »), puis la signature « by Jongoma Tech ».
import Image from "next/image";

export function Symbole({ taille = 40, pastille = false }: { taille?: number; pastille?: boolean }) {
  const img = <Image src="/brand/jongoma-care-symbole.png" alt="" width={Math.round(taille * 0.867)} height={taille} priority />;
  // Sur fond sombre, le visage sombre disparaîtrait : le symbole est posé sur une pastille crème.
  if (!pastille) return img;
  return (
    <span className="flex items-center justify-center rounded-2xl bg-background" style={{ width: taille * 1.25, height: taille * 1.25 }}>
      {img}
    </span>
  );
}

export function Marque({ taille = "md", sombre = false }: { taille?: "sm" | "md" | "lg"; sombre?: boolean }) {
  const t = {
    sm: { s: 40, nom: "text-[17px]", care: "text-[9px]", par: "text-[12px]" },
    md: { s: 48, nom: "text-xl", care: "text-[10px]", par: "text-[13px]" },
    lg: { s: 76, nom: "text-3xl", care: "text-sm", par: "text-lg" },
  }[taille];
  return (
    <span className="flex items-center gap-2.5" aria-label="Jongoma Care by Jongoma Tech">
      <Symbole taille={t.s} pastille={sombre} />
      <span className="flex flex-col leading-none" aria-hidden>
        <span className={`font-marque ${t.nom} font-semibold tracking-[0.04em] ${sombre ? "text-white" : "text-encre"}`}>JONGOMA</span>
        <span className={`mt-1 flex items-center gap-1.5 ${t.care} font-semibold tracking-[0.42em] ${sombre ? "text-or-clair" : "text-brand"}`}>
          <span className={`h-px w-3 ${sombre ? "bg-or-clair" : "bg-brand"}`} />
          CARE
          <span className={`h-px w-3 ${sombre ? "bg-or-clair" : "bg-brand"}`} />
        </span>
        <span className={`mt-1 whitespace-nowrap font-display ${t.par} font-semibold italic ${sombre ? "text-white/80" : "text-accent"}`}>by Jongoma Tech</span>
      </span>
    </span>
  );
}
