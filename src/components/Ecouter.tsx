"use client";
// Lecture audio (F-11, F-34). Utilise un enregistrement natif s'il existe,
// sinon la synthèse vocale du navigateur. Les navigateurs ne proposent pas de
// voix wolof : les capsules wolof doivent être enregistrées par des locutrices natives.
import { useRef, useState } from "react";

export function Ecouter({ texte, audio, libelle = "Écouter", langue = "fr" }: { texte: string; audio?: string; libelle?: string; langue?: "fr" | "en" }) {
  const [enCours, setEnCours] = useState(false);
  const el = useRef<HTMLAudioElement | null>(null);

  function lire() {
    if (enCours) {
      el.current?.pause();
      window.speechSynthesis?.cancel();
      setEnCours(false);
      return;
    }
    setEnCours(true);
    if (audio) {
      el.current = new Audio(audio);
      el.current.onended = () => setEnCours(false);
      el.current.play().catch(synthese);
    } else synthese();
  }

  function synthese() {
    if (!("speechSynthesis" in window)) return setEnCours(false);
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = langue === "en" ? "en-GB" : "fr-FR";
    u.rate = 0.9;
    u.onend = () => setEnCours(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  return (
    <button type="button" onClick={lire} className="btn-sec btn-sm" aria-label={`${libelle} : ${texte.slice(0, 40)}`}>
      <span aria-hidden>{enCours ? "■" : "▶"}</span> {enCours ? "Arrêter" : libelle}
    </button>
  );
}
