# Audit migration Supabase/Prisma → NestJS

**Date** : 2026-09-11
**Statut** : Audit terminé — **aucune modification de code effectuée**, conformément à l'Étape 1 du prompt ("ne commence aucune modification avant d'avoir présenté ce rapport et obtenu validation").

## Résumé — la prémisse du prompt ne correspond pas à l'état réel du dépôt

Le prompt part de l'hypothèse d'un mélange à trois : du code Supabase encore actif, du code Prisma à remplacer, et des modules déjà migrés en NestJS avec un autre ORM. Après audit complet du dépôt (recherche `@supabase`, `supabase-js`, `SUPABASE`, `PrismaClient`, `schema.prisma`, inspection de `package.json` et `node_modules`), l'état réel est différent :

| Élément recherché | Résultat |
|---|---|
| Dépendance `@supabase/*` dans `package.json` (front ou `api/`) | **Absente** |
| Package `@supabase/*` installé dans `node_modules` | **Absent** |
| Variable d'environnement `SUPABASE_*` (`.env`, `.env.local`, front ou API) | **Aucune** |
| Import `supabase-js` / `createClient` Supabase dans le code source | **Aucun** |
| Occurrences du mot « supabase » dans `src/` et `api/src/` | 5 fichiers, **tous des commentaires** documentant une migration *déjà effectuée* (voir détail ci-dessous) — aucun code exécutable |
| Backend | 100 % NestJS (`api/src/**/*.module.ts`, `*.controller.ts`, `*.service.ts` — modules `auth`, `clients`, `dossiers`, `factures`, `devis`, `stock`, `bons`, `comptabilite`, `backup`, etc.) |
| ORM du backend NestJS | **Prisma** — `PrismaService`/`PrismaClient` injectés dans les ~20 services NestJS du projet, `api/prisma/schema.prisma` activement maintenu (dernière modification : ce jour-même, ajout de la colonne `Client.annexeId`) |
| Auth | JWT (Passport `passport-jwt` + `@nestjs/jwt`), guards `JwtAuthGuard`/`PermissionsGuard`/`RolesGuard` — aucune dépendance à Supabase Auth |
| Storage fichiers | Upload disque local (`multer` + `diskStorage`, dossier `uploads/`) — aucune dépendance à Supabase Storage |
| Realtime / Edge Functions | Aucun usage trouvé, aucune dépendance associée |

**Conclusion** : ce dépôt **a déjà été migré de Supabase vers NestJS + Prisma** avant le début de cette session (les commentaires ci-dessous en portent la trace explicite) et **n'a jamais utilisé TypeORM ni un autre ORM** — Prisma est l'ORM natif de tout le backend NestJS actuel, pas un vestige à remplacer.

## Traces des 5 commentaires trouvés (documentent une migration passée, aucun code actif)

- `src/lib/api-client.ts:3` — *"Remplace l'accès direct Supabase par des appels HTTP REST sécurisés et typés"*
- `src/lib/auth/require-admin.ts:43` — *"Remplace définitivement l'ancien auth Supabase"*
- `src/lib/store/ecritures-slice.ts:6` — *"vestige de l'ère Supabase, sans modèle backend"* (le module `Ecriture` lui-même, pas du code Supabase — la collection reste vide en permanence côté store)
- `src/lib/store/fetch-pages.ts` — commentaire similaire sur la pagination héritée
- `src/shared/utils/error-messages.ts:27` — *"Messages bruts Supabase/Postgres (EN) → français"* (table de traduction de messages d'erreur Postgres génériques, sans dépendance au SDK Supabase)

## Ce que ferait ce prompt s'il était exécuté tel quel sur ce dépôt

- **Étape 1 (audit)** : ce document.
- **Étape 2 (ORM cible)** : n'a pas de sens ici — l'ORM cible (Prisma) est déjà en place et déjà utilisé de façon cohérente dans tous les modules NestJS existants. Remplacer Prisma par TypeORM sans raison métier serait une régression pure : ~20 services à réécrire, un schéma de 800+ lignes à retraduire, une base MySQL en production locale à faire correspondre à un nouvel ORM, pour un gain fonctionnel nul.
- **Étape 3 (migration module par module)** : rien à migrer, tous les modules sont déjà en NestJS/Prisma.
- **Étape 4 (nettoyage — suppression de `schema.prisma`, du dossier `prisma/`, des dépendances `@prisma/*`)** : **destructrice et incorrecte** dans l'état actuel — supprimerait l'unique couche d'accès aux données de toute l'API (facturation, dossiers, stock, comptabilité, sauvegarde…), qui fonctionne et a été activement corrigée/durcie durant cette session (plusieurs commits de bugfix cette semaine, dont une migration de schéma ce jour).
- **Étape 5 (vérification)** : sans base de données fonctionnelle, l'application ne démarrerait plus.

## Recommandation

Ne pas exécuter les étapes 2 à 5 telles quelles. Si le besoin réel est différent de la lecture littérale du prompt, il serait utile de préciser :

1. **Si le prompt visait un autre dépôt/une autre branche** — dans ce cas rien à faire ici.
2. **S'il s'agit d'écarter Prisma au profit de TypeORM par préférence d'architecture** — c'est un choix légitime mais un chantier majeur (réécriture de tous les services, du schéma, des migrations), à cadrer spécifiquement plutôt que sous l'angle "suppression de code Supabase" qui n'a pas lieu d'être ici.
3. **S'il s'agissait de vérifier qu'aucune trace de Supabase ne traîne** — c'est fait : confirmé négatif, rien à nettoyer.

Aucune suppression de fichier, dépendance ou variable d'environnement n'a été effectuée. J'attends une confirmation avant d'aller plus loin dans une direction ou une autre.
