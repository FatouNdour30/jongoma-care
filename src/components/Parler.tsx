"use client";
// Question à voix haute (PROTOTYPE) : la bénéficiaire parle en wolof ou en français, l'assistant
// répond seulement avec une capsule validée ; sinon il transmet une demande de rappel à sa référente.
import { useEffect, useRef, useState } from "react";
import { Ecouter } from "./Ecouter";

type Reponse = { transcription: string; capsule?: { titre: string; texte: string; audioWolof: string | null }; transmis?: boolean };

const DUREE_MAX_MS = 15_000;

export function Parler() {
  const [active, setActive] = useState<boolean | null>(null);
  const [etat, setEtat] = useState<"repos" | "ecoute" | "envoi">("repos");
  const [reponse, setReponse] = useState<Reponse | null>(null);
  const [erreur, setErreur] = useState("");
  const enregistreur = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    fetch("/api/voix/etat").then((r) => r.json()).then((x) => setActive(Boolean(x.active))).catch(() => setActive(false));
  }, []);

  async function demarrer() {
    setErreur("");
    setReponse(null);
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const morceaux: Blob[] = [];
      const rec = new MediaRecorder(flux);
      rec.ondataavailable = (e) => morceaux.push(e.data);
      rec.onstop = async () => {
        flux.getTracks().forEach((t) => t.stop());
        setEtat("envoi");
        const corps = new FormData();
        corps.append("audio", new Blob(morceaux, { type: rec.mimeType }));
        const r = await fetch("/api/voix/question", { method: "POST", body: corps }).catch(() => null);
        setEtat("repos");
        if (!r?.ok) return setErreur(r?.status === 429 ? "Trop de questions d'affilée. Réessayez dans une minute." : "La question n'a pas pu être traitée. Votre référente reste joignable.");
        setReponse(await r.json());
      };
      enregistreur.current = rec;
      rec.start();
      setEtat("ecoute");
      setTimeout(() => rec.state === "recording" && rec.stop(), DUREE_MAX_MS);
    } catch {
      setErreur("Le micro n'est pas accessible sur ce téléphone.");
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-border p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">Poser une question à voix haute</p>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Prototype</span>
      </div>
      {active === false ? (
        <p className="text-sm text-muted">
          Bientôt : vous pourrez parler en wolof ou en français. L&apos;assistant répondra seulement avec des conseils validés par des sages-femmes, et transmettra toute autre question à votre référente. En attendant, appelez votre référente.
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">Parlez en wolof ou en français (15 secondes au plus). L&apos;assistant répond seulement avec des conseils validés ; pour toute autre question, il demande à votre référente de vous rappeler.</p>
          {etat === "ecoute" ? (
            <button type="button" onClick={() => enregistreur.current?.stop()} className="btn bg-red-700">■ J&apos;ai fini</button>
          ) : (
            <button type="button" onClick={demarrer} disabled={active === null || etat === "envoi"} className="btn">🎤 {etat === "envoi" ? "Un instant…" : "Parler"}</button>
          )}
        </>
      )}
      {erreur && <p className="mt-3 text-sm text-red-700">{erreur}</p>}
      {reponse && (
        <div className="mt-3 space-y-2 text-sm">
          {reponse.transcription && <p className="text-muted">Vous avez dit : « {reponse.transcription} »</p>}
          {reponse.capsule ? (
            <div className="rounded-lg bg-background p-3">
              <p className="font-medium">{reponse.capsule.titre}</p>
              <p className="my-1">{reponse.capsule.texte}</p>
              <Ecouter texte={reponse.capsule.texte} audio={reponse.capsule.audioWolof ?? undefined} />
            </div>
          ) : (
            <p className="rounded-lg bg-background p-3">Je n&apos;ai pas de réponse validée à cette question. Votre référente est prévenue et va vous rappeler.</p>
          )}
        </div>
      )}
    </div>
  );
}
