# Graph Report - Transit_SLTT  (2026-07-21)

## Corpus Check
- 252 files · ~682,668 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1255 nodes · 4350 edges · 102 communities (50 shown, 52 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `58c121b2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devis.tsx
- entreposage.tsx
- print-modules.ts
- store.ts
- dossiers-slice.ts
- require-admin.ts
- use-toast.ts
- domain-types.ts
- compilerOptions
- export.ts
- useStore
- route-sync.tsx
- nav-store.ts
- parametres.tsx
- client-fiche.tsx
- fournisseurs.tsx
- bilans.tsx
- transporteur-form-fields.tsx
- dependencies
- devDependencies
- dossier-detail-hero.tsx
- dossier-form.tsx
- permissions.ts
- dossier-detail.tsx
- components.json
- classeur.ts
- Writing Guidelines for Postgres References
- Supabase
- Dossier
- UserRole
- audit.ts
- 2. Fonctionnalités demandées
- file-drop-zone.tsx
- topbar.tsx
- scripts
- SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés
- dossier-detail-overview.tsx
- command-palette.tsx
- facture-detail.tsx
- Section Definitions
- archives-slice.ts
- 2026-07-14T18-50-10Z__ontrats-factures-comptabilite-entreposage-archives.md
- Product
- [0.1.3](https://github.com/supabase/agent-skills/compare/v0.1.2...v0.1.3) (2026-06-02)
- [1.2.0](https://github.com/supabase/agent-skills/compare/v1.1.1...v1.2.0) (2026-06-02)
- factures.tsx
- next.config.ts
- Supabase Postgres Best Practices
- eslint.config.mjs
- route.ts
- advanced-full-text-search.md
- advanced-jsonb-indexing.md
- conn-idle-timeout.md
- conn-limits.md
- conn-pooling.md
- conn-prepared-statements.md
- data-batch-inserts.md
- data-n-plus-one.md
- data-pagination.md
- data-upsert.md
- lock-advisory.md
- lock-deadlock-prevention.md
- lock-short-transactions.md
- lock-skip-locked.md
- monitor-explain-analyze.md
- monitor-pg-stat-statements.md
- monitor-vacuum-analyze.md
- query-composite-indexes.md
- query-covering-indexes.md
- query-index-types.md
- query-missing-indexes.md
- query-partial-indexes.md
- schema-constraints.md
- schema-data-types.md
- schema-foreign-key-indexes.md
- schema-lowercase-identifiers.md
- schema-partitioning.md
- schema-primary-keys.md
- security-privileges.md
- security-rls-basics.md
- security-rls-performance.md
- _template.md
- CLAUDE.md
- mcp.json
- lucide-react
- .mcp.json
- @radix-ui/react-alert-dialog
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-switch
- @radix-ui/react-tooltip
- react-dom
- @supabase/supabase-js
- tailwindcss-animate
- postcss.config.mjs
- tailwind.config.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 208 edges
2. `useStore` - 98 edges
3. `formatFCFA()` - 72 edges
4. `useNav` - 72 edges
5. `useToast()` - 71 edges
6. `formatDateShort()` - 53 edges
7. `usePermission()` - 47 edges
8. `Button()` - 44 edges
9. `SLTTState` - 42 edges
10. `Input()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `CalendrierScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/calendrier.tsx → package.json
- `DashboardScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/dashboard.tsx → package.json
- `GuideDemarrage()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/dashboard.tsx → package.json
- `FactureDetailScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/facture-detail.tsx → package.json
- `PaiementDialog()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/facture-detail.tsx → package.json

## Import Cycles
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`

## Communities (102 total, 52 thin omitted)

### Community 0 - "devis.tsx"
Cohesion: 0.11
Nodes (37): BonCaisseTabProps, BonMarchandiseTabProps, BON_MOTIFS, KpiCard(), FilterChip, ListFilters(), ListFiltersProps, ResponsiveColumn (+29 more)

### Community 1 - "entreposage.tsx"
Cohesion: 0.10
Nodes (35): BonCaisseFormDialogProps, CaisseLigneForm, BonFormDialogProps, ClientFormFields(), ClientFormFieldsProps, clientTypes, emptyClientForm(), PAIEMENT_MODES (+27 more)

### Community 2 - "print-modules.ts"
Cohesion: 0.10
Nodes (61): FactureDocumentHeader(), buildCsvBlob(), Column, csvCell(), downloadBlob(), encodeCsvForExcel(), exportToCSV(), htmlEscape() (+53 more)

### Community 3 - "store.ts"
Cohesion: 0.06
Nodes (20): DepenseInput, DevisStatut, FactureStatut, computeIncrementalPaye(), validatePaymentAmount(), canTransitionDevis(), canTransitionFacture(), DEVIS_ALLOWED_TRANSITIONS (+12 more)

### Community 4 - "dossiers-slice.ts"
Cohesion: 0.16
Nodes (15): DEFAULT_PAIEMENT_MODE, DOSSIER_STATUT_DEDOUANE, DOSSIER_STATUT_EN_COURS, DOSSIER_STATUT_SOLDE, CHART_COLORS, Ecriture, PaiementMode, applyEcritureSoldeToLocalState() (+7 more)

### Community 5 - "require-admin.ts"
Cohesion: 0.22
Nodes (16): POST(), RouteContext, AdminClient, assertCanTouchTarget(), assertNotLastActiveAdmin(), DELETE(), PATCH(), RouteContext (+8 more)

### Community 6 - "use-toast.ts"
Cohesion: 0.09
Nodes (27): inter, metadata, sora, ThemeEffect(), Toast, ToastAction, ToastActionElement, ToastClose (+19 more)

### Community 7 - "domain-types.ts"
Cohesion: 0.09
Nodes (35): BON_MOTIF_TONE, BON_STATUT_TONE, ConvertDevisDialogProps, syncContratStats(), BaseContrat, BonMotif, BonSortie, BonSortieCaisse (+27 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (31): dom, dom.iterable, esnext, examples, mini-services, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+23 more)

### Community 9 - "export.ts"
Cohesion: 0.35
Nodes (8): PATCH(), getAdminClient(), getAuthenticatedProfile(), getServerClient(), requireUser(), createAdminClient(), createServerClient(), getPublicKey()

### Community 10 - "useStore"
Cohesion: 0.05
Nodes (112): react, react, BonCaisseFormDialog(), beneficiairesSummary(), BonCaisseTab(), CaisseMobileCard(), CaisseTableRow(), BonFormDialog() (+104 more)

### Community 11 - "route-sync.tsx"
Cohesion: 0.11
Nodes (14): PageProps, PageProps, PageProps, PageProps, PageProps, ACTIVITY_EVENTS, AppRoot(), AppRootInner() (+6 more)

### Community 12 - "nav-store.ts"
Cohesion: 0.19
Nodes (16): DETAIL_PARENT, NavList(), useCanManageUsers(), useCanView(), useEffectivePermissionUser(), NavItem, navItems, VIEW_PERMISSIONS (+8 more)

### Community 13 - "parametres.tsx"
Cohesion: 0.09
Nodes (30): defaultSelectionForRole(), PermissionMatrix(), PermissionMatrixProps, permissionsFromSelection(), actionTone, ParametresScreen(), ParamTab, ProfileTabForm() (+22 more)

### Community 16 - "client-fiche.tsx"
Cohesion: 0.14
Nodes (14): ActifStatutBadge(), DEVIS_STATUT_TONE, DOSSIER_STATUT_HEX, DOSSIER_STATUT_TONE, DossierFournisseurStatutBadge(), dotClasses, StockStatutBadge(), Tone (+6 more)

### Community 19 - "fournisseurs.tsx"
Cohesion: 0.09
Nodes (28): EmptyState(), MetaTabItem, MetaTabsList(), ArchiveTab, DocSource, RattachementKind, TAB_META, TYPE_DOC_BADGE (+20 more)

### Community 20 - "bilans.tsx"
Cohesion: 0.10
Nodes (32): PageHeader(), ChartPayloadItem, ChartTooltip(), Periode, periodes, PiePayloadItem, PieTooltip(), SortableHead() (+24 more)

### Community 21 - "transporteur-form-fields.tsx"
Cohesion: 0.14
Nodes (23): SORT_OPTIONS, SortKey, TransporteurFormModal(), CAPACITE_PRESETS, emptyTransporteurForm(), FieldProps, firstInvalidTransporteurStep(), isTransporteurFormValid() (+15 more)

### Community 22 - "dependencies"
Cohesion: 0.10
Nodes (21): class-variance-authority, clsx, cmdk, next, dependencies, class-variance-authority, clsx, cmdk (+13 more)

### Community 23 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css (+13 more)

### Community 24 - "dossier-detail-hero.tsx"
Cohesion: 0.14
Nodes (13): DossierDetailStepper(), STATUTS_ORDERED, DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem() (+5 more)

### Community 25 - "dossier-form.tsx"
Cohesion: 0.16
Nodes (13): iconWrap, KpiTone, CollapsibleSection(), numStr(), SectionTitle(), STATUTS, toneMap, Tooltip() (+5 more)

### Community 26 - "permissions.ts"
Cohesion: 0.22
Nodes (8): DashboardSection, SECTION_PERMISSIONS, ALL_PERMISSION_KEYS, PERMISSION_MODULES, PermissionAction, PermissionDefinition, PermissionModule, PermissionUser

### Community 27 - "dossier-detail.tsx"
Cohesion: 0.24
Nodes (13): AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay() (+5 more)

### Community 28 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 32 - "classeur.ts"
Cohesion: 0.09
Nodes (25): FinancialBreakdown(), InfoRow(), NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, StatutCfg, STATUTS_ALL, VerticalStepper() (+17 more)

### Community 33 - "Writing Guidelines for Postgres References"
Cohesion: 0.12
Nodes (15): 1. Concrete Transformation Patterns, 2. Error-First Structure, 3. Quantified Impact, 4. Self-Contained Examples, 5. Semantic Naming, Code Example Standards, Comments, Impact Level Guidelines (+7 more)

### Community 34 - "Supabase"
Cohesion: 0.13
Nodes (12): Fix suggestion, Source, What happened, Skill Feedback, Steps, Core Principles, Making and Committing Schema Changes, Reference Guides (+4 more)

### Community 35 - "Dossier"
Cohesion: 0.13
Nodes (21): TransitionDialogProps, syncClientStats(), Client, Dossier, DossierFournisseur, DossierStatut, Facture, Fournisseur (+13 more)

### Community 36 - "UserRole"
Cohesion: 0.19
Nodes (12): UserFormState, UserRole, getGuideProgress(), getGuideStepsForRole(), GUIDE_STEP_DEFS, GuideStepDef, GuideStepId, GuideStepView (+4 more)

### Community 37 - "audit.ts"
Cohesion: 0.15
Nodes (15): REALTIME_TABLES, fetchWithAuth(), AuditAction, AuditModule, insertAuditLog(), logExportAudit(), mapAuditLogFromDb(), resolveClientIp() (+7 more)

### Community 38 - "2. Fonctionnalités demandées"
Cohesion: 0.14
Nodes (13): 0. Contexte, 1. Principes directeurs (non négociables), 2. Fonctionnalités demandées, 3. Récapitulatif des changements techniques, 4. Points à confirmer avec le client avant / pendant l'implémentation, 5. Hors périmètre (pour éviter la dérive), F1 — Dimension « Société » (Top Doumani / Traoré Transit Logistique), F2 — TVA 18 % optionnelle sur les factures (+5 more)

### Community 40 - "file-drop-zone.tsx"
Cohesion: 0.31
Nodes (10): DossierDetailDocuments(), FileDropZone(), SubDossierCard(), GlossaryLabel(), DossierFichier, SubDossier, formatFileSize(), getFileIconComponent() (+2 more)

### Community 41 - "topbar.tsx"
Cohesion: 0.16
Nodes (11): viewTitles, Avatar(), AvatarFallback(), AvatarImage(), Sheet(), SheetContent(), SheetDescription(), SheetFooter() (+3 more)

### Community 43 - "scripts"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, lint, start, test (+2 more)

### Community 44 - "SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés"
Cohesion: 0.18
Nodes (10): 1. Contexte du retour, 2. Clarification métier CRITIQUE : deux sociétés, une plateforme, 3.1 Référence Excel actuelle, 3.2 Équivalent à implémenter, 3.3 Suivi des mouvements, 3. Fonctionnalité demandée : le Classeur Client, 4. Architecture données (orientation), 5. Contrainte technique (+2 more)

### Community 45 - "dossier-detail-overview.tsx"
Cohesion: 0.18
Nodes (9): AmountRow(), DossierDetailOverview(), DossierInfoGrid(), InfoTile(), TRANSITION_META, TransitionType, LoginScreen(), EcartValue() (+1 more)

### Community 46 - "command-palette.tsx"
Cohesion: 0.31
Nodes (9): Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator() (+1 more)

### Community 47 - "facture-detail.tsx"
Cohesion: 0.18
Nodes (10): FinancialSummary(), InfoRow(), LignesTable(), NEXT_STATUT, PaymentRing(), STATUT_CONFIG, STATUT_FLOW, StatutCfg (+2 more)

### Community 48 - "Section Definitions"
Cohesion: 0.20
Nodes (9): 1. Query Performance (query), 2. Connection Management (conn), 3. Security & RLS (security), 4. Schema Design (schema), 5. Concurrency & Locking (lock), 6. Data Access Patterns (data), 7. Monitoring & Diagnostics (monitor), 8. Advanced Features (advanced) (+1 more)

### Community 49 - "archives-slice.ts"
Cohesion: 0.31
Nodes (8): UnifiedDoc, Archive, TypeDocument, AddArchiveInput, ArchivesSlice, createArchivesSlice(), mapArchiveFromDb(), getConnectedUserName()

### Community 50 - "2026-07-14T18-50-10Z__ontrats-factures-comptabilite-entreposage-archives.md"
Cohesion: 0.22
Nodes (8): Anti-Patterns Verdict, Design Health Score, Minor Observations, Overall Impression, Persona Red Flags, Priority Issues, Questions to Consider, What's Working

### Community 51 - "Product"
Cohesion: 0.22
Nodes (8): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Product, Product Purpose, Register, Users

### Community 52 - "[0.1.3](https://github.com/supabase/agent-skills/compare/v0.1.2...v0.1.3) (2026-06-02)"
Cohesion: 0.25
Nodes (7): [0.1.3](https://github.com/supabase/agent-skills/compare/v0.1.2...v0.1.3) (2026-06-02), [0.1.4](https://github.com/supabase/agent-skills/compare/v0.1.3...v0.1.4) (2026-06-05), Bug Fixes, Bug Fixes, Changelog, Features, Features

### Community 53 - "[1.2.0](https://github.com/supabase/agent-skills/compare/v1.1.1...v1.2.0) (2026-06-02)"
Cohesion: 0.25
Nodes (7): [1.2.0](https://github.com/supabase/agent-skills/compare/v1.1.1...v1.2.0) (2026-06-02), [1.3.0](https://github.com/supabase/agent-skills/compare/v1.2.0...v1.3.0) (2026-06-05), Bug Fixes, Bug Fixes, Changelog, Features, Features

### Community 54 - "factures.tsx"
Cohesion: 0.25
Nodes (6): ConfirmDeleteDialog(), InfoCallout(), EMPTY_LIGNE, LigneForm, TABS, SocieteFilterSelect()

### Community 56 - "next.config.ts"
Cohesion: 0.29
Nodes (6): csp, nextConfig, scriptSrc, securityHeaders, supabaseOrigin, supabaseWsOrigin

### Community 58 - "Supabase Postgres Best Practices"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 61 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): __dirname, eslintConfig, __filename

## Knowledge Gaps
- **366 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+361 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **52 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `bilans.tsx` to `devis.tsx`, `entreposage.tsx`, `use-toast.ts`, `useStore`, `nav-store.ts`, `parametres.tsx`, `client-fiche.tsx`, `fournisseurs.tsx`, `transporteur-form-fields.tsx`, `dossier-detail-hero.tsx`, `dossier-form.tsx`, `dossier-detail.tsx`, `classeur.ts`, `file-drop-zone.tsx`, `topbar.tsx`, `dossier-detail-overview.tsx`, `command-palette.tsx`, `facture-detail.tsx`, `factures.tsx`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `lucide-react`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-select`, `scripts`, `@radix-ui/react-separator`, `@radix-ui/react-switch`, `@radix-ui/react-tooltip`, `useStore`, `react-dom`, `@supabase/supabase-js`, `tailwindcss-animate`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `react` connect `useStore` to `dependencies`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _366 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devis.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11215686274509803 - nodes in this community are weakly interconnected._
- **Should `entreposage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09696969696969697 - nodes in this community are weakly interconnected._
- **Should `print-modules.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09577464788732394 - nodes in this community are weakly interconnected._