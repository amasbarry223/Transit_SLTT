# Graph Report - Transit_SLTT  (2026-08-20)

## Corpus Check
- 721 files · ~304,779 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2630 nodes · 9990 edges · 183 communities (106 shown, 77 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1f88fb2a`
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
- dossiers-list-table.tsx
- 2026-07-14T18-50-10Z__ontrats-factures-comptabilite-entreposage-archives.md
- Product
- [0.1.3](https://github.com/supabase/agent-skills/compare/v0.1.2...v0.1.3) (2026-06-02)
- [1.2.0](https://github.com/supabase/agent-skills/compare/v1.1.1...v1.2.0) (2026-06-02)
- devis.tsx
- build-xlsx-client.ts
- next.config.ts
- dashboard-metrics.ts
- Supabase Postgres Best Practices
- use-permission.ts
- route.test.ts
- eslint.config.mjs
- route.test.ts
- calculations.test.ts
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
- users-slice.ts
- dossier-bulk-import-dialog.tsx
- use-excel-workbook.ts
- page.tsx
- sync-sequences.ts
- derniers-dossiers-card.tsx
- excel-export.ts
- postcss.config.mjs
- tailwind.config.ts
- classeur-tab.tsx
- InstallPWA.tsx
- 3. Modèle de données — détail champ par champ
- recus-paiement.ts
- heic2any.d.ts
- 7. Spécification fonctionnelle par écran
- classeur-grid-lazy.tsx
- dossier-detail-overview.tsx
- heic2any
- route.test.ts
- facture.ts
- pdfjs-dist
- db-seed-demo.mjs
- comptabilite-generale-import.ts
- zod
- tailwind-merge
- confirm-transitions.ts
- contrats.tsx
- template.ts
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
- page.tsx
- dashboard-screen.tsx
- @radix-ui/react-separator
- @radix-ui/react-toast
- server-only
- @supabase/supabase-js
- @radix-ui/react-alert-dialog
- classeur-import.ts
- getInitials
- @radix-ui/react-dialog
- page.tsx
- serwist
- tesseract.js
- index.ts
- ag-grid-community
- readLegacyNavPersist
- ag-grid-react
- @radix-ui/react-dropdown-menu
- InstallPWA.tsx
- use-recu-generator.ts
- bon-caisse-form-dialog.tsx
- exceljs
- dossier-form-ui.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 294 edges
2. `useStore` - 151 edges
3. `formatFCFA()` - 144 edges
4. `useToast()` - 114 edges
5. `Button()` - 111 edges
6. `Card()` - 79 edges
7. `UI` - 73 edges
8. `formatDateShort()` - 70 edges
9. `usePermission()` - 63 edges
10. `toastSuccess()` - 63 edges

## Surprising Connections (you probably didn't know these)
- `GuideDemarrage()` --references--> `react`  [EXTRACTED]
  src/components/sltt/dashboard/guide-demarrage.tsx → package.json
- `CalendrierScreen()` --references--> `react`  [EXTRACTED]
  src/features/calendrier/components/calendrier-screen.tsx → package.json
- `DashboardScreen()` --references--> `react`  [EXTRACTED]
  src/features/dashboard/components/dashboard-screen.tsx → package.json
- `useFactureEditState()` --references--> `react`  [EXTRACTED]
  src/features/factures/components/facture-detail/use-facture-edit-state.ts → package.json
- `FournisseurFormModal()` --references--> `react`  [EXTRACTED]
  src/features/fournisseurs/components/fournisseurs/fournisseur-form-modal.tsx → package.json

## Import Cycles
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/ecritures-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`
- 4-file cycle: `src/lib/store.ts -> src/lib/store/documents-slice.ts -> src/lib/store/documents/index.ts -> src/lib/store/documents/resolve-document-annexe.ts -> src/lib/store.ts`
- 4-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-secondary-fetch-results.ts -> src/lib/store.ts`
- 4-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-core-fetch-results.ts -> src/lib/store.ts`
- 5-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-secondary-fetch-results.ts -> src/lib/client-stats.ts`
- 5-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-secondary-fetch-results.ts -> src/lib/contrat-stats.ts`
- 5-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-secondary-fetch-results.ts -> src/lib/store/sync-sequences.ts -> src/lib/store.ts`
- 5-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-core-fetch-results.ts -> src/lib/client-stats.ts`
- 5-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-core-fetch-results.ts -> src/lib/store/sync-sequences.ts -> src/lib/store.ts`

## Communities (183 total, 77 thin omitted)

### Community 0 - "devis.tsx"
Cohesion: 0.14
Nodes (12): FactureEditForm(), FinancialSummary(), InfoRow(), LignesCard(), LignesTable(), PaymentRing(), SuiviPaiementCard(), useFactureEditState() (+4 more)

### Community 1 - "entreposage.tsx"
Cohesion: 0.22
Nodes (8): ACTIVITY_EVENTS, AppRoot(), AppRootInner(), LoginScreen(), SupabaseRequiredScreen(), clearLegacyNavPersist(), LegacyNavPersist, useSupabaseRealtime()

### Community 2 - "print-modules.ts"
Cohesion: 0.19
Nodes (8): inter, metadata, sora, viewport, PwaGlobalEffects(), PwaUpdatePrompt(), AppSerwistProvider(), ThemeEffect()

### Community 3 - "store.ts"
Cohesion: 0.11
Nodes (34): ProfilePublicRow, mapAnnexeFromDb(), fetchCoreEntities(), PagedFetchResult, buildSecondaryFetchSpecs(), fetchSecondaryEntities(), SECONDARY_FETCH_KEYS, SecondaryFetchKey (+26 more)

### Community 4 - "dossiers-slice.ts"
Cohesion: 0.13
Nodes (8): PageProps, PageProps, PageProps, PageProps, PageProps, RouteSync(), RouteSyncProps, syncNavFromRoute()

### Community 5 - "require-admin.ts"
Cohesion: 0.13
Nodes (22): ClotureDialog(), dayAfter(), firstDayOfMonth(), today(), JournalCaissePanelProps, OperationRowProps, OperationsTableProps, useComptabiliteGeneraleScreen() (+14 more)

### Community 6 - "utils.ts"
Cohesion: 0.12
Nodes (23): AnnexeRow, ArchiveRow, BonSortieCaisseLigneRow, BonSortieStatut, ClotureCaisseRow, ContratPrestationRow, DossierFournisseurStatut, FactureLigneRow (+15 more)

### Community 7 - "domain-types.ts"
Cohesion: 0.10
Nodes (23): ChartPayloadItem, ChartTooltip(), PiePayloadItem, PieTooltip(), EvolutionChartCard(), EvolutionChartCardProps, RecapClientCardProps, RecapRow (+15 more)

### Community 8 - "compilerOptions"
Cohesion: 0.05
Nodes (36): dom, dom.iterable, esnext, examples, mini-services, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+28 more)

### Community 9 - "export.ts"
Cohesion: 0.12
Nodes (36): DevisFormDialog(), DEVIS_SORT_OPTIONS, DevisListFilters(), DevisSortKey, CATEGORIES, FIELD_LABELS, FormState, OcrReviewState (+28 more)

### Community 10 - "useStore"
Cohesion: 0.10
Nodes (35): syncClientStats(), DEFAULT_PAIEMENT_MODE, DOSSIER_STATUT_DEDOUANE, DOSSIER_STATUT_EN_COURS, DOSSIER_STATUT_SOLDE, FETCH_ENTITY_SOFT_CAPS, getRecoveryRateColor(), RECOVERY_RATE_THRESHOLDS (+27 more)

### Community 12 - "nav-store.ts"
Cohesion: 0.25
Nodes (17): PATCH(), RouteContext, POST(), RouteContext, AdminClient, assertNotLastActiveAdmin(), DELETE(), PATCH() (+9 more)

### Community 13 - "contrats.tsx"
Cohesion: 0.09
Nodes (39): actionTone, ResponsiveDataListProps, FactureStatutBadge(), BonsTab(), BonsTabProps, DossiersTabProps, FacturesTabProps, LogistiqueTab() (+31 more)

### Community 14 - "calendrier.tsx"
Cohesion: 0.11
Nodes (23): SocieteBadge(), SocieteFilterSelect(), ToneBadge(), BonMarchandiseTabProps, BonMobileCard(), BonTableRow(), BON_MOTIF_TONE, BON_MOTIFS (+15 more)

### Community 15 - "dossier-wizard-steps.tsx"
Cohesion: 0.14
Nodes (27): syncContratStats(), BaseContrat, ContratRow, Contrat, ContratInput, ContratPrestation, ContratPrestationInput, ContratStatut (+19 more)

### Community 16 - "store-actions.test.ts"
Cohesion: 0.09
Nodes (40): ConvertDevisDialogProps, DevisFormProps, mapDevisFromDb(), Devis, DevisInput, DevisListPrintRow, DevisStatut, DevisRow (+32 more)

### Community 17 - "contrat-stats.test.ts"
Cohesion: 0.27
Nodes (9): GuideDemarrage(), getGuideProgress(), getGuideStepsForRole(), GUIDE_STEP_DEFS, GuideStepDef, GuideStepId, GuideStepView, GuideStoreSnapshot (+1 more)

### Community 18 - "contrat-fichiers-slice.ts"
Cohesion: 0.20
Nodes (14): ReviewRow, buildColMap(), cellToString(), Field, findHeaderRow(), HEADER_ALIASES, isPlausibleDate(), normalizeHeader() (+6 more)

### Community 19 - "fournisseurs.tsx"
Cohesion: 0.80
Nodes (3): applyFacturePaiement(), canDecrementStock(), simulateSequentialPaiements()

### Community 20 - "Facture"
Cohesion: 0.10
Nodes (30): RecapClientCard(), DevisEditForm(), DevisListKpis(), DevisListTable(), DevisSummaryHeader(), OcrReviewDialogImpl, OcrReviewDialogLazy(), DossierDetailHero() (+22 more)

### Community 21 - "cn"
Cohesion: 0.15
Nodes (17): FilterChip, MetaTabItem, ArchiveTab, DocSource, RattachementKind, TAB_META, TYPES_DOCUMENT, UnifiedDoc (+9 more)

### Community 22 - "dependencies"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, cmdk, heic2any, dependencies, class-variance-authority, clsx, cmdk (+21 more)

### Community 23 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, @next/bundle-analyzer, devDependencies, eslint, eslint-config-next, @next/bundle-analyzer, sharp (+17 more)

### Community 24 - "archives-slice.ts"
Cohesion: 0.12
Nodes (16): DevisPipelineCard(), DevisNextStatut, DevisStatutConfig, STATUT_CONFIG, STATUT_FLOW, STATUTS_ALL, StatusStepConfig, StatusVerticalStepper() (+8 more)

### Community 25 - "dossier-form.tsx"
Cohesion: 0.15
Nodes (18): Action, ActionType, actionTypes, addToRemoveQueue(), AppToastFn, AppToastInput, AppToastReturn, dispatch() (+10 more)

### Community 26 - "UserRole"
Cohesion: 0.13
Nodes (14): 1. Isolation des données par annexe, 2. Sélecteur d'annexe, 3. Numérotation des documents, 4. Migration des données existantes, 5. Création d'une nouvelle annexe, CONTEXTE MÉTIER, CONTRAINTE UX — PRIORITÉ ABSOLUE, CONTRAINTES TECHNIQUES (+6 more)

### Community 27 - "UserRole"
Cohesion: 0.31
Nodes (6): planClasseurImport(), buildEmptyWorkbookData(), ensureGrandLivreCapacity(), GRAND_LIVRE_HEADERS, HEADER_STYLE, headerCellData()

### Community 28 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 29 - "stock-slice.ts"
Cohesion: 0.12
Nodes (35): ProfileTabForm(), PasswordField(), RolePicker(), allRoles, emptyFormState(), FormMode, FormTab, isCustomPermissionSet() (+27 more)

### Community 30 - "csv-export.ts"
Cohesion: 0.11
Nodes (43): react, react, DossierBulkImportButton(), useDossierDocumentsWarmup(), TransitionDialog(), InfoCallout(), UsersTab(), BonCaisseFormDialog() (+35 more)

### Community 31 - "ag-grid-community"
Cohesion: 0.16
Nodes (16): POST(), changePasswordBodySchema, createUserBodySchema, exportExcelBodySchema, resetPasswordBodySchema, strongPasswordSchema, updateUserAnnexesBodySchema, updateUserBodySchema (+8 more)

### Community 32 - "classeur.ts"
Cohesion: 0.16
Nodes (44): printClients(), DevisData, DevisListPrintRow, fmtDevisDate(), fmtDevisDateShort(), prestataireDisplayName(), printDevis(), printDevisList() (+36 more)

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
Cohesion: 0.14
Nodes (16): ContratFichierRow, ContratFichier, ExcelWorkbook, ExcelWorkbookRow, LOGGED_OUT, AddContratFichierInput, ContratFichiersSlice, createContratFichiersSlice() (+8 more)

### Community 37 - "createServerClient"
Cohesion: 0.23
Nodes (13): NEXT_STATUT, DossierDetailStepper(), STATUTS_ORDERED, DevisStatutBadge(), TablePagination(), TablePaginationProps, TransporteursTableProps, SortKey (+5 more)

### Community 38 - "2. Fonctionnalités demandées"
Cohesion: 0.09
Nodes (15): OfflineIndicator(), emptyForm(), OcrReviewActions(), OcrReviewDialog(), OcrReviewFields(), useOcrReviewState(), Bone(), ScreenSkeleton() (+7 more)

### Community 39 - "@radix-ui/react-slot"
Cohesion: 0.18
Nodes (13): CalendrierScreen(), CalEvent, DayPanel(), daysInMonth(), EventType, FR_DAYS, FR_MONTHS, isoDate() (+5 more)

### Community 40 - "@radix-ui/react-toast"
Cohesion: 0.09
Nodes (22): DocumentMetaForm(), DocumentMetaValues, DocumentUploadFile, DocumentUploadZone(), DocumentPreviewBody(), DocumentViewer(), FetchedDocumentPreview(), isDirectUrl() (+14 more)

### Community 41 - "recharts"
Cohesion: 0.22
Nodes (12): brandLogoImgHTML(), buildLegalLine(), BuildPrintDocumentOptions, PrintTargetOptions, resolveLogoUrl(), splitRaisonSocialeLines(), bonDataToBrand(), BonSortieCaisseModuleData (+4 more)

### Community 42 - "tailwind-merge"
Cohesion: 0.24
Nodes (9): copy(), coreSrcDir, download(), ensureDir(), langDir, langs, ocrDir, pdfWorkerSrc (+1 more)

### Community 43 - "scripts"
Cohesion: 0.11
Nodes (17): uuid, name, overrides, exceljs, private, scripts, build, db:seed:demo (+9 more)

### Community 44 - "SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés"
Cohesion: 0.12
Nodes (22): Periode, ConfirmDeleteDialog(), KpiCard(), ListFilters(), ListFiltersProps, MetaTabsList(), PageHeader(), SocietesTab() (+14 more)

### Community 45 - "ag-grid-community"
Cohesion: 0.10
Nodes (20): AmountRow(), DossierDetailOverview(), DossierInfoGrid(), InfoTile(), TRANSITION_META, TransitionDialogProps, TransitionType, GlossaryLabel() (+12 more)

### Community 46 - "ecritures-panel.tsx"
Cohesion: 0.20
Nodes (12): FactureDocumentHeader(), ANNEXE_DOSSIER_COUT_LABELS, DEFAULT_DOSSIER_COUT_LABELS, DossierCoutLabels, formatSocieteLegalLine(), hasSocieteLogo(), PrintHTMLBrand, requirePrintHTMLBrand() (+4 more)

### Community 47 - "guide-progress.ts"
Cohesion: 0.10
Nodes (38): AuditAction, AuditEntry, AuditModule, AuditSourceRef, insertAuditLog(), resolveClientIp(), RecuPaiementRow, RecuPaiement (+30 more)

### Community 48 - "Section Definitions"
Cohesion: 0.20
Nodes (9): 1. Query Performance (query), 2. Connection Management (conn), 3. Security & RLS (security), 4. Schema Design (schema), 5. Concurrency & Locking (lock), 6. Data Access Patterns (data), 7. Monitoring & Diagnostics (monitor), 8. Advanced Features (advanced) (+1 more)

### Community 49 - "dossiers-list-table.tsx"
Cohesion: 0.24
Nodes (13): DossierDetailDocuments(), FileDropZone(), SubDossierCard(), DossierFichierRow, SubDossierRow, DossierFichier, SubDossier, FichierInput (+5 more)

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

### Community 55 - "build-xlsx-client.ts"
Cohesion: 0.28
Nodes (7): buildXlsxBlob(), HEADER_FILL, normalizeExportCell(), normalizeExportRows(), cellDisplayLength(), computeColumnWidths(), sanitizeExcelCell()

### Community 56 - "next.config.ts"
Cohesion: 0.33
Nodes (5): nextConfig, pwaHeaders, securityHeaders, withBundleAnalyzer, withSerwist

### Community 57 - "dashboard-metrics.ts"
Cohesion: 0.32
Nodes (9): PATCH(), decodeJwtSubUnsafe(), getAdminClient(), getAuthenticatedProfile(), getServerClient(), requireUser(), createAdminClient(), createServerClient() (+1 more)

### Community 58 - "Supabase Postgres Best Practices"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 59 - "use-permission.ts"
Cohesion: 0.18
Nodes (14): ComptablePanel(), getNextTransition(), DossierDetailScreen(), numStr(), useDossierFormState(), UseDossierFormStateOptions, DossiersListTable(), buildEcartsParPeriode() (+6 more)

### Community 60 - "route.test.ts"
Cohesion: 0.25
Nodes (3): FakeProfile, { fakeState, resetFake }, validPatchBody

### Community 61 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): __dirname, eslintConfig, __filename

### Community 63 - "calculations.test.ts"
Cohesion: 0.24
Nodes (11): useStockMovementDialogs(), ParametresScreen(), VIEW_PERMISSIONS, hasPermission(), resolvePermissionUser(), useSession, useCanManageUsers(), useCurrentUser() (+3 more)

### Community 98 - "require-admin.ts"
Cohesion: 0.48
Nodes (6): ProfileRow, normalizePermissions(), UserInput, createUsersSlice(), mapProfileFromDb(), UsersSlice

### Community 101 - "operation-form-dialog.tsx"
Cohesion: 0.09
Nodes (42): CheckedState, Phase, StatutHistorique, BonCaisseFormDialogProps, CaisseLigneForm, BonFormDialogProps, ClasseurImportDialog(), Phase (+34 more)

### Community 104 - "users-slice.ts"
Cohesion: 0.20
Nodes (10): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+2 more)

### Community 105 - "dossier-bulk-import-dialog.tsx"
Cohesion: 0.05
Nodes (41): AdminPanel(), FinancialBreakdown(), InfoRow(), StatPill(), AnnexePicker(), ResponsiveDataList(), TransporteursTable(), StatPill() (+33 more)

### Community 107 - "use-excel-workbook.ts"
Cohesion: 0.12
Nodes (20): ClasseurGridImpl, ClasseurGridLazy(), AuditSourceType, mapAuditLogFromDb(), buildClasseurJournal(), buildDossierLibelle(), classeurEntrySourceType(), ClasseurMouvementRow (+12 more)

### Community 109 - "sync-sequences.ts"
Cohesion: 0.07
Nodes (52): ClientFormFieldsProps, BonSortieCaisseRow, BonSortieRow, DossierFournisseurRow, FournisseurRow, SocieteRow, TransporteurRow, Annexe (+44 more)

### Community 116 - "classeur-tab.tsx"
Cohesion: 0.10
Nodes (20): ActifStatutBadge(), DEVIS_STATUT_TONE, DOSSIER_STATUT_DOT, DOSSIER_STATUT_TONE, DossierFournisseurStatutBadge(), DossierStatutBadge(), dotClasses, EcritureStatutBadge() (+12 more)

### Community 118 - "3. Modèle de données — détail champ par champ"
Cohesion: 0.12
Nodes (16): 3.10 bons_sortie (marchandise) + bons_sortie_caisse, 3.11 contrats + contrat_prestations + contrat_fichiers + depenses, 3.12 fournisseurs + transporteurs + dossier_fournisseurs, 3.13 archives, 3.14 documents / document_versions / ocr_jobs / ocr_fields (module OCR), 3.15 excel_workbooks & audit_logs, 3.1 profiles (extension de `auth.users`), 3.2 annexes (+8 more)

### Community 119 - "recus-paiement.ts"
Cohesion: 0.17
Nodes (19): buildRecuPrintData(), formToModuleData(), printRecu(), printRecuFromForm(), RecuFormModuleInput, resolveGeneratorBrand(), resolveRecuBrand(), toRecuModuleData() (+11 more)

### Community 121 - "7. Spécification fonctionnelle par écran"
Cohesion: 0.12
Nodes (16): 7.10 Fournisseurs, 7.11 Transporteurs, 7.12 Calendrier, 7.13 Comptabilité, 7.14 Bilans, 7.15 Paramètres, 7.1 Dashboard, 7.2 Clients (+8 more)

### Community 126 - "facture.ts"
Cohesion: 0.21
Nodes (14): buildFieldLine(), buildHeaderLegalHTML(), buildReceiptContentHTML(), buildRecuPaiementHTML(), BuildRecuPaiementHTMLOptions, buildRecuPaiementPrintHTML(), buildSignatureHTML(), montantEnLettresFCFA() (+6 more)

### Community 128 - "db-seed-demo.mjs"
Cohesion: 0.50
Nodes (3): result, root, seedFile

### Community 132 - "confirm-transitions.ts"
Cohesion: 0.60
Nodes (4): CONTRAT_STATUTS_NEED_CONFIRM, contratStatutNeedsConfirm(), DEVIS_STATUTS_NEED_CONFIRM, devisStatutNeedsConfirm()

### Community 133 - "contrats.tsx"
Cohesion: 0.26
Nodes (13): PendingConfirm, UseExcelWorkbookParams, excelTheme, cellToNumber(), cellToString(), ecritureClasseurReference(), injectGrandLivre(), normalizeClasseurRef() (+5 more)

### Community 134 - "template.ts"
Cohesion: 0.11
Nodes (28): useBilansScreen(), AgentPanel(), AlertesCard(), MagasinierPanel(), useDashboardMetrics(), DOSSIER_STATUT_HEX, DashboardScreen(), computeBenefice() (+20 more)

### Community 136 - "split-users-table.mjs"
Cohesion: 0.22
Nodes (8): 11. Temps réel, 12. Routes API custom (7), 13. Glossaire, 14. Références (fichiers sources), 4. Machines à états (FSM), 6. Matrice des permissions, Cahier des charges détaillé — Plateforme SLTT Transit, Sommaire

### Community 137 - "bons-slice.ts"
Cohesion: 0.16
Nodes (27): DocumentRow, DocumentVersionRow, OcrFieldRow, OcrJobRow, buildDocumentStoragePath(), dataUrlToBlob(), getSignedDocumentUrl(), removeDocumentStoragePaths() (+19 more)

### Community 139 - "sync-sequences.ts"
Cohesion: 0.11
Nodes (36): AnnexeSelector(), CreateDossierFromOcrButton(), AppShell(), BreadcrumbNav(), DETAIL_PARENT, CommandPalette(), QuickAction, NavList() (+28 more)

### Community 140 - "command-palette.tsx"
Cohesion: 0.09
Nodes (29): RecuGeneratorActions(), RecuGeneratorForm(), RecuGeneratorFormProps, ResteSummary(), STATUT_BADGE_CLASS, STATUT_LABELS, FieldLine(), RecuReceiptBody() (+21 more)

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
Cohesion: 0.47
Nodes (5): GrandLivreRow, buildGrandLivreXlsxBlob(), downloadBlob(), exportGrandLivreToXlsx(), parseXlsxToGrandLivreRows()

### Community 155 - "ocr-review-dialog.tsx"
Cohesion: 0.06
Nodes (52): extractClientIp(), GET(), ClientsTable(), avatarGradient(), ClientSortKey, ClientTypeFilter, rowAccentClass(), SORT_OPTIONS (+44 more)

### Community 156 - "clsx"
Cohesion: 0.50
Nodes (3): secureRuntimeCaching, serwist, WorkerGlobalScope

### Community 158 - "dashboard-screen.tsx"
Cohesion: 0.13
Nodes (14): EvolutionChartCardImpl, EvolutionChartCardLazy(), RepartitionCardImpl, RepartitionCardLazy(), DossiersEvolutionChartImpl, DossiersEvolutionChartLazy(), StockRepartitionChartImpl, StockRepartitionChartLazy() (+6 more)

### Community 164 - "classeur-import.ts"
Cohesion: 0.23
Nodes (18): ClasseurType, buildColMapFromRow(), cellToString(), ClasseurImportApplyPlan, ClasseurImportRow, countFilledCells(), HEADER_ALIASES, looksLikeDataRow() (+10 more)

### Community 165 - "getInitials"
Cohesion: 0.32
Nodes (6): ExcelSaveStatus, ExcelToolbar(), QuickBtn(), ExcelWorkbookPanel(), ExcelWorkbookPanelProps, useExcelWorkbook()

### Community 173 - "readLegacyNavPersist"
Cohesion: 0.67
Nodes (3): readLegacyNavPersist(), seedFromLegacy(), seedFromLegacy()

### Community 176 - "InstallPWA.tsx"
Cohesion: 0.18
Nodes (10): Ce qui ne change pas, Clean code, Conventions de code — Transit SLTT, Conventions de nommage, Gestion des erreurs, Imports, Migration en cours, Principes SOLID (+2 more)

### Community 180 - "use-recu-generator.ts"
Cohesion: 0.09
Nodes (46): ConfirmActionDialog(), ConvertDevisDialog(), DevisListBanner(), DossierDocumentsPanel(), BackupTab(), ProfileTab(), SecurityTab(), AnnexeCard() (+38 more)

### Community 183 - "bon-caisse-form-dialog.tsx"
Cohesion: 0.25
Nodes (14): DangerConfirmDialog(), ActionsCard(), InformationsCard(), RecuGeneratorActionsProps, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent() (+6 more)

### Community 188 - "dossier-form-ui.tsx"
Cohesion: 0.05
Nodes (54): BeforeInstallPromptEvent, InstallPWA(), InstallPWAProps, isDesktopChromium(), isIos(), isStandalone(), FormField(), iconWrap (+46 more)

## Knowledge Gaps
- **589 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+584 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **77 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `dossier-bulk-import-dialog.tsx` to `devis.tsx`, `require-admin.ts`, `template.ts`, `domain-types.ts`, `export.ts`, `sync-sequences.ts`, `command-palette.tsx`, `contrats.tsx`, `calendrier.tsx`, `contrat-stats.test.ts`, `Facture`, `archives-slice.ts`, `ocr-review-dialog.tsx`, `stock-slice.ts`, `csv-export.ts`, `dashboard-screen.tsx`, `createServerClient`, `2. Fonctionnalités demandées`, `getInitials`, `@radix-ui/react-toast`, `@radix-ui/react-slot`, `SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés`, `ag-grid-community`, `use-recu-generator.ts`, `bon-caisse-form-dialog.tsx`, `dossier-form-ui.tsx`, `calculations.test.ts`, `operation-form-dialog.tsx`, `users-slice.ts`, `classeur-tab.tsx`, `InstallPWA.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `comptabilite-generale-import.ts`, `zod`, `tailwind-merge`, `@radix-ui/react-switch`, `@radix-ui/react-select`, `@radix-ui/react-label`, `package.json`, `bon-caisse.ts`, `csv-export.ts`, `@radix-ui/react-separator`, `@radix-ui/react-toast`, `server-only`, `@supabase/supabase-js`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-dialog`, `tesseract.js`, `scripts`, `ag-grid-community`, `ag-grid-react`, `@radix-ui/react-dropdown-menu`, `exceljs`, `excel-export.ts`, `heic2any`, `pdfjs-dist`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `react` connect `csv-export.ts` to `devis.tsx`, `template.ts`, `@radix-ui/react-slot`, `SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés`, `contrat-stats.test.ts`, `use-recu-generator.ts`, `dependencies`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _589 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devis.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13846153846153847 - nodes in this community are weakly interconnected._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10685249709639953 - nodes in this community are weakly interconnected._
- **Should `dossiers-slice.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12857142857142856 - nodes in this community are weakly interconnected._