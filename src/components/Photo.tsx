import Image from "next/image";
import type { Photo as P } from "@/lib/photos";

// Le cadrage suit le point d'intérêt de la photo, sauf si `position` le remplace.
export function Photo({ photo, className = "", sizes = "(min-width: 768px) 50vw, 100vw", priority, legende, position }: { photo: P; className?: string; sizes?: string; priority?: boolean; legende?: string; position?: string }) {
  return (
    <figure className={`relative overflow-hidden ${className}`}>
      <Image src={photo.src} alt={photo.alt} fill sizes={sizes} priority={priority} className="object-cover" style={{ objectPosition: position ?? photo.focus }} />
      {legende && (
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-sm font-medium text-white">{legende}</figcaption>
      )}
    </figure>
  );
}
