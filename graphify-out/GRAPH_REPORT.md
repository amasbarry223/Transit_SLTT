# Graph Report - Transit_SLTT  (2026-08-03)

## Corpus Check
- 480 files · ~740,066 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1945 nodes · 7244 edges · 136 communities (67 shown, 69 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.77)
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
- status-badge.tsx
- devis-slice.ts
- contrat-detail.tsx
- derniers-dossiers-card.tsx
- excel-export.ts
- postcss.config.mjs
- tailwind.config.ts
- vertical-stepper.tsx
- contrat-detail.tsx
- heic2any.d.ts
- @univerjs/preset-sheets-core
- heic2any
- route.test.ts
- pdfjs-dist
- db-seed-demo.mjs
- @radix-ui/react-toast
- tailwind-merge
- cmdk
- tesseract.js
- lucide-react
- split-users-table.mjs
- bons-slice.ts
- @radix-ui/react-switch
- recharts
- bilans.tsx
- @radix-ui/react-select
- README.md
- cmdk
- @radix-ui/react-label

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
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/ecritures-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/sync-sequences.ts -> src/lib/store.ts`
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/contrat-stats.ts`
- 4-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`
- 4-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/ecritures-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`

## Communities (136 total, 69 thin omitted)

### Community 0 - "devis.tsx"
Cohesion: 0.06
Nodes (90): ACTIVITY_EVENTS, AppRootInner(), BonCaisseFormDialogProps, CaisseLigneForm, BonFormDialogProps, ClasseurSuiviDialogProps, ClientFormFields(), clientTypes (+82 more)

### Community 1 - "entreposage.tsx"
Cohesion: 0.20
Nodes (19): TransitionDialog(), ActionsCard(), FactureEditForm(), DossierDetailScreen(), AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent() (+11 more)

### Community 2 - "print-modules.ts"
Cohesion: 0.12
Nodes (57): FactureDocumentHeader(), htmlEscape(), acquirePrintTarget(), brandLogoImgHTML(), buildBrandSubHTML(), buildLegalLine(), buildPrintDocument(), BuildPrintDocumentOptions (+49 more)

### Community 3 - "store.ts"
Cohesion: 0.07
Nodes (52): BonCaisseTab(), BonFormDialog(), ClasseurGrid(), ClasseurGridProps, deriveStatut(), today(), useEcrituresScreen(), ContratFileDropZone() (+44 more)

### Community 4 - "dossiers-slice.ts"
Cohesion: 0.07
Nodes (42): EcrituresTableProps, NewEcritureDialog(), NewEcritureDialogProps, PaymentDialogProps, TransitionDialogProps, deriveClientIdFromRattachement(), RattachementKind, syncClientStats() (+34 more)

### Community 5 - "require-admin.ts"
Cohesion: 0.09
Nodes (30): EcrituresFilters(), EcrituresKpiRow(), EcrituresTable(), PaymentDialog(), ConfirmDeleteDialog(), DepenseFormModal(), PrestationFormModal(), MetaTabItem (+22 more)

### Community 6 - "utils.ts"
Cohesion: 0.25
Nodes (17): DocumentRow, buildDocumentStoragePath(), dataUrlToBlob(), removeDocumentStoragePaths(), sha256Hex(), uploadDocumentBlob(), DocumentCategorie, DocumentEntityType (+9 more)

### Community 7 - "domain-types.ts"
Cohesion: 0.13
Nodes (24): MouvementRow, StockItemRow, DossierFournisseur, DossierFournisseurInput, Fournisseur, FournisseurInput, syncFournisseurStats(), FETCH_SOFT_CAPS (+16 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, examples, mini-services, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 9 - "export.ts"
Cohesion: 0.10
Nodes (40): BonsTab(), BonsTabProps, ClasseurSuiviDialog(), ClasseurTab(), ClasseurTabProps, ClasseurViewMode, ClientProfileCard(), ClientProfileCardProps (+32 more)

### Community 10 - "useStore"
Cohesion: 0.05
Nodes (41): 0. Note d'architecture — À LIRE AVANT TOUT, 1.1 POST /api/admin/users, 1.2 PATCH /api/admin/users/:id, 1.3 DELETE /api/admin/users/:id, 1.4 POST /api/admin/users/:id/password, 1.5 PATCH /api/admin/users/:id/annexes, 1.6 PATCH /api/auth/password, 1.7 GET /api/client-ip (+33 more)

### Community 11 - "dashboard.tsx"
Cohesion: 0.05
Nodes (11): PageProps, PageProps, PageProps, PageProps, PageProps, PageProps, AppRoot(), RouteSync() (+3 more)

### Community 12 - "nav-store.ts"
Cohesion: 0.13
Nodes (21): BonMarchandiseTab(), BonMarchandiseTabProps, BonMobileCard(), BonTableRow(), BON_MOTIF_TONE, BON_MOTIFS, BON_STATUT_TONE, useBonFilters() (+13 more)

### Community 13 - "contrats.tsx"
Cohesion: 0.06
Nodes (40): DevisPipelineCard(), STATUT_FLOW, InfoRow(), DocumentPreviewBody(), FetchedDocumentPreview(), AmountRow(), DossierDetailOverview(), DossierDetailStepper() (+32 more)

### Community 15 - "dossier-wizard-steps.tsx"
Cohesion: 0.20
Nodes (16): ExcelSaveStatus, ExcelToolbar(), QuickBtn(), ExcelWorkbookPanelProps, ClasseurType, excelTheme, cellToNumber(), cellToString() (+8 more)

### Community 16 - "store-actions.test.ts"
Cohesion: 0.15
Nodes (17): ExcelWorkbookLazy(), ExcelWorkbookPanel, buildClasseurJournal(), buildDossierLibelle(), ClasseurEntry, classeurEntrySourceType(), ClasseurMouvementRow, ClasseurTotals (+9 more)

### Community 17 - "contrat-stats.test.ts"
Cohesion: 0.23
Nodes (18): buildColMapFromRow(), cellToString(), ClasseurImportApplyPlan, ClasseurImportRow, countFilledCells(), HEADER_ALIASES, looksLikeDataRow(), looksLikeGrandLivreHeaderRow() (+10 more)

### Community 18 - "contrat-fichiers-slice.ts"
Cohesion: 0.08
Nodes (33): GuideDemarrage(), RolePicker(), emptyFormState(), FormMode, FormTab, isCustomPermissionSet(), RoleFilter, roleMeta (+25 more)

### Community 19 - "fournisseurs.tsx"
Cohesion: 0.80
Nodes (3): applyFacturePaiement(), canDecrementStock(), simulateSequentialPaiements()

### Community 21 - "cn"
Cohesion: 0.10
Nodes (29): AnnexeSelector(), BonCaisseFormDialog(), EntryExitDialogs(), StockTab(), SORTIE_MOTIFS, SortieMotif, useStockMovementDialogs(), BonsScreen() (+21 more)

### Community 22 - "dependencies"
Cohesion: 0.08
Nodes (25): ag-grid-react, class-variance-authority, next, dependencies, ag-grid-react, class-variance-authority, next, @radix-ui/react-dialog (+17 more)

### Community 23 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css (+13 more)

### Community 24 - "archives-slice.ts"
Cohesion: 0.08
Nodes (34): beneficiairesSummary(), BonCaisseTabProps, CaisseMobileCard(), CaisseTableRow(), PreviewState, BonPreview(), Benefice, BeneficeKpiRow() (+26 more)

### Community 25 - "dossier-form.tsx"
Cohesion: 0.07
Nodes (38): DossierDetailDocuments(), FileDropZone(), SubDossierCard(), DossierAmountsSection(), DossierAmountsSectionProps, CollapsibleSection(), SectionTitle(), SummaryRow() (+30 more)

### Community 26 - "UserRole"
Cohesion: 0.13
Nodes (14): 1. Isolation des données par annexe, 2. Sélecteur d'annexe, 3. Numérotation des documents, 4. Migration des données existantes, 5. Création d'une nouvelle annexe, CONTEXTE MÉTIER, CONTRAINTE UX — PRIORITÉ ABSOLUE, CONTRAINTES TECHNIQUES (+6 more)

### Community 27 - "domain-types.ts"
Cohesion: 0.27
Nodes (8): InfoCallout(), EMPTY_LIGNE, FactureMobileCard(), FactureRowProps, FactureTableRow(), isFactureEchue(), LigneForm, TABS

### Community 28 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 29 - "stock-slice.ts"
Cohesion: 0.07
Nodes (48): BonSortieCaisseLigneRow, BonSortieCaisseRow, BonSortieRow, BonSortieStatut, ClientRow, DocumentVersionRow, DossierFournisseurRow, DossierFournisseurStatut (+40 more)

### Community 30 - "csv-export.ts"
Cohesion: 0.40
Nodes (5): readLegacyNavPersist(), seedFromLegacy(), seedFromLegacy(), Theme, UiPrefsState

### Community 33 - "Writing Guidelines for Postgres References"
Cohesion: 0.12
Nodes (15): 1. Concrete Transformation Patterns, 2. Error-First Structure, 3. Quantified Impact, 4. Self-Contained Examples, 5. Semantic Naming, Code Example Standards, Comments, Impact Level Guidelines (+7 more)

### Community 34 - "Supabase"
Cohesion: 0.13
Nodes (12): Fix suggestion, Source, What happened, Skill Feedback, Steps, Core Principles, Making and Committing Schema Changes, Reference Guides (+4 more)

### Community 35 - "Dossier"
Cohesion: 0.14
Nodes (14): Heading(), modeIcon, DossierDetailSuivi(), EmptyState(), DEVIS_STATUT_TONE, DOSSIER_STATUT_DOT, DOSSIER_STATUT_TONE, DossierFournisseurStatutBadge() (+6 more)

### Community 36 - "parametres.tsx"
Cohesion: 0.15
Nodes (28): AppShell(), BreadcrumbNav(), DETAIL_PARENT, CommandPalette(), NavList(), Sidebar(), Topbar(), viewTitles (+20 more)

### Community 38 - "2. Fonctionnalités demandées"
Cohesion: 0.14
Nodes (13): 0. Contexte, 1. Principes directeurs (non négociables), 2. Fonctionnalités demandées, 3. Récapitulatif des changements techniques, 4. Points à confirmer avec le client avant / pendant l'implémentation, 5. Hors périmètre (pour éviter la dérive), F1 — Dimension « Société » (Top Doumani / Traoré Transit Logistique), F2 — TVA 18 % optionnelle sur les factures (+5 more)

### Community 39 - "@radix-ui/react-slot"
Cohesion: 0.09
Nodes (27): inter, metadata, sora, ThemeEffect(), Toast, ToastAction, ToastActionElement, ToastClose (+19 more)

### Community 41 - "recharts"
Cohesion: 0.12
Nodes (20): ContratFichierRow, SocieteRow, ContratFichier, SocieteInput, AddContratFichierInput, ContratFichiersSlice, createContratFichiersSlice(), mapContratFichierFromDb() (+12 more)

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
Cohesion: 0.24
Nodes (9): NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, StatutCfg, STATUTS_ALL, PipelineCard(), VerticalStepper(), FactureRow (+1 more)

### Community 47 - "dossier-detail-overview.tsx"
Cohesion: 0.31
Nodes (11): AuditAction, AuditEntry, AuditModule, AuditSourceRef, AuditSourceType, insertAuditLog(), mapAuditLogFromDb(), resolveClientIp() (+3 more)

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
Nodes (20): clampConfidence(), findFirst(), isValidYmd(), mapDossierFieldsFromText(), normalizeDate(), parseMontant(), PdfRasterizeResult, rasterizePdfToBlobs() (+12 more)

### Community 55 - "archives.tsx"
Cohesion: 0.13
Nodes (23): react, react, ComptablePanel(), numStr(), useDossierFormState(), UseDossierFormStateOptions, getNextTransition(), PaiementDialog() (+15 more)

### Community 58 - "Supabase Postgres Best Practices"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 59 - "dashboard-metrics.ts"
Cohesion: 0.12
Nodes (29): CONTRAT_STATUT_TONE, contratToInput(), InfoRow(), MODES_PAIEMENT, PRESTATION_STATUT_TONE, PRESTATION_STATUTS, syncContratStats(), BaseContrat (+21 more)

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
Cohesion: 0.08
Nodes (45): PATCH(), RouteContext, POST(), RouteContext, AdminClient, assertNotLastActiveAdmin(), DELETE(), PATCH() (+37 more)

### Community 104 - "contrats.tsx"
Cohesion: 0.11
Nodes (22): ClientFormFieldsProps, ActiveAnnexe, REALTIME_TABLES, AnnexeRow, Annexe, AnnexeInput, ExcelWorkbook, ExcelWorkbookRow (+14 more)

### Community 105 - "command-palette.tsx"
Cohesion: 0.31
Nodes (9): Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator() (+1 more)

### Community 107 - "status-badge.tsx"
Cohesion: 0.12
Nodes (22): DevisNextStatut, DevisStatutConfig, NEXT_STATUT, STATUT_CONFIG, STATUTS_ALL, SupabaseRequiredScreen(), SORT_OPTIONS, SortKey (+14 more)

### Community 108 - "devis-slice.ts"
Cohesion: 0.14
Nodes (25): ConvertDevisDialogProps, DevisFormProps, DevisRow, Devis, DevisInput, DevisStatut, computeIncrementalPaye(), validatePaymentAmount() (+17 more)

### Community 109 - "contrat-detail.tsx"
Cohesion: 0.07
Nodes (34): AdminPanel(), AgentPanel(), AlertesCard(), ChartTooltipPayload, EcartsTooltip(), EncaissementsTooltip(), DerniersDossiersCard(), EncaissementsChart() (+26 more)

### Community 128 - "db-seed-demo.mjs"
Cohesion: 0.50
Nodes (3): result, root, seedFile

### Community 132 - "cmdk"
Cohesion: 0.33
Nodes (8): DossierFichierRow, SubDossierRow, SubDossier, createFichiersSlice(), FichiersSlice, mapFichierFromDb(), mapSubDossierFromDb(), SubDossierInput

### Community 136 - "split-users-table.mjs"
Cohesion: 0.21
Nodes (10): GrandLivreRow, buildEmptyWorkbookData(), ensureGrandLivreCapacity(), GRAND_LIVRE_HEADERS, HEADER_STYLE, headerCellData(), buildGrandLivreXlsxBlob(), downloadBlob() (+2 more)

### Community 137 - "bons-slice.ts"
Cohesion: 0.17
Nodes (18): UnifiedDoc, ArchiveRow, Archive, TypeDocument, AddArchiveInput, ARCHIVES_ALLOWED_MIME, ArchivesSlice, createArchivesSlice() (+10 more)

### Community 140 - "bilans.tsx"
Cohesion: 0.25
Nodes (12): BilansScreen(), currentYearMonth(), getPeriodeLabel(), ComptabiliteScreen(), BeneficeMensuel, BeneficeParSocieteEntry, useBeneficeParSociete(), computeBenefice() (+4 more)

## Knowledge Gaps
- **470 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+465 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `@radix-ui/react-toast`, `tailwind-merge`, `tesseract.js`, `lucide-react`, `@radix-ui/react-switch`, `recharts`, `@radix-ui/react-select`, `calendrier.tsx`, `cmdk`, `@radix-ui/react-label`, `Facture`, `ag-grid-community`, `classeur.ts`, `@radix-ui/react-toast`, `scripts`, `parametres.tsx`, `archives-slice.ts`, `archives.tsx`, `excel-export.ts`, `vertical-stepper.tsx`, `contrat-detail.tsx`, `@univerjs/preset-sheets-core`, `heic2any`, `pdfjs-dist`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `react` connect `archives.tsx` to `require-admin.ts`, `store.ts`, `parametres.tsx`, `contrat-fichiers-slice.ts`, `cn`, `dependencies`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `cn()` connect `contrats.tsx` to `devis.tsx`, `entreposage.tsx`, `store.ts`, `require-admin.ts`, `export.ts`, `nav-store.ts`, `bilans.tsx`, `dossier-wizard-steps.tsx`, `contrat-fichiers-slice.ts`, `cn`, `archives-slice.ts`, `dossier-form.tsx`, `domain-types.ts`, `Dossier`, `parametres.tsx`, `@radix-ui/react-slot`, `archives.tsx`, `require-admin.ts`, `command-palette.tsx`, `status-badge.tsx`, `contrat-detail.tsx`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _470 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devis.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06165278458272089 - nodes in this community are weakly interconnected._
- **Should `print-modules.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11757990867579908 - nodes in this community are weakly interconnected._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07377049180327869 - nodes in this community are weakly interconnected._