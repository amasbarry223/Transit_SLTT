# Prompt Claude Code — Architecture Multi-Annexe SLTT (Mali / Côte d'Ivoire)

> À copier-coller tel quel dans Claude Code, à la racine du repo SLTT. Joins la facture PDF de l'annexe Côte d'Ivoire dans le contexte si possible (utile pour la numérotation, l'en-tête, les mentions légales CI).

---

## RÔLE

Tu es un développeur full-stack senior, expert en architecture applicative pour logiciels métier B2B (logistique, transit, douane). Tu maîtrises particulièrement la modélisation de données multi-entités/multi-sites et les pièges classiques de ce type d'architecture (fuite de données entre entités, numérotation de documents, permissions).

Stack du projet : PostgreSQL en accès direct (SQL / query builder — **pas de Prisma**), backend + frontend existants à identifier toi-même dans le repo.

## ÉTAPE 0 — ANALYSE OBLIGATOIRE (ne rien coder avant cette étape)

Avant toute modification, analyse le code existant et produis un rapport court (pas de code) qui répond à :

1. **Structure des données actuelle** : quelles tables/entités existent pour Clients, Devis, Dossiers, Factures, Entreposage, Contrats, Bons de sortie, Archives, Fournisseurs, Transporteurs, Calendrier, Comptabilité, Bilans ? Schéma exact (colonnes, clés étrangères).
2. **Où vit déjà la notion de société** (SLTT vs Top Doumani) : y a-t-il déjà une colonne/table `societe_id` ou équivalent ? Comment est-elle utilisée dans les requêtes et l'UI actuellement ?
3. **Numérotation des documents** : comment sont générés aujourd'hui les numéros de facture, devis, dossier, bon de sortie ? (séquence globale, format, préfixe)
4. **Frontend** : comment la navigation entre les 13 onglets est structurée (routing, layout, state global) ? Où est le point d'entrée pour ajouter un sélecteur global (topbar, sidebar, contexte React/Vue) ?
5. **Auth/permissions** : existe-t-il déjà une notion d'utilisateur rattaché à une société ou un site ?
6. **Points de friction UX actuels** que tu observes dans le code (formulaires trop longs, absence de filtres, etc.) — pertinent pour la contrainte de simplicité ci-dessous.

Ne passe à l'étape 1 qu'après avoir présenté ce rapport.

## CONTEXTE MÉTIER

La société **SLTT (Société Traoré de Logistique, Transit et Transport)** opère avec deux structures qui utilisent la même plateforme :
- La société **Top Doumani** (déjà gérée dans l'app comme une société distincte de SLTT)
- **SLTT elle-même possède deux annexes physiques distinctes** :
  - **Annexe Mali** (siège / origine des données existantes)
  - **Annexe Côte d'Ivoire** (nouvelle, exemple de facture fourni en pièce jointe)

Chaque annexe SLTT doit avoir sa **comptabilité et ses données strictement séparées** : ses propres clients, son propre entreposage, sa propre douane, ses propres dossiers, etc. Une annexe ne doit jamais voir ni mélanger les données de l'autre annexe — comme deux back-offices indépendants qui partagent la même interface.

**Important — hiérarchie à respecter** : ceci est une dimension supplémentaire à celle qui existe déjà entre SLTT et Top Doumani. Ne pas confondre :
- **Société** : SLTT / Top Doumani (niveau déjà existant)
- **Annexe** (nouveau niveau, uniquement pertinent pour SLTT) : Mali / Côte d'Ivoire

Top Doumani n'a pas d'annexe — la notion d'annexe ne s'applique qu'à SLTT.

## ONGLETS CONCERNÉS PAR LA LOGIQUE MULTI-ANNEXE

Les 13 onglets suivants doivent tous respecter le cloisonnement par annexe pour SLTT :

Clients, Devis, Dossiers, Factures, Entreposage, Contrats, Bons de sortie, Archives, Fournisseurs, Transporteurs, Calendrier, Comptabilité, Bilans.

Pour chacun, la logique attendue est la même : les données créées/consultées dépendent de l'annexe active sélectionnée.

## EXIGENCES FONCTIONNELLES

### 1. Isolation des données par annexe
- Toute table métier liée à SLTT doit porter une référence d'annexe (`annexe_id` ou équivalent), en plus de la référence société existante.
- Toutes les requêtes de lecture/écriture doivent être filtrées par l'annexe active — au niveau backend, pas seulement au niveau UI (sécurité : un filtre uniquement frontend est insuffisant).
- Les agrégats (Comptabilité, Bilans) doivent être calculés **par annexe**, avec la possibilité d'une vue consolidée SLTT globale (Mali + CI) réservée à un rôle admin/direction si cela existe déjà dans le système de permissions.

### 2. Sélecteur d'annexe
- Un sélecteur d'annexe global et permanent (ex. dans la topbar), visible uniquement quand la société active est SLTT (masqué pour Top Doumani).
- Le changement d'annexe doit rafraîchir le contexte de toute l'application sans rechargement complet si l'architecture actuelle le permet.
- L'annexe active doit être mémorisée (session utilisateur) pour éviter de la resélectionner à chaque connexion.

### 3. Numérotation des documents
- Factures, devis, dossiers, bons de sortie doivent avoir une numérotation **séparée par annexe** (ex. préfixe `ML-` pour Mali, `CI-` pour Côte d'Ivoire), pour rester cohérent avec les usages comptables/douaniers locaux distincts.
- Analyser la facture CI fournie pour aligner le format d'en-tête, mentions légales et numérotation attendus côté Côte d'Ivoire.

### 4. Migration des données existantes
- Toutes les données SLTT actuelles en base doivent être rattachées par défaut à l'**Annexe Mali** lors de la migration (aucune donnée orpheline).
- Fournir un script de migration réversible (avec plan de rollback).

### 5. Création d'une nouvelle annexe
- Prévoir que la structure reste extensible si une 3e annexe devait un jour être ajoutée (éviter un modèle figé à seulement deux valeurs codées en dur).

## CONTRAINTE UX — PRIORITÉ ABSOLUE

L'application doit rester **simple, intuitive, sans friction**. Cette contrainte prime sur l'exhaustivité fonctionnelle :
- Le sélecteur d'annexe ne doit pas ajouter de clics inutiles au quotidien pour un utilisateur qui travaille toujours sur la même annexe.
- Ne pas dupliquer la navigation (pas de 13 onglets x 2 = 26 onglets) : les mêmes onglets restent, seul le contenu change selon l'annexe active.
- Éviter tout écran de configuration complexe pour un besoin qui doit rester transparent pour l'utilisateur final.

## CONTRAINTES TECHNIQUES

- Pas de Prisma : rester cohérent avec l'accès SQL/PostgreSQL direct déjà en place dans le projet.
- Respecter les patterns et conventions déjà utilisés dans le repo (nommage, structure de dossiers, style de requêtes) — à identifier lors de l'étape 0.

## LIVRABLES ATTENDUS

1. Le rapport d'analyse (étape 0).
2. Un plan technique détaillé : modifications de schéma (tables/colonnes touchées), stratégie de migration, modifications backend (requêtes, endpoints), modifications frontend (sélecteur, contexte global, filtres par onglet).
3. Une implémentation par étapes, en commençant par la couche données, puis le backend, puis le frontend — en validant chaque étape avant de passer à la suivante plutôt que de tout livrer d'un bloc.
4. Un résumé des risques identifiés (ex. fuite de données entre annexes, doublons de numérotation) et comment ils sont couverts.

---

**Ne commence pas l'implémentation avant d'avoir présenté le rapport de l'étape 0 et obtenu validation.**