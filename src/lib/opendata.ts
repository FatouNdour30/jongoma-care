// Indicateurs agrégés publiés (F-16, F-36). Aucune cellule sous le seuil d'effectif.
import { addDays, diffDays, today } from "./protocol";
import type { Base } from "./types";
import { ZONES } from "./types";

export const SEUIL_MIN = 5;

export interface Ligne {
  zone: string;
  inscrites: number | null;
  avecReferente: number | null; // en %
  rdvHonores: number | null; // en %
  continuitePostnatale: number | null; // en %
  orientationsAbouties: number | null;
  // Nouveau-nés (même seuil d'effectif que le reste).
  nouveauNes: number | null;
  bcgATemps: number | null; // en % des bébés de 14 jours et plus
  penta3ATemps: number | null; // en % des bébés de 18 semaines et plus
}

// Délais retenus pour « à temps » (calendrier indicatif, à valider avec le PEV).
export const BCG_DELAI_JOURS = 14;
export const PENTA3_DELAI_JOURS = 98 + 28;

const pct = (n: number, d: number) => (d >= SEUIL_MIN ? Math.round((n / d) * 100) : null);
const masque = (n: number) => (n >= SEUIL_MIN ? n : null);

export function indicateurs(base: Base): { lignes: Ligne[]; total: Ligne; maj: string } {
  const t = today();
  const calc = (filtre: (zone: string) => boolean, zone: string): Ligne => {
    const bs = base.beneficiaires.filter((b) => filtre(b.zone));
    const ids = new Set(bs.map((b) => b.id));
    const consentantes = bs.filter((b) => b.consentements.accompagnement);
    const rdvPasses = base.rendezVous.filter((r) => ids.has(r.beneficiaireId) && r.date < t && r.statut !== "annule" && r.statut !== "prevu");
    const post = bs.filter((b) => b.etape === "postnatal");
    const postSuivies = post.filter((b) => base.rendezVous.some((r) => r.beneficiaireId === b.id && r.type === "CPoN" && r.statut === "honore"));
    const orientations = base.orientations.filter((o) => ids.has(o.beneficiaireId) && (o.statut === "prise_en_charge" || o.statut === "cloturee")).length;
    const bebes = base.bebes.filter((x) => ids.has(x.beneficiaireId));
    const faitAvant = (bebeId: string, vaccinId: string, limite: string) => base.vaccinations.some((v) => v.bebeId === bebeId && v.vaccinId === vaccinId && v.statut === "fait" && v.date <= limite);
    const ageBcg = bebes.filter((x) => diffDays(t, x.dateNaissance) >= BCG_DELAI_JOURS);
    const agePenta = bebes.filter((x) => diffDays(t, x.dateNaissance) >= PENTA3_DELAI_JOURS);
    return {
      zone,
      inscrites: masque(bs.length),
      avecReferente: pct(consentantes.filter((b) => b.referenteId).length, consentantes.length),
      rdvHonores: pct(rdvPasses.filter((r) => r.statut === "honore").length, rdvPasses.length),
      continuitePostnatale: pct(postSuivies.length, post.length),
      orientationsAbouties: masque(orientations),
      nouveauNes: masque(bebes.length),
      bcgATemps: pct(ageBcg.filter((x) => faitAvant(x.id, "bcg", addDays(x.dateNaissance, BCG_DELAI_JOURS))).length, ageBcg.length),
      penta3ATemps: pct(agePenta.filter((x) => faitAvant(x.id, "penta3", addDays(x.dateNaissance, PENTA3_DELAI_JOURS))).length, agePenta.length),
    };
  };
  return {
    lignes: ZONES.map((z) => calc((zone) => zone === z, z)),
    total: calc(() => true, "Total"),
    maj: t,
  };
}

export function versCsv(lignes: Ligne[]) {
  const entete = "zone,inscrites,pct_avec_referente,pct_rdv_honores,pct_continuite_postnatale,orientations_abouties,nouveau_nes,pct_bcg_a_temps,pct_penta3_a_temps";
  const v = (x: number | null) => (x === null ? "masque" : String(x));
  return [entete, ...lignes.map((l) => [l.zone, v(l.inscrites), v(l.avecReferente), v(l.rdvHonores), v(l.continuitePostnatale), v(l.orientationsAbouties), v(l.nouveauNes), v(l.bcgATemps), v(l.penta3ATemps)].join(","))].join("\n");
}
