import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond, Montserrat } from "next/font/google";
import { getLangue } from "@/lib/langue";
import "./globals.css";

// Charte Jongoma Tech : capitales romaines pour la marque, sérif classique pour les titres,
// sans-sérif géométrique pour le texte.
const texte = Montserrat({ variable: "--font-texte", subsets: ["latin"] });
const titre = Cormorant_Garamond({ variable: "--font-titre", subsets: ["latin"], weight: ["500", "600", "700"] });
const marque = Cinzel({ variable: "--font-marque", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "Jongoma Care by Jongoma Tech",
  description: "Suivi maternel inclusif, orientation et données ouvertes pour les femmes et les filles. Un projet Jongoma Tech.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#0f766e", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const langue = await getLangue();
  return (
    <html lang={langue} className={`${texte.variable} ${titre.variable} ${marque.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
