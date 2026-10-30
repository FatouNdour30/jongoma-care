# Test de la voix wolof avec 10 à 15 femmes

Objectif : savoir si des femmes qui lisent peu **comprennent** les messages en wolof et peuvent **poser une question à voix haute**, avant de proposer la fonction à toutes. Le test dure environ 20 minutes par personne.

## Avant le test

1. **Écrire les textes wolof** des capsules (au moins 5 : consultations prénatales, moustiquaire, vaccination du bébé, préparer l'accouchement, quand demander de l'aide). Ils sont écrits par une locutrice native, relus par une sage-femme, puis ajoutés dans `src/lib/contenus.ts` (champ `texteWolof`, et `validation: "validee"`). **Aucune traduction automatique.**
2. **Mettre le service vocal en ligne** sur un serveur GPU (voir plus bas) et définir `VOIX_SERVICE_URL` et `VOIX_SERVICE_TOKEN` sur Vercel.
3. **Préparer 2 téléphones Android** chargés, avec le site ouvert sur un compte de démonstration (aucune donnée réelle).
4. **Recruter 10 à 15 femmes** avec une structure ou une association partenaire : de préférence enceintes ou jeunes mères, dont au moins la moitié lisent peu, de 2 zones différentes.

## Consentement (lu à voix haute, en wolof)

- Le test sert à améliorer un service ; il ne s'agit pas d'un soin.
- Aucune donnée personnelle n'est enregistrée ; les questions posées ne sont pas conservées.
- Elle peut arrêter à tout moment, sans conséquence.
- Noter seulement un code (F01, F02…), jamais le nom ni le téléphone.

## Déroulé (pour chaque participante)

| Étape | Ce qu'on fait | Ce qu'on note |
| --- | --- | --- |
| 1. Écoute | Faire écouter 3 capsules en wolof | Après chacune : « Qu'avez-vous compris ? » → compris / en partie / pas compris |
| 2. Naturel de la voix | « La voix est-elle claire ? Agréable ? » | Note de 1 à 5 |
| 3. Question à voix haute | Lui demander de poser 3 questions simples (ex. « Quand est mon prochain rendez-vous ? », « Pourquoi vacciner mon bébé ? ») | Pour chacune : texte reconnu correct / en partie / faux ; réponse utile oui / non |
| 4. Passage à un humain | Poser une question hors capsules | L'assistant a-t-il bien proposé le rappel par la référente ? |
| 5. Avis | « Utiliseriez-vous ce service ? Qu'est-ce qui manque ? » | Réponse libre, citation courte |

## Ce qu'on publie dans le dossier UNICEF

- Nombre de participantes, zones, part de femmes qui lisent peu.
- Taux de compréhension des capsules (compris + en partie).
- Taux de questions correctement reconnues, et taux de réponses utiles.
- Note moyenne de la voix, et 2 ou 3 citations anonymes.
- Les problèmes trouvés et ce qui a été corrigé.

Présenter les résultats tels qu'ils sont, même modestes : un petit test honnête vaut mieux qu'une promesse.

## Mettre le service vocal en ligne (Hugging Face Spaces, le plus simple)

1. Créer un compte sur huggingface.co, puis un **Space** de type **Docker**, avec du matériel **GPU** (une petite carte comme la T4 suffit pour un test ; facturé à l'heure, à arrêter après le test).
2. Y copier `app.py`, `requirements.txt`, `Dockerfile`, et `README.space.md` renommé en `README.md`.
3. Dans les **Secrets** du Space : `VOIX_SERVICE_TOKEN` = un jeton long et aléatoire.
4. Sur Vercel : `VOIX_SERVICE_URL` = l'adresse du Space, et le même `VOIX_SERVICE_TOKEN`, puis redéployer.
5. Vérifier : la page `/api/voix/etat` doit répondre `{"active":true}`, et le bouton micro apparaît dans « Écouter ».
