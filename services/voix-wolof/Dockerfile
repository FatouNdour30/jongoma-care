# Service vocal wolof — image prête pour un serveur GPU (Hugging Face Spaces, RunPod, Modal…).
FROM python:3.11-slim
# ffmpeg : décodage de l'audio enregistré par le navigateur (webm/opus) ; git : installation de parler-tts.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
# Les modèles (environ 7 Go) sont téléchargés au premier appel et gardés dans le cache Hugging Face.
ENV PORT=7860 HF_HOME=/data/hf
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
