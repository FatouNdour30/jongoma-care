# Stratégie de protection des données de santé

Jongoma Care traite des données de santé, qui sont des **données sensibles**. Ce document décrit ce qui est **déjà en place dans le code** (vérifiable dans ce dépôt) et ce qui reste **à faire avant le pilote**. Il sera relu par une personne compétente en droit des données au Sénégal.

## Cadre légal

- **Loi sénégalaise n° 2008-12** sur la protection des données à caractère personnel, et ses textes d'application (ou le texte qui la remplace, s'il est adopté d'ici au pilote).
- **Commission de Protection des Données Personnelles (CDP)** : les données de santé exigent une **demande d'autorisation** auprès de la CDP avant tout traitement réel.
- **Comité National d'Éthique pour la Recherche en Santé (CNERS)** : avis demandé si le pilote est conduit comme une étude (mesures d'efficacité, publication).
- Principes suivis : finalité déterminée, minimisation, consentement libre et éclairé, durée de conservation limitée, sécurité, droits d'accès, de rectification et d'effacement.

## Ce qui est déjà en place

| Principe | Mise en œuvre dans le code |
| --- | --- |
| Consentements séparés | Service, rappels, accompagnement par une référente et traitement par l'IA sont recueillis **séparément** ; refuser l'IA ne retire aucun service. |
| Minimisation | Pas de numéro de pièce d'identité, pas de diagnostic. Pour le bébé : date de naissance, prénom facultatif, vaccin fait ou refusé avec sa date. |
| Pseudonymisation | L'identité (prénom, téléphone) est stockée à part du dossier de suivi, qui ne porte qu'un identifiant. |
| Droit d'accès | La femme télécharge toutes ses données depuis son espace (`/api/mes-donnees`). |
| Droit à l'effacement | La femme supprime elle-même son compte et ses données, y compris celles de son bébé. |
| Accès par rôle | Chaque page professionnelle vérifie le rôle (référente, structure, spécialiste, coordination). |
| Traçabilité | Journal d'audit des actions sensibles (consultations, exports, suppressions). |
| Mots de passe | Hachés avec scrypt et un sel aléatoire ; jamais stockés en clair. |
| Sessions | Cookie signé (HMAC), `httpOnly`, `secure` en production, expiration après 2 heures. |
| Téléphone partagé | Mode discret : écran d'accueil neutre (« Agenda »), messages sans mot sensible. |
| Données ouvertes | Agrégées par zone uniquement, et masquées en dessous de **5 personnes** pour empêcher toute ré-identification. |
| IA | Aucune variable de santé mentale, de protection ou d'âge ; la zone et la langue servent uniquement au contrôle d'équité ; une humaine décide toujours. |
| Voix | Le service vocal ne reçoit aucune donnée identifiante et ne conserve aucun enregistrement ; accès par jeton, avec limitation du débit. |
| Stockage | Magasin privé (non accessible publiquement), séparé par environnement ; aucun secret dans le code. |

## À faire avant le pilote

1. **Analyse d'impact (AIPD)** sur le traitement, avec la grille de la CDP.
2. **Dossier d'autorisation CDP** : finalités, catégories de données, destinataires, durées, mesures de sécurité (ce document en est la base).
3. **Base de données de production** : PostgreSQL hébergé avec chiffrement au repos, sauvegardes chiffrées, journalisation des accès. Choisir l'hébergement en fonction des exigences de la CDP sur les transferts hors du Sénégal.
4. **Durées de conservation** : dossier actif pendant le suivi, puis archivage limité (proposition : 2 ans après la clôture, à valider), puis effacement ou anonymisation.
5. **Délégué à la protection des données** désigné au sein de Jongoma Tech, et procédure de **notification des violations** de données.
6. **Contrats** avec les structures et associations partenaires (rôles, confidentialité, accès).
7. **Formation des référentes** : confidentialité, téléphone partagé, signalement des violences vers les services compétents.
8. **Consentement à l'oral en wolof**, avec une fiche lue et expliquée (voir `PILOTE.md`).
9. **Consentement distinct pour l'entraînement du modèle d'IA** sur les données du pilote.
10. **Jeunes filles mineures** : définir avec la CDP, un juriste et les services de protection de l'enfance qui consent pour une mineure (elle-même, un parent, un adulte de confiance), sans que l'exigence d'un parent n'écarte une adolescente du suivi. Le statut « jeune fille » est déclaré par elle-même (aucune date de naissance), ne sert jamais au score ni au modèle d'IA, seulement à adapter l'accompagnement et à contrôler l'équité.
