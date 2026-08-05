# Graph Report - Transit_SLTT  (2026-08-04)

## Corpus Check
- 484 files · ~749,462 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2030 nodes · 7434 edges · 145 communities (74 shown, 71 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2dd44a26`
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
- domain-types.ts
- components.json
- stock-slice.ts
- csv-export.ts
- ag-grid-community
- classeur.ts
- Writing Guidelines for Postgres References
- Supabase
- Dossier
- parametres.tsx
- 2. Fonctionnalités demandées
- @radix-ui/react-slot
- @radix-ui/react-toast
- recharts
- tailwind-merge
- scripts
- SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés
- zustand
- parametres.tsx
- Section Definitions
- archives-slice.ts
- 2026-07-14T18-50-10Z__ontrats-factures-comptabilite-entreposage-archives.md
- Product
- [0.1.3](https://github.com/supabase/agent-skills/compare/v0.1.2...v0.1.3) (2026-06-02)
- [1.2.0](https://github.com/supabase/agent-skills/compare/v1.1.1...v1.2.0) (2026-06-02)
- devis.tsx
- factures.tsx
- next.config.ts
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
- @radix-ui/react-avatar
- require-admin.test.ts
- route.test.ts
- contrats.tsx
- status-badge.tsx
- devis-slice.ts
- contrat-detail.tsx
- derniers-dossiers-card.tsx
- excel-export.ts
- postcss.config.mjs
- tailwind.config.ts
- contrat-detail.tsx
- 3. Modèle de données — détail champ par champ
- heic2any.d.ts
- 7. Spécification fonctionnelle par écran
- heic2any
- route.test.ts
- pdfjs-dist
- db-seed-demo.mjs
- @radix-ui/react-toast
- tailwind-merge
- cmdk
- split-users-table.mjs
- bons-slice.ts
- @radix-ui/react-switch
- recharts
- 8. Module OCR — détail du pipeline
- @radix-ui/react-select
- README.md
- cmdk
- 9. Multi-société / multi-annexe
- @radix-ui/react-label
- 5. Règles de gestion transversales
- 10. Sécurité
- 1. Présentation générale
- 2. Architecture technique
- page.tsx
- tailwindcss-animate
- ag-grid-react
- next
- @radix-ui/react-separator
- @radix-ui/react-toast
- server-only
- @supabase/supabase-js

## God Nodes (most connected - your core abstractions)
1. `cn()` - 255 edges
2. `useStore` - 127 edges
3. `formatFCFA()` - 125 edges
4. `useToast()` - 91 edges
5. `Button()` - 90 edges
6. `formatDateShort()` - 70 edges
7. `Card()` - 68 edges
8. `usePermission()` - 57 edges
9. `useNav` - 49 edges
10. `Input()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `GuideDemarrage()` --references--> `react`  [EXTRACTED]
  src/components/sltt/dashboard/guide-demarrage.tsx → package.json
- `CalendrierScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/calendrier.tsx → package.json
- `DashboardScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/dashboard.tsx → package.json
- `FacturesScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/factures.tsx → package.json
- `FournisseursScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/fournisseurs.tsx → package.json

## Import Cycles
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/contrat-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/sync-sequences.ts -> src/lib/store.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/ecritures-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`
- 4-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/ecritures-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`

## Communities (145 total, 71 thin omitted)

### Community 0 - "devis.tsx"
Cohesion: 0.05
Nodes (100): BonCaisseFormDialogProps, CaisseLigneForm, BonFormDialogProps, ClientFormFields(), ClientFormFieldsProps, clientTypes, EcrituresFilters(), EcrituresFiltersProps (+92 more)

### Community 1 - "entreposage.tsx"
Cohesion: 0.25
Nodes (15): AnnexeSelector(), ActionsCard(), FactureEditForm(), viewTitles, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent() (+7 more)

### Community 2 - "print-modules.ts"
Cohesion: 0.11
Nodes (60): FactureDocumentHeader(), htmlEscape(), acquirePrintTarget(), brandLogoImgHTML(), buildBrandSubHTML(), buildLegalLine(), buildPrintDocument(), BuildPrintDocumentOptions (+52 more)

### Community 3 - "store.ts"
Cohesion: 0.14
Nodes (41): BonCaisseFormDialog(), BonCaisseTab(), BonFormDialog(), ClasseurGrid(), ClasseurGridProps, emptyClientForm(), ConvertDevisDialog(), DevisListBanner() (+33 more)

### Community 4 - "dossiers-slice.ts"
Cohesion: 0.08
Nodes (34): EcrituresTableProps, PaymentDialogProps, RattachementKind, syncClientStats(), DepenseRow, DossierRow, EcritureRow, Dossier (+26 more)

### Community 5 - "require-admin.ts"
Cohesion: 0.18
Nodes (10): ChartPayloadItem, ChartTooltip(), Periode, periodes, PiePayloadItem, PieTooltip(), SortableHead(), SortDir (+2 more)

### Community 6 - "utils.ts"
Cohesion: 0.05
Nodes (69): PATCH(), RouteContext, POST(), RouteContext, AdminClient, assertNotLastActiveAdmin(), DELETE(), PATCH() (+61 more)

### Community 7 - "domain-types.ts"
Cohesion: 0.13
Nodes (29): syncContratStats(), DossierFournisseur, DossierFournisseurInput, Fournisseur, FournisseurInput, syncFournisseurStats(), mapAnnexeFromDb(), createContratsSlice() (+21 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, examples, mini-services, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 9 - "export.ts"
Cohesion: 0.13
Nodes (35): BonsTab(), BonsTabProps, ClasseurSuiviDialog(), ClasseurSuiviDialogProps, ClasseurTab(), ClasseurTabProps, ClasseurViewMode, DossiersTab() (+27 more)

### Community 10 - "useStore"
Cohesion: 0.05
Nodes (41): 0. Note d'architecture — À LIRE AVANT TOUT, 1.1 POST /api/admin/users, 1.2 PATCH /api/admin/users/:id, 1.3 DELETE /api/admin/users/:id, 1.4 POST /api/admin/users/:id/password, 1.5 PATCH /api/admin/users/:id/annexes, 1.6 PATCH /api/auth/password, 1.7 GET /api/client-ip (+33 more)

### Community 12 - "nav-store.ts"
Cohesion: 0.13
Nodes (17): CONTRAT_STATUT_TONE, CONTRAT_STATUTS, FilterChip, ListFilters(), ListFiltersProps, PageHeader(), clientTypes, SortKey (+9 more)

### Community 13 - "contrats.tsx"
Cohesion: 0.07
Nodes (39): ClientProfileCard(), ClientProfileCardProps, avatarGradient(), InfoRow(), DocumentPreviewBody(), DocumentViewer(), FetchedDocumentPreview(), isDirectUrl() (+31 more)

### Community 15 - "dossier-wizard-steps.tsx"
Cohesion: 0.13
Nodes (19): DevisActionsCard(), DevisDeleteZone(), AmountRow(), TRANSITION_META, TransitionType, StockCard(), StockRow(), UsersEmptyState() (+11 more)

### Community 16 - "store-actions.test.ts"
Cohesion: 0.24
Nodes (13): DossierDetailDocuments(), FileDropZone(), SubDossierCard(), DossierFichierRow, SubDossierRow, DossierFichier, SubDossier, FichierInput (+5 more)

### Community 17 - "contrat-stats.test.ts"
Cohesion: 0.09
Nodes (25): Heading(), DossierDetailSuivi(), EmptyState(), MetaTabItem, MetaTabsList(), FournisseurTab, PrestatairesTable(), TAB_META (+17 more)

### Community 18 - "contrat-fichiers-slice.ts"
Cohesion: 0.24
Nodes (10): ContratFileDropZone(), DossierDocumentsPanel(), EntityFileDropZone(), EntityFileDropZoneLabels, EntityFileItem, EntityFilePayload, ArchivesScreen(), formatFileSize() (+2 more)

### Community 19 - "fournisseurs.tsx"
Cohesion: 0.80
Nodes (3): applyFacturePaiement(), canDecrementStock(), simulateSequentialPaiements()

### Community 20 - "Facture"
Cohesion: 0.39
Nodes (7): nextSeqFromValues(), parseIdSeq(), parseNumeroSeq(), parseTrailingSeq(), SequenceCounters, syncSequencesFromData(), SyncSource

### Community 21 - "cn"
Cohesion: 0.10
Nodes (22): PaymentDialog(), PaymentInfoBanner(), PaymentInfoBannerProps, StockTab(), useStockMovementDialogs(), BilansScreen(), currentYearMonth(), getPeriodeLabel() (+14 more)

### Community 22 - "dependencies"
Cohesion: 0.08
Nodes (25): ag-grid-community, class-variance-authority, lucide-react, dependencies, ag-grid-community, class-variance-authority, lucide-react, @radix-ui/react-alert-dialog (+17 more)

### Community 23 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css (+13 more)

### Community 24 - "archives-slice.ts"
Cohesion: 0.09
Nodes (35): beneficiairesSummary(), BonCaisseTabProps, CaisseMobileCard(), CaisseTableRow(), PreviewState, BonPreview(), BonMarchandiseTabProps, BonMobileCard() (+27 more)

### Community 25 - "dossier-form.tsx"
Cohesion: 0.08
Nodes (34): DossierDetailOverview(), DossierAmountsSection(), DossierAmountsSectionProps, CollapsibleSection(), SectionTitle(), SummaryRow(), toneMap, FormField() (+26 more)

### Community 26 - "UserRole"
Cohesion: 0.13
Nodes (14): 1. Isolation des données par annexe, 2. Sélecteur d'annexe, 3. Numérotation des documents, 4. Migration des données existantes, 5. Création d'une nouvelle annexe, CONTEXTE MÉTIER, CONTRAINTE UX — PRIORITÉ ABSOLUE, CONTRAINTES TECHNIQUES (+6 more)

### Community 27 - "domain-types.ts"
Cohesion: 0.18
Nodes (7): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle()

### Community 28 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 29 - "stock-slice.ts"
Cohesion: 0.12
Nodes (31): ContratFichierRow, DocumentRow, OcrJobRow, buildDocumentStoragePath(), dataUrlToBlob(), getSignedDocumentUrl(), removeDocumentStoragePaths(), sha256Hex() (+23 more)

### Community 30 - "csv-export.ts"
Cohesion: 0.31
Nodes (6): ACTIVITY_EVENTS, AppRootInner(), SupabaseRequiredScreen(), useSupabaseRealtime(), clearLegacyNavPersist(), LegacyNavPersist

### Community 31 - "ag-grid-community"
Cohesion: 0.13
Nodes (7): PageProps, PageProps, PageProps, PageProps, PageProps, AppRoot(), RouteSync()

### Community 33 - "Writing Guidelines for Postgres References"
Cohesion: 0.12
Nodes (15): 1. Concrete Transformation Patterns, 2. Error-First Structure, 3. Quantified Impact, 4. Self-Contained Examples, 5. Semantic Naming, Code Example Standards, Comments, Impact Level Guidelines (+7 more)

### Community 34 - "Supabase"
Cohesion: 0.13
Nodes (12): Fix suggestion, Source, What happened, Skill Feedback, Steps, Core Principles, Making and Committing Schema Changes, Reference Guides (+4 more)

### Community 35 - "Dossier"
Cohesion: 0.40
Nodes (5): readLegacyNavPersist(), seedFromLegacy(), seedFromLegacy(), Theme, UiPrefsState

### Community 36 - "parametres.tsx"
Cohesion: 0.13
Nodes (28): BreadcrumbNav(), DETAIL_PARENT, CommandPalette(), NavList(), Sidebar(), Topbar(), RouteSyncProps, useCanManageUsers() (+20 more)

### Community 38 - "2. Fonctionnalités demandées"
Cohesion: 0.14
Nodes (13): 0. Contexte, 1. Principes directeurs (non négociables), 2. Fonctionnalités demandées, 3. Récapitulatif des changements techniques, 4. Points à confirmer avec le client avant / pendant l'implémentation, 5. Hors périmètre (pour éviter la dérive), F1 — Dimension « Société » (Top Doumani / Traoré Transit Logistique), F2 — TVA 18 % optionnelle sur les factures (+5 more)

### Community 39 - "@radix-ui/react-slot"
Cohesion: 0.09
Nodes (27): inter, metadata, sora, ThemeEffect(), Toast, ToastAction, ToastActionElement, ToastClose (+19 more)

### Community 40 - "@radix-ui/react-toast"
Cohesion: 0.12
Nodes (22): react, react, EcrituresTable(), deriveStatut(), today(), useEcrituresScreen(), ComptablePanel(), TransitionDialog() (+14 more)

### Community 42 - "tailwind-merge"
Cohesion: 0.28
Nodes (8): copy(), download(), ensureDir(), langDir, langs, ocrDir, pdfWorkerSrc, root

### Community 43 - "scripts"
Cohesion: 0.12
Nodes (16): uuid, name, overrides, exceljs, private, scripts, build, db:seed:demo (+8 more)

### Community 44 - "SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés"
Cohesion: 0.18
Nodes (10): 1. Contexte du retour, 2. Clarification métier CRITIQUE : deux sociétés, une plateforme, 3.1 Référence Excel actuelle, 3.2 Équivalent à implémenter, 3.3 Suivi des mouvements, 3. Fonctionnalité demandée : le Classeur Client, 4. Architecture données (orientation), 5. Contrainte technique (+2 more)

### Community 45 - "zustand"
Cohesion: 0.09
Nodes (27): DevisPipelineCard(), DevisNextStatut, DevisStatutConfig, NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, STATUTS_ALL, NEXT_STATUT (+19 more)

### Community 46 - "parametres.tsx"
Cohesion: 0.06
Nodes (62): ExcelSaveStatus, ExcelToolbar(), QuickBtn(), ExcelWorkbookPanelProps, ExcelWorkbookLazy(), ExcelWorkbookPanel, AuditSourceType, buildClasseurJournal() (+54 more)

### Community 48 - "Section Definitions"
Cohesion: 0.20
Nodes (9): 1. Query Performance (query), 2. Connection Management (conn), 3. Security & RLS (security), 4. Schema Design (schema), 5. Concurrency & Locking (lock), 6. Data Access Patterns (data), 7. Monitoring & Diagnostics (monitor), 8. Advanced Features (advanced) (+1 more)

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
Cohesion: 0.14
Nodes (19): clampConfidence(), findFirst(), isValidYmd(), mapDossierFieldsFromText(), normalizeDate(), parseMontant(), PdfRasterizeResult, rasterizePdfToBlobs() (+11 more)

### Community 55 - "factures.tsx"
Cohesion: 0.24
Nodes (9): ConfirmDeleteDialog(), InfoCallout(), EMPTY_LIGNE, FactureMobileCard(), FactureRowProps, FactureTableRow(), isFactureEchue(), LigneForm (+1 more)

### Community 58 - "Supabase Postgres Best Practices"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 59 - "dashboard-metrics.ts"
Cohesion: 0.21
Nodes (18): ActiveAnnexe, BaseContrat, AnnexeRow, ContratRow, Annexe, AnnexeInput, Contrat, ContratInput (+10 more)

### Community 60 - "route.test.ts"
Cohesion: 0.25
Nodes (3): FakeProfile, { fakeState, resetFake }, validPatchBody

### Community 61 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): __dirname, eslintConfig, __filename

### Community 98 - "require-admin.ts"
Cohesion: 0.21
Nodes (12): CalendrierScreen(), CalEvent, DayPanel(), daysInMonth(), EventType, FR_DAYS, FR_MONTHS, isoDate() (+4 more)

### Community 101 - "@radix-ui/react-avatar"
Cohesion: 0.16
Nodes (20): BonMarchandiseTab(), useBonFilters(), AuditTab(), PreferencesTab(), ProfileTab(), SecurityTab(), SocietesTab(), emptyFormState() (+12 more)

### Community 104 - "contrats.tsx"
Cohesion: 0.11
Nodes (27): REALTIME_TABLES, fetchWithAuth(), ProfileRow, SocieteRow, Client, SocieteInput, User, ExcelWorkbook (+19 more)

### Community 107 - "status-badge.tsx"
Cohesion: 0.16
Nodes (16): DossierDetailStepper(), STATUTS_ORDERED, SocieteBadge(), DevisStatutBadge(), DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem() (+8 more)

### Community 108 - "devis-slice.ts"
Cohesion: 0.11
Nodes (32): BonSortieCaisseRow, BonSortieRow, DevisRow, FactureRow, BonMotif, BonSortie, BonSortieCaisse, BonSortieCaisseInput (+24 more)

### Community 109 - "contrat-detail.tsx"
Cohesion: 0.06
Nodes (42): AdminPanel(), AgentPanel(), AlertesCard(), ChartTooltipPayload, EcartsTooltip(), EncaissementsTooltip(), DerniersDossiersCard(), EncaissementsChart() (+34 more)

### Community 118 - "3. Modèle de données — détail champ par champ"
Cohesion: 0.12
Nodes (16): 3.10 bons_sortie (marchandise) + bons_sortie_caisse, 3.11 contrats + contrat_prestations + contrat_fichiers + depenses, 3.12 fournisseurs + transporteurs + dossier_fournisseurs, 3.13 archives, 3.14 documents / document_versions / ocr_jobs / ocr_fields (module OCR), 3.15 excel_workbooks & audit_logs, 3.1 profiles (extension de `auth.users`), 3.2 annexes (+8 more)

### Community 121 - "7. Spécification fonctionnelle par écran"
Cohesion: 0.12
Nodes (16): 7.10 Fournisseurs, 7.11 Transporteurs, 7.12 Calendrier, 7.13 Comptabilité, 7.14 Bilans, 7.15 Paramètres, 7.1 Dashboard, 7.2 Clients (+8 more)

### Community 128 - "db-seed-demo.mjs"
Cohesion: 0.50
Nodes (3): result, root, seedFile

### Community 132 - "cmdk"
Cohesion: 0.09
Nodes (36): BonSortieCaisseLigneRow, BonSortieStatut, ClientRow, ContratPrestationRow, DocumentVersionRow, DossierFournisseurRow, DossierFournisseurStatut, FactureLigneRow (+28 more)

### Community 136 - "split-users-table.mjs"
Cohesion: 0.22
Nodes (8): 11. Temps réel, 12. Routes API custom (7), 13. Glossaire, 14. Références (fichiers sources), 4. Machines à états (FSM), 6. Matrice des permissions, Cahier des charges détaillé — Plateforme SLTT Transit, Sommaire

### Community 137 - "bons-slice.ts"
Cohesion: 0.14
Nodes (24): AuditAction, AuditEntry, AuditModule, AuditSourceRef, insertAuditLog(), mapAuditLogFromDb(), resolveClientIp(), fetchMouvementSuivi() (+16 more)

### Community 141 - "8. Module OCR — détail du pipeline"
Cohesion: 0.29
Nodes (7): 8.1 Entrée, 8.2 Stockage, 8.3 Extraction (`tesseract-provider.ts`), 8.4 Mapping heuristique (`dossier-mapper.ts`), 8.5 Revue et validation, 8.6 Fiabilité, 8. Module OCR — détail du pipeline

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

## Knowledge Gaps
- **539 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+534 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **71 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `@radix-ui/react-toast`, `tailwind-merge`, `@radix-ui/react-switch`, `recharts`, `@radix-ui/react-select`, `calendrier.tsx`, `cmdk`, `@radix-ui/react-label`, `tailwindcss-animate`, `ag-grid-react`, `next`, `@radix-ui/react-separator`, `classeur.ts`, `@radix-ui/react-toast`, `server-only`, `@supabase/supabase-js`, `@radix-ui/react-toast`, `recharts`, `scripts`, `archives-slice.ts`, `excel-export.ts`, `contrat-detail.tsx`, `heic2any`, `pdfjs-dist`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `react` connect `@radix-ui/react-toast` to `require-admin.ts`, `store.ts`, `contrat-detail.tsx`, `cn`, `dependencies`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `cn()` connect `contrats.tsx` to `devis.tsx`, `entreposage.tsx`, `store.ts`, `require-admin.ts`, `utils.ts`, `export.ts`, `nav-store.ts`, `dossier-wizard-steps.tsx`, `contrat-stats.test.ts`, `contrat-fichiers-slice.ts`, `cn`, `archives-slice.ts`, `dossier-form.tsx`, `domain-types.ts`, `parametres.tsx`, `@radix-ui/react-slot`, `@radix-ui/react-toast`, `zustand`, `parametres.tsx`, `factures.tsx`, `require-admin.ts`, `@radix-ui/react-avatar`, `status-badge.tsx`, `contrat-detail.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _539 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devis.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05341055341055341 - nodes in this community are weakly interconnected._
- **Should `print-modules.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10947368421052632 - nodes in this community are weakly interconnected._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14396135265700483 - nodes in this community are weakly interconnected._