# Graph Report - Transit_SLTT  (2026-08-05)

## Corpus Check
- 494 files · ~757,273 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2074 nodes · 7606 edges · 156 communities (86 shown, 70 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.77)
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
- derniers-dossiers-card.tsx
- 2. Fonctionnalités demandées
- @radix-ui/react-slot
- @radix-ui/react-toast
- recharts
- tailwind-merge
- scripts
- SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés
- require-admin.ts
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
- @radix-ui/react-avatar
- require-admin.test.ts
- route.test.ts
- contrats.tsx
- backup-tab.tsx
- devis.tsx
- status-badge.tsx
- devis-slice.ts
- contrat-detail.tsx
- derniers-dossiers-card.tsx
- excel-export.ts
- postcss.config.mjs
- tailwind.config.ts
- use-benefice-par-societe.ts
- contrat-detail.tsx
- 3. Modèle de données — détail champ par champ
- heic2any.d.ts
- 7. Spécification fonctionnelle par écran
- echeance-utils.ts
- contrat-detail.tsx
- heic2any
- route.test.ts
- excel-export.ts
- pdfjs-dist
- db-seed-demo.mjs
- audit.ts
- @radix-ui/react-toast
- tailwind-merge
- cmdk
- template.ts
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
- tailwindcss-animate
- backup-slice.test.ts
- ag-grid-react
- next
- @radix-ui/react-separator
- @radix-ui/react-toast
- server-only
- @supabase/supabase-js

## God Nodes (most connected - your core abstractions)
1. `cn()` - 258 edges
2. `useStore` - 131 edges
3. `formatFCFA()` - 128 edges
4. `useToast()` - 95 edges
5. `Button()` - 92 edges
6. `formatDateShort()` - 72 edges
7. `Card()` - 69 edges
8. `usePermission()` - 59 edges
9. `Input()` - 49 edges
10. `useNav` - 49 edges

## Surprising Connections (you probably didn't know these)
- `GuideDemarrage()` --references--> `react`  [EXTRACTED]
  src/components/sltt/dashboard/guide-demarrage.tsx → package.json
- `useFactureEditState()` --references--> `react`  [EXTRACTED]
  src/components/sltt/facture-detail/use-facture-edit-state.ts → package.json
- `CalendrierScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/calendrier.tsx → package.json
- `FactureDetailScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/facture-detail.tsx → package.json
- `PaiementDialog()` --references--> `react`  [EXTRACTED]
  src/components/sltt/facture-detail/paiement-dialog.tsx → package.json

## Import Cycles
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/sync-sequences.ts -> src/lib/store.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/ecritures-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/contrat-stats.ts`
- 4-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/ecritures-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`

## Communities (156 total, 70 thin omitted)

### Community 0 - "devis.tsx"
Cohesion: 0.14
Nodes (25): CONTRAT_STATUTS, InfoRow(), MODES_PAIEMENT, PRESTATION_STATUT_TONE, PRESTATION_STATUTS, ActiveAnnexe, syncContratStats(), BaseContrat (+17 more)

### Community 1 - "entreposage.tsx"
Cohesion: 0.10
Nodes (21): ActionsCard(), FactureEditForm(), FinancialSummary(), InfoRow(), InformationsCard(), LignesCard(), LignesTable(), PaymentRing() (+13 more)

### Community 2 - "print-modules.ts"
Cohesion: 0.11
Nodes (60): FactureDocumentHeader(), htmlEscape(), acquirePrintTarget(), brandLogoImgHTML(), buildBrandSubHTML(), buildLegalLine(), buildPrintDocument(), BuildPrintDocumentOptions (+52 more)

### Community 3 - "store.ts"
Cohesion: 0.10
Nodes (23): ConfirmDeleteDialog(), ConvertDevisDialog(), DevisListBanner(), MouvementsTab(), NewItemDialog(), StockTab(), PageHeader(), EntrepotTab (+15 more)

### Community 4 - "dossiers-slice.ts"
Cohesion: 0.18
Nodes (13): DossierFournisseur, DossierFournisseurInput, Fournisseur, FournisseurInput, syncFournisseurStats(), baseClient, baseDossier, { calls, remoteState, resetFake } (+5 more)

### Community 5 - "require-admin.ts"
Cohesion: 0.14
Nodes (17): AmountRow(), DossierDetailOverview(), DossierInfoGrid(), InfoTile(), DossierAmountsSection(), DossierAmountsSectionProps, TRANSITION_META, TransitionType (+9 more)

### Community 6 - "utils.ts"
Cohesion: 0.12
Nodes (28): AnnexePicker(), PasswordField(), RolePicker(), allRoles, emptyFormState(), FormMode, FormTab, isCustomPermissionSet() (+20 more)

### Community 7 - "domain-types.ts"
Cohesion: 0.11
Nodes (30): MouvementRow, ProfilePublicRow, StockItemRow, Mouvement, createContratsSlice(), mapContratFromDb(), mapContratPrestationFromDb(), mapDepenseFromDb() (+22 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, examples, mini-services, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 9 - "export.ts"
Cohesion: 0.08
Nodes (54): BonCaisseTabProps, PreviewState, BonMarchandiseTab(), BonMarchandiseTabProps, BonMobileCard(), BonTableRow(), BON_MOTIF_TONE, BON_MOTIFS (+46 more)

### Community 10 - "useStore"
Cohesion: 0.05
Nodes (41): 0. Note d'architecture — À LIRE AVANT TOUT, 1.1 POST /api/admin/users, 1.2 PATCH /api/admin/users/:id, 1.3 DELETE /api/admin/users/:id, 1.4 POST /api/admin/users/:id/password, 1.5 PATCH /api/admin/users/:id/annexes, 1.6 PATCH /api/auth/password, 1.7 GET /api/client-ip (+33 more)

### Community 11 - "dashboard.tsx"
Cohesion: 0.05
Nodes (10): PageProps, PageProps, PageProps, PageProps, PageProps, PageProps, RouteSync(), RouteSyncProps (+2 more)

### Community 12 - "nav-store.ts"
Cohesion: 0.17
Nodes (25): BonCaisseFormDialogProps, CaisseLigneForm, ClasseurSuiviDialog(), ClasseurSuiviDialogProps, classeurStatutTone(), emptyClientForm(), modeOptions, DepenseFormModal() (+17 more)

### Community 13 - "contrats.tsx"
Cohesion: 0.08
Nodes (34): Heading(), StatPill(), ResponsiveDataList(), SortableHead(), DayPanel(), PrestatairesTable(), TarifsTable(), TypeBadge() (+26 more)

### Community 15 - "dossier-wizard-steps.tsx"
Cohesion: 0.19
Nodes (20): PATCH(), RouteContext, POST(), RouteContext, AdminClient, assertNotLastActiveAdmin(), DELETE(), PATCH() (+12 more)

### Community 16 - "store-actions.test.ts"
Cohesion: 0.10
Nodes (71): react, react, BonCaisseFormDialog(), BonCaisseTab(), BonFormDialog(), CreateDossierFromOcrButton(), DossierBulkImportButton(), DossierDocumentsPanel() (+63 more)

### Community 17 - "contrat-stats.test.ts"
Cohesion: 0.15
Nodes (16): FilterChip, ListFilters(), ListFiltersProps, MetaTabItem, MetaTabsList(), ResponsiveColumn, ArchiveTab, DocSource (+8 more)

### Community 18 - "contrat-fichiers-slice.ts"
Cohesion: 0.13
Nodes (27): EcrituresTableProps, PaymentDialogProps, modeIcon, syncClientStats(), DepenseRow, DossierRow, EcritureRow, DossierStatut (+19 more)

### Community 19 - "fournisseurs.tsx"
Cohesion: 0.80
Nodes (3): applyFacturePaiement(), canDecrementStock(), simulateSequentialPaiements()

### Community 20 - "Facture"
Cohesion: 0.10
Nodes (21): DevisNextStatut, DevisStatutConfig, NEXT_STATUT, STATUT_CONFIG, STATUTS_ALL, DevisSummaryHeader(), DossierDetailHero(), DossierDetailStepper() (+13 more)

### Community 21 - "cn"
Cohesion: 0.10
Nodes (33): beneficiairesSummary(), CaisseMobileCard(), CaisseTableRow(), BonPreview(), BonsTab(), ClasseurGrid(), ClasseurGridProps, ClasseurTab() (+25 more)

### Community 22 - "dependencies"
Cohesion: 0.08
Nodes (25): ag-grid-community, class-variance-authority, lucide-react, dependencies, ag-grid-community, class-variance-authority, lucide-react, @radix-ui/react-alert-dialog (+17 more)

### Community 23 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css (+13 more)

### Community 24 - "archives-slice.ts"
Cohesion: 0.28
Nodes (12): AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogTitle() (+4 more)

### Community 25 - "dossier-form.tsx"
Cohesion: 0.18
Nodes (13): TransitionDialogProps, deriveClientIdFromRattachement(), RattachementKind, DevisRow, DevisInput, DevisStatut, Dossier, createDevisSlice() (+5 more)

### Community 26 - "UserRole"
Cohesion: 0.13
Nodes (14): 1. Isolation des données par annexe, 2. Sélecteur d'annexe, 3. Numérotation des documents, 4. Migration des données existantes, 5. Création d'une nouvelle annexe, CONTEXTE MÉTIER, CONTRAINTE UX — PRIORITÉ ABSOLUE, CONTRAINTES TECHNIQUES (+6 more)

### Community 27 - "domain-types.ts"
Cohesion: 0.22
Nodes (15): ClientFormFieldsProps, clientTypes, EcrituresFilters(), DEVIS_SORT_OPTIONS, DevisListFilters(), DevisSortKey, CATEGORIES, Select() (+7 more)

### Community 28 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 29 - "stock-slice.ts"
Cohesion: 0.23
Nodes (17): DocumentRow, buildDocumentStoragePath(), dataUrlToBlob(), removeDocumentStoragePaths(), sha256Hex(), uploadDocumentBlob(), DocumentCategorie, DocumentEntityType (+9 more)

### Community 30 - "csv-export.ts"
Cohesion: 0.20
Nodes (10): EntryExitDialogs(), SORTIE_MOTIFS, SortieMotif, AnnexeCard(), LOGO_ACCEPTED_TYPES, SocieteCard(), StockMovementFields(), StockMovementFieldsProps (+2 more)

### Community 31 - "ag-grid-community"
Cohesion: 0.13
Nodes (21): ExcelWorkbookLazy(), ExcelWorkbookPanel, ClientFicheScreen(), AuditSourceType, buildClasseurJournal(), buildDossierLibelle(), ClasseurEntry, classeurEntrySourceType() (+13 more)

### Community 33 - "Writing Guidelines for Postgres References"
Cohesion: 0.12
Nodes (15): 1. Concrete Transformation Patterns, 2. Error-First Structure, 3. Quantified Impact, 4. Self-Contained Examples, 5. Semantic Naming, Code Example Standards, Comments, Impact Level Guidelines (+7 more)

### Community 34 - "Supabase"
Cohesion: 0.13
Nodes (12): Fix suggestion, Source, What happened, Skill Feedback, Steps, Core Principles, Making and Committing Schema Changes, Reference Guides (+4 more)

### Community 35 - "Dossier"
Cohesion: 0.15
Nodes (12): ACTIVITY_EVENTS, AppRootInner(), CheckedState, Phase, ReviewRow, StatutHistorique, LoginScreen(), SupabaseRequiredScreen() (+4 more)

### Community 36 - "parametres.tsx"
Cohesion: 0.29
Nodes (9): EcrituresFiltersProps, NewEcritureDialog(), NewEcritureDialogProps, StatutFilter, Client, ClientInput, ClientsSlice, createClientsSlice() (+1 more)

### Community 37 - "derniers-dossiers-card.tsx"
Cohesion: 0.08
Nodes (34): AdminPanel(), AgentPanel(), AlertesCard(), ChartTooltipPayload, EcartsTooltip(), EncaissementsTooltip(), ComptablePanel(), DerniersDossiersCard() (+26 more)

### Community 38 - "2. Fonctionnalités demandées"
Cohesion: 0.14
Nodes (13): 0. Contexte, 1. Principes directeurs (non négociables), 2. Fonctionnalités demandées, 3. Récapitulatif des changements techniques, 4. Points à confirmer avec le client avant / pendant l'implémentation, 5. Hors périmètre (pour éviter la dérive), F1 — Dimension « Société » (Top Doumani / Traoré Transit Logistique), F2 — TVA 18 % optionnelle sur les factures (+5 more)

### Community 39 - "@radix-ui/react-slot"
Cohesion: 0.09
Nodes (27): BonFormDialogProps, DangerConfirmDialog(), EntityFileDropZone(), EntityFileDropZoneLabels, EntityFileItem, EntityFilePayload, Badge(), badgeVariants (+19 more)

### Community 40 - "@radix-ui/react-toast"
Cohesion: 0.14
Nodes (15): inter, metadata, sora, viewport, AppRoot(), Toast, ToastAction, ToastActionElement (+7 more)

### Community 42 - "tailwind-merge"
Cohesion: 0.28
Nodes (8): copy(), download(), ensureDir(), langDir, langs, ocrDir, pdfWorkerSrc, root

### Community 43 - "scripts"
Cohesion: 0.12
Nodes (16): uuid, name, overrides, exceljs, private, scripts, build, db:seed:demo (+8 more)

### Community 44 - "SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés"
Cohesion: 0.18
Nodes (10): 1. Contexte du retour, 2. Clarification métier CRITIQUE : deux sociétés, une plateforme, 3.1 Référence Excel actuelle, 3.2 Équivalent à implémenter, 3.3 Suivi des mouvements, 3. Fonctionnalité demandée : le Classeur Client, 4. Architecture données (orientation), 5. Contrainte technique (+2 more)

### Community 45 - "require-admin.ts"
Cohesion: 0.16
Nodes (9): DocumentMetaForm(), DocumentMetaValues, DocumentUploadFile, DocumentUploadZone(), DocumentPreviewBody(), DocumentViewer(), FetchedDocumentPreview(), isDirectUrl() (+1 more)

### Community 46 - "parametres.tsx"
Cohesion: 0.15
Nodes (22): ExcelSaveStatus, ExcelToolbar(), QuickBtn(), ExcelWorkbookPanel(), ExcelWorkbookPanelProps, planClasseurImport(), excelTheme, cellToNumber() (+14 more)

### Community 47 - "guide-progress.ts"
Cohesion: 0.19
Nodes (12): GuideDemarrage(), UserRole, emitGuideReset(), getGuideProgress(), getGuideStepsForRole(), GUIDE_STEP_DEFS, GuideStepDef, GuideStepId (+4 more)

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
Cohesion: 0.10
Nodes (28): clampConfidence(), findFirst(), isValidYmd(), mapDossierFieldsFromText(), normalizeDate(), parseMontant(), PdfRasterizeResult, rasterizePdfToBlobs() (+20 more)

### Community 55 - "factures.tsx"
Cohesion: 0.11
Nodes (26): ClientFormFields(), CollapsibleSection(), SectionTitle(), SummaryRow(), toneMap, DossierIdentityStep(), DossierIdentityStepProps, DossierSuiviSection() (+18 more)

### Community 57 - "dashboard-metrics.ts"
Cohesion: 0.22
Nodes (14): FactureLigne, computeIncrementalPaye(), validatePaymentAmount(), FactureInput, createFacturesSlice(), FacturesSlice, mapFactureFromDb(), computeAnnexeScopedReference() (+6 more)

### Community 58 - "Supabase Postgres Best Practices"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 59 - "dashboard-metrics.ts"
Cohesion: 0.23
Nodes (14): DossierDetailDocuments(), FileDropZone(), SubDossierCard(), GlossaryLabel(), DossierFichierRow, SubDossierRow, DossierFichier, SubDossier (+6 more)

### Community 60 - "route.test.ts"
Cohesion: 0.25
Nodes (3): FakeProfile, { fakeState, resetFake }, validPatchBody

### Community 61 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): __dirname, eslintConfig, __filename

### Community 98 - "require-admin.ts"
Cohesion: 0.21
Nodes (12): CalendrierScreen(), CalEvent, daysInMonth(), EventType, FR_DAYS, FR_MONTHS, isoDate(), startOfMonth() (+4 more)

### Community 101 - "@radix-ui/react-avatar"
Cohesion: 0.13
Nodes (17): AnnexeSelector(), NavList(), viewTitles, Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader() (+9 more)

### Community 104 - "contrats.tsx"
Cohesion: 0.07
Nodes (39): REALTIME_TABLES, fetchWithAuth(), ContratFichierRow, ProfileRow, SocieteRow, ContratFichier, SocieteInput, User (+31 more)

### Community 105 - "backup-tab.tsx"
Cohesion: 0.25
Nodes (17): buildColMapFromRow(), cellToString(), ClasseurImportApplyPlan, ClasseurImportRow, countFilledCells(), HEADER_ALIASES, looksLikeDataRow(), looksLikeGrandLivreHeaderRow() (+9 more)

### Community 106 - "devis.tsx"
Cohesion: 0.12
Nodes (23): ClasseurTabProps, ClasseurViewMode, ClientProfileCard(), ClientProfileCardProps, avatarGradient(), PaymentInfoBanner(), PaymentInfoBannerProps, ConvertDevisDialogProps (+15 more)

### Community 107 - "status-badge.tsx"
Cohesion: 0.16
Nodes (19): TransporteurFormModal(), CAPACITE_PRESETS, emptyTransporteurForm(), firstInvalidTransporteurStep(), isTransporteurFormValid(), isTransporteurStepValid(), maxReachableStep(), STEP_FIELDS (+11 more)

### Community 108 - "devis-slice.ts"
Cohesion: 0.21
Nodes (13): BonSortieCaisseRow, BonSortieRow, BonMotif, BonSortie, BonSortieCaisse, BonSortieCaisseInput, societe(), BonInput (+5 more)

### Community 109 - "contrat-detail.tsx"
Cohesion: 0.24
Nodes (8): PaymentDialog(), DossierDetailSuivi(), TransitionDialog(), SORT_OPTIONS, SortKey, STATUT_OPTIONS, StatusQuickAction(), resteAPayer()

### Community 116 - "use-benefice-par-societe.ts"
Cohesion: 0.09
Nodes (29): EcrituresTable(), deriveStatut(), today(), useEcrituresScreen(), ContratFileDropZone(), ContratFormModal(), contratToInput(), ChartPayloadItem (+21 more)

### Community 118 - "3. Modèle de données — détail champ par champ"
Cohesion: 0.12
Nodes (16): 3.10 bons_sortie (marchandise) + bons_sortie_caisse, 3.11 contrats + contrat_prestations + contrat_fichiers + depenses, 3.12 fournisseurs + transporteurs + dossier_fournisseurs, 3.13 archives, 3.14 documents / document_versions / ocr_jobs / ocr_fields (module OCR), 3.15 excel_workbooks & audit_logs, 3.1 profiles (extension de `auth.users`), 3.2 annexes (+8 more)

### Community 121 - "7. Spécification fonctionnelle par écran"
Cohesion: 0.12
Nodes (16): 7.10 Fournisseurs, 7.11 Transporteurs, 7.12 Calendrier, 7.13 Comptabilité, 7.14 Bilans, 7.15 Paramètres, 7.1 Dashboard, 7.2 Clients (+8 more)

### Community 122 - "echeance-utils.ts"
Cohesion: 0.11
Nodes (24): DevisPipelineCard(), STATUT_FLOW, NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, StatutCfg, STATUTS_ALL, FactureSummaryHeader() (+16 more)

### Community 123 - "contrat-detail.tsx"
Cohesion: 0.26
Nodes (12): PATCH(), EXPORT_PERMISSIONS, POST(), sanitizeFilename(), authErrorResponse(), getAdminClient(), getAuthenticatedProfile(), getServerClient() (+4 more)

### Community 126 - "excel-export.ts"
Cohesion: 0.20
Nodes (11): Column, downloadBlob(), isValidXlsxBytes(), sanitizeFilename(), normalizeExportCell(), normalizeExportRows(), buildXlsxBuffer(), cellDisplayLength() (+3 more)

### Community 128 - "db-seed-demo.mjs"
Cohesion: 0.50
Nodes (3): result, root, seedFile

### Community 129 - "audit.ts"
Cohesion: 0.35
Nodes (10): AuditAction, AuditEntry, AuditModule, AuditSourceRef, insertAuditLog(), mapAuditLogFromDb(), resolveClientIp(), fetchMouvementSuivi() (+2 more)

### Community 132 - "cmdk"
Cohesion: 0.10
Nodes (32): BonSortieCaisseLigneRow, BonSortieStatut, ClientRow, ContratPrestationRow, DocumentVersionRow, DossierFournisseurRow, DossierFournisseurStatut, FactureLigneRow (+24 more)

### Community 133 - "template.ts"
Cohesion: 0.36
Nodes (5): buildEmptyWorkbookData(), ensureGrandLivreCapacity(), GRAND_LIVRE_HEADERS, HEADER_STYLE, headerCellData()

### Community 136 - "split-users-table.mjs"
Cohesion: 0.22
Nodes (8): 11. Temps réel, 12. Routes API custom (7), 13. Glossaire, 14. Références (fichiers sources), 4. Machines à états (FSM), 6. Matrice des permissions, Cahier des charges détaillé — Plateforme SLTT Transit, Sommaire

### Community 137 - "bons-slice.ts"
Cohesion: 0.23
Nodes (14): UnifiedDoc, ArchiveRow, Archive, TypeDocument, AddArchiveInput, ARCHIVES_ALLOWED_MIME, ArchivesSlice, createArchivesSlice() (+6 more)

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
- **544 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+539 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **70 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `contrats.tsx` to `entreposage.tsx`, `store.ts`, `require-admin.ts`, `utils.ts`, `export.ts`, `nav-store.ts`, `store-actions.test.ts`, `contrat-stats.test.ts`, `Facture`, `cn`, `archives-slice.ts`, `domain-types.ts`, `csv-export.ts`, `ag-grid-community`, `Dossier`, `derniers-dossiers-card.tsx`, `@radix-ui/react-slot`, `@radix-ui/react-toast`, `require-admin.ts`, `parametres.tsx`, `guide-progress.ts`, `factures.tsx`, `dashboard-metrics.ts`, `require-admin.ts`, `@radix-ui/react-avatar`, `devis.tsx`, `status-badge.tsx`, `contrat-detail.tsx`, `use-benefice-par-societe.ts`, `echeance-utils.ts`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `@radix-ui/react-toast`, `tailwind-merge`, `@radix-ui/react-switch`, `recharts`, `@radix-ui/react-select`, `calendrier.tsx`, `cmdk`, `store-actions.test.ts`, `@radix-ui/react-label`, `tailwindcss-animate`, `ag-grid-react`, `next`, `@radix-ui/react-separator`, `classeur.ts`, `@radix-ui/react-toast`, `server-only`, `@supabase/supabase-js`, `recharts`, `scripts`, `archives-slice.ts`, `excel-export.ts`, `contrat-detail.tsx`, `heic2any`, `pdfjs-dist`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `react` connect `store-actions.test.ts` to `entreposage.tsx`, `require-admin.ts`, `dependencies`, `guide-progress.ts`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _544 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devis.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13978494623655913 - nodes in this community are weakly interconnected._
- **Should `entreposage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09982174688057041 - nodes in this community are weakly interconnected._
- **Should `print-modules.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10947368421052632 - nodes in this community are weakly interconnected._