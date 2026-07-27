# Graph Report - Transit_SLTT  (2026-07-27)

## Corpus Check
- 360 files · ~709,702 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1620 nodes · 5943 edges · 132 communities (65 shown, 67 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e11460e2`
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
- calendrier.tsx
- dossiers-slice.ts
- client-fiche.tsx
- contrat-stats.test.ts
- contrat-fichiers-slice.ts
- fournisseurs.tsx
- bilans.tsx
- transporteur-form-fields.tsx
- dependencies
- devDependencies
- dossier-detail-hero.tsx
- dossier-form.tsx
- UserRole
- calendrier.tsx
- components.json
- users-tab.tsx
- csv-export.ts
- audit.ts
- classeur.ts
- Writing Guidelines for Postgres References
- Supabase
- Dossier
- contrat-stats.test.ts
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
- react-dom
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
- lucide-react
- .mcp.json
- route.test.ts
- @radix-ui/react-avatar
- require-admin.test.ts
- route.test.ts
- domain-types.ts
- UserRole
- format.ts
- route.ts
- DossiersListScreen
- derniers-dossiers-card.tsx
- excel-export.ts
- postcss.config.mjs
- tailwind.config.ts
- require-admin.ts
- users-tab.tsx
- dashboard-metrics.ts
- react-dom
- heic2any.d.ts
- server-only
- @univerjs/preset-sheets-core
- clsx
- cmdk
- route.test.ts
- heic2any
- pdfjs-dist
- @radix-ui/react-alert-dialog
- @radix-ui/react-select
- @radix-ui/react-toast
- tailwind-merge
- tesseract.js

## God Nodes (most connected - your core abstractions)
1. `cn()` - 246 edges
2. `useStore` - 116 edges
3. `formatFCFA()` - 105 edges
4. `useToast()` - 84 edges
5. `useNav` - 74 edges
6. `formatDateShort()` - 69 edges
7. `Button()` - 68 edges
8. `Card()` - 58 edges
9. `usePermission()` - 53 edges
10. `SLTTState` - 40 edges

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
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`

## Communities (132 total, 67 thin omitted)

### Community 0 - "devis.tsx"
Cohesion: 0.09
Nodes (28): ConfirmDeleteDialog(), EmptyState(), FilterChip, ListFilters(), ListFiltersProps, MetaTabItem, MetaTabsList(), ResponsiveColumn (+20 more)

### Community 1 - "entreposage.tsx"
Cohesion: 0.15
Nodes (25): BonCaisseFormDialogProps, CaisseLigneForm, BonCaisseTabProps, PreviewState, BonFormDialogProps, BON_MOTIFS, ClasseurSuiviDialogProps, ClientFormFields() (+17 more)

### Community 2 - "print-modules.ts"
Cohesion: 0.13
Nodes (51): FactureDocumentHeader(), htmlEscape(), brandLogoImgHTML(), buildBrandSubHTML(), buildLegalLine(), buildPrintDocument(), BuildPrintDocumentOptions, documentFooterHTML() (+43 more)

### Community 3 - "store.ts"
Cohesion: 0.08
Nodes (26): ClientFormFieldsProps, BonSortieRow, ContratFichierRow, BonMotif, Client, ContratFichier, computeIncrementalPaye(), validatePaymentAmount() (+18 more)

### Community 4 - "dossiers-slice.ts"
Cohesion: 0.10
Nodes (28): TransitionDialogProps, deriveClientIdFromRattachement(), RattachementKind, syncClientStats(), DossierRow, Dossier, DossierStatut, Ecriture (+20 more)

### Community 5 - "require-admin.ts"
Cohesion: 0.13
Nodes (26): ClasseurTabProps, ClasseurViewMode, clientTypes, CATEGORIES, FIELD_LABELS, FormState, PAIEMENT_MODES, CONTRAT_STATUT_TONE (+18 more)

### Community 6 - "use-toast.ts"
Cohesion: 0.05
Nodes (46): inter, metadata, sora, DocumentMetaForm(), DocumentMetaValues, DocumentUploadFile, DocumentUploadZone(), DocumentPreviewBody() (+38 more)

### Community 7 - "domain-types.ts"
Cohesion: 0.21
Nodes (17): syncContratStats(), BaseContrat, ContratRow, Contrat, ContratInput, ContratPrestation, ContratPrestationInput, ContratStatut (+9 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, examples, mini-services, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 9 - "export.ts"
Cohesion: 0.16
Nodes (12): ActifStatutBadge(), DEVIS_STATUT_TONE, DevisStatutBadge(), DOSSIER_STATUT_TONE, DossierFournisseurStatutBadge(), dotClasses, EcritureStatutBadge(), StockStatutBadge() (+4 more)

### Community 10 - "useStore"
Cohesion: 0.23
Nodes (14): POST(), RouteContext, AdminClient, assertCanTouchTarget(), assertNotLastActiveAdmin(), DELETE(), PATCH(), RouteContext (+6 more)

### Community 11 - "route-sync.tsx"
Cohesion: 0.12
Nodes (35): AppShell(), BreadcrumbNav(), DETAIL_PARENT, CommandPalette(), NavList(), Sidebar(), Topbar(), viewTitles (+27 more)

### Community 12 - "nav-store.ts"
Cohesion: 0.19
Nodes (13): CalendrierScreen(), CalEvent, DayPanel(), daysInMonth(), EventType, FR_DAYS, FR_MONTHS, isoDate() (+5 more)

### Community 13 - "parametres.tsx"
Cohesion: 0.16
Nodes (32): BonMarchandiseTabProps, BonsTabProps, DossiersTabProps, FacturesTabProps, TabEmptyState(), StockTabProps, MouvementFilter, ResponsiveDataListProps (+24 more)

### Community 14 - "calendrier.tsx"
Cohesion: 0.07
Nodes (35): StockCard(), StockRow(), PrestatairesTable(), TarifsTable(), TypeBadge(), ProfileTabForm(), RolePicker(), AlertDialogOverlay() (+27 more)

### Community 15 - "dossiers-slice.ts"
Cohesion: 0.15
Nodes (12): AmountRow(), DossierDetailOverview(), TRANSITION_META, TransitionType, ActionsCard(), CardAction(), CardContent(), CardDescription() (+4 more)

### Community 16 - "client-fiche.tsx"
Cohesion: 0.31
Nodes (8): POST(), sanitizeFilename(), normalizeExportRows(), buildXlsxBuffer(), cellDisplayLength(), computeColumnWidths(), HEADER_FILL, sanitizeExcelCell()

### Community 17 - "contrat-stats.test.ts"
Cohesion: 0.09
Nodes (28): BonSortieCaisseLigneRow, BonSortieCaisseRow, BonSortieStatut, ClientRow, ContratPrestationRow, DepenseRow, DocumentVersionRow, DossierFichierRow (+20 more)

### Community 18 - "contrat-fichiers-slice.ts"
Cohesion: 0.13
Nodes (9): PageProps, PageProps, PageProps, PageProps, PageProps, AppRoot(), RouteSync(), RouteSyncProps (+1 more)

### Community 19 - "fournisseurs.tsx"
Cohesion: 0.15
Nodes (18): defaultSelectionForRole(), PermissionMatrix(), PermissionMatrixProps, permissionsFromSelection(), emptyFormState(), isCustomPermissionSet(), UserFormModal(), Checkbox() (+10 more)

### Community 20 - "bilans.tsx"
Cohesion: 0.36
Nodes (8): TransporteurRow, Transporteur, TransporteurInput, TransporteurStatut, TypeVehicule, createTransporteursSlice(), mapTransporteurFromDb(), TransporteursSlice

### Community 21 - "transporteur-form-fields.tsx"
Cohesion: 0.09
Nodes (21): DossierDetailStepper(), STATUTS_ORDERED, FinancialBreakdown(), InfoRow(), NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, StatutCfg (+13 more)

### Community 22 - "dependencies"
Cohesion: 0.09
Nodes (23): ag-grid-community, ag-grid-react, class-variance-authority, next, dependencies, ag-grid-community, ag-grid-react, class-variance-authority (+15 more)

### Community 23 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css (+13 more)

### Community 24 - "dossier-detail-hero.tsx"
Cohesion: 0.29
Nodes (11): ConvertDevisDialogProps, DevisFormProps, DevisRow, Devis, DevisInput, DevisStatut, canTransitionDevis(), createDevisSlice() (+3 more)

### Community 25 - "dossier-form.tsx"
Cohesion: 0.14
Nodes (20): TransporteurFormModal(), CAPACITE_PRESETS, emptyTransporteurForm(), FieldProps, firstInvalidTransporteurStep(), isTransporteurFormValid(), isTransporteurStepValid(), maxReachableStep() (+12 more)

### Community 26 - "UserRole"
Cohesion: 0.35
Nodes (8): PATCH(), getAdminClient(), getAuthenticatedProfile(), getServerClient(), requireUser(), createAdminClient(), createServerClient(), getPublicKey()

### Community 27 - "calendrier.tsx"
Cohesion: 0.10
Nodes (21): iconWrap, KpiCard(), KpiTone, PageHeader(), ChartPayloadItem, ChartTooltip(), currentYearMonth(), getPeriodeLabel() (+13 more)

### Community 28 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 29 - "users-tab.tsx"
Cohesion: 0.29
Nodes (12): AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogTitle() (+4 more)

### Community 31 - "audit.ts"
Cohesion: 0.18
Nodes (14): BonsTab(), ClasseurSuiviDialog(), ClasseurTab(), ClientProfileCard(), ClientProfileCardProps, avatarGradient(), BON_MOTIF_TONE, bonStatutTone() (+6 more)

### Community 33 - "Writing Guidelines for Postgres References"
Cohesion: 0.12
Nodes (15): 1. Concrete Transformation Patterns, 2. Error-First Structure, 3. Quantified Impact, 4. Self-Contained Examples, 5. Semantic Naming, Code Example Standards, Comments, Impact Level Guidelines (+7 more)

### Community 34 - "Supabase"
Cohesion: 0.13
Nodes (12): Fix suggestion, Source, What happened, Skill Feedback, Steps, Core Principles, Making and Committing Schema Changes, Reference Guides (+4 more)

### Community 35 - "Dossier"
Cohesion: 0.11
Nodes (31): beneficiairesSummary(), CaisseMobileCard(), CaisseTableRow(), BonPreview(), BonMobileCard(), BonTableRow(), ClasseurGrid(), ClasseurGridProps (+23 more)

### Community 36 - "contrat-stats.test.ts"
Cohesion: 0.17
Nodes (14): GuideDemarrage(), UserFormState, UserRole, emitGuideReset(), getGuideProgress(), getGuideStepsForRole(), GUIDE_STEP_DEFS, GuideStepDef (+6 more)

### Community 37 - "audit.ts"
Cohesion: 0.07
Nodes (43): ExcelSaveStatus, ExcelToolbar(), ExcelWorkbookPanelProps, ExcelWorkbookLazy(), ExcelWorkbookPanel, buildClasseurJournal(), buildDossierLibelle(), ClasseurEntry (+35 more)

### Community 38 - "2. Fonctionnalités demandées"
Cohesion: 0.14
Nodes (13): 0. Contexte, 1. Principes directeurs (non négociables), 2. Fonctionnalités demandées, 3. Récapitulatif des changements techniques, 4. Points à confirmer avec le client avant / pendant l'implémentation, 5. Hors périmètre (pour éviter la dérive), F1 — Dimension « Société » (Top Doumani / Traoré Transit Logistique), F2 — TVA 18 % optionnelle sur les factures (+5 more)

### Community 39 - "@radix-ui/react-slot"
Cohesion: 0.28
Nodes (7): actionTone, LOGO_ACCEPTED_TYPES, ParamTab, SocieteCard(), tabs, Switch(), AuditEntry

### Community 40 - "@radix-ui/react-toast"
Cohesion: 0.20
Nodes (13): NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, StatutCfg, STATUTS_ALL, FactureSummaryHeader(), PipelineCard(), VerticalStepper() (+5 more)

### Community 42 - "tailwind-merge"
Cohesion: 0.39
Nodes (7): AuditModule, Column, downloadBlob(), exportToExcel(), isValidXlsxBytes(), sanitizeFilename(), normalizeExportCell()

### Community 43 - "scripts"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, lint, start, test (+2 more)

### Community 44 - "SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés"
Cohesion: 0.18
Nodes (10): 1. Contexte du retour, 2. Clarification métier CRITIQUE : deux sociétés, une plateforme, 3.1 Référence Excel actuelle, 3.2 Équivalent à implémenter, 3.3 Suivi des mouvements, 3. Fonctionnalité demandée : le Classeur Client, 4. Architecture données (orientation), 5. Contrainte technique (+2 more)

### Community 45 - "zustand"
Cohesion: 0.15
Nodes (25): DocumentRow, OcrJobRow, buildDocumentStoragePath(), dataUrlToBlob(), getSignedDocumentUrl(), removeDocumentStoragePaths(), sha256Hex(), uploadDocumentBlob() (+17 more)

### Community 48 - "Section Definitions"
Cohesion: 0.20
Nodes (9): 1. Query Performance (query), 2. Connection Management (conn), 3. Security & RLS (security), 4. Schema Design (schema), 5. Concurrency & Locking (lock), 6. Data Access Patterns (data), 7. Monitoring & Diagnostics (monitor), 8. Advanced Features (advanced) (+1 more)

### Community 49 - "archives-slice.ts"
Cohesion: 0.26
Nodes (11): UnifiedDoc, ArchiveRow, Archive, TypeDocument, AddArchiveInput, ARCHIVES_ALLOWED_MIME, ArchivesSlice, createArchivesSlice() (+3 more)

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
Cohesion: 0.19
Nodes (13): clampConfidence(), findFirst(), mapDossierFieldsFromText(), normalizeDate(), parseMontant(), rasterizePdfToBlobs(), preprocessImageBlob(), OcrExtractedField (+5 more)

### Community 56 - "next.config.ts"
Cohesion: 0.29
Nodes (6): csp, nextConfig, scriptSrc, securityHeaders, supabaseOrigin, supabaseWsOrigin

### Community 57 - "status-badge.tsx"
Cohesion: 0.07
Nodes (38): AdminPanel(), AgentPanel(), AlertesCard(), ChartTooltipPayload, EcartsTooltip(), EncaissementsTooltip(), DerniersDossiersCard(), EncaissementsChart() (+30 more)

### Community 58 - "Supabase Postgres Best Practices"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 59 - "react-dom"
Cohesion: 0.43
Nodes (6): ExcelWorkbook, ExcelWorkbookRow, createExcelWorkbooksSlice(), currentUserId(), ExcelWorkbooksSlice, mapExcelWorkbookFromDb()

### Community 60 - "route.test.ts"
Cohesion: 0.25
Nodes (3): FakeProfile, { fakeState, resetFake }, validPatchBody

### Community 61 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): __dirname, eslintConfig, __filename

### Community 98 - "lucide-react"
Cohesion: 0.20
Nodes (10): FactureEditForm(), FinancialSummary(), InfoRow(), InformationsCard(), LignesCard(), LignesTable(), useFactureEditState(), Facture (+2 more)

### Community 101 - "@radix-ui/react-avatar"
Cohesion: 0.10
Nodes (43): react, react, BonCaisseFormDialog(), BonCaisseTab(), BonFormDialog(), BonMarchandiseTab(), useBonFilters(), ConvertDevisDialog() (+35 more)

### Community 104 - "domain-types.ts"
Cohesion: 0.11
Nodes (26): BON_MOTIF_TONE, BON_STATUT_TONE, SocieteRow, BonSortie, BonSortieCaisse, BonSortieCaisseInput, DossierFournisseur, DossierFournisseurInput (+18 more)

### Community 106 - "UserRole"
Cohesion: 0.11
Nodes (24): DossierAmountsSection(), DossierAmountsSectionProps, CollapsibleSection(), FormField(), SectionTitle(), SummaryRow(), toneMap, DossierIdentityStep() (+16 more)

### Community 108 - "route.ts"
Cohesion: 0.12
Nodes (22): ACTIVITY_EVENTS, AppRootInner(), LoginScreen(), SupabaseRequiredScreen(), REALTIME_TABLES, useSupabaseRealtime(), fetchWithAuth(), AuditAction (+14 more)

### Community 109 - "DossiersListScreen"
Cohesion: 0.22
Nodes (13): DossierFormErrors, numStr(), useDossierFormState(), UseDossierFormStateOptions, WIZARD_STEPS, getNextTransition(), DevisFormDialog(), calculerEcart() (+5 more)

### Community 116 - "require-admin.ts"
Cohesion: 0.16
Nodes (14): EntryExitDialogs(), MouvementsTab(), NewItemDialog(), StockTab(), SORTIE_MOTIFS, SortieMotif, DevisDetailScreen(), EntrepotTab (+6 more)

## Knowledge Gaps
- **410 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+405 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **67 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `calendrier.tsx` to `devis.tsx`, `entreposage.tsx`, `require-admin.ts`, `use-toast.ts`, `export.ts`, `route-sync.tsx`, `nav-store.ts`, `parametres.tsx`, `dossiers-slice.ts`, `fournisseurs.tsx`, `transporteur-form-fields.tsx`, `dossier-form.tsx`, `calendrier.tsx`, `users-tab.tsx`, `audit.ts`, `Dossier`, `contrat-stats.test.ts`, `audit.ts`, `@radix-ui/react-slot`, `@radix-ui/react-toast`, `status-badge.tsx`, `lucide-react`, `@radix-ui/react-avatar`, `UserRole`, `format.ts`, `require-admin.ts`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `@radix-ui/react-alert-dialog`, `@radix-ui/react-select`, `@radix-ui/react-toast`, `tailwind-merge`, `tesseract.js`, `csv-export.ts`, `classeur.ts`, `recharts`, `scripts`, `parametres.tsx`, `dossier-detail-overview.tsx`, `archives.tsx`, `@radix-ui/react-avatar`, `derniers-dossiers-card.tsx`, `excel-export.ts`, `users-tab.tsx`, `dashboard-metrics.ts`, `react-dom`, `server-only`, `@univerjs/preset-sheets-core`, `clsx`, `cmdk`, `heic2any`, `pdfjs-dist`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `react` connect `@radix-ui/react-avatar` to `lucide-react`, `contrat-stats.test.ts`, `nav-store.ts`, `require-admin.ts`, `dependencies`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _410 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devis.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08819345661450925 - nodes in this community are weakly interconnected._
- **Should `entreposage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14634146341463414 - nodes in this community are weakly interconnected._
- **Should `print-modules.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.131002331002331 - nodes in this community are weakly interconnected._