# Jongoma Care

> **English summary.** Jongoma Care is an open-source platform by Jongoma Tech (Senegal) for maternal follow-up of women and girls. Each consenting woman gets a named human referent from registration to postnatal care, backed by reminders, local-language audio, a verified facility directory, explainable call-back prioritisation, newborn and vaccination follow-up, an optional Wolof voice layer (prototype) and a public open-data dashboard. This repository is a **working prototype with fictitious data**.
>
> **Live demo:** https://jongoma-care.vercel.app · **Licence:** Apache-2.0

Plateforme numérique inclusive pour la santé, le bien-être et la protection des femmes et des filles. **Ce dépôt est un prototype : toutes les données sont fictives.**

## Fonctionnalités du prototype

| Espace | Route | Exigences couvertes |
| --- | --- | --- |
| Inscription avec consentements séparés, audio, données minimales | `/femme/inscription` | F-01, F-02, F-03, F-39 |
| Espace bénéficiaire : référente, date prévue indicative, calendrier, capsules audio, préférences | `/femme` | F-04 à F-07, F-11, F-31, F-34 |
| Répertoire vérifié, statut de partenariat, signalement | `/structures` | F-08, F-09, F-19, F-23, F-24 |
| Demande de mise en relation et suivi du statut | `/structures`, `/femme` | F-20 |
| Tableau de bord de la référente avec score de priorisation expliqué | `/personnel` | F-30, F-33 |
| Plan de suivi individuel, vérification des RDV, orientations avec consentement, escalade | `/personnel/beneficiaire/[id]` | F-26 à F-28, F-32 |
| Coordination : charge, affectation, réaffectation, journal d'audit | `/coordination` | F-15, F-25 |
| Spécialistes : orientations reçues, correction de la date prévue (sage-femme) | `/specialiste` | F-05, F-28 |
| Établissement partenaire : répondre aux demandes, confirmer les RDV | `/etablissement` | F-21, F-22 |
| Données ouvertes agrégées, seuil d'effectif, export CSV | `/donnees`, `/api/donnees` | F-16, F-36 |
| Réponse de la bénéficiaire aux orientations proposées, annulation de demande | `/femme` | F-20, F-28 |
| Export de ses données (JSON) et suppression de son compte | `/femme`, `/api/mes-donnees` | Droits d'accès et d'effacement |
| File des rappels (texte prêt à envoyer, mode discret), appels sans réponse, filtres | `/personnel` | F-07, F-33 |
| Passage en postnatal : calendrier CPoN généré, CPN futures annulées ; historique du suivi | `/personnel/beneficiaire/[id]` | F-26 |
| Affectation automatique, traitement des signalements du répertoire | `/coordination` | F-15, F-24 |
| Replanification d'un RDV par l'établissement, agenda confirmé à 14 jours | `/etablissement` | F-22 |

Principes appliqués dans le code :

- **Cloisonnement des accès** (F-29) : chaque page et chaque action serveur vérifie le rôle et le périmètre ([src/lib/session.ts](src/lib/session.ts), [src/lib/actions.ts](src/lib/actions.ts)).
- **Aucune confirmation automatique** de rendez-vous : seule la structure confirme (F-22).
- **Séparation identité / suivi** dans le modèle de données ([src/lib/types.ts](src/lib/types.ts)).
- **IA explicable et refusable** : le score de priorisation est une liste de règles documentées ([src/lib/priority.ts](src/lib/priority.ts)) ; il n'utilise ni l'âge, ni les données de santé mentale ou de protection.
- **Données ouvertes** : toute valeur calculée sur moins de 5 personnes est masquée ([src/lib/opendata.ts](src/lib/opendata.ts)).

## Démarrer

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000, puis « Se connecter ». La page de connexion liste les comptes de démonstration :

| Espace | Identifiant | Secret |
| --- | --- | --- |
| Personnel (référentes, coordinatrice, spécialistes, établissements) | `prenom@demo.jongoma.care`, `accueil.<zone>@demo.jongoma.care` | `Demo2026!` |
| Bénéficiaires | `77 000 10 01`, `77 000 10 02`, `77 000 10 03` | code `1234` |

Les données sont générées au premier lancement dans `.data/db.json` ; le lien « Réinitialiser » de la page de connexion les régénère.

Par défaut, la plateforme tourne en **environnement de démonstration** : données d'exemple générées, comptes d'essai et mention discrète « Données d'exemple » sur les écrans d'indicateurs. Avec les données réelles du pilote, définir `JONGOMA_DONNEES=reelles` : la mention, les comptes d'essai et la réinitialisation disparaissent.

En production, définir `SESSION_SECRET` (chaîne aléatoire d'au moins 32 caractères) pour signer les sessions.

## Programmes de santé

Jongoma Care cible la prévention et le dépistage des maladies prioritaires en santé maternelle ([src/lib/programmes.ts](src/lib/programmes.ts)) : paludisme pendant la grossesse, anémie, triple élimination (VIH, syphilis, hépatite B), hypertension et prééclampsie, tétanos, santé mentale après la naissance, cancer du col. La plateforme ne diagnostique pas et **n'enregistre jamais de résultat d'examen** : seulement si une action a été faite ou refusée. Les échéances sont provisoires, à aligner sur le protocole national. Les actions en retard (hors santé mentale) alimentent le score de priorisation.

## Langues

L'interface existe en **français** (par défaut) et en **anglais**, avec un sélecteur FR | EN dans l'en-tête et dans l'espace professionnel ; le choix est mémorisé dans un cookie. Sont traduits : le site public (accueil, à propos, répertoire, données ouvertes), toutes les pages de connexion et d'inscription, la navigation de l'espace professionnel et le tableau de bord de la coordinatrice. Les autres écrans de travail restent en français pour l'instant. Le wolof est porté par les contenus audio.

## Authentification

- **Bénéficiaires** : téléphone + code PIN à 4 chiffres, créés à l'inscription (`/femme/inscription`).
- **Personnel** : e-mail + mot de passe (8 caractères, lettre et chiffre). L'inscription (`/inscription/personnel`) crée une **demande d'accès** que la coordinatrice valide dans `/coordination/comptes`.
- Secrets chiffrés avec scrypt et sel aléatoire ; jamais stockés en clair ([src/lib/auth.ts](src/lib/auth.ts)).
- Session dans un cookie httpOnly signé HMAC-SHA256, expirant après 2 h d'inactivité ; un compte désactivé perd l'accès immédiatement ([src/lib/session.ts](src/lib/session.ts)).
- 5 tentatives échouées bloquent l'identifiant 15 minutes ; le message d'erreur ne révèle pas si le compte existe.

## Tableau de bord

Onglets de l'espace professionnel :

| Rôle | Onglets |
| --- | --- |
| Référente | Aujourd'hui (file d'appels, vérifications, rappels), Agenda, Orientations, Mes statistiques |
| Coordinatrice | Tableau de bord, Affectations, Équipe, Structures (statut de partenariat, ajout), Carte des besoins, IA et équité (fiche du modèle, écarts par zone et langue), Comptes et accès, Rapport imprimable, Journal d'audit |
| Spécialiste | Orientations reçues (à prendre en charge, en cours, terminées) |
| Établissement | Demandes et rendez-vous, Agenda, Statistiques, Ma fiche (horaires, téléphone, services) |
| Tous | Notifications (alertes calculées par rôle), Répertoire, Contenus audio, Protocole (calendrier, escalade, règles du score), Données ouvertes, Mon compte (changement de mot de passe) |

L'espace professionnel (`src/app/(pro)`) a une barre latérale par rôle. La coordinatrice dispose d'un tableau de bord : indicateurs clés, alertes à traiter, taux de rendez-vous honorés par semaine, charge des référentes, inscriptions, répartition par étape et vue par zone. Les graphiques sont en SVG rendu côté serveur, avec info-bulle et tableau de données accessible ([src/components/Graphiques.tsx](src/components/Graphiques.tsx)).

## Architecture

- **React 19** (composants serveur et client) avec **Next.js 16** (App Router, actions serveur), TypeScript, Tailwind CSS.
- Stockage du prototype : mémoire + fichier JSON ([src/lib/db.ts](src/lib/db.ts)). Version pilote : PostgreSQL.
- Audio : enregistrements natifs si disponibles, sinon synthèse vocale du navigateur (français uniquement : les navigateurs n'ont pas de voix wolof).

## Ce qui reste à faire avant un pilote

- [ ] Double authentification pour le personnel, réinitialisation de mot de passe par SMS ou e-mail, chiffrement des données au repos.
- [ ] Base PostgreSQL, sauvegardes chiffrées, environnement de test séparé.
- [ ] Passerelle SMS agréée et tâches planifiées de rappels.
- [ ] Capsules audio wolof enregistrées par des locutrices natives et validées par des sages-femmes.
- [ ] Validation clinique du protocole (calendrier CPN/CPoN, procédure d'escalade, poids du score).
- [ ] Analyse d'impact relative à la protection des données et avis juridique (CDP Sénégal).
- [ ] Parcours protection et psychosocial co-conçus avec des experts.
- [ ] Phase 2 : IVR, assistant encadré, HL7 FHIR / DHIS2, cartographie.

## Licence

Apache-2.0 : voir [LICENSE](LICENSE) et [NOTICE](NOTICE). Les modèles du service vocal wolof (Adia_TTS, Whosper) sont eux aussi sous Apache-2.0. Ne jamais publier de données réelles, de secrets ou de dossiers de bénéficiaires.
