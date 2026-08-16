# Graph Report - Transit_SLTT  (2026-08-15)

## Corpus Check
- 905 files · ~900,582 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3166 nodes · 13380 edges · 179 communities (107 shown, 72 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3ced7e4e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devis.tsx
- entreposage.tsx
- print-modules.ts
- store.ts
- dossiers-slice.ts
- require-admin.ts
- utils.ts
- domain-types.ts
- compilerOptions
- export.ts
- useStore
- dashboard.tsx
- nav-store.ts
- contrats.tsx
- calendrier.tsx
- dossier-wizard-steps.tsx
- store-actions.test.ts
- contrat-stats.test.ts
- contrat-fichiers-slice.ts
- fournisseurs.tsx
- Facture
- cn
- dependencies
- devDependencies
- archives-slice.ts
- dossier-form.tsx
- UserRole
- UserRole
- components.json
- stock-slice.ts
- csv-export.ts
- ag-grid-community
- classeur.ts
- Writing Guidelines for Postgres References
- Supabase
- @supabase/server
- comptabilite-generale-import.ts
- createServerClient
- 2. Fonctionnalités demandées
- @radix-ui/react-slot
- @radix-ui/react-toast
- recharts
- tailwind-merge
- scripts
- SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés
- ag-grid-community
- ecritures-panel.tsx
- guide-progress.ts
- Section Definitions
- archives-slice.ts
- 2026-07-14T18-50-10Z__ontrats-factures-comptabilite-entreposage-archives.md
- Product
- [0.1.3](https://github.com/supabase/agent-skills/compare/v0.1.2...v0.1.3) (2026-06-02)
- [1.2.0](https://github.com/supabase/agent-skills/compare/v1.1.1...v1.2.0) (2026-06-02)
- devis.tsx
- factures.tsx
- next.config.ts
- dashboard-metrics.ts
- Supabase Postgres Best Practices
- dashboard-metrics.ts
- route.test.ts
- eslint.config.mjs
- route.test.ts
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
- require-admin.ts
- .mcp.json
- route.test.ts
- operation-form-dialog.tsx
- require-admin.test.ts
- route.test.ts
- import-dialog.tsx
- dossier-bulk-import-dialog.tsx
- use-excel-workbook.ts
- page.tsx
- sync-sequences.ts
- derniers-dossiers-card.tsx
- excel-export.ts
- postcss.config.mjs
- tailwind.config.ts
- classeur-tab.tsx
- classeur-import.ts
- 3. Modèle de données — détail champ par champ
- excel-export.ts
- heic2any.d.ts
- 7. Spécification fonctionnelle par écran
- recugenerateur.md
- dossier-detail-overview.tsx
- heic2any
- route.test.ts
- facture.ts
- pdfjs-dist
- db-seed-demo.mjs
- comptabilite-generale-import.ts
- @radix-ui/react-toast
- tailwind-merge
- recu-paiement.ts
- contrats.tsx
- template.ts
- command-palette.tsx
- split-users-table.mjs
- bons-slice.ts
- @radix-ui/react-switch
- sync-sequences.ts
- command-palette.tsx
- 8. Module OCR — détail du pipeline
- @radix-ui/react-select
- README.md
- generate-pwa-icons.mjs
- 9. Multi-société / multi-annexe
- @radix-ui/react-label
- 5. Règles de gestion transversales
- 10. Sécurité
- 1. Présentation générale
- 2. Architecture technique
- package.json
- bon-caisse.ts
- backup-slice.test.ts
- informations-card.tsx
- ocr-review-dialog.tsx
- clsx
- next
- @radix-ui/react-separator
- @radix-ui/react-toast
- server-only
- @supabase/supabase-js
- @radix-ui/react-alert-dialog
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- serwist
- tesseract.js
- confirm-transitions.ts
- guide-progress.ts
- @radix-ui/react-dropdown-menu
- InstallPWA.tsx
- index.ts
- useSession
- bon-caisse-form-dialog.tsx
- index.ts
- exceljs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 402 edges
2. `formatFCFA()` - 267 edges
3. `useStore` - 221 edges
4. `Button()` - 179 edges
5. `useToast()` - 173 edges
6. `Card()` - 133 edges
7. `formatDateShort()` - 125 edges
8. `UI` - 116 edges
9. `toastSuccess()` - 93 edges
10. `toastError()` - 89 edges

## Surprising Connections (you probably didn't know these)
- `GuideDemarrage()` --references--> `react`  [EXTRACTED]
  src/components/sltt/dashboard/guide-demarrage.tsx → package.json
- `useFactureEditState()` --references--> `react`  [EXTRACTED]
  src/components/sltt/facture-detail/use-facture-edit-state.ts → package.json
- `FactureFormModal()` --references--> `react`  [EXTRACTED]
  src/components/sltt/factures/facture-form-modal.tsx → package.json
- `useFacturesScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/factures/use-factures-screen.ts → package.json
- `FournisseurFormModal()` --references--> `react`  [EXTRACTED]
  src/components/sltt/fournisseurs/fournisseur-form-modal.tsx → package.json

## Import Cycles
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/ecritures-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-core-fetch-results.ts -> src/lib/store.ts`
- 4-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-secondary-fetch-results.ts -> src/lib/store.ts`
- 4-file cycle: `src/lib/store.ts -> src/lib/store/documents-slice.ts -> src/lib/store/documents/index.ts -> src/lib/store/documents/resolve-document-annexe.ts -> src/lib/store.ts`
- 5-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-core-fetch-results.ts -> src/lib/client-stats.ts`
- 5-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-core-fetch-results.ts -> src/lib/store/sync-sequences.ts -> src/lib/store.ts`
- 5-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-secondary-fetch-results.ts -> src/lib/client-stats.ts`
- 5-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-secondary-fetch-results.ts -> src/lib/contrat-stats.ts`
- 5-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-secondary-fetch-results.ts -> src/lib/store/sync-sequences.ts -> src/lib/store.ts`

## Communities (179 total, 72 thin omitted)

### Community 0 - "devis.tsx"
Cohesion: 0.11
Nodes (29): DevisFormDialog(), numStr(), useDossierFormState(), UseDossierFormStateOptions, getNextTransition(), DossiersListTable(), ClientFormFieldsProps, EcrituresFiltersProps (+21 more)

### Community 1 - "entreposage.tsx"
Cohesion: 0.08
Nodes (32): ACTIVITY_EVENTS, AppRootInner(), PermissionMatrixProps, LoginScreen(), SupabaseRequiredScreen(), fetchWithAuth(), resolveAccessToken(), ProfileRow (+24 more)

### Community 2 - "print-modules.ts"
Cohesion: 0.20
Nodes (33): printClients(), htmlEscape(), acquirePrintTarget(), brandLogoImgHTML(), buildBrandSubHTML(), buildLegalLine(), buildPrintDocument(), BuildPrintDocumentOptions (+25 more)

### Community 3 - "store.ts"
Cohesion: 0.09
Nodes (36): AnnexeRow, ProfilePublicRow, SocieteRow, SocieteInput, createAnnexesSlice(), mapAnnexeFromDb(), fetchCoreEntities(), PagedFetchResult (+28 more)

### Community 4 - "dossiers-slice.ts"
Cohesion: 0.13
Nodes (8): PageProps, PageProps, PageProps, PageProps, PageProps, RouteSync(), RouteSyncProps, syncNavFromRoute()

### Community 5 - "require-admin.ts"
Cohesion: 0.11
Nodes (29): ClotureDialog(), dayAfter(), firstDayOfMonth(), today(), JournalCaissePanelProps, OperationsTableProps, NATURE_SUGGESTIONS, entiteKeyOf() (+21 more)

### Community 6 - "utils.ts"
Cohesion: 0.13
Nodes (27): BonSortieCaisseRow, BonSortieRow, BonMotif, BonSortieCaisse, BonSortieCaisseInput, FactureLigne, computeIncrementalPaye(), validatePaymentAmount() (+19 more)

### Community 7 - "domain-types.ts"
Cohesion: 0.11
Nodes (30): DevisPipelineCard(), DevisNextStatut, DevisStatutConfig, NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, STATUTS_ALL, DevisSummaryHeader() (+22 more)

### Community 8 - "compilerOptions"
Cohesion: 0.05
Nodes (36): dom, dom.iterable, esnext, examples, mini-services, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+28 more)

### Community 9 - "export.ts"
Cohesion: 0.07
Nodes (28): DevisActionsCard(), AmountRow(), DossierDetailOverview(), DossierInfoGrid(), InfoTile(), TRANSITION_META, TransitionDialog(), TransitionDialogProps (+20 more)

### Community 10 - "useStore"
Cohesion: 0.11
Nodes (31): EcrituresTableProps, PaymentDialogProps, EcrituresTableProps, PaymentDialogProps, syncClientStats(), DepenseRow, DossierRow, EcritureRow (+23 more)

### Community 12 - "nav-store.ts"
Cohesion: 0.20
Nodes (18): PasswordField(), emptyFormState(), FormMode, UsersTab(), UserFormModal(), defaultSelectionForRole(), PermissionMatrix(), permissionsFromSelection() (+10 more)

### Community 13 - "contrats.tsx"
Cohesion: 0.08
Nodes (50): RecapClientCard(), RecapRow, SortableHead(), BonsTabProps, DossiersTabProps, FacturesTabProps, TabEmptyState(), entiteKeyOf() (+42 more)

### Community 14 - "calendrier.tsx"
Cohesion: 0.10
Nodes (15): ChartTooltipPayload, EcartsTooltip(), EncaissementsTooltip(), DerniersDossiersCard(), EncaissementsChart(), MargeChart(), AgentPanel(), ChartTooltipPayload (+7 more)

### Community 15 - "dossier-wizard-steps.tsx"
Cohesion: 0.12
Nodes (19): RecuGeneratorActions(), RecuGeneratorForm(), RecuGeneratorFormProps, STATUT_BADGE_CLASS, STATUT_LABELS, RecuReceiptPreview(), RecuWorkspace(), RecuWorkspaceProps (+11 more)

### Community 16 - "store-actions.test.ts"
Cohesion: 0.10
Nodes (22): NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, StatutCfg, STATUTS_ALL, VerticalStepper(), FACTURE_TABS, NEXT_STATUT (+14 more)

### Community 17 - "contrat-stats.test.ts"
Cohesion: 0.26
Nodes (10): NavList(), NavSectionLabel(), NavItem, navItems, VIEW_PERMISSIONS, ComptaTab, ViewKey, ROLE_SHORTCUTS (+2 more)

### Community 18 - "contrat-fichiers-slice.ts"
Cohesion: 0.24
Nodes (12): buildColMap(), cellToString(), Field, findHeaderRow(), HEADER_ALIASES, isPlausibleDate(), normalizeHeader(), parseAmount() (+4 more)

### Community 19 - "fournisseurs.tsx"
Cohesion: 0.80
Nodes (3): applyFacturePaiement(), canDecrementStock(), simulateSequentialPaiements()

### Community 20 - "Facture"
Cohesion: 0.04
Nodes (81): ChartPayloadItem, ChartTooltip(), PiePayloadItem, PieTooltip(), PieDatum, RepartitionCard(), RepartitionCardProps, beneficiairesSummary() (+73 more)

### Community 21 - "cn"
Cohesion: 0.12
Nodes (26): ARCHIVE_COLUMNS, ArchiveTab, DocSource, RattachementKind, TAB_META, TYPE_DOC_BADGE, TYPES_DOCUMENT, UnifiedDoc (+18 more)

### Community 22 - "dependencies"
Cohesion: 0.07
Nodes (29): ag-grid-community, clsx, cmdk, heic2any, dependencies, ag-grid-community, clsx, cmdk (+21 more)

### Community 23 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, @next/bundle-analyzer, devDependencies, eslint, eslint-config-next, @next/bundle-analyzer, sharp (+17 more)

### Community 24 - "archives-slice.ts"
Cohesion: 0.14
Nodes (10): FinancialSummary(), InfoRow(), InformationsCard(), LignesTable(), FactureEditForm(), FinancialSummary(), InfoRow(), InformationsCard() (+2 more)

### Community 25 - "dossier-form.tsx"
Cohesion: 0.06
Nodes (37): inter, metadata, sora, viewport, PwaGlobalEffects(), PwaUpdatePrompt(), AppSerwistProvider(), AppRoot() (+29 more)

### Community 26 - "UserRole"
Cohesion: 0.13
Nodes (14): 1. Isolation des données par annexe, 2. Sélecteur d'annexe, 3. Numérotation des documents, 4. Migration des données existantes, 5. Création d'une nouvelle annexe, CONTEXTE MÉTIER, CONTRAINTE UX — PRIORITÉ ABSOLUE, CONTRAINTES TECHNIQUES (+6 more)

### Community 27 - "UserRole"
Cohesion: 0.12
Nodes (16): CollapsibleSection(), SectionTitle(), SummaryRow(), toneMap, DossierIdentityStep(), DossierIdentityStepProps, DossierSuiviSection(), DossierSuiviSectionProps (+8 more)

### Community 28 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 29 - "stock-slice.ts"
Cohesion: 0.15
Nodes (11): Benefice, BeneficeKpiRow(), BeneficeKpiRowProps, BeneficeParSociete, EcrituresFilters(), NewEcritureDialog(), PaymentDialog(), PaymentInfoBanner() (+3 more)

### Community 30 - "csv-export.ts"
Cohesion: 0.12
Nodes (42): DossierBulkImportButton(), emptyForm(), OcrReviewDialog(), useDossierFormActions(), useDossiersListScreen(), FactureFormModal(), buildDossierPrefill(), useFacturesScreen() (+34 more)

### Community 31 - "ag-grid-community"
Cohesion: 0.05
Nodes (72): PATCH(), RouteContext, POST(), RouteContext, AdminClient, assertNotLastActiveAdmin(), DELETE(), PATCH() (+64 more)

### Community 33 - "Writing Guidelines for Postgres References"
Cohesion: 0.12
Nodes (15): 1. Concrete Transformation Patterns, 2. Error-First Structure, 3. Quantified Impact, 4. Self-Contained Examples, 5. Semantic Naming, Code Example Standards, Comments, Impact Level Guidelines (+7 more)

### Community 34 - "Supabase"
Cohesion: 0.13
Nodes (12): Fix suggestion, Source, What happened, Skill Feedback, Steps, Core Principles, Making and Committing Schema Changes, Reference Guides (+4 more)

### Community 35 - "@supabase/server"
Cohesion: 0.12
Nodes (16): Calling from database with pg_net, Cloudflare Workers, Cookie-based environments (compose with `@supabase/ssr`), Documentation, Edge Function recipes, Entry points, Function-to-function calls, Hono (+8 more)

### Community 36 - "comptabilite-generale-import.ts"
Cohesion: 0.12
Nodes (13): CollapsibleSection(), SectionTitle(), toneMap, DossierIdentityStep(), DossierIdentityStepProps, DossierSuiviSectionProps, DossierTransportSectionProps, DossierWizardNavProps (+5 more)

### Community 37 - "createServerClient"
Cohesion: 0.19
Nodes (20): CAPACITE_PRESETS, emptyTransporteurForm(), firstInvalidTransporteurStep(), isTransporteurFormValid(), isTransporteurStepValid(), maxReachableStep(), STEP_FIELDS, TRAJETS_SUGGERES (+12 more)

### Community 38 - "2. Fonctionnalités demandées"
Cohesion: 0.14
Nodes (13): 0. Contexte, 1. Principes directeurs (non négociables), 2. Fonctionnalités demandées, 3. Récapitulatif des changements techniques, 4. Points à confirmer avec le client avant / pendant l'implémentation, 5. Hors périmètre (pour éviter la dérive), F1 — Dimension « Société » (Top Doumani / Traoré Transit Logistique), F2 — TVA 18 % optionnelle sur les factures (+5 more)

### Community 39 - "@radix-ui/react-slot"
Cohesion: 0.07
Nodes (12): OfflineIndicator(), AppShell(), Bone(), ScreenSkeleton(), ArchivesScreen(), ComptabiliteScreen(), ContratDetailScreen(), DashboardScreen() (+4 more)

### Community 40 - "@radix-ui/react-toast"
Cohesion: 0.05
Nodes (84): ArchiveUploadDialog(), BonFormDialog(), ClasseurGrid(), ClasseurGridProps, ClasseurImportDialog(), Phase, ReviewRow, ConfirmActionDialog() (+76 more)

### Community 41 - "recharts"
Cohesion: 0.08
Nodes (42): AuditAction, AuditEntry, AuditModule, AuditSourceRef, insertAuditLog(), resolveClientIp(), RecuPaiementRow, Archive (+34 more)

### Community 42 - "tailwind-merge"
Cohesion: 0.24
Nodes (9): copy(), coreSrcDir, download(), ensureDir(), langDir, langs, ocrDir, pdfWorkerSrc (+1 more)

### Community 43 - "scripts"
Cohesion: 0.11
Nodes (17): uuid, name, overrides, exceljs, private, scripts, build, db:seed:demo (+9 more)

### Community 44 - "SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés"
Cohesion: 0.14
Nodes (20): DossierDetailDocuments(), FileDropZone(), SubDossierCard(), ContratFichierRow, DossierFichierRow, SubDossierRow, dataUrlToBlob(), ContratFichier (+12 more)

### Community 45 - "ag-grid-community"
Cohesion: 0.15
Nodes (11): Benefice, BeneficeKpiRow(), BeneficeKpiRowProps, BeneficeParSociete, EcrituresFilters(), NewEcritureDialog(), PaymentDialog(), PaymentInfoBanner() (+3 more)

### Community 46 - "ecritures-panel.tsx"
Cohesion: 0.08
Nodes (34): react, react, PaiementDialog(), FactureDocumentHeader(), DevisDetailScreen(), LignesCard(), PaiementDialog(), PipelineCard() (+26 more)

### Community 47 - "guide-progress.ts"
Cohesion: 0.14
Nodes (27): syncContratStats(), MouvementRow, StockItemRow, DossierFournisseur, DossierFournisseurInput, Fournisseur, FournisseurInput, syncFournisseurStats() (+19 more)

### Community 48 - "Section Definitions"
Cohesion: 0.20
Nodes (9): 1. Query Performance (query), 2. Connection Management (conn), 3. Security & RLS (security), 4. Schema Design (schema), 5. Concurrency & Locking (lock), 6. Data Access Patterns (data), 7. Monitoring & Diagnostics (monitor), 8. Advanced Features (advanced) (+1 more)

### Community 49 - "archives-slice.ts"
Cohesion: 0.26
Nodes (12): ConvertDevisDialogProps, DevisFormProps, DevisFormProps, mapDevisFromDb(), Devis, DevisInput, DevisListPrintRow, DevisStatut (+4 more)

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

### Community 54 - "devis.tsx"
Cohesion: 0.08
Nodes (38): ReviewRow, clampConfidence(), findFirst(), isValidYmd(), mapDossierFieldsFromText(), normalizeDate(), parseMontant(), clampConfidence() (+30 more)

### Community 55 - "factures.tsx"
Cohesion: 0.30
Nodes (10): ClotureCaisseRow, OperationComptableRow, ClotureCaisse, EntiteComptableType, OperationComptableInput, ComptabiliteGeneraleSlice, createComptabiliteGeneraleSlice(), mapClotureCaisseFromDb() (+2 more)

### Community 56 - "next.config.ts"
Cohesion: 0.33
Nodes (5): nextConfig, pwaHeaders, securityHeaders, withBundleAnalyzer, withSerwist

### Community 57 - "dashboard-metrics.ts"
Cohesion: 0.21
Nodes (6): DossiersListTable(), DossiersListScreen(), SORT_OPTIONS, SortKey, STATUT_OPTIONS, useDossiersListScreen()

### Community 58 - "Supabase Postgres Best Practices"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 60 - "route.test.ts"
Cohesion: 0.25
Nodes (3): FakeProfile, { fakeState, resetFake }, validPatchBody

### Community 61 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): __dirname, eslintConfig, __filename

### Community 63 - "route.ts"
Cohesion: 0.20
Nodes (13): extractClientIp(), GET(), ApiErrorBody, apiErrorResponse(), apiSuccessResponse(), mapAppErrorToStatus(), toApiErrorResponse(), AppError (+5 more)

### Community 98 - "require-admin.ts"
Cohesion: 0.07
Nodes (36): DevisListBanner(), DevisListFilters(), DevisSortKey, DossierFormState, UseDossierFormActionsOptions, SORT_OPTIONS, SortKey, STATUT_OPTIONS (+28 more)

### Community 101 - "operation-form-dialog.tsx"
Cohesion: 0.10
Nodes (14): ListFilters(), ListFiltersProps, PageHeader(), ClasseurImportDialog(), ClientFormFields(), emptyClientForm(), Props, QuickClientButton() (+6 more)

### Community 104 - "import-dialog.tsx"
Cohesion: 0.06
Nodes (39): ClotureDialogProps, ImportAnyDialog(), ImportAnyDialogProps, isExcelFile(), CheckedState, ComptabiliteGeneraleImportDialog(), ImportDialogProps, Phase (+31 more)

### Community 105 - "dossier-bulk-import-dialog.tsx"
Cohesion: 0.03
Nodes (76): StatPill(), ClientProfileCard(), ClientProfileCardProps, avatarGradient(), Heading(), StatPill(), Heading(), AdminPanel() (+68 more)

### Community 107 - "use-excel-workbook.ts"
Cohesion: 0.06
Nodes (64): ClasseurGridImpl, ClasseurGridLazy(), ExcelSaveStatus, ExcelToolbar(), QuickBtn(), ExcelWorkbookPanel(), ExcelWorkbookPanelProps, PendingConfirm (+56 more)

### Community 108 - "page.tsx"
Cohesion: 0.14
Nodes (46): ClasseurSuiviDialogProps, FormState, OperationFormDialog(), today(), modeOptions, DEVIS_SORT_OPTIONS, CATEGORIES, FIELD_LABELS (+38 more)

### Community 109 - "sync-sequences.ts"
Cohesion: 0.07
Nodes (50): CONTRAT_STATUT_TONE, CONTRAT_STATUTS, MODES_PAIEMENT, PRESTATION_STATUT_TONE, PRESTATION_STATUTS, FactureEditForm(), useFactureEditState(), FactureRowProps (+42 more)

### Community 116 - "classeur-tab.tsx"
Cohesion: 0.05
Nodes (50): BonMarchandiseTab(), BonMarchandiseTabProps, BON_MOTIF_TONE, BON_MOTIFS, BON_STATUT_TONE, useBonFilters(), ClasseurSuiviDialog(), ClasseurTabProps (+42 more)

### Community 117 - "classeur-import.ts"
Cohesion: 0.33
Nodes (7): EcrituresFiltersProps, EcrituresPanelProps, deriveStatut(), modeIcon, StatutFilter, today(), useEcrituresScreen()

### Community 118 - "3. Modèle de données — détail champ par champ"
Cohesion: 0.12
Nodes (16): 3.10 bons_sortie (marchandise) + bons_sortie_caisse, 3.11 contrats + contrat_prestations + contrat_fichiers + depenses, 3.12 fournisseurs + transporteurs + dossier_fournisseurs, 3.13 archives, 3.14 documents / document_versions / ocr_jobs / ocr_fields (module OCR), 3.15 excel_workbooks & audit_logs, 3.1 profiles (extension de `auth.users`), 3.2 annexes (+8 more)

### Community 119 - "excel-export.ts"
Cohesion: 0.43
Nodes (6): BeforeInstallPromptEvent, InstallPWA(), InstallPWAProps, isDesktopChromium(), isIos(), isStandalone()

### Community 121 - "7. Spécification fonctionnelle par écran"
Cohesion: 0.12
Nodes (16): 7.10 Fournisseurs, 7.11 Transporteurs, 7.12 Calendrier, 7.13 Comptabilité, 7.14 Bilans, 7.15 Paramètres, 7.1 Dashboard, 7.2 Clients (+8 more)

### Community 126 - "facture.ts"
Cohesion: 0.21
Nodes (14): FieldLine(), RecuReceiptBody(), RecuReceiptBodyProps, buildFieldLine(), buildHeaderLegalHTML(), buildRecuPaiementHTML(), buildSignatureHTML(), fmtDate() (+6 more)

### Community 128 - "db-seed-demo.mjs"
Cohesion: 0.50
Nodes (3): result, root, seedFile

### Community 129 - "comptabilite-generale-import.ts"
Cohesion: 0.29
Nodes (6): DevisNextStatut, DevisStatutConfig, NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, STATUTS_ALL

### Community 130 - "@radix-ui/react-toast"
Cohesion: 0.50
Nodes (4): DocumentPreviewBody(), DocumentViewer(), FetchedDocumentPreview(), isDirectUrl()

### Community 132 - "recu-paiement.ts"
Cohesion: 0.11
Nodes (32): buildRecuPrintData(), formToModuleData(), printRecu(), printRecuFromForm(), RecuFormModuleInput, resolveGeneratorBrand(), resolveRecuBrand(), toRecuModuleData() (+24 more)

### Community 133 - "contrats.tsx"
Cohesion: 0.16
Nodes (13): CalendrierScreen(), CalEvent, DayPanel(), daysInMonth(), EventType, FR_DAYS, FR_MONTHS, isoDate() (+5 more)

### Community 134 - "template.ts"
Cohesion: 0.15
Nodes (20): EvolutionChartCard(), EvolutionChartCardProps, RecapClientCardProps, currentYearMonth(), getPeriodeLabel(), Periode, PERIODES, SortDir (+12 more)

### Community 135 - "command-palette.tsx"
Cohesion: 0.24
Nodes (10): QuickAction, Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem(), CommandList() (+2 more)

### Community 136 - "split-users-table.mjs"
Cohesion: 0.22
Nodes (8): 11. Temps réel, 12. Routes API custom (7), 13. Glossaire, 14. Références (fichiers sources), 4. Machines à états (FSM), 6. Matrice des permissions, Cahier des charges détaillé — Plateforme SLTT Transit, Sommaire

### Community 137 - "bons-slice.ts"
Cohesion: 0.12
Nodes (37): BonSortieCaisseLigneRow, BonSortieStatut, DocumentRow, DocumentVersionRow, DossierFournisseurRow, DossierFournisseurStatut, FactureLigneRow, FournisseurRow (+29 more)

### Community 139 - "sync-sequences.ts"
Cohesion: 0.33
Nodes (6): AUTH_ERROR_MAP, extractErrorCode(), extractErrorMessage(), mapErrorToUserMessage(), PG_ERROR_MAP, RAW_MESSAGE_MAP

### Community 140 - "command-palette.tsx"
Cohesion: 0.09
Nodes (29): RecuReceiptHeader(), RecuReceiptHeaderProps, RecuReceiptPreviewProps, RecuGeneratorActions(), RecuGeneratorForm(), RecuGeneratorFormProps, STATUT_BADGE_CLASS, STATUT_LABELS (+21 more)

### Community 141 - "8. Module OCR — détail du pipeline"
Cohesion: 0.29
Nodes (7): 8.1 Entrée, 8.2 Stockage, 8.3 Extraction (`tesseract-provider.ts`), 8.4 Mapping heuristique (`dossier-mapper.ts`), 8.5 Revue et validation, 8.6 Fiabilité, 8. Module OCR — détail du pipeline

### Community 144 - "generate-pwa-icons.mjs"
Cohesion: 0.27
Nodes (9): badgeRingSvg(), buildBadge(), __dirname, EMBLEM_CROP, exists(), main(), outDir, root (+1 more)

### Community 145 - "9. Multi-société / multi-annexe"
Cohesion: 0.29
Nodes (7): 9.1 Deux dimensions orthogonales, 9.2 Isolation des données, 9.3 Rattachement utilisateur, 9.4 Sélecteur d'annexe (topbar), 9.5 Numérotation, 9.6 Reporting consolidé, 9. Multi-société / multi-annexe

### Community 147 - "5. Règles de gestion transversales"
Cohesion: 0.33
Nodes (6): 5.1 Montants et paiements, 5.2 Numérotation des documents, 5.3 Fichiers & uploads, 5.4 Fonctions RPC (`security definer`, verrou de ligne), 5.5 Journal d'audit, 5. Règles de gestion transversales

### Community 148 - "10. Sécurité"
Cohesion: 0.40
Nodes (5): 10.1 Authentification, 10.2 RLS, 10.3 Storage, 10.4 En-têtes HTTP, 10. Sécurité

### Community 149 - "1. Présentation générale"
Cohesion: 0.40
Nodes (5): 1.1 Objet, 1.2 Contexte organisationnel, 1.3 Rôles utilisateurs, 1.4 Règles métier propres à l'implantation, 1. Présentation générale

### Community 150 - "2. Architecture technique"
Cohesion: 0.50
Nodes (4): 2.1 Stack (versions issues de `package.json`), 2.2 Principe d'architecture — pas de backend REST custom, 2.3 Organisation du code, 2. Architecture technique

### Community 154 - "informations-card.tsx"
Cohesion: 0.13
Nodes (18): AnnexeSelector(), BreadcrumbNav(), DETAIL_PARENT, CommandPalette(), Sidebar(), SidebarBrand(), viewTitles, pathForView() (+10 more)

### Community 155 - "ocr-review-dialog.tsx"
Cohesion: 0.13
Nodes (23): NewEcritureDialogProps, mapClientFromDb(), mapClientInputToDb(), createClient(), toAppError(), updateClient(), Client, ClientInput (+15 more)

### Community 156 - "clsx"
Cohesion: 0.50
Nodes (3): secureRuntimeCaching, serwist, WorkerGlobalScope

### Community 167 - "@radix-ui/react-dropdown-menu"
Cohesion: 0.07
Nodes (39): AgentPanel(), AlertesCard(), DossiersEvolutionChart(), GuideDemarrage(), MagasinierPanel(), useDashboardMetrics(), DOSSIER_STATUT_HEX, GuideDemarrage() (+31 more)

### Community 170 - "confirm-transitions.ts"
Cohesion: 0.19
Nodes (10): ClientTypeBadge(), ClientMobileCard, ClientsTableProps, ClientTableRow, SortableHeader(), avatarGradient(), ClientSortKey, ClientTypeFilter (+2 more)

### Community 176 - "InstallPWA.tsx"
Cohesion: 0.18
Nodes (10): Ce qui ne change pas, Clean code, Conventions de code — Transit SLTT, Conventions de nommage, Gestion des erreurs, Imports, Migration en cours, Principes SOLID (+2 more)

### Community 177 - "index.ts"
Cohesion: 0.13
Nodes (15): ClientTypeBadge(), ClientMobileCard, ClientsTable(), ClientsTableProps, ClientTableRow, SortableHeader(), avatarGradient(), ClientSortKey (+7 more)

### Community 178 - "useSession"
Cohesion: 0.52
Nodes (6): hasPermission(), resolvePermissionUser(), useCanManageUsers(), useCanView(), useEffectivePermissionUser(), usePermissionsReady()

### Community 183 - "bon-caisse-form-dialog.tsx"
Cohesion: 0.19
Nodes (17): BonFormDialogProps, RecuGeneratorActionsProps, BonCaisseFormDialog(), BonCaisseFormDialogProps, CaisseLigneForm, BonFormDialog(), BonFormDialogProps, RecuGeneratorActionsProps (+9 more)

### Community 184 - "index.ts"
Cohesion: 0.21
Nodes (11): devisInputSchema, DevisData, DevisListPrintRow, fmtDevisDate(), fmtDevisDateShort(), prestataireDisplayName(), printDevis(), printDevisList() (+3 more)

## Knowledge Gaps
- **677 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+672 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **72 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `dossier-bulk-import-dialog.tsx` to `@radix-ui/react-toast`, `require-admin.ts`, `contrats.tsx`, `domain-types.ts`, `command-palette.tsx`, `export.ts`, `sync-sequences.ts`, `nav-store.ts`, `contrats.tsx`, `calendrier.tsx`, `dossier-wizard-steps.tsx`, `command-palette.tsx`, `contrat-stats.test.ts`, `Facture`, `cn`, `archives-slice.ts`, `dossier-form.tsx`, `informations-card.tsx`, `UserRole`, `csv-export.ts`, `ag-grid-community`, `comptabilite-generale-import.ts`, `createServerClient`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-toast`, `@radix-ui/react-slot`, `confirm-transitions.ts`, `ecritures-panel.tsx`, `index.ts`, `bon-caisse-form-dialog.tsx`, `operation-form-dialog.tsx`, `import-dialog.tsx`, `use-excel-workbook.ts`, `page.tsx`, `classeur-tab.tsx`, `facture.ts`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `tailwind-merge`, `@radix-ui/react-switch`, `@radix-ui/react-select`, `@radix-ui/react-label`, `package.json`, `bon-caisse.ts`, `next`, `@radix-ui/react-separator`, `@radix-ui/react-toast`, `server-only`, `@supabase/supabase-js`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-dialog`, `tesseract.js`, `scripts`, `guide-progress.ts`, `ecritures-panel.tsx`, `@radix-ui/react-dropdown-menu`, `exceljs`, `dashboard-metrics.ts`, `excel-export.ts`, `recugenerateur.md`, `heic2any`, `pdfjs-dist`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `react` connect `ecritures-panel.tsx` to `contrats.tsx`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-toast`, `@radix-ui/react-slot`, `sync-sequences.ts`, `dependencies`, `csv-export.ts`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _677 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devis.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11261261261261261 - nodes in this community are weakly interconnected._
- **Should `entreposage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08325624421831637 - nodes in this community are weakly interconnected._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09178743961352658 - nodes in this community are weakly interconnected._