"""Service vocal wolof de Jongoma Care — PROTOTYPE, non encore testé en conditions réelles.

Deux modèles open source, tous deux sous licence Apache-2.0 (usage commercial autorisé) :
  - synthèse vocale wolof : CONCREE/Adia_TTS (Parler-TTS mini multilingue, 24 kHz) ;
  - reconnaissance vocale wolof : CAYTU/whosper-large-v2 (Whisper large-v2 + adaptateur, wolof/français).

Le service ne conserve rien : l'audio reçu est écrit dans un fichier temporaire, transcrit, puis effacé.
Il n'accepte que les appels portant le jeton VOIX_SERVICE_TOKEN (même valeur que côté site).
"""

import io
import os
import re
import tempfile

import numpy as np
import soundfile as sf
import torch
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

JETON = os.environ["VOIX_SERVICE_TOKEN"]
APPAREIL = "cuda" if torch.cuda.is_available() else "cpu"
# Voix décrite en texte (Parler-TTS) : claire et posée, adaptée à des conseils de santé.
DESCRIPTION_VOIX = os.environ.get("VOIX_DESCRIPTION", "A clear and calm female voice, speaking slowly and warmly, with very clear audio.")
LONGUEUR_MAX = 200  # limite d'Adia_TTS par génération : le texte est découpé en phrases

app = FastAPI(title="Jongoma Care — service vocal wolof (prototype)")
_modeles: dict = {}


def verifier_jeton(authorization: str = Header(default="")):
    if authorization != f"Bearer {JETON}":
        raise HTTPException(status_code=401, detail="Jeton invalide")


def tts():
    if "tts" not in _modeles:
        from parler_tts import ParlerTTSForConditionalGeneration
        from transformers import AutoTokenizer

        modele = ParlerTTSForConditionalGeneration.from_pretrained("CONCREE/Adia_TTS").to(APPAREIL)
        _modeles["tts"] = (modele, AutoTokenizer.from_pretrained("CONCREE/Adia_TTS"))
    return _modeles["tts"]


def asr():
    if "asr" not in _modeles:
        from whosper import WhosperTranscriber

        _modeles["asr"] = WhosperTranscriber(model_id="CAYTU/whosper-large-v2")
    return _modeles["asr"]


def decouper(texte: str) -> list[str]:
    """Découpe aux fins de phrase, sans dépasser LONGUEUR_MAX caractères par morceau."""
    morceaux, courant = [], ""
    for phrase in re.split(r"(?<=[.!?])\s+", texte.strip()):
        if courant and len(courant) + len(phrase) + 1 > LONGUEUR_MAX:
            morceaux.append(courant)
            courant = phrase
        else:
            courant = f"{courant} {phrase}".strip()
    if courant:
        morceaux.append(courant)
    return [m[:LONGUEUR_MAX] for m in morceaux]


class DemandeSynthese(BaseModel):
    texte: str = Field(min_length=1, max_length=2000)


@app.get("/sante")
def sante():
    return {"ok": True, "appareil": APPAREIL}


@app.post("/tts", dependencies=[Depends(verifier_jeton)])
def synthese(demande: DemandeSynthese):
    modele, tokenizer = tts()
    description = tokenizer(DESCRIPTION_VOIX, return_tensors="pt").input_ids.to(APPAREIL)
    morceaux = []
    for morceau in decouper(demande.texte):
        invite = tokenizer(morceau, return_tensors="pt").input_ids.to(APPAREIL)
        with torch.no_grad():
            audio = modele.generate(input_ids=description, prompt_input_ids=invite)
        morceaux.append(audio.cpu().numpy().squeeze())
        morceaux.append(np.zeros(int(0.25 * modele.config.sampling_rate), dtype=np.float32))  # courte pause
    tampon = io.BytesIO()
    sf.write(tampon, np.concatenate(morceaux), modele.config.sampling_rate, format="WAV", subtype="PCM_16")
    return Response(tampon.getvalue(), media_type="audio/wav")


@app.post("/asr", dependencies=[Depends(verifier_jeton)])
async def reconnaissance(audio: UploadFile = File(...)):
    donnees = await audio.read()
    if not donnees or len(donnees) > 2_000_000:
        raise HTTPException(status_code=400, detail="Audio vide ou trop long")
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        f.write(donnees)
        chemin = f.name
    try:
        texte = asr().transcribe_audio(chemin)
    finally:
        os.remove(chemin)  # rien n'est conservé
    return {"texte": texte if isinstance(texte, str) else str(texte)}
