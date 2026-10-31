"use client";
// BabyAlert : questionnaire guidé, un signe à la fois. Il ne pose aucun diagnostic : au premier « oui »,
// il oriente tout de suite vers le centre de santé et propose de prévenir la référente.
// Rien n'est enregistré tant que la mère n'appuie pas sur un bouton ; même alors, seul le fait est noté.
import { useState } from "react";
import { Ecouter } from "./Ecouter";

export function QuestionnaireDanger({ signes, urgence, alerteEnCours, alerter, demanderAide }: { signes: readonly string[]; urgence: string; alerteEnCours: boolean; alerter: () => Promise<void>; demanderAide: (f: FormData) => Promise<void> }) {
  const [etape, setEtape] = useState<number | null>(null);
  const [danger, setDanger] = useState(false);

  if (alerteEnCours) {
    return <p className="text-sm font-semibold text-red-900">Votre référente est prévenue. Si vous n&apos;êtes pas déjà au centre de santé, allez-y maintenant (SAMU : {urgence}).</p>;
  }
  if (etape === null) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setEtape(0)} className="btn btn-sm">Vérifier l&apos;état de bébé, question par question</button>
        <form action={alerter}><button className="btn btn-sm !bg-red-700 hover:!bg-red-800">Je vois un signe de danger : prévenir ma référente</button></form>
        <span className="text-xs text-red-900">SAMU : {urgence}</span>
      </div>
    );
  }
  if (danger) {
    return (
      <div className="space-y-3 rounded-xl bg-red-100/70 p-3">
        <p className="font-semibold text-red-950">Allez tout de suite au centre de santé avec bébé, ou appelez le SAMU au {urgence}.</p>
        <form action={alerter}><button className="btn btn-sm !bg-red-700 hover:!bg-red-800">Prévenir ma référente maintenant</button></form>
      </div>
    );
  }
  if (etape >= signes.length) {
    return (
      <div className="space-y-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950">
        <p className="font-semibold">Aucun signe de danger aujourd&apos;hui.</p>
        <p>Continuez à observer bébé. Si un signe apparaît, allez tout de suite au centre de santé.</p>
        <div className="flex flex-wrap gap-2">
          <form action={demanderAide}><input type="hidden" name="motif" value="inquietude" /><button className="btn-sec btn-sm">Je m&apos;inquiète quand même : être rappelée</button></form>
          <button type="button" onClick={() => setEtape(null)} className="text-xs text-muted underline">Fermer</button>
        </div>
      </div>
    );
  }
  const question = `Bébé : ${signes[etape].charAt(0).toLowerCase()}${signes[etape].slice(1)} ?`;
  return (
    <div className="space-y-3 rounded-xl bg-card p-3 ring-1 ring-red-200">
      <p className="text-xs text-muted">Question {etape + 1} sur {signes.length}</p>
      <p className="font-semibold">{question}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setDanger(true)} className="btn-sec btn-sm !border-red-300">Oui</button>
        <button type="button" onClick={() => setEtape(etape + 1)} className="btn-sec btn-sm">Non</button>
        <Ecouter texte={question} />
      </div>
      <div className="h-1.5 rounded-full bg-stone-100"><div className="h-1.5 rounded-full bg-red-400" style={{ width: `${(etape / signes.length) * 100}%` }} /></div>
    </div>
  );
}
