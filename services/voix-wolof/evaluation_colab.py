# Évaluation GRATUITE de la voix wolof sur Google Colab (carte T4 offerte).
# Mode d'emploi : colab.research.google.com → Nouveau notebook → Exécution → Modifier le type
# d'exécution → GPU T4. Coller ce fichier dans une cellule, puis l'exécuter (environ 20 minutes).
#
# Ce qu'il mesure, sans aucune donnée personnelle :
#   1. Reconnaissance vocale (Whosper-large-v2) : taux d'erreur sur les mots (WER) et sur les caractères
#      (CER) sur l'échantillon de test wolof public de Google FLEURS (wo_sn), enregistré par des locuteurs
#      natifs. Ce chiffre est publiable tel quel dans le dossier.
#   2. Synthèse vocale (Adia_TTS) : génère les capsules en wolof dans le dossier capsules/, à faire
#      écouter et noter par des locutrices natives (voir PROTOCOLE-TEST.md).
#
# Les résultats sont écrits dans resultats.json. Publier les chiffres tels qu'ils sortent, même modestes.

import subprocess, sys

subprocess.run([sys.executable, "-m", "pip", "install", "-q", "whosper", "jiwer", "datasets<3", "soundfile", "librosa",
                "git+https://github.com/huggingface/parler-tts.git"], check=True)

import json, os, time
import numpy as np, soundfile as sf, torch, jiwer
from datasets import load_dataset

N = int(os.environ.get("N_EXEMPLES", "100"))  # nombre de phrases évaluées (100 ≈ 10 minutes sur T4)
assert torch.cuda.is_available(), "Activez le GPU : Exécution → Modifier le type d'exécution → T4"

# ---------- 1. Reconnaissance vocale ----------
from whosper import WhosperTranscriber

asr = WhosperTranscriber(model_id="CAYTU/whosper-large-v2")
test = load_dataset("google/fleurs", "wo_sn", split="test", trust_remote_code=True).select(range(N))

def normaliser(t: str) -> str:
    return " ".join("".join(c for c in t.lower() if c.isalnum() or c.isspace() or c == "'").split())

references, hypotheses, durees = [], [], []
os.makedirs("audio_test", exist_ok=True)
for i, ex in enumerate(test):
    chemin = f"audio_test/{i}.wav"
    sf.write(chemin, ex["audio"]["array"], ex["audio"]["sampling_rate"])
    debut = time.time()
    texte = asr.transcribe_audio(chemin)
    durees.append(time.time() - debut)
    references.append(normaliser(ex["transcription"]))
    hypotheses.append(normaliser(texte if isinstance(texte, str) else str(texte)))
    if i < 5:
        print(f"RÉF : {references[-1]}\nASR : {hypotheses[-1]}\n")

wer, cer = jiwer.wer(references, hypotheses), jiwer.cer(references, hypotheses)
print(f"WER = {wer:.1%}  ·  CER = {cer:.1%}  ·  {N} phrases FLEURS wo_sn  ·  {np.mean(durees):.1f} s par phrase")

# ---------- 2. Synthèse vocale ----------
# Remplacer ces phrases par les textes des capsules VALIDÉS par une locutrice native et une sage-femme.
# Aucune traduction automatique : les phrases ci-dessous servent seulement à tester la voix.
PHRASES = [
    "Salaam aleekum. Bul fàtte sa rendez-vous bu ñëw ci daara ja.",
    "Nelaw ci biir moustiquaire guddi gu nekk.",
]
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer

tts = ParlerTTSForConditionalGeneration.from_pretrained("CONCREE/Adia_TTS").to("cuda")
tok = AutoTokenizer.from_pretrained("CONCREE/Adia_TTS")
description = tok("A clear and calm female voice, speaking slowly and warmly, with very clear audio.", return_tensors="pt").input_ids.to("cuda")
os.makedirs("capsules", exist_ok=True)
for i, phrase in enumerate(PHRASES):
    audio = tts.generate(input_ids=description, prompt_input_ids=tok(phrase, return_tensors="pt").input_ids.to("cuda"))
    sf.write(f"capsules/{i + 1}.wav", audio.cpu().numpy().squeeze(), tts.config.sampling_rate)
print(f"{len(PHRASES)} capsules générées dans capsules/ : à faire écouter et noter par des locutrices natives.")

json.dump({"asr": {"modele": "CAYTU/whosper-large-v2", "jeu": "google/fleurs wo_sn (test)", "n": N, "wer": wer, "cer": cer,
                   "secondes_par_phrase": float(np.mean(durees)), "gpu": torch.cuda.get_device_name(0)},
           "tts": {"modele": "CONCREE/Adia_TTS", "capsules": len(PHRASES)}},
          open("resultats.json", "w"), indent=2, ensure_ascii=False)
print("Résultats enregistrés dans resultats.json")
