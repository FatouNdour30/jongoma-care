# Service vocal wolof — prototype

Service open source qui donne une voix en wolof à Jongoma Care, pour les femmes qui lisent peu.

| Fonction | Modèle | Licence |
| --- | --- | --- |
| Synthèse vocale (texte wolof → voix) | [CONCREE/Adia_TTS](https://huggingface.co/CONCREE/Adia_TTS) | Apache-2.0 |
| Reconnaissance vocale (voix → texte, wolof et wolof-français mélangés) | [CAYTU/whosper-large-v2](https://huggingface.co/CAYTU/whosper-large-v2) | Apache-2.0 |

## Statut : prototype, pas encore testé

- Le code suit l'usage décrit sur les fiches des deux modèles, mais il **n'a pas encore été exécuté** :
  il demande un serveur avec GPU (Adia_TTS : environ 20 s par phrase sur GPU ; Whisper large-v2 : plusieurs Go).
- Qualité à évaluer **avec des locutrices natives** avant toute mise en service : taux d'erreur de Whosper
  annoncé par son auteur autour de 23 % sur son jeu de test, et Adia_TTS gère mal les nombres et les dates.
- Les textes wolof des capsules doivent être **écrits et validés par des locutrices natives et des sages-femmes**.
  Aucune traduction automatique de contenu de santé.

## Protection des données

- Le site n'envoie jamais de nom, de téléphone ni d'élément du dossier : seulement le texte wolof validé
  d'une capsule (synthèse) ou l'audio d'une question (reconnaissance).
- L'audio reçu est écrit dans un fichier temporaire, transcrit, puis effacé. Rien n'est journalisé.
- Accès protégé par jeton (`VOIX_SERVICE_TOKEN`), à définir dans les variables d'environnement, jamais dans le code.

## Lancer

```bash
pip install -r requirements.txt
export VOIX_SERVICE_TOKEN="<jeton long et aléatoire>"
uvicorn app:app --host 0.0.0.0 --port 8000
```

Côté site (Vercel) : `VOIX_SERVICE_URL=https://<adresse du service>` et le même `VOIX_SERVICE_TOKEN`.
Sans ces deux variables, la brique vocale reste inactive et le site l'affiche comme « prototype ».
