// Traductions anglaises des programmes de santé (le français reste la source dans lib/programmes.ts).
import { ACTIONS, PROGRAMMES, type IdProgramme } from "../programmes";
import type { LangueUI } from "../langue";

const PROGRAMMES_EN: Record<IdProgramme, { nom: string; court: string; pourquoi: string }> = {
  paludisme: { nom: "Malaria in pregnancy", court: "Malaria", pourquoi: "Malaria exposes the mother to anaemia and the baby to low birth weight. Insecticide-treated nets and preventive treatment reduce this risk." },
  anemie: { nom: "Maternal anaemia", court: "Anaemia", pourquoi: "Anaemia weakens the mother and increases risks at delivery. Iron and folic acid help prevent it." },
  triple: { nom: "Triple elimination: HIV, syphilis, hepatitis B", court: "HIV · syphilis · hepatitis B", pourquoi: "Screening during pregnancy enables care that protects the baby from mother-to-child transmission." },
  hypertension: { nom: "Hypertension and pre-eclampsia", court: "Hypertension", pourquoi: "High blood pressure in pregnancy can become serious. It is easily detected during antenatal visits." },
  tetanos: { nom: "Maternal and neonatal tetanus", court: "Tetanus", pourquoi: "Vaccinating the mother also protects the newborn." },
  mental: { nom: "Mental health after birth", court: "Mental well-being", pourquoi: "Fatigue, sadness or anxiety after birth are common. Talking about it helps women get support." },
  col: { nom: "Cervical cancer", court: "Cervical cancer", pourquoi: "Screening detects early lesions that are easily treated." },
  pf: { nom: "Birth spacing", court: "Birth spacing", pourquoi: "Waiting at least two years before a new pregnancy protects the health of mother and baby. The midwife presents the methods; the woman chooses freely." },
};

const ACTIONS_EN: Record<string, string> = {
  moustiquaire: "Insecticide-treated net provided",
  tpi1: "Preventive treatment (IPTp) – 1st dose",
  tpi2: "Preventive treatment (IPTp) – 2nd dose",
  tpi3: "Preventive treatment (IPTp) – 3rd dose",
  fer: "Iron and folic acid started",
  hemoglobine: "Haemoglobin check",
  vih: "HIV screening offered",
  syphilis: "Syphilis screening offered",
  hepatiteb: "Hepatitis B screening offered",
  tension: "Blood pressure and proteinuria checked in 3rd trimester",
  vat: "Tetanus vaccination",
  bienetre: "Well-being conversation offered",
  col: "Cervical cancer screening offered",
  pf_conseil: "Birth spacing counselling offered",
};

export function programmes(l: LangueUI) {
  return PROGRAMMES.map((p) => (l === "en" ? { ...p, ...PROGRAMMES_EN[p.id] } : p));
}

export function actions(l: LangueUI) {
  return ACTIONS.map((a) => (l === "en" ? { ...a, libelle: ACTIONS_EN[a.id] ?? a.libelle } : a));
}
