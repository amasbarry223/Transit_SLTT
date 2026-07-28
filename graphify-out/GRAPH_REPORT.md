# Graph Report - Transit_SLTT  (2026-07-28)

## Corpus Check
- 381 files · ~720,363 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1696 nodes · 6205 edges · 132 communities (63 shown, 69 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `30f36f34`
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
- contrats.tsx
- calendrier.tsx
- comptabilite.tsx
- contrat-stats.test.ts
- contrat-fichiers-slice.ts
- fournisseurs.tsx
- Facture
- cn
- dependencies
- devDependencies
- dossier-form.tsx
- UserRole
- domain-types.ts
- components.json
- csv-export.ts
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
- .mcp.json
- route.test.ts
- @radix-ui/react-avatar
- require-admin.test.ts
- route.test.ts
- domain-types.ts
- dossier-detail-documents.tsx
- UserRole
- status-badge.tsx
- devis-slice.ts
- contrat-detail.tsx
- derniers-dossiers-card.tsx
- excel-export.ts
- postcss.config.mjs
- tailwind.config.ts
- users-tab.tsx
- dashboard-metrics.ts
- react-dom
- heic2any.d.ts
- server-only
- @univerjs/preset-sheets-core
- sheet.tsx
- cmdk
- route.test.ts
- heic2any
- pdfjs-dist
- @radix-ui/react-select
- @radix-ui/react-toast
- tailwind-merge
- dossier-detail-overview.tsx
- tesseract.js
- parametres.tsx
- command-palette.tsx
- clsx
- lignes-card.tsx
- @radix-ui/react-select

## God Nodes (most connected - your core abstractions)
1. `cn()` - 247 edges
2. `useStore` - 118 edges
3. `formatFCFA()` - 105 edges
4. `useToast()` - 86 edges
5. `useNav` - 76 edges
6. `formatDateShort()` - 69 edges
7. `Button()` - 68 edges
8. `Card()` - 58 edges
9. `usePermission()` - 57 edges
10. `SLTTState` - 39 edges

## Surprising Connections (you probably didn't know these)
- `GuideDemarrage()` --references--> `react`  [EXTRACTED]
  src/components/sltt/dashboard/guide-demarrage.tsx → package.json
- `useFactureEditState()` --references--> `react`  [EXTRACTED]
  src/components/sltt/facture-detail/use-facture-edit-state.ts → package.json
- `CalendrierScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/calendrier.tsx → package.json
- `FactureDetailScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/facture-detail.tsx → package.json
- `FournisseursScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/fournisseurs.tsx → package.json

## Import Cycles
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`

## Communities (132 total, 69 thin omitted)

### Community 0 - "devis.tsx"
Cohesion: 0.13
Nodes (14): CollapsibleSection(), FormField(), DossierIdentityStep(), DossierIdentityStepProps, DossierSuiviSection(), DossierSuiviSectionProps, DossierTransportSection(), DossierTransportSectionProps (+6 more)

### Community 1 - "entreposage.tsx"
Cohesion: 0.43
Nodes (6): ExcelWorkbook, ExcelWorkbookRow, createExcelWorkbooksSlice(), currentUserId(), ExcelWorkbooksSlice, mapExcelWorkbookFromDb()

### Community 2 - "print-modules.ts"
Cohesion: 0.14
Nodes (51): FactureDocumentHeader(), htmlEscape(), acquirePrintTarget(), brandLogoImgHTML(), buildBrandSubHTML(), buildLegalLine(), buildPrintDocument(), BuildPrintDocumentOptions (+43 more)

### Community 3 - "store.ts"
Cohesion: 0.11
Nodes (26): BonCaisseFormDialogProps, CaisseLigneForm, ClasseurTabProps, ClasseurViewMode, CATEGORIES, modeIcon, modeOptions, StatutFilter (+18 more)

### Community 4 - "dossiers-slice.ts"
Cohesion: 0.18
Nodes (18): DossierRow, DossierStatut, assertDossierTransition(), DOSSIER_STATUT_FLOW, getNextDossierStatut(), DossierInput, createDossiersSlice(), DossiersSlice (+10 more)

### Community 5 - "require-admin.ts"
Cohesion: 0.19
Nodes (24): emptyClientForm(), AppShell(), BreadcrumbNav(), DETAIL_PARENT, CommandPalette(), Sidebar(), Topbar(), QuickClientButton() (+16 more)

### Community 6 - "use-toast.ts"
Cohesion: 0.38
Nodes (7): useFactureEditState(), DevisDetailScreen(), FactureDetailScreen(), resolveClasseurPrintBrand(), resolveSlttBrand(), resolveSocieteDisplayName(), societeToBrand()

### Community 7 - "domain-types.ts"
Cohesion: 0.09
Nodes (36): syncContratStats(), BaseContrat, ContratRow, MouvementRow, StockItemRow, Contrat, ContratInput, ContratPrestation (+28 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, examples, mini-services, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 9 - "export.ts"
Cohesion: 0.13
Nodes (38): BonCaisseTabProps, PreviewState, BonMarchandiseTabProps, BonsTabProps, DossiersTabProps, FacturesTabProps, TabEmptyState(), StockTabProps (+30 more)

### Community 10 - "useStore"
Cohesion: 0.13
Nodes (33): ClasseurSuiviDialog(), ClasseurSuiviDialogProps, classeurStatutTone(), StockTab(), clientTypes, DocumentMetaForm(), DocumentMetaValues, DocumentUploadFile (+25 more)

### Community 12 - "nav-store.ts"
Cohesion: 0.11
Nodes (21): ChartTooltipPayload, EcartsTooltip(), EncaissementsTooltip(), DerniersDossiersCard(), EncaissementsChart(), MargeChart(), CalendrierScreen(), CalEvent (+13 more)

### Community 13 - "contrats.tsx"
Cohesion: 0.10
Nodes (25): EntryExitDialogs(), MouvementsTab(), StockTab(), FilterChip, ListFilters(), ListFiltersProps, MetaTabItem, MetaTabsList() (+17 more)

### Community 15 - "comptabilite.tsx"
Cohesion: 0.16
Nodes (21): ComptablePanel(), CreateDossierFromOcrButton(), numStr(), useDossierFormState(), UseDossierFormStateOptions, getNextTransition(), TransitionDialog(), ComptabiliteScreen() (+13 more)

### Community 17 - "contrat-stats.test.ts"
Cohesion: 0.09
Nodes (32): BonSortieCaisseLigneRow, BonSortieStatut, ClientRow, ContratPrestationRow, DepenseRow, DocumentVersionRow, DossierFichierRow, DossierFournisseurRow (+24 more)

### Community 18 - "contrat-fichiers-slice.ts"
Cohesion: 0.06
Nodes (32): PageProps, PageProps, PageProps, PageProps, PageProps, AppRoot(), GuideDemarrage(), NavList() (+24 more)

### Community 19 - "fournisseurs.tsx"
Cohesion: 0.80
Nodes (3): applyFacturePaiement(), canDecrementStock(), simulateSequentialPaiements()

### Community 21 - "cn"
Cohesion: 0.07
Nodes (32): ClientFormFields(), DocumentPreviewBody(), FetchedDocumentPreview(), NewItemDialog(), InfoCallout(), ResponsiveDataList(), PrestatairesTable(), TarifsTable() (+24 more)

### Community 22 - "dependencies"
Cohesion: 0.09
Nodes (23): ag-grid-community, ag-grid-react, class-variance-authority, lucide-react, dependencies, ag-grid-community, ag-grid-react, class-variance-authority (+15 more)

### Community 23 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css (+13 more)

### Community 25 - "dossier-form.tsx"
Cohesion: 0.14
Nodes (20): TransporteurFormModal(), CAPACITE_PRESETS, emptyTransporteurForm(), FieldProps, firstInvalidTransporteurStep(), isTransporteurFormValid(), isTransporteurStepValid(), maxReachableStep() (+12 more)

### Community 26 - "UserRole"
Cohesion: 0.09
Nodes (27): NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, StatutCfg, STATUTS_ALL, PipelineCard(), VerticalStepper(), deriveClientIdFromRattachement() (+19 more)

### Community 27 - "domain-types.ts"
Cohesion: 0.09
Nodes (33): ClientFormFieldsProps, REALTIME_TABLES, fetchWithAuth(), AuditAction, AuditEntry, AuditModule, AuditSourceRef, insertAuditLog() (+25 more)

### Community 28 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 30 - "csv-export.ts"
Cohesion: 0.14
Nodes (8): PaymentRing(), SuiviPaiementCard(), DEFAULT_PAIEMENT_MODE, DOSSIER_STATUT_DEDOUANE, DOSSIER_STATUT_EN_COURS, DOSSIER_STATUT_SOLDE, CHART_COLORS, DOC_ACCEPTED_MIME_TYPES

### Community 33 - "Writing Guidelines for Postgres References"
Cohesion: 0.12
Nodes (15): 1. Concrete Transformation Patterns, 2. Error-First Structure, 3. Quantified Impact, 4. Self-Contained Examples, 5. Semantic Naming, Code Example Standards, Comments, Impact Level Guidelines (+7 more)

### Community 34 - "Supabase"
Cohesion: 0.13
Nodes (12): Fix suggestion, Source, What happened, Skill Feedback, Steps, Core Principles, Making and Committing Schema Changes, Reference Guides (+4 more)

### Community 35 - "Dossier"
Cohesion: 0.13
Nodes (30): beneficiairesSummary(), BonCaisseTab(), CaisseMobileCard(), CaisseTableRow(), BonPreview(), BonMarchandiseTab(), BonMobileCard(), BonTableRow() (+22 more)

### Community 36 - "parametres.tsx"
Cohesion: 0.05
Nodes (68): POST(), RouteContext, AdminClient, assertCanTouchTarget(), assertNotLastActiveAdmin(), DELETE(), PATCH(), RouteContext (+60 more)

### Community 37 - "audit.ts"
Cohesion: 0.05
Nodes (65): ExcelSaveStatus, ExcelToolbar(), QuickBtn(), ExcelWorkbookPanelProps, ExcelWorkbookLazy(), ExcelWorkbookPanel, AuditSourceType, mapAuditLogFromDb() (+57 more)

### Community 38 - "2. Fonctionnalités demandées"
Cohesion: 0.14
Nodes (13): 0. Contexte, 1. Principes directeurs (non négociables), 2. Fonctionnalités demandées, 3. Récapitulatif des changements techniques, 4. Points à confirmer avec le client avant / pendant l'implémentation, 5. Hors périmètre (pour éviter la dérive), F1 — Dimension « Société » (Top Doumani / Traoré Transit Logistique), F2 — TVA 18 % optionnelle sur les factures (+5 more)

### Community 39 - "@radix-ui/react-slot"
Cohesion: 0.06
Nodes (50): inter, metadata, sora, BonFormDialog(), BonFormDialogProps, BON_MOTIF_TONE, BON_MOTIFS, BON_STATUT_TONE (+42 more)

### Community 42 - "tailwind-merge"
Cohesion: 0.28
Nodes (8): copy(), download(), ensureDir(), langDir, langs, ocrDir, pdfWorkerSrc, root

### Community 43 - "scripts"
Cohesion: 0.15
Nodes (12): name, private, scripts, build, dev, lint, postinstall, start (+4 more)

### Community 44 - "SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés"
Cohesion: 0.18
Nodes (10): 1. Contexte du retour, 2. Clarification métier CRITIQUE : deux sociétés, une plateforme, 3.1 Référence Excel actuelle, 3.2 Équivalent à implémenter, 3.3 Suivi des mouvements, 3. Fonctionnalité demandée : le Classeur Client, 4. Architecture données (orientation), 5. Contrainte technique (+2 more)

### Community 45 - "zustand"
Cohesion: 0.15
Nodes (26): DocumentRow, OcrJobRow, buildDocumentStoragePath(), dataUrlToBlob(), removeDocumentStoragePaths(), sha256Hex(), uploadDocumentBlob(), DepenseInput (+18 more)

### Community 47 - "dossier-detail-overview.tsx"
Cohesion: 0.13
Nodes (23): UnifiedDoc, ArchiveRow, BonSortieCaisseRow, BonSortieRow, Archive, BonMotif, BonSortieCaisse, BonSortieCaisseInput (+15 more)

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

### Community 56 - "next.config.ts"
Cohesion: 0.29
Nodes (6): csp, nextConfig, scriptSrc, securityHeaders, supabaseOrigin, supabaseWsOrigin

### Community 57 - "status-badge.tsx"
Cohesion: 0.15
Nodes (19): AdminPanel(), AgentPanel(), AlertesCard(), MagasinierPanel(), StatutsDonutCard(), useDashboardMetrics(), DashboardSection, getDashboardSections() (+11 more)

### Community 58 - "Supabase Postgres Best Practices"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 59 - "dashboard-metrics.ts"
Cohesion: 0.13
Nodes (21): BilansScreen(), ChartPayloadItem, ChartTooltip(), currentYearMonth(), getPeriodeLabel(), Periode, periodes, PiePayloadItem (+13 more)

### Community 60 - "route.test.ts"
Cohesion: 0.25
Nodes (3): FakeProfile, { fakeState, resetFake }, validPatchBody

### Community 61 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): __dirname, eslintConfig, __filename

### Community 101 - "@radix-ui/react-avatar"
Cohesion: 0.14
Nodes (28): react, react, ACTIVITY_EVENTS, AppRootInner(), BonCaisseFormDialog(), DossierDocumentsPanel(), OcrReviewDialog(), useStockMovementDialogs() (+20 more)

### Community 104 - "domain-types.ts"
Cohesion: 0.17
Nodes (13): DossierFournisseur, DossierFournisseurInput, Fournisseur, FournisseurInput, syncFournisseurStats(), baseClient, baseDossier, { calls, remoteState, resetFake } (+5 more)

### Community 105 - "dossier-detail-documents.tsx"
Cohesion: 0.29
Nodes (11): DossierDetailDocuments(), FileDropZone(), SubDossierCard(), GlossaryLabel(), ContratFileDropZone(), DossierFichier, SubDossier, formatFileSize() (+3 more)

### Community 106 - "UserRole"
Cohesion: 0.22
Nodes (12): DossierAmountsSection(), DossierAmountsSectionProps, SectionTitle(), SummaryRow(), toneMap, iconWrap, KpiTone, Tooltip() (+4 more)

### Community 107 - "status-badge.tsx"
Cohesion: 0.09
Nodes (31): ConfirmDeleteDialog(), ConvertDevisDialog(), TRANSITION_META, TransitionType, KpiCard(), viewTitles, PageHeader(), FinancialBreakdown() (+23 more)

### Community 108 - "devis-slice.ts"
Cohesion: 0.29
Nodes (11): ConvertDevisDialogProps, DevisFormProps, DevisRow, Devis, DevisInput, DevisStatut, canTransitionDevis(), createDevisSlice() (+3 more)

### Community 109 - "contrat-detail.tsx"
Cohesion: 0.11
Nodes (19): ClientProfileCard(), ClientProfileCardProps, avatarGradient(), BON_MOTIF_TONE, bonStatutTone(), CLASSEUR_STATUT_TONE, FICHE_TABS, FicheTab (+11 more)

### Community 123 - "sheet.tsx"
Cohesion: 0.18
Nodes (7): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle()

### Community 132 - "dossier-detail-overview.tsx"
Cohesion: 0.28
Nodes (7): AmountRow(), DossierDetailOverview(), DossierInfoGrid(), InfoTile(), TransitionDialogProps, EcartValue(), Dossier

### Community 134 - "parametres.tsx"
Cohesion: 0.20
Nodes (10): actionTone, LOGO_ACCEPTED_TYPES, ParamTab, SocieteCard(), SocietesTab(), tabs, UsersTabBadge(), Checkbox() (+2 more)

### Community 136 - "command-palette.tsx"
Cohesion: 0.31
Nodes (9): Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator() (+1 more)

### Community 141 - "lignes-card.tsx"
Cohesion: 0.47
Nodes (3): FinancialSummary(), LignesCard(), LignesTable()

## Knowledge Gaps
- **421 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+416 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `devis.tsx`, `store.ts`, `dossier-detail-overview.tsx`, `require-admin.ts`, `parametres.tsx`, `command-palette.tsx`, `export.ts`, `useStore`, `route-sync.tsx`, `nav-store.ts`, `lignes-card.tsx`, `contrats.tsx`, `comptabilite.tsx`, `contrat-fichiers-slice.ts`, `dossier-form.tsx`, `UserRole`, `csv-export.ts`, `Dossier`, `parametres.tsx`, `audit.ts`, `@radix-ui/react-slot`, `status-badge.tsx`, `dashboard-metrics.ts`, `@radix-ui/react-avatar`, `dossier-detail-documents.tsx`, `UserRole`, `status-badge.tsx`, `contrat-detail.tsx`, `sheet.tsx`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `@radix-ui/react-select`, `@radix-ui/react-toast`, `tailwind-merge`, `tesseract.js`, `clsx`, `@radix-ui/react-select`, `calendrier.tsx`, `Facture`, `classeur.ts`, `@radix-ui/react-toast`, `recharts`, `scripts`, `parametres.tsx`, `archives-slice.ts`, `archives.tsx`, `@radix-ui/react-avatar`, `excel-export.ts`, `users-tab.tsx`, `dashboard-metrics.ts`, `react-dom`, `server-only`, `@univerjs/preset-sheets-core`, `cmdk`, `heic2any`, `pdfjs-dist`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `react` connect `@radix-ui/react-avatar` to `Dossier`, `use-toast.ts`, `nav-store.ts`, `contrat-fichiers-slice.ts`, `dependencies`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _421 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devis.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `print-modules.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13846153846153847 - nodes in this community are weakly interconnected._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1064102564102564 - nodes in this community are weakly interconnected._