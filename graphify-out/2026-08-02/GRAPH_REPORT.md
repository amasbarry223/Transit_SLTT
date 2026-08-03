# Graph Report - Transit_SLTT  (2026-08-02)

## Corpus Check
- 420 files · ~734,289 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1798 nodes · 6582 edges · 147 communities (78 shown, 69 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `74cf47fd`
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
- route.ts
- classeur.ts
- Writing Guidelines for Postgres References
- Supabase
- Dossier
- parametres.tsx
- audit.ts
- 2. Fonctionnalités demandées
- @radix-ui/react-slot
- @radix-ui/react-toast
- recharts
- tailwind-merge
- scripts
- SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés
- zustand
- parametres.tsx
- dossier-detail-overview.tsx
- Section Definitions
- archives-slice.ts
- 2026-07-14T18-50-10Z__ontrats-factures-comptabilite-entreposage-archives.md
- Product
- [0.1.3](https://github.com/supabase/agent-skills/compare/v0.1.2...v0.1.3) (2026-06-02)
- [1.2.0](https://github.com/supabase/agent-skills/compare/v1.1.1...v1.2.0) (2026-06-02)
- devis.tsx
- archives.tsx
- next.config.ts
- status-badge.tsx
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
- command-palette.tsx
- UserRole
- status-badge.tsx
- devis-slice.ts
- contrat-detail.tsx
- derniers-dossiers-card.tsx
- excel-export.ts
- postcss.config.mjs
- tailwind.config.ts
- vertical-stepper.tsx
- contrat-detail.tsx
- dashboard-metrics.ts
- heic2any.d.ts
- ag-grid-community
- @univerjs/preset-sheets-core
- lignes-card.tsx
- heic2any
- route.test.ts
- normalizePermissions
- pdfjs-dist
- db-seed-demo.mjs
- ag-grid-community
- @radix-ui/react-toast
- tailwind-merge
- cmdk
- tesseract.js
- parametres.tsx
- lucide-react
- devis-detail.tsx
- bons-slice.ts
- @radix-ui/react-switch
- recharts
- status-flow.ts
- vertical-stepper.tsx
- @radix-ui/react-select
- README.md
- bon-marchandise-tab.tsx
- devis.tsx
- @radix-ui/react-label

## God Nodes (most connected - your core abstractions)
1. `cn()` - 248 edges
2. `useStore` - 126 edges
3. `formatFCFA()` - 105 edges
4. `useToast()` - 90 edges
5. `useNav` - 79 edges
6. `Button()` - 75 edges
7. `formatDateShort()` - 66 edges
8. `Card()` - 62 edges
9. `usePermission()` - 57 edges
10. `Input()` - 43 edges

## Surprising Connections (you probably didn't know these)
- `GuideDemarrage()` --references--> `react`  [EXTRACTED]
  src/components/sltt/dashboard/guide-demarrage.tsx → package.json
- `CalendrierScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/calendrier.tsx → package.json
- `DashboardScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/dashboard.tsx → package.json
- `FactureFormModal()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/factures.tsx → package.json
- `PaiementDialog()` --references--> `react`  [EXTRACTED]
  src/components/sltt/facture-detail/paiement-dialog.tsx → package.json

## Import Cycles
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`

## Communities (147 total, 69 thin omitted)

### Community 0 - "devis.tsx"
Cohesion: 0.10
Nodes (24): beneficiairesSummary(), BonCaisseTabProps, CaisseMobileCard(), CaisseTableRow(), PreviewState, BonPreview(), BonTableRow(), ClasseurGrid() (+16 more)

### Community 1 - "entreposage.tsx"
Cohesion: 0.10
Nodes (26): FilterChip, MetaTabItem, MetaTabsList(), ResponsiveColumn, ResponsiveDataList(), ArchiveTab, DocSource, RattachementKind (+18 more)

### Community 2 - "print-modules.ts"
Cohesion: 0.12
Nodes (58): FactureDocumentHeader(), htmlEscape(), acquirePrintTarget(), brandLogoImgHTML(), buildBrandSubHTML(), buildLegalLine(), buildPrintDocument(), BuildPrintDocumentOptions (+50 more)

### Community 3 - "store.ts"
Cohesion: 0.15
Nodes (28): AnnexeSelector(), BreadcrumbNav(), DETAIL_PARENT, CommandPalette(), NavList(), Sidebar(), Topbar(), viewTitles (+20 more)

### Community 4 - "dossiers-slice.ts"
Cohesion: 0.18
Nodes (19): DepenseRow, DossierRow, EcritureRow, DossierStatut, Ecriture, PaiementMode, syncFournisseurStats(), DossierInput (+11 more)

### Community 5 - "require-admin.ts"
Cohesion: 0.10
Nodes (28): AdminPanel(), AgentPanel(), MagasinierPanel(), StatutsDonutCard(), EmptyState(), iconWrap, KpiCard(), KpiTone (+20 more)

### Community 6 - "utils.ts"
Cohesion: 0.18
Nodes (22): DocumentRow, buildDocumentStoragePath(), dataUrlToBlob(), getSignedDocumentUrl(), removeDocumentStoragePaths(), sha256Hex(), uploadDocumentBlob(), DocumentCategorie (+14 more)

### Community 7 - "domain-types.ts"
Cohesion: 0.10
Nodes (31): MouvementRow, SocieteRow, StockItemRow, TransporteurRow, Mouvement, Societe, SocieteInput, StockItem (+23 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, examples, mini-services, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 9 - "export.ts"
Cohesion: 0.24
Nodes (17): BonsTabProps, DossiersTabProps, FacturesTabProps, TabEmptyState(), StockTabProps, MouvementFilter, actionTone, ResponsiveDataListProps (+9 more)

### Community 10 - "useStore"
Cohesion: 0.05
Nodes (41): 0. Note d'architecture — À LIRE AVANT TOUT, 1.1 POST /api/admin/users, 1.2 PATCH /api/admin/users/:id, 1.3 DELETE /api/admin/users/:id, 1.4 POST /api/admin/users/:id/password, 1.5 PATCH /api/admin/users/:id/annexes, 1.6 PATCH /api/auth/password, 1.7 GET /api/client-ip (+33 more)

### Community 11 - "dashboard.tsx"
Cohesion: 0.09
Nodes (35): useDashboardMetrics(), BilansScreen(), ChartPayloadItem, ChartTooltip(), currentYearMonth(), getPeriodeLabel(), Periode, periodes (+27 more)

### Community 12 - "nav-store.ts"
Cohesion: 0.25
Nodes (9): ChartTooltipPayload, EcartsTooltip(), EncaissementsTooltip(), DerniersDossiersCard(), EncaissementsChart(), MargeChart(), DOSSIER_STATUT_DOT, formatDateTime() (+1 more)

### Community 13 - "contrats.tsx"
Cohesion: 0.07
Nodes (36): ClientFormFields(), DossierDetailStepper(), STATUTS_ORDERED, NewItemDialog(), Avatar(), AvatarFallback(), AvatarImage(), CardAction() (+28 more)

### Community 15 - "dossier-wizard-steps.tsx"
Cohesion: 0.17
Nodes (9): allRoles, AnnexePicker(), FormMode, FormTab, RoleFilter, roleMeta, RolePicker(), roleTone (+1 more)

### Community 16 - "store-actions.test.ts"
Cohesion: 0.06
Nodes (60): ExcelSaveStatus, ExcelToolbar(), QuickBtn(), ExcelWorkbookPanelProps, AuditSourceType, buildClasseurJournal(), buildDossierLibelle(), classeurEntrySourceType() (+52 more)

### Community 17 - "contrat-stats.test.ts"
Cohesion: 0.11
Nodes (23): BonSortieCaisseLigneRow, BonSortieStatut, ClientRow, ContratPrestationRow, DocumentVersionRow, DossierFichierRow, DossierFournisseurRow, DossierFournisseurStatut (+15 more)

### Community 18 - "contrat-fichiers-slice.ts"
Cohesion: 0.11
Nodes (14): PageProps, PageProps, PageProps, PageProps, PageProps, ACTIVITY_EVENTS, AppRoot(), AppRootInner() (+6 more)

### Community 19 - "fournisseurs.tsx"
Cohesion: 0.80
Nodes (3): applyFacturePaiement(), canDecrementStock(), simulateSequentialPaiements()

### Community 21 - "cn"
Cohesion: 0.21
Nodes (19): ContratFormModal(), DepenseFormModal(), PrestationFormModal(), CONTRAT_STATUT_TONE, CONTRAT_STATUTS, contratToInput(), InfoRow(), MODES_PAIEMENT (+11 more)

### Community 22 - "dependencies"
Cohesion: 0.08
Nodes (25): ag-grid-community, ag-grid-react, class-variance-authority, next, dependencies, ag-grid-community, ag-grid-react, class-variance-authority (+17 more)

### Community 23 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css (+13 more)

### Community 24 - "archives-slice.ts"
Cohesion: 0.14
Nodes (20): BonsTab(), ClasseurSuiviDialog(), ClasseurSuiviDialogProps, ClasseurTab(), ClasseurTabProps, ClasseurViewMode, ClientProfileCard(), avatarGradient() (+12 more)

### Community 25 - "dossier-form.tsx"
Cohesion: 0.18
Nodes (21): SORT_OPTIONS, SortKey, TransporteurFormModal(), CAPACITE_PRESETS, emptyTransporteurForm(), firstInvalidTransporteurStep(), isTransporteurFormValid(), isTransporteurStepValid() (+13 more)

### Community 26 - "UserRole"
Cohesion: 0.12
Nodes (19): TransitionDialogProps, deriveClientIdFromRattachement(), RattachementKind, syncClientStats(), FactureRow, Dossier, Facture, FactureLigne (+11 more)

### Community 27 - "domain-types.ts"
Cohesion: 0.11
Nodes (26): REALTIME_TABLES, AuditAction, AuditModule, AuditSourceRef, insertAuditLog(), mapAuditLogFromDb(), resolveClientIp(), ContratFichierRow (+18 more)

### Community 28 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 29 - "stock-slice.ts"
Cohesion: 0.16
Nodes (15): DossierFournisseur, DossierFournisseurInput, Fournisseur, FournisseurInput, SortieCaisseLigne, SubDossier, societe(), baseClient (+7 more)

### Community 30 - "csv-export.ts"
Cohesion: 0.27
Nodes (9): GuideDemarrage(), emitGuideReset(), getGuideProgress(), getGuideStepsForRole(), GUIDE_STEP_DEFS, GuideStepId, GuideStepView, GuideStoreSnapshot (+1 more)

### Community 31 - "route.ts"
Cohesion: 0.19
Nodes (18): PATCH(), RouteContext, POST(), RouteContext, AdminClient, assertCanTouchTarget(), assertNotLastActiveAdmin(), DELETE() (+10 more)

### Community 33 - "Writing Guidelines for Postgres References"
Cohesion: 0.12
Nodes (15): 1. Concrete Transformation Patterns, 2. Error-First Structure, 3. Quantified Impact, 4. Self-Contained Examples, 5. Semantic Naming, Code Example Standards, Comments, Impact Level Guidelines (+7 more)

### Community 34 - "Supabase"
Cohesion: 0.13
Nodes (12): Fix suggestion, Source, What happened, Skill Feedback, Steps, Core Principles, Making and Committing Schema Changes, Reference Guides (+4 more)

### Community 35 - "Dossier"
Cohesion: 0.11
Nodes (30): BonCaisseFormDialog(), useDossierDocumentsWarmup(), emptyForm(), OcrReviewDialog(), AuditTab(), PreferencesTab(), ProfileTab(), ProfileTabForm() (+22 more)

### Community 36 - "parametres.tsx"
Cohesion: 0.12
Nodes (21): defaultSelectionForRole(), PermissionMatrix(), PermissionMatrixProps, permissionsFromSelection(), emptyFormState(), UserFormState, DashboardSection, getDashboardSections() (+13 more)

### Community 37 - "audit.ts"
Cohesion: 0.28
Nodes (10): EXPORT_PERMISSIONS, POST(), sanitizeFilename(), normalizeExportCell(), normalizeExportRows(), buildXlsxBuffer(), cellDisplayLength(), computeColumnWidths() (+2 more)

### Community 38 - "2. Fonctionnalités demandées"
Cohesion: 0.14
Nodes (13): 0. Contexte, 1. Principes directeurs (non négociables), 2. Fonctionnalités demandées, 3. Récapitulatif des changements techniques, 4. Points à confirmer avec le client avant / pendant l'implémentation, 5. Hors périmètre (pour éviter la dérive), F1 — Dimension « Société » (Top Doumani / Traoré Transit Logistique), F2 — TVA 18 % optionnelle sur les factures (+5 more)

### Community 39 - "@radix-ui/react-slot"
Cohesion: 0.09
Nodes (26): inter, metadata, sora, Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription (+18 more)

### Community 42 - "tailwind-merge"
Cohesion: 0.28
Nodes (8): copy(), download(), ensureDir(), langDir, langs, ocrDir, pdfWorkerSrc, root

### Community 43 - "scripts"
Cohesion: 0.14
Nodes (13): name, private, scripts, build, db:seed:demo, dev, lint, postinstall (+5 more)

### Community 44 - "SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés"
Cohesion: 0.18
Nodes (10): 1. Contexte du retour, 2. Clarification métier CRITIQUE : deux sociétés, une plateforme, 3.1 Référence Excel actuelle, 3.2 Équivalent à implémenter, 3.3 Suivi des mouvements, 3. Fonctionnalité demandée : le Classeur Client, 4. Architecture données (orientation), 5. Contrainte technique (+2 more)

### Community 45 - "zustand"
Cohesion: 0.36
Nodes (7): FETCH_SOFT_CAPS, fetchAllPaged(), isTransientFetchError(), pagedSelect(), QueryBuilder, sleep(), toFetchError()

### Community 47 - "dossier-detail-overview.tsx"
Cohesion: 0.26
Nodes (11): UnifiedDoc, ArchiveRow, Archive, TypeDocument, AddArchiveInput, ARCHIVES_ALLOWED_MIME, ArchivesSlice, createArchivesSlice() (+3 more)

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

### Community 55 - "archives.tsx"
Cohesion: 0.19
Nodes (13): ClientFormFieldsProps, ActiveAnnexe, AnnexeRow, Annexe, AnnexeInput, Client, AnnexesSlice, createAnnexesSlice() (+5 more)

### Community 57 - "status-badge.tsx"
Cohesion: 0.08
Nodes (43): CollapsibleSection(), SectionTitle(), SummaryRow(), toneMap, DossierIdentityStep(), DossierIdentityStepProps, DossierSuiviSection(), DossierSuiviSectionProps (+35 more)

### Community 58 - "Supabase Postgres Best Practices"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 59 - "dashboard-metrics.ts"
Cohesion: 0.22
Nodes (16): syncContratStats(), BaseContrat, ContratRow, Contrat, ContratInput, ContratPrestation, ContratPrestationInput, ContratStatut (+8 more)

### Community 60 - "route.test.ts"
Cohesion: 0.25
Nodes (3): FakeProfile, { fakeState, resetFake }, validPatchBody

### Community 61 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): __dirname, eslintConfig, __filename

### Community 98 - "require-admin.ts"
Cohesion: 0.11
Nodes (22): EntryExitDialogs(), StockTab(), SORTIE_MOTIFS, SortieMotif, useStockMovementDialogs(), CalendrierScreen(), CalEvent, DayPanel() (+14 more)

### Community 101 - "@radix-ui/react-avatar"
Cohesion: 0.13
Nodes (35): react, react, BonCaisseTab(), BonFormDialog(), ConvertDevisDialog(), ComptablePanel(), CreateDossierFromOcrButton(), TransitionDialog() (+27 more)

### Community 104 - "contrats.tsx"
Cohesion: 0.30
Nodes (6): clientTypes, StockMovementFields(), StockMovementFieldsProps, Checkbox(), Input(), Label()

### Community 105 - "command-palette.tsx"
Cohesion: 0.35
Nodes (8): PATCH(), getAdminClient(), getAuthenticatedProfile(), getServerClient(), requireUser(), createAdminClient(), createServerClient(), getPublicKey()

### Community 106 - "UserRole"
Cohesion: 0.18
Nodes (14): DossierDetailDocuments(), FileDropZone(), SubDossierCard(), DossierAmountsSection(), DossierAmountsSectionProps, GlossaryLabel(), Tooltip(), TooltipContent() (+6 more)

### Community 107 - "status-badge.tsx"
Cohesion: 0.16
Nodes (10): DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut() (+2 more)

### Community 108 - "devis-slice.ts"
Cohesion: 0.24
Nodes (12): ConvertDevisDialogProps, DevisFormProps, DevisRow, Devis, DevisInput, DevisStatut, resolveActiveAnnexeId(), createDevisSlice() (+4 more)

### Community 109 - "contrat-detail.tsx"
Cohesion: 0.16
Nodes (15): ClientProfileCardProps, AlertesCard(), DossierDetailHero(), AmountRow(), DossierDetailOverview(), TRANSITION_META, TransitionType, StockCard() (+7 more)

### Community 118 - "dashboard-metrics.ts"
Cohesion: 0.20
Nodes (12): ContratFileDropZone(), DossierDocumentsPanel(), EntityFileDropZone(), EntityFileDropZoneLabels, EntityFileItem, EntityFilePayload, ArchivesScreen(), useUnifiedDocs() (+4 more)

### Community 121 - "ag-grid-community"
Cohesion: 0.43
Nodes (6): fetchWithAuth(), Column, downloadBlob(), exportToExcel(), isValidXlsxBytes(), sanitizeFilename()

### Community 123 - "lignes-card.tsx"
Cohesion: 0.16
Nodes (9): ConfirmDeleteDialog(), DocumentMetaForm(), DocumentMetaValues, DocumentUploadFile, DocumentUploadZone(), DocumentPreviewBody(), DocumentViewer(), FetchedDocumentPreview() (+1 more)

### Community 126 - "normalizePermissions"
Cohesion: 0.40
Nodes (6): POST(), ALL_PERMISSION_KEYS, getModuleSummary(), normalizePermissions(), createUsersSlice(), mapProfileFromDb()

### Community 128 - "db-seed-demo.mjs"
Cohesion: 0.50
Nodes (3): result, root, seedFile

### Community 129 - "ag-grid-community"
Cohesion: 0.15
Nodes (14): DossierDetailSuivi(), ActifStatutBadge(), DEVIS_STATUT_TONE, DevisStatutBadge(), DOSSIER_STATUT_TONE, DossierFournisseurStatutBadge(), dotClasses, EcritureStatutBadge() (+6 more)

### Community 134 - "parametres.tsx"
Cohesion: 0.17
Nodes (20): BonCaisseFormDialogProps, CaisseLigneForm, BonFormDialogProps, emptyClientForm(), FIELD_LABELS, FormState, Props, QuickClientButton() (+12 more)

### Community 136 - "devis-detail.tsx"
Cohesion: 0.15
Nodes (12): FinancialBreakdown(), InfoRow(), NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, StatutCfg, STATUTS_ALL, VerticalStepper() (+4 more)

### Community 137 - "bons-slice.ts"
Cohesion: 0.26
Nodes (12): BonSortieCaisseRow, BonSortieRow, BonMotif, BonSortie, BonSortieCaisse, BonSortieCaisseInput, BonInput, BonsSlice (+4 more)

### Community 140 - "status-flow.ts"
Cohesion: 0.29
Nodes (9): assertDossierTransition(), DOSSIER_STATUT_FLOW, getNextDossierStatut(), canTransitionContrat(), canTransitionDevis(), canTransitionFacture(), CONTRAT_ALLOWED_TRANSITIONS, DEVIS_ALLOWED_TRANSITIONS (+1 more)

### Community 141 - "vertical-stepper.tsx"
Cohesion: 0.27
Nodes (7): NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, StatutCfg, STATUTS_ALL, PipelineCard(), VerticalStepper()

### Community 144 - "bon-marchandise-tab.tsx"
Cohesion: 0.36
Nodes (7): BonMarchandiseTab(), BonMarchandiseTabProps, BonMobileCard(), BON_MOTIF_TONE, BON_MOTIFS, BON_STATUT_TONE, useBonFilters()

### Community 145 - "devis.tsx"
Cohesion: 0.29
Nodes (5): DevisFormDialog(), NEXT_STATUT, SORT_OPTIONS, SortKey, StatusQuickAction()

## Knowledge Gaps
- **463 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+458 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `@radix-ui/react-toast`, `tailwind-merge`, `cmdk`, `tesseract.js`, `lucide-react`, `@radix-ui/react-switch`, `recharts`, `@radix-ui/react-select`, `calendrier.tsx`, `@radix-ui/react-label`, `Facture`, `classeur.ts`, `@radix-ui/react-toast`, `recharts`, `scripts`, `parametres.tsx`, `archives-slice.ts`, `@radix-ui/react-avatar`, `excel-export.ts`, `vertical-stepper.tsx`, `contrat-detail.tsx`, `@univerjs/preset-sheets-core`, `heic2any`, `pdfjs-dist`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `react` connect `@radix-ui/react-avatar` to `require-admin.ts`, `Dossier`, `dependencies`, `csv-export.ts`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `cn()` connect `contrats.tsx` to `devis.tsx`, `entreposage.tsx`, `ag-grid-community`, `store.ts`, `require-admin.ts`, `parametres.tsx`, `devis-detail.tsx`, `export.ts`, `dashboard.tsx`, `nav-store.ts`, `dossier-wizard-steps.tsx`, `bon-marchandise-tab.tsx`, `store-actions.test.ts`, `devis.tsx`, `cn`, `archives-slice.ts`, `dossier-form.tsx`, `csv-export.ts`, `Dossier`, `parametres.tsx`, `@radix-ui/react-slot`, `status-badge.tsx`, `require-admin.ts`, `@radix-ui/react-avatar`, `contrats.tsx`, `UserRole`, `status-badge.tsx`, `contrat-detail.tsx`, `dashboard-metrics.ts`, `lignes-card.tsx`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _463 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devis.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10420168067226891 - nodes in this community are weakly interconnected._
- **Should `entreposage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09659090909090909 - nodes in this community are weakly interconnected._
- **Should `print-modules.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11514253980007405 - nodes in this community are weakly interconnected._