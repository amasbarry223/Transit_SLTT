# Conventions de code — Transit SLTT

Ce document décrit l'architecture cible, les conventions de nommage et les patterns à suivre pour tout nouveau code et chaque migration de feature.

## Structure des dossiers

```
src/
├── app/                    # Routes Next.js (pages minces)
├── features/[feature]/     # Domaines métier
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── schemas/            # Zod (validation aux frontières)
│   └── index.ts            # API publique de la feature
├── shared/                 # Code transversal
│   ├── components/ui/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   ├── errors/
│   ├── result/
│   ├── logger/
│   └── constants/
├── styles/                 # CSS global
└── lib/                    # Legacy en transition (store Zustand, etc.)
```

Chaque feature expose uniquement ce qui est nécessaire via son `index.ts`. Les imports internes restent relatifs à la feature.

## Conventions de nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Composants React | PascalCase | `UserCard.tsx` |
| Hooks | camelCase, préfixe `use` | `useUserData.ts` |
| Services | camelCase, suffixe `Service` | `clientService.ts` |
| Constantes | UPPER_SNAKE | `SLTT_SOCIETE_ID` |
| Booléens | préfixes `is`, `has`, `can` | `isLoading`, `hasError` |
| Handlers d'événements | préfixe `handle` | `handleSubmit` |
| Types / interfaces | PascalCase | `Client`, `ClientInput` |
| Fichiers de schéma Zod | kebab-case + `-schema` | `client-schema.ts` |

## Clean code

- **Fonctions ≤ 20 lignes** pour le nouveau code et le code refactoré lors d'une migration.
- **Early returns** : éviter l'imbrication profonde.
- **Pas de magic numbers/strings** : extraire dans `shared/constants/` ou constantes locales nommées.
- **Commentaires = POURQUOI**, pas QUOI. Le code doit être auto-explicatif.
- **Nommage expressif** : pas d'abréviations obscures.

## Principes SOLID

- **S (Single Responsibility)** : un service = une responsabilité (ex. `clientService` pour le CRUD Supabase).
- **O (Open/Closed)** : étendre via nouvelles implémentations, pas en modifiant le cœur.
- **I (Interface Segregation)** : types ciblés (`ClientInput` vs `Client`), pas de god-objects.
- **D (Dependency Inversion)** : les slices Zustand délèguent aux services ; les composants consomment hooks/services, pas Supabase directement.

Les slices Zustand restent des **adaptateurs d'état UI** : orchestration, cache local, audit. La logique métier et persistance vivent dans `features/*/services/`.

## Gestion des erreurs

Hiérarchie dans `src/shared/errors/` :

- `AppError` — base avec `code` et `cause`
- `ValidationError` — entrées invalides (400)
- `NotFoundError` — ressource absente (404)
- `UnauthorizedError` — accès refusé (403/401)

**Result pattern** (`src/shared/result/`) pour les services :

```typescript
const result = await clientService.create(input);
if (!result.ok) throw result.error;
return result.value;
```

Règles :

- Jamais de `catch` vide.
- Pas de `console.log` en production : utiliser `logInfo`, `logWarn`, `logError` de `@/shared/logger`.
- Les messages utilisateur passent par `@/shared/utils/error-messages`.

## Typage strict

- `strict: true` dans `tsconfig.json` (déjà actif).
- Interdiction de `any` — utiliser `unknown` + garde de type.
- **Zod** pour valider toute donnée externe (API, Supabase, imports fichier).
- Types DB dans `features/*/types/` ou `shared/types/` ; mapper DB → domaine dans `*-mapper.ts`.

## Imports

Alias TypeScript :

- `@/shared/*` — code transversal
- `@/features/*` — domaines métier
- `@/*` — reste du projet (legacy en transition)

Pendant la migration, des re-exports de compatibilité existent dans les anciens chemins (`@/components/ui`, `@/hooks`, `@/lib/errors`).

## Migration en cours

| Statut | Feature | Emplacement |
|--------|---------|-------------|
| Migré | `clients` | `@/features/clients` — service + slice aminci |
| Migré | `devis` | `@/features/devis` — types + mapper extraits |
| Migré | `contrats`, `fournisseurs`, `factures`, `bons` | `@/features/*` |
| Migré | `dossiers`, `entreposage`, `comptabilite` | `@/features/*` |
| Migré | `archives`, `recus-paiement`, `parametres` | `@/features/*` |
| Migré | `dashboard`, `auth`, `calendrier`, `bilans`, `transporteurs` | `@/features/*` |
| Legacy | Composants transverses (layout, dialogs, badges…) | `@/components/sltt/` → à migrer vers `@/shared/components/` |
| Legacy | Store Zustand | `@/lib/store.ts` + slices |
| Legacy | Types restants | `@/lib/domain-types.ts` → scinder progressivement |

Les anciens chemins `@/components/sltt/*`, `@/hooks`, `@/components/ui` restent disponibles via re-exports `@deprecated` le temps de la transition.

## Ce qui ne change pas

- Pattern SPA (`AppRoot` + `RouteSync` + `ViewRoutePage`)
- Routes API dans `src/app/api/`
- Store Zustand central jusqu'à migration complète des services
