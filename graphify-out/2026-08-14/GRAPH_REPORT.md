# Graph Report - Transit_SLTT  (2026-08-14)

## Corpus Check
- 618 files · ~811,941 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2489 nodes · 9328 edges · 176 communities (104 shown, 72 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `940277c3`
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
- operation-form-dialog.tsx
- parametres.tsx
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
- contrats.tsx
- dossier-bulk-import-dialog.tsx
- societe-brand.ts
- page.tsx
- derniers-dossiers-card.tsx
- excel-export.ts
- postcss.config.mjs
- tailwind.config.ts
- contrat-detail.tsx
- 3. Modèle de données — détail champ par champ
- excel-export.ts
- heic2any.d.ts
- 7. Spécification fonctionnelle par écran
- dossier-detail-overview.tsx
- heic2any
- route.test.ts
- ocr-capture-dialog.tsx
- pdfjs-dist
- db-seed-demo.mjs
- comptabilite-generale-import.ts
- @radix-ui/react-toast
- tailwind-merge
- shared.tsx
- contrats.tsx
- bon-marchandise-tab.tsx
- dossier-amounts-section.tsx
- split-users-table.mjs
- bons-slice.ts
- @radix-ui/react-switch
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
- backup-slice.test.ts
- informations-card.tsx
- dossier-detail-stepper.tsx
- clsx
- class-variance-authority
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
- @univerjs/preset-sheets-core
- guide-progress.ts
- recap-client-card.tsx
- @radix-ui/react-dropdown-menu
- InstallPWA.tsx
- lignes-card.tsx
- recap-client-card.tsx
- page.tsx
- cmdk
- class-variance-authority

## God Nodes (most connected - your core abstractions)
1. `cn()` - 300 edges
2. `formatFCFA()` - 164 edges
3. `useStore` - 153 edges
4. `useToast()` - 116 edges
5. `Button()` - 114 edges
6. `Card()` - 78 edges
7. `formatDateShort()` - 77 edges
8. `usePermission()` - 65 edges
9. `useNav` - 56 edges
10. `Input()` - 55 edges

## Surprising Connections (you probably didn't know these)
- `GuideDemarrage()` --references--> `react`  [EXTRACTED]
  src/components/sltt/dashboard/guide-demarrage.tsx → package.json
- `useFactureEditState()` --references--> `react`  [EXTRACTED]
  src/components/sltt/facture-detail/use-facture-edit-state.ts → package.json
- `useFacturesScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/factures/use-factures-screen.ts → package.json
- `CalendrierScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/calendrier.tsx → package.json
- `DashboardScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/dashboard.tsx → package.json

## Import Cycles
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/ecritures-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/store.ts -> src/lib/store/documents-slice.ts -> src/lib/store/documents/index.ts -> src/lib/store/documents/resolve-document-annexe.ts -> src/lib/store.ts`
- 4-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-core-fetch-results.ts -> src/lib/store.ts`
- 4-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-secondary-fetch-results.ts -> src/lib/store.ts`
- 5-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-secondary-fetch-results.ts -> src/lib/contrat-stats.ts`
- 5-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-core-fetch-results.ts -> src/lib/client-stats.ts`
- 5-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-secondary-fetch-results.ts -> src/lib/client-stats.ts`
- 5-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-core-fetch-results.ts -> src/lib/store/sync-sequences.ts -> src/lib/store.ts`
- 5-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/data-fetch/index.ts -> src/lib/store/data-fetch/map-secondary-fetch-results.ts -> src/lib/store/sync-sequences.ts -> src/lib/store.ts`

## Communities (176 total, 72 thin omitted)

### Community 0 - "devis.tsx"
Cohesion: 0.08
Nodes (42): TransitionDialogProps, FactureRowProps, deriveClientIdFromRattachement(), RattachementKind, syncClientStats(), DossierRow, Dossier, DossierStatut (+34 more)

### Community 1 - "entreposage.tsx"
Cohesion: 0.08
Nodes (49): syncContratStats(), ArchiveRow, BonSortieCaisseRow, BonSortieRow, ClotureCaisseRow, OperationComptableRow, Archive, BonMotif (+41 more)

### Community 2 - "print-modules.ts"
Cohesion: 0.26
Nodes (30): htmlEscape(), acquirePrintTarget(), brandLogoImgHTML(), buildBrandSubHTML(), buildLegalLine(), buildPrintDocument(), documentFooterHTML(), openPrintWindow() (+22 more)

### Community 3 - "store.ts"
Cohesion: 0.09
Nodes (40): ProfilePublicRow, ProfileRow, User, mapAnnexeFromDb(), ClientsSlice, createClientsSlice(), mapClientFromDb(), fetchCoreEntities() (+32 more)

### Community 4 - "dossiers-slice.ts"
Cohesion: 0.13
Nodes (8): PageProps, PageProps, PageProps, PageProps, PageProps, RouteSync(), RouteSyncProps, syncNavFromRoute()

### Community 5 - "require-admin.ts"
Cohesion: 0.13
Nodes (24): ClotureDialog(), dayAfter(), firstDayOfMonth(), today(), EntiteTotal, JournalCaissePanelProps, OperationFormDialog(), today() (+16 more)

### Community 6 - "utils.ts"
Cohesion: 0.08
Nodes (41): BeforeInstallPromptEvent, InstallPWA(), InstallPWAProps, isDesktopChromium(), isIos(), isStandalone(), DossierDetailOverview(), DossierAmountsSection() (+33 more)

### Community 7 - "domain-types.ts"
Cohesion: 0.13
Nodes (19): REALTIME_TABLES, ContratFichierRow, ContratFichier, ExcelWorkbook, ExcelWorkbookRow, readLegacyNavPersist(), LOGGED_OUT, seedFromLegacy() (+11 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (32): dom, dom.iterable, esnext, examples, mini-services, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+24 more)

### Community 9 - "export.ts"
Cohesion: 0.11
Nodes (46): BonMarchandiseTabProps, BON_MOTIF_TONE, BON_MOTIFS, BON_STATUT_TONE, DossiersTabProps, EntitesConsolideesCardProps, SOURCE_LABEL, modeIcon (+38 more)

### Community 10 - "useStore"
Cohesion: 0.05
Nodes (41): 0. Note d'architecture — À LIRE AVANT TOUT, 1.1 POST /api/admin/users, 1.2 PATCH /api/admin/users/:id, 1.3 DELETE /api/admin/users/:id, 1.4 POST /api/admin/users/:id/password, 1.5 PATCH /api/admin/users/:id/annexes, 1.6 PATCH /api/auth/password, 1.7 GET /api/client-ip (+33 more)

### Community 12 - "nav-store.ts"
Cohesion: 0.11
Nodes (35): ProfileTabForm(), AnnexePicker(), PasswordField(), RolePicker(), allRoles, emptyFormState(), FormMode, FormTab (+27 more)

### Community 13 - "contrats.tsx"
Cohesion: 0.12
Nodes (31): BonCaisseFormDialogProps, CaisseLigneForm, ClasseurSuiviDialogProps, emptyClientForm(), ClotureDialogProps, ImportAnyDialog(), ImportAnyDialogProps, isExcelFile() (+23 more)

### Community 15 - "dossier-wizard-steps.tsx"
Cohesion: 0.13
Nodes (20): ChartPayloadItem, ChartTooltip(), PiePayloadItem, PieTooltip(), EvolutionChartCard(), EvolutionChartCardProps, RecapClientCard(), RecapClientCardProps (+12 more)

### Community 16 - "store-actions.test.ts"
Cohesion: 0.13
Nodes (18): DevisNextStatut, DevisStatutConfig, NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, STATUTS_ALL, DevisStatutBadge(), DropdownMenu() (+10 more)

### Community 17 - "contrat-stats.test.ts"
Cohesion: 0.10
Nodes (31): react, react, ArchiveUploadDialog(), BonFormDialog(), ComptabiliteGeneraleImportDialog(), ContratFormModal(), AgentPanel(), MagasinierPanel() (+23 more)

### Community 18 - "contrat-fichiers-slice.ts"
Cohesion: 0.10
Nodes (23): EcrituresTableProps, PaymentDialogProps, DEFAULT_PAIEMENT_MODE, DOSSIER_STATUT_DEDOUANE, DOSSIER_STATUT_EN_COURS, DOSSIER_STATUT_SOLDE, FETCH_ENTITY_SOFT_CAPS, getRecoveryRateColor() (+15 more)

### Community 19 - "fournisseurs.tsx"
Cohesion: 0.80
Nodes (3): applyFacturePaiement(), canDecrementStock(), simulateSequentialPaiements()

### Community 20 - "Facture"
Cohesion: 0.10
Nodes (40): AnnexeSelector(), BonCaisseFormDialog(), BonCaisseTab(), BonMarchandiseTab(), useBonFilters(), ConvertDevisDialog(), DevisListBanner(), DevisListFilters() (+32 more)

### Community 21 - "cn"
Cohesion: 0.16
Nodes (16): ClasseurImportDialog(), Phase, ReviewRow, StatPill(), TYPE_META, TYPES, CoutsTable(), LiaisonEnrichie (+8 more)

### Community 22 - "dependencies"
Cohesion: 0.07
Nodes (27): ag-grid-react, clsx, lucide-react, dependencies, ag-grid-react, clsx, lucide-react, @radix-ui/react-checkbox (+19 more)

### Community 23 - "devDependencies"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, sharp, tailwindcss, @tailwindcss/postcss (+15 more)

### Community 24 - "archives-slice.ts"
Cohesion: 0.20
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 25 - "dossier-form.tsx"
Cohesion: 0.15
Nodes (31): BreadcrumbNav(), DETAIL_PARENT, CommandPalette(), QuickAction, NavList(), Sidebar(), SidebarBrand(), Topbar() (+23 more)

### Community 26 - "UserRole"
Cohesion: 0.13
Nodes (14): 1. Isolation des données par annexe, 2. Sélecteur d'annexe, 3. Numérotation des documents, 4. Migration des données existantes, 5. Création d'une nouvelle annexe, CONTEXTE MÉTIER, CONTRAINTE UX — PRIORITÉ ABSOLUE, CONTRAINTES TECHNIQUES (+6 more)

### Community 27 - "UserRole"
Cohesion: 0.27
Nodes (7): LOGO_ACCEPTED_TYPES, SocieteCard(), StockMovementFields(), StockMovementFieldsProps, Input(), Label(), Switch()

### Community 28 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 29 - "stock-slice.ts"
Cohesion: 0.27
Nodes (5): BRAND, CHART_BRAND, CHART_COLORS, FactureModuleData, shouldShowTva()

### Community 30 - "csv-export.ts"
Cohesion: 0.10
Nodes (37): DossierDetailDocuments(), FileDropZone(), SubDossierCard(), ActiveAnnexe, BaseContrat, AnnexeRow, ContratRow, DossierFichierRow (+29 more)

### Community 31 - "ag-grid-community"
Cohesion: 0.17
Nodes (25): PATCH(), RouteContext, POST(), RouteContext, AdminClient, assertNotLastActiveAdmin(), DELETE(), PATCH() (+17 more)

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
Cohesion: 0.29
Nodes (7): CATEGORIES, DocumentMetaForm(), DocumentMetaValues, DocumentUploadFile, DocumentUploadZone(), DocumentViewer(), isDirectUrl()

### Community 37 - "createServerClient"
Cohesion: 0.17
Nodes (10): DevisActionsCard(), AmountRow(), DossierInfoGrid(), InfoTile(), TRANSITION_META, TransitionType, ActionsCard(), GlossaryLabel() (+2 more)

### Community 38 - "2. Fonctionnalités demandées"
Cohesion: 0.14
Nodes (13): 0. Contexte, 1. Principes directeurs (non négociables), 2. Fonctionnalités demandées, 3. Récapitulatif des changements techniques, 4. Points à confirmer avec le client avant / pendant l'implémentation, 5. Hors périmètre (pour éviter la dérive), F1 — Dimension « Société » (Top Doumani / Traoré Transit Logistique), F2 — TVA 18 % optionnelle sur les factures (+5 more)

### Community 39 - "@radix-ui/react-slot"
Cohesion: 0.13
Nodes (21): ARCHIVE_COLUMNS, ArchiveTab, DocSource, RattachementKind, TAB_META, TYPE_DOC_BADGE, TYPES_DOCUMENT, UnifiedDoc (+13 more)

### Community 40 - "@radix-ui/react-toast"
Cohesion: 0.31
Nodes (6): planClasseurImport(), buildEmptyWorkbookData(), ensureGrandLivreCapacity(), GRAND_LIVRE_HEADERS, HEADER_STYLE, headerCellData()

### Community 41 - "recharts"
Cohesion: 0.32
Nodes (6): ExcelSaveStatus, ExcelToolbar(), QuickBtn(), ExcelWorkbookPanel(), ExcelWorkbookPanelProps, useExcelWorkbook()

### Community 42 - "tailwind-merge"
Cohesion: 0.24
Nodes (9): copy(), coreSrcDir, download(), ensureDir(), langDir, langs, ocrDir, pdfWorkerSrc (+1 more)

### Community 43 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, db:seed:demo, dev, generate:pwa-icons, lint, postinstall, start (+3 more)

### Community 44 - "SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés"
Cohesion: 0.18
Nodes (10): 1. Contexte du retour, 2. Clarification métier CRITIQUE : deux sociétés, une plateforme, 3.1 Référence Excel actuelle, 3.2 Équivalent à implémenter, 3.3 Suivi des mouvements, 3. Fonctionnalité demandée : le Classeur Client, 4. Architecture données (orientation), 5. Contrainte technique (+2 more)

### Community 45 - "operation-form-dialog.tsx"
Cohesion: 0.06
Nodes (51): beneficiairesSummary(), BonCaisseTabProps, CaisseMobileCard(), CaisseTableRow(), PreviewState, BonPreview(), BonMobileCard(), BonTableRow() (+43 more)

### Community 46 - "parametres.tsx"
Cohesion: 0.13
Nodes (15): ChartTooltipPayload, EcartsTooltip(), EncaissementsTooltip(), DerniersDossiersCard(), EncaissementsChart(), MargeChart(), DOSSIER_STATUT_DOT, DossierStatutBadge() (+7 more)

### Community 47 - "guide-progress.ts"
Cohesion: 0.17
Nodes (19): buildRecuPrintData(), formToModuleData(), printRecu(), printRecuFromForm(), RecuFormModuleInput, resolveGeneratorBrand(), resolveRecuBrand(), toRecuModuleData() (+11 more)

### Community 48 - "Section Definitions"
Cohesion: 0.20
Nodes (9): 1. Query Performance (query), 2. Connection Management (conn), 3. Security & RLS (security), 4. Schema Design (schema), 5. Concurrency & Locking (lock), 6. Data Access Patterns (data), 7. Monitoring & Diagnostics (monitor), 8. Advanced Features (advanced) (+1 more)

### Community 49 - "archives-slice.ts"
Cohesion: 0.28
Nodes (14): BonFormDialogProps, RecuGeneratorActionsProps, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter() (+6 more)

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
Cohesion: 0.09
Nodes (36): clampConfidence(), findFirst(), isValidYmd(), mapDossierFieldsFromText(), normalizeDate(), parseMontant(), clampConfidence(), findFirst() (+28 more)

### Community 55 - "factures.tsx"
Cohesion: 0.19
Nodes (18): PendingConfirm, UseExcelWorkbookParams, excelTheme, cellToNumber(), cellToString(), ecritureClasseurReference(), GrandLivreRow, injectGrandLivre() (+10 more)

### Community 56 - "next.config.ts"
Cohesion: 0.40
Nodes (4): nextConfig, pwaHeaders, securityHeaders, withSerwist

### Community 57 - "dashboard-metrics.ts"
Cohesion: 0.18
Nodes (12): DossierFournisseur, DossierFournisseurInput, Fournisseur, FournisseurInput, baseClient, baseDossier, { calls, remoteState, resetFake }, createFournisseursSlice() (+4 more)

### Community 58 - "Supabase Postgres Best Practices"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 59 - "dashboard-metrics.ts"
Cohesion: 0.22
Nodes (14): RecuReceiptBody(), RecuReceiptBodyProps, resolveLogoUrl(), buildFieldLine(), buildHeaderLegalHTML(), buildRecuPaiementHTML(), buildSignatureHTML(), fmtDate() (+6 more)

### Community 60 - "route.test.ts"
Cohesion: 0.25
Nodes (3): FakeProfile, { fakeState, resetFake }, validPatchBody

### Community 61 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): __dirname, eslintConfig, __filename

### Community 63 - "route.ts"
Cohesion: 0.50
Nodes (6): extractClientIp(), GET(), ApiErrorBody, apiErrorResponse(), apiSuccessResponse(), toApiErrorResponse()

### Community 98 - "require-admin.ts"
Cohesion: 0.14
Nodes (18): ConfirmActionDialog(), DossierFormState, UseDossierFormActionsOptions, TransporteursScreen(), TransporteursTable(), TransporteursTableProps, InlineFormState, SORT_OPTIONS (+10 more)

### Community 101 - "operation-form-dialog.tsx"
Cohesion: 0.09
Nodes (28): ClientFormFields(), ClientFormFieldsProps, clientTypes, EcrituresFiltersProps, NewEcritureDialog(), NewEcritureDialogProps, modeOptions, StatutFilter (+20 more)

### Community 105 - "dossier-bulk-import-dialog.tsx"
Cohesion: 0.05
Nodes (50): Heading(), StatPill(), Heading(), DevisPipelineCard(), FinancialBreakdown(), InfoRow(), DocumentPreviewBody(), FetchedDocumentPreview() (+42 more)

### Community 107 - "societe-brand.ts"
Cohesion: 0.15
Nodes (19): FactureDocumentHeader(), BuildPrintDocumentOptions, ANNEXE_DOSSIER_COUT_LABELS, buildInvoiceBrandBlocks(), buildLegalLineHTML(), DEFAULT_DOSSIER_COUT_LABELS, DossierCoutLabels, escapeHtml() (+11 more)

### Community 117 - "contrat-detail.tsx"
Cohesion: 0.17
Nodes (23): CONTRAT_STATUT_TONE, CONTRAT_STATUTS, contratToInput(), InfoRow(), MODES_PAIEMENT, PRESTATION_STATUT_TONE, PRESTATION_STATUTS, DevisFormDialog() (+15 more)

### Community 118 - "3. Modèle de données — détail champ par champ"
Cohesion: 0.12
Nodes (16): 3.10 bons_sortie (marchandise) + bons_sortie_caisse, 3.11 contrats + contrat_prestations + contrat_fichiers + depenses, 3.12 fournisseurs + transporteurs + dossier_fournisseurs, 3.13 archives, 3.14 documents / document_versions / ocr_jobs / ocr_fields (module OCR), 3.15 excel_workbooks & audit_logs, 3.1 profiles (extension de `auth.users`), 3.2 annexes (+8 more)

### Community 119 - "excel-export.ts"
Cohesion: 0.14
Nodes (20): assertCellSizes(), POST(), sanitizeFilename(), fetchWithAuth(), exportExcelBodySchema, Column, downloadBlob(), exportToExcel() (+12 more)

### Community 121 - "7. Spécification fonctionnelle par écran"
Cohesion: 0.12
Nodes (16): 7.10 Fournisseurs, 7.11 Transporteurs, 7.12 Calendrier, 7.13 Comptabilité, 7.14 Bilans, 7.15 Paramètres, 7.1 Dashboard, 7.2 Clients (+8 more)

### Community 123 - "dossier-detail-overview.tsx"
Cohesion: 0.22
Nodes (11): ComptablePanel(), TransitionDialog(), SORT_OPTIONS, SortKey, STATUT_OPTIONS, useDossiersListScreen(), DossierDetailScreen(), DossiersListScreen() (+3 more)

### Community 126 - "ocr-capture-dialog.tsx"
Cohesion: 0.09
Nodes (38): BonSortieCaisseLigneRow, BonSortieStatut, ClientRow, ContratPrestationRow, DossierFournisseurRow, DossierFournisseurStatut, FactureLigneRow, FournisseurRow (+30 more)

### Community 128 - "db-seed-demo.mjs"
Cohesion: 0.50
Nodes (3): result, root, seedFile

### Community 129 - "comptabilite-generale-import.ts"
Cohesion: 0.24
Nodes (12): buildColMap(), cellToString(), Field, findHeaderRow(), HEADER_ALIASES, isPlausibleDate(), normalizeHeader(), parseAmount() (+4 more)

### Community 130 - "@radix-ui/react-toast"
Cohesion: 0.21
Nodes (10): DangerConfirmDialog(), changePasswordBodySchema, createUserBodySchema, resetPasswordBodySchema, BackupRestorePayload, backupRestoreSchema, operationImportRowSchema, operationImportRowsSchema (+2 more)

### Community 132 - "shared.tsx"
Cohesion: 0.18
Nodes (17): ClientFicheScreen(), AuditSourceType, buildClasseurJournal(), buildDossierLibelle(), classeurEntrySourceType(), ClasseurMouvementRow, ClasseurTotals, ClasseurType (+9 more)

### Community 133 - "contrats.tsx"
Cohesion: 0.21
Nodes (12): CalendrierScreen(), CalEvent, daysInMonth(), EventType, FR_DAYS, FR_MONTHS, isoDate(), startOfMonth() (+4 more)

### Community 134 - "bon-marchandise-tab.tsx"
Cohesion: 0.25
Nodes (17): buildColMapFromRow(), cellToString(), ClasseurImportApplyPlan, ClasseurImportRow, countFilledCells(), HEADER_ALIASES, looksLikeDataRow(), looksLikeGrandLivreHeaderRow() (+9 more)

### Community 135 - "dossier-amounts-section.tsx"
Cohesion: 0.32
Nodes (6): CheckedState, Phase, ReviewRow, StatutHistorique, Checkbox(), DossierBulkImportRow

### Community 136 - "split-users-table.mjs"
Cohesion: 0.22
Nodes (8): 11. Temps réel, 12. Routes API custom (7), 13. Glossaire, 14. Références (fichiers sources), 4. Machines à états (FSM), 6. Matrice des permissions, Cahier des charges détaillé — Plateforme SLTT Transit, Sommaire

### Community 137 - "bons-slice.ts"
Cohesion: 0.16
Nodes (27): DocumentRow, DocumentVersionRow, OcrFieldRow, OcrJobRow, buildDocumentStoragePath(), dataUrlToBlob(), getSignedDocumentUrl(), removeDocumentStoragePaths() (+19 more)

### Community 140 - "command-palette.tsx"
Cohesion: 0.10
Nodes (25): RecuGeneratorActions(), RecuGeneratorForm(), RecuGeneratorFormProps, ResteSummary(), STATUT_BADGE_CLASS, STATUT_LABELS, RecuReceiptHeader(), RecuReceiptHeaderProps (+17 more)

### Community 141 - "8. Module OCR — détail du pipeline"
Cohesion: 0.29
Nodes (7): 8.1 Entrée, 8.2 Stockage, 8.3 Extraction (`tesseract-provider.ts`), 8.4 Mapping heuristique (`dossier-mapper.ts`), 8.5 Revue et validation, 8.6 Fiabilité, 8. Module OCR — détail du pipeline

### Community 144 - "generate-pwa-icons.mjs"
Cohesion: 0.32
Nodes (7): __dirname, exists(), main(), outDir, root, source, writeIcon()

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

### Community 151 - "package.json"
Cohesion: 0.29
Nodes (6): uuid, name, overrides, exceljs, private, version

### Community 155 - "dossier-detail-stepper.tsx"
Cohesion: 0.10
Nodes (19): inter, metadata, sora, viewport, PwaGlobalEffects(), PwaUpdatePrompt(), AppSerwistProvider(), AppRoot() (+11 more)

### Community 156 - "clsx"
Cohesion: 0.50
Nodes (3): secureRuntimeCaching, serwist, WorkerGlobalScope

### Community 157 - "class-variance-authority"
Cohesion: 0.09
Nodes (29): ConvertDevisDialogProps, DevisFormProps, NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, StatutCfg, STATUTS_ALL, PipelineCard() (+21 more)

### Community 167 - "@radix-ui/react-dropdown-menu"
Cohesion: 0.10
Nodes (32): useBilansScreen(), AdminPanel(), AlertesCard(), DossiersEvolutionChart(), useDashboardMetrics(), DashboardScreen(), DOSSIER_STATUT_HEX, Avatar() (+24 more)

### Community 172 - "guide-progress.ts"
Cohesion: 0.24
Nodes (10): GuideDemarrage(), emitGuideReset(), getGuideProgress(), getGuideStepsForRole(), GUIDE_STEP_DEFS, GuideStepDef, GuideStepId, GuideStepView (+2 more)

### Community 173 - "recap-client-card.tsx"
Cohesion: 0.39
Nodes (5): ACTIVITY_EVENTS, AppRootInner(), useSupabaseRealtime(), clearLegacyNavPersist(), LegacyNavPersist

### Community 176 - "InstallPWA.tsx"
Cohesion: 0.10
Nodes (29): OfflineIndicator(), useArchivesScreen(), DevisEditForm(), useDossierFormActions(), FactureEditForm(), useFactureEditState(), AppShell(), Bone() (+21 more)

### Community 177 - "lignes-card.tsx"
Cohesion: 0.29
Nodes (8): EcrituresPanel(), EcrituresPanelProps, deriveStatut(), today(), useEcrituresScreen(), ComptabiliteScreen(), ComptabiliteTab, tabMeta

### Community 178 - "recap-client-card.tsx"
Cohesion: 0.38
Nodes (9): AuditAction, AuditEntry, AuditModule, AuditSourceRef, insertAuditLog(), mapAuditLogFromDb(), resolveClientIp(), fetchMouvementSuivi() (+1 more)

### Community 180 - "page.tsx"
Cohesion: 0.10
Nodes (32): BonsTab(), BonsTabProps, ClasseurSuiviDialog(), ClasseurTab(), ClasseurTabProps, ClasseurViewMode, ClientProfileCard(), ClientProfileCardProps (+24 more)

## Knowledge Gaps
- **599 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+594 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **72 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `dossier-bulk-import-dialog.tsx` to `shared.tsx`, `require-admin.ts`, `utils.ts`, `dossier-amounts-section.tsx`, `contrats.tsx`, `export.ts`, `nav-store.ts`, `contrats.tsx`, `command-palette.tsx`, `dossier-wizard-steps.tsx`, `store-actions.test.ts`, `contrat-stats.test.ts`, `contrat-fichiers-slice.ts`, `Facture`, `cn`, `dossier-form.tsx`, `UserRole`, `dossier-detail-stepper.tsx`, `comptabilite-generale-import.ts`, `createServerClient`, `@radix-ui/react-slot`, `@radix-ui/react-dropdown-menu`, `recharts`, `guide-progress.ts`, `operation-form-dialog.tsx`, `parametres.tsx`, `InstallPWA.tsx`, `archives-slice.ts`, `page.tsx`, `dashboard-metrics.ts`, `require-admin.ts`, `operation-form-dialog.tsx`, `contrat-detail.tsx`, `dossier-detail-overview.tsx`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `react` connect `contrat-stats.test.ts` to `contrats.tsx`, `@radix-ui/react-dropdown-menu`, `guide-progress.ts`, `InstallPWA.tsx`, `Facture`, `dependencies`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `tailwind-merge`, `@radix-ui/react-switch`, `@radix-ui/react-select`, `calendrier.tsx`, `contrat-stats.test.ts`, `@radix-ui/react-label`, `package.json`, `next`, `@radix-ui/react-separator`, `classeur.ts`, `@radix-ui/react-toast`, `server-only`, `@radix-ui/react-alert-dialog`, `@supabase/supabase-js`, `@radix-ui/react-dialog`, `serwist`, `tesseract.js`, `@univerjs/preset-sheets-core`, `@radix-ui/react-dropdown-menu`, `cmdk`, `class-variance-authority`, `page.tsx`, `excel-export.ts`, `heic2any`, `pdfjs-dist`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _599 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devis.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07662337662337662 - nodes in this community are weakly interconnected._
- **Should `entreposage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07744107744107744 - nodes in this community are weakly interconnected._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08571428571428572 - nodes in this community are weakly interconnected._