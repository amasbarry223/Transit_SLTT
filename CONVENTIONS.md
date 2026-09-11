# Conventions — Transit SLTT

Référence pour tout code nouveau ou modifié dans ce dépôt (frontend Next.js
`src/` + backend NestJS `api/src/`). Documente ce qui est **déjà en place**
(vérifié dans le code, pas aspirationnel) et ce qui est **visé** pour le
code écrit à partir de maintenant.

## 1. Structure des fichiers

**Déjà en place** — ne pas réintroduire l'ancienne structure plate :

```
src/
├── app/                    # routes Next.js (App Router)
├── features/[feature]/     # domaine métier : dossiers, clients, devis, factures…
│   ├── components/
│   ├── hooks/               (ou co-localisés dans components/use-*.ts)
│   ├── services/
│   ├── types/
│   └── index.ts             # API publique du module — c'est par ce fichier
│                             # qu'on importe le module depuis l'extérieur
├── shared/                 # transverse, sans logique métier
│   ├── components/ui/       # primitives shadcn — génériques, jamais de logique métier
│   ├── hooks/
│   ├── errors/               # AppError, ValidationError, NotFoundError…
│   ├── result/                # Result<T, E>
│   └── utils/
├── lib/                    # legacy pré-migration `features/` — store Zustand,
│                             # domain-types, export/impression, permissions…
│                             # Nouveau code métier va dans features/, pas ici.
└── styles/
```

Migration `src/` plat → `features/` + `shared/` effectuée le 2026-09-09
(shims de compatibilité retirés). `src/lib/` reste le foyer légitime du
store global (Zustand), des types de domaine partagés entre plusieurs
features, et des modules d'impression/export — ce n'est pas du code à
« migrer » systématiquement vers `features/`, seulement le point où vit
tout ce qui est réellement transverse à plus d'une feature.

Backend (`api/src/`) : un module NestJS par domaine
(`modules/<domaine>/<domaine>.{module,controller,service}.ts`), déjà
conforme — pas de restructuration nécessaire.

## 2. Conventions de nommage

| Type | Casse | Exemple réel dans le dépôt |
|---|---|---|
| Composant React | PascalCase | `DossierCard`, `ClientFicheScreen` |
| Hook | camelCase, préfixe `use` | `useDossiersListScreen`, `useActiveAnnexe` |
| Service (front, appels API) | camelCase, suffixe `Service` | `clientService` |
| Service NestJS (backend) | PascalCase, suffixe `Service` | `FacturesService`, `DossiersService` |
| Constante | UPPER_SNAKE_CASE | `DEFAULT_TVA_RATE`, `MS_PER_DAY` |
| Booléen (variable/prop) | `is`/`has`/`can`/`should` | `isLoading`, `canWrite`, `hasActiveFilters` |
| Handler d'événement | préfixe `handle` | `handleSaveForm`, `handleExportPDF` |
| Fichier composant | kebab-case (pas PascalCase) | `dossier-card.tsx` exporte `DossierCard` |
| Fichier hook/service/lib | kebab-case | `use-dossiers-list-screen.ts` |

Note : ce dépôt nomme les **fichiers** en kebab-case même pour les
composants (convention Next.js/shadcn établie), alors que l'**export**
nommé à l'intérieur reste en PascalCase. Ne pas renommer les fichiers en
PascalCase — ce serait la convention inverse de celle déjà utilisée dans
les 450+ fichiers existants.

## 3. Clean code

- **Fonctions courtes** : viser une seule responsabilité par fonction.
  Pour un composant React, la limite raisonnable porte sur la **logique**
  (un hook `use-*-screen.ts` qui dépasse ~150 lignes est un signal pour
  extraire des sous-hooks), pas sur le JSX de rendu — un corps de rendu de
  40-60 lignes pour un écran avec plusieurs sections est normal en React
  et ne doit pas être saucissonné artificiellement en composants sans
  identité propre.
- **Pas de magic number / magic string** : passer par une constante nommée
  (`src/lib/constants/*.ts` côté front) ou un enum Prisma (côté API).
  Exception assumée : les libellés UI en français directement dans le JSX
  (pas de couche i18n dans ce projet) et les classes Tailwind.
- **Early return** plutôt que l'imbrication de `if`.
- **Nommage expressif** : pas d'abréviation opaque (`dd`/`fc`/`fp` existent
  encore par endroits comme raccourcis de `droitDouane`/`fraisCircuit`/
  `fraisPrestation` dans du code plus ancien — à éviter dans le code neuf,
  préférer le nom complet ou un nom de variable qui porte le sens).
- **Commentaires** : expliquent le *pourquoi* (une règle métier, un piège
  évité, une divergence avec ce qu'on attendrait) — jamais le *quoi*
  (`// incrémente x` au-dessus de `x++`). Le code de ce dépôt commente
  abondamment les règles métier non évidentes (ex. pourquoi un dossier
  facturé cède son montant à sa facture) — continuer sur ce modèle.

## 4. SOLID (adapté à React + NestJS, pas à un design purement OO)

- **S — Single Responsibility** : un hook `use-*-screen.ts` orchestre l'état
  d'un écran, un fichier `*-table.tsx`/`*-card.tsx` ne fait que du rendu, un
  service NestJS ne fait que l'accès aux données + règles métier de son
  domaine (pas de HTTP, pas de présentation).
- **O — Ouvert/fermé** : étendre par composition (nouvelles props, nouveaux
  hooks) plutôt que par branches `if (type === ...)` qui s'accumulent dans
  une fonction déjà en place.
- **I — Interfaces ciblées** : props de composant et DTO ne portent que ce
  dont le composant/l'endpoint a besoin — ne pas faire transiter un objet
  domaine entier (`Dossier` complet) quand 3 champs suffisent.
- **D — Dépendre des abstractions** : les services NestJS dépendent de
  `PrismaService` (déjà injecté partout, jamais de `new PrismaClient()`
  ailleurs) ; le front dépend de `@/lib/api-client` (`api.*`), jamais de
  `fetch()` direct vers l'API en dehors de ce client.

## 5. Gestion des erreurs

**Déjà en place, à réutiliser (pas à recréer)** :

- Hiérarchie d'erreurs : `AppError` (base), `ValidationError`,
  `NotFoundError`, `UnauthorizedError` — `src/shared/errors/`.
- Result Pattern : `Result<T, E>` (`{ok:true,value}` / `{ok:false,error}`),
  `ok()`/`err()` — `src/shared/result/`. Utilisé dans les services front
  qui appellent l'API (`clientService.create/update/delete` par exemple) ;
  à privilégier pour tout nouveau service front plutôt qu'un `try/catch`
  qui remonte une exception brute au composant appelant.
- Backend : NestJS gère les erreurs par exceptions (`NotFoundException`,
  `BadRequestException`, `ForbiddenException`, `ConflictException`) +
  `PrismaExceptionFilter` global qui traduit les erreurs Prisma (violation
  de contrainte, enregistrement introuvable) en réponses HTTP correctes
  plutôt qu'un 500 générique — c'est la convention NestJS standard, ne pas
  la remplacer par un Result Pattern côté API.
- **Jamais de `catch` vide** — au minimum logger via `logWarn`/`logError`
  (`@/shared/logger`), jamais avaler silencieusement une erreur métier.
  Un `catch {}` vide reste acceptable seulement pour du nettoyage best-effort
  documenté comme tel (ex. suppression de fichier physique où l'échec ne
  doit pas bloquer la suppression logique — commenter pourquoi).
- **Logging structuré** : `logWarn(message, error?, payload?)` /
  `logError(...)` — jamais `console.log`/`console.error` dans le code
  applicatif (seul `src/shared/logger/logger.ts` a le droit d'appeler
  `console.*`, c'est son rôle).

## 6. Typage strict

- `strict: true` déjà actif dans `tsconfig.json` (front) et `api/tsconfig.json`
  (backend) — ne jamais l'affaiblir.
- **`any` à éviter dans le code neuf** — ne pas en introduire par facilité.
  Le code existant en contient encore, en particulier côté API
  (`@Body() body: any` sur la plupart des controllers, `data: any` dans les
  services) : ce n'est pas la cible, mais corriger l'existant est un chantier
  à part (voir note en fin de document), pas une règle à appliquer
  rétroactivement à chaque fichier touché en passant.
- **Zod pour valider les données externes** côté front (`src/lib/schemas/`,
  `src/features/*/schemas/`) — déjà la convention pour les formulaires et
  imports Excel. Zod n'est pas utilisé côté API aujourd'hui (les DTO
  NestJS n'existent pas encore sur la plupart des endpoints, qui acceptent
  `any` et laissent Prisma lever une erreur de contrainte le cas échéant) —
  introduire des DTO `class-validator` (convention NestJS native) plutôt que
  Zod côté backend, pour rester cohérent avec le `ValidationPipe` global
  déjà configuré (`whitelist: true, forbidNonWhitelisted: true`).
- **Types utilitaires partagés** : `src/lib/domain-types.ts` (front) est la
  source de vérité des types métier partagés entre features — pas de
  redéfinition locale d'un type déjà présent là.

## État réel vs. cible (audit du 2026-09-11)

| Point | État |
|---|---|
| Structure `features/` + `shared/` | ✅ Déjà en place |
| `tsconfig strict: true` | ✅ Déjà actif (front + API) |
| Hiérarchie d'erreurs + Result Pattern | ✅ Déjà en place (`shared/errors`, `shared/result`) |
| `console.log`/`debugger` résiduels | ✅ Aucun (audit du même jour) |
| `any` éliminé | ❌ ~271 occurrences (122 front, 149 API) — chantier séparé, à scoper |
| Toute fonction < 20 lignes | ⚠️ Non mesuré strictement — beaucoup de rendus React de bonne taille, quelques fichiers de 500-800 lignes (`ocr-review-dialog.tsx`, `dossier-detail-screen.tsx`, `stock-bulk-import-dialog.tsx`…) qui gagneraient à être décomposés |
| DTO validés (Zod/class-validator) sur chaque endpoint API | ❌ La plupart des controllers acceptent `@Body() body: any` sans DTO |

Le dépôt fait **~64 000 lignes sur 543 fichiers** (453 front + 90 API),
en usage réel. Éliminer les ~271 `any` et découper les plus gros fichiers
correctement (pas mécaniquement) représente un chantier de plusieurs
sessions à mener module par module, avec vérification (`tsc`/`eslint`/
`vitest`/build) à chaque étape — pas une réécriture en une seule passe,
qui serait le moyen le plus sûr d'introduire des régressions silencieuses
sur une application qui n'a pas de tests de composants (seulement des
tests unitaires sur les fonctions pures de `lib/`).
