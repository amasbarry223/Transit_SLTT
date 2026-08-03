# Graph Report - Transit_SLTT  (2026-08-03)

## Corpus Check
- 478 files · ~738,063 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1926 nodes · 7205 edges · 139 communities (70 shown, 69 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.77)
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
- @univerjs/preset-sheets-core
- command-palette.tsx
- heic2any
- route.test.ts
- pdfjs-dist
- db-seed-demo.mjs
- ag-grid-community
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
- `useFactureEditState()` --references--> `react`  [EXTRACTED]
  src/components/sltt/facture-detail/use-facture-edit-state.ts → package.json
- `CalendrierScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/calendrier.tsx → package.json
- `DashboardScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/dashboard.tsx → package.json
- `FactureDetailScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/facture-detail.tsx → package.json

## Import Cycles
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/contrat-stats.ts`
- 3-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/sync-sequences.ts -> src/lib/store.ts`
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/ecritures-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`
- 4-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/ecritures-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`

## Communities (139 total, 69 thin omitted)

### Community 0 - "devis.tsx"
Cohesion: 0.06
Nodes (102): ACTIVITY_EVENTS, AppRootInner(), BonCaisseFormDialogProps, CaisseLigneForm, BonFormDialogProps, ClasseurSuiviDialog(), ClasseurSuiviDialogProps, ClasseurTab() (+94 more)

### Community 1 - "entreposage.tsx"
Cohesion: 0.20
Nodes (20): ConfirmDeleteDialog(), TransitionDialog(), LignesCard(), DossierDetailScreen(), AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent() (+12 more)

### Community 2 - "print-modules.ts"
Cohesion: 0.12
Nodes (56): FactureDocumentHeader(), htmlEscape(), acquirePrintTarget(), brandLogoImgHTML(), buildBrandSubHTML(), buildLegalLine(), buildPrintDocument(), BuildPrintDocumentOptions (+48 more)

### Community 3 - "store.ts"
Cohesion: 0.11
Nodes (54): react, react, BonCaisseFormDialog(), BonCaisseTab(), BonFormDialog(), ConvertDevisDialog(), DevisListBanner(), CreateDossierFromOcrButton() (+46 more)

### Community 4 - "dossiers-slice.ts"
Cohesion: 0.11
Nodes (30): EcrituresTableProps, PaymentDialogProps, DossierFormErrors, numStr(), UseDossierFormStateOptions, WIZARD_STEPS, syncClientStats(), DepenseRow (+22 more)

### Community 5 - "require-admin.ts"
Cohesion: 0.14
Nodes (14): MetaTabItem, MetaTabsList(), PageHeader(), PreferencesTab(), ProfileTab(), SocietesTab(), FournisseurTab, TAB_META (+6 more)

### Community 6 - "utils.ts"
Cohesion: 0.18
Nodes (22): DocumentRow, buildDocumentStoragePath(), dataUrlToBlob(), getSignedDocumentUrl(), removeDocumentStoragePaths(), sha256Hex(), uploadDocumentBlob(), DocumentCategorie (+14 more)

### Community 7 - "domain-types.ts"
Cohesion: 0.10
Nodes (32): MouvementRow, StockItemRow, Mouvement, createContratsSlice(), mapContratFromDb(), mapContratPrestationFromDb(), mapDepenseFromDb(), createDataFetchSlice() (+24 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, examples, mini-services, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 9 - "export.ts"
Cohesion: 0.14
Nodes (31): BonCaisseTabProps, PreviewState, BonsTabProps, DossiersTabProps, FacturesTabProps, TabEmptyState(), StockTabProps, modeIcon (+23 more)

### Community 10 - "useStore"
Cohesion: 0.05
Nodes (41): 0. Note d'architecture — À LIRE AVANT TOUT, 1.1 POST /api/admin/users, 1.2 PATCH /api/admin/users/:id, 1.3 DELETE /api/admin/users/:id, 1.4 POST /api/admin/users/:id/password, 1.5 PATCH /api/admin/users/:id/annexes, 1.6 PATCH /api/auth/password, 1.7 GET /api/client-ip (+33 more)

### Community 11 - "dashboard.tsx"
Cohesion: 0.05
Nodes (11): PageProps, PageProps, PageProps, PageProps, PageProps, PageProps, AppRoot(), RouteSync() (+3 more)

### Community 12 - "nav-store.ts"
Cohesion: 0.13
Nodes (17): BonMarchandiseTabProps, BON_MOTIF_TONE, BON_MOTIFS, BON_STATUT_TONE, EmptyState(), InfoCallout(), KpiCard(), SORT_OPTIONS (+9 more)

### Community 13 - "contrats.tsx"
Cohesion: 0.06
Nodes (34): AnnexeSelector(), Heading(), InfoRow(), InfoRow(), PaymentRing(), SuiviPaiementCard(), ResponsiveDataList(), PrestatairesTable() (+26 more)

### Community 15 - "dossier-wizard-steps.tsx"
Cohesion: 0.26
Nodes (12): ClasseurType, cellToNumber(), cellToString(), ecritureClasseurReference(), GrandLivreRow, injectGrandLivre(), normalizeClasseurRef(), parseClasseurType() (+4 more)

### Community 16 - "store-actions.test.ts"
Cohesion: 0.14
Nodes (23): StockTab(), ExcelWorkbookLazy(), ExcelWorkbookPanel, ClientFicheScreen(), mapAuditLogFromDb(), buildClasseurJournal(), buildDossierLibelle(), ClasseurEntry (+15 more)

### Community 17 - "contrat-stats.test.ts"
Cohesion: 0.25
Nodes (17): buildColMapFromRow(), cellToString(), ClasseurImportApplyPlan, ClasseurImportRow, countFilledCells(), HEADER_ALIASES, looksLikeDataRow(), looksLikeGrandLivreHeaderRow() (+9 more)

### Community 18 - "contrat-fichiers-slice.ts"
Cohesion: 0.22
Nodes (9): DossierFournisseur, DossierFournisseurInput, Fournisseur, FournisseurInput, baseClient, baseDossier, { calls, remoteState, resetFake }, FournisseursSlice (+1 more)

### Community 19 - "fournisseurs.tsx"
Cohesion: 0.80
Nodes (3): applyFacturePaiement(), canDecrementStock(), simulateSequentialPaiements()

### Community 21 - "cn"
Cohesion: 0.29
Nodes (8): ContratFileDropZone(), EntityFileDropZone(), EntityFileDropZoneLabels, EntityFileItem, EntityFilePayload, formatFileSize(), getFileIconComponent(), getFileIconMeta()

### Community 22 - "dependencies"
Cohesion: 0.08
Nodes (25): ag-grid-community, ag-grid-react, class-variance-authority, next, dependencies, ag-grid-community, ag-grid-react, class-variance-authority (+17 more)

### Community 23 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css (+13 more)

### Community 24 - "archives-slice.ts"
Cohesion: 0.11
Nodes (31): beneficiairesSummary(), CaisseMobileCard(), CaisseTableRow(), BonPreview(), BonMarchandiseTab(), BonMobileCard(), BonTableRow(), useBonFilters() (+23 more)

### Community 25 - "dossier-form.tsx"
Cohesion: 0.18
Nodes (21): SORT_OPTIONS, SortKey, TransporteurFormModal(), CAPACITE_PRESETS, emptyTransporteurForm(), firstInvalidTransporteurStep(), isTransporteurFormValid(), isTransporteurStepValid() (+13 more)

### Community 26 - "UserRole"
Cohesion: 0.15
Nodes (18): BonSortieCaisseRow, BonSortieRow, BonMotif, BonSortieCaisse, BonSortieCaisseInput, FactureLigne, computeIncrementalPaye(), validatePaymentAmount() (+10 more)

### Community 27 - "domain-types.ts"
Cohesion: 0.38
Nodes (6): ContratFichierRow, ContratFichier, AddContratFichierInput, ContratFichiersSlice, createContratFichiersSlice(), mapContratFichierFromDb()

### Community 28 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 29 - "stock-slice.ts"
Cohesion: 0.10
Nodes (32): deriveClientIdFromRattachement(), RattachementKind, BonSortieCaisseLigneRow, BonSortieStatut, ClientRow, ContratPrestationRow, DocumentVersionRow, DossierFournisseurRow (+24 more)

### Community 33 - "Writing Guidelines for Postgres References"
Cohesion: 0.12
Nodes (15): 1. Concrete Transformation Patterns, 2. Error-First Structure, 3. Quantified Impact, 4. Self-Contained Examples, 5. Semantic Naming, Code Example Standards, Comments, Impact Level Guidelines (+7 more)

### Community 34 - "Supabase"
Cohesion: 0.13
Nodes (12): Fix suggestion, Source, What happened, Skill Feedback, Steps, Core Principles, Making and Committing Schema Changes, Reference Guides (+4 more)

### Community 35 - "Dossier"
Cohesion: 0.10
Nodes (21): ClientProfileCard(), ClientProfileCardProps, avatarGradient(), BON_MOTIF_TONE, bonStatutTone(), CLASSEUR_STATUT_TONE, FICHE_TABS, FicheTab (+13 more)

### Community 36 - "parametres.tsx"
Cohesion: 0.16
Nodes (26): BreadcrumbNav(), DETAIL_PARENT, CommandPalette(), NavList(), Sidebar(), Topbar(), viewTitles, useCanManageUsers() (+18 more)

### Community 38 - "2. Fonctionnalités demandées"
Cohesion: 0.14
Nodes (13): 0. Contexte, 1. Principes directeurs (non négociables), 2. Fonctionnalités demandées, 3. Récapitulatif des changements techniques, 4. Points à confirmer avec le client avant / pendant l'implémentation, 5. Hors périmètre (pour éviter la dérive), F1 — Dimension « Société » (Top Doumani / Traoré Transit Logistique), F2 — TVA 18 % optionnelle sur les factures (+5 more)

### Community 39 - "@radix-ui/react-slot"
Cohesion: 0.09
Nodes (27): inter, metadata, sora, ThemeEffect(), Toast, ToastAction, ToastActionElement, ToastClose (+19 more)

### Community 41 - "recharts"
Cohesion: 0.09
Nodes (29): ClientFormFieldsProps, Benefice, BeneficeKpiRowProps, BeneficeParSociete, NewEcritureDialog(), NewEcritureDialogProps, AnnexeCard(), LOGO_ACCEPTED_TYPES (+21 more)

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
Cohesion: 0.09
Nodes (27): DevisPipelineCard(), DevisNextStatut, DevisStatutConfig, STATUT_CONFIG, STATUT_FLOW, STATUTS_ALL, NEXT_STATUT, STATUT_CONFIG (+19 more)

### Community 47 - "dossier-detail-overview.tsx"
Cohesion: 0.38
Nodes (9): AuditAction, AuditEntry, AuditModule, AuditSourceRef, AuditSourceType, insertAuditLog(), resolveClientIp(), AuditSlice (+1 more)

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
Cohesion: 0.11
Nodes (24): BeneficeKpiRow(), EcrituresKpiRow(), EcrituresKpiRowProps, PaymentDialog(), PendingAlertBanner(), PendingAlertBannerProps, deriveStatut(), today() (+16 more)

### Community 58 - "Supabase Postgres Best Practices"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 59 - "dashboard-metrics.ts"
Cohesion: 0.14
Nodes (23): syncContratStats(), BaseContrat, ContratRow, ProfileRow, Contrat, ContratInput, ContratPrestation, ContratPrestationInput (+15 more)

### Community 60 - "route.test.ts"
Cohesion: 0.25
Nodes (3): FakeProfile, { fakeState, resetFake }, validPatchBody

### Community 61 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): __dirname, eslintConfig, __filename

### Community 98 - "require-admin.ts"
Cohesion: 0.17
Nodes (14): CalendrierScreen(), CalEvent, DayPanel(), daysInMonth(), EventType, FR_DAYS, FR_MONTHS, isoDate() (+6 more)

### Community 101 - "@radix-ui/react-avatar"
Cohesion: 0.06
Nodes (70): PATCH(), RouteContext, POST(), RouteContext, AdminClient, assertNotLastActiveAdmin(), DELETE(), PATCH() (+62 more)

### Community 104 - "contrats.tsx"
Cohesion: 0.14
Nodes (17): REALTIME_TABLES, ExcelWorkbook, ExcelWorkbookRow, LegacyNavPersist, readLegacyNavPersist(), LOGGED_OUT, seedFromLegacy(), SessionState (+9 more)

### Community 105 - "command-palette.tsx"
Cohesion: 0.31
Nodes (9): Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator() (+1 more)

### Community 106 - "UserRole"
Cohesion: 0.17
Nodes (15): DossierAmountsSection(), DossierAmountsSectionProps, CollapsibleSection(), SectionTitle(), SummaryRow(), toneMap, FormField(), iconWrap (+7 more)

### Community 107 - "status-badge.tsx"
Cohesion: 0.14
Nodes (19): NEXT_STATUT, DossierDetailStepper(), STATUTS_ORDERED, TransitionDialogProps, SocieteBadge(), DevisStatutBadge(), DropdownMenu(), DropdownMenuCheckboxItem() (+11 more)

### Community 108 - "devis-slice.ts"
Cohesion: 0.25
Nodes (12): ConvertDevisDialogProps, DevisFormProps, DevisRow, Devis, DevisInput, DevisStatut, requireActiveAnnexeId(), resolveActiveAnnexeId() (+4 more)

### Community 109 - "contrat-detail.tsx"
Cohesion: 0.05
Nodes (48): AdminPanel(), AgentPanel(), AlertesCard(), ChartTooltipPayload, EcartsTooltip(), EncaissementsTooltip(), DerniersDossiersCard(), EncaissementsChart() (+40 more)

### Community 118 - "dashboard-metrics.ts"
Cohesion: 0.43
Nodes (6): fetchWithAuth(), Column, downloadBlob(), exportToExcel(), isValidXlsxBytes(), sanitizeFilename()

### Community 123 - "command-palette.tsx"
Cohesion: 0.24
Nodes (7): FinancialSummary(), LignesTable(), useFactureEditState(), Switch(), Facture, FactureInput, FacturesSlice

### Community 128 - "db-seed-demo.mjs"
Cohesion: 0.50
Nodes (3): result, root, seedFile

### Community 129 - "ag-grid-community"
Cohesion: 0.17
Nodes (10): DevisActionsCard(), AmountRow(), DossierDetailOverview(), DossierInfoGrid(), InfoTile(), TRANSITION_META, TransitionType, ActionsCard() (+2 more)

### Community 132 - "cmdk"
Cohesion: 0.23
Nodes (14): DossierDetailDocuments(), FileDropZone(), SubDossierCard(), GlossaryLabel(), DossierFichierRow, SubDossierRow, DossierFichier, SubDossier (+6 more)

### Community 136 - "split-users-table.mjs"
Cohesion: 0.17
Nodes (14): ExcelSaveStatus, ExcelToolbar(), QuickBtn(), ExcelWorkbookPanelProps, excelTheme, buildEmptyWorkbookData(), ensureGrandLivreCapacity(), GRAND_LIVRE_HEADERS (+6 more)

### Community 137 - "bons-slice.ts"
Cohesion: 0.27
Nodes (11): UnifiedDoc, ArchiveRow, Archive, TypeDocument, AddArchiveInput, ARCHIVES_ALLOWED_MIME, ArchivesSlice, createArchivesSlice() (+3 more)

### Community 140 - "bilans.tsx"
Cohesion: 0.17
Nodes (12): ChartPayloadItem, ChartTooltip(), currentYearMonth(), getPeriodeLabel(), Periode, periodes, PiePayloadItem, PieTooltip() (+4 more)

## Knowledge Gaps
- **458 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+453 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `@radix-ui/react-toast`, `store.ts`, `tailwind-merge`, `tesseract.js`, `lucide-react`, `@radix-ui/react-switch`, `recharts`, `@radix-ui/react-select`, `calendrier.tsx`, `cmdk`, `@radix-ui/react-label`, `Facture`, `csv-export.ts`, `classeur.ts`, `@radix-ui/react-toast`, `scripts`, `parametres.tsx`, `archives-slice.ts`, `excel-export.ts`, `vertical-stepper.tsx`, `contrat-detail.tsx`, `@univerjs/preset-sheets-core`, `heic2any`, `pdfjs-dist`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `react` connect `store.ts` to `require-admin.ts`, `contrat-detail.tsx`, `dependencies`, `archives.tsx`, `command-palette.tsx`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `cn()` connect `contrats.tsx` to `devis.tsx`, `ag-grid-community`, `entreposage.tsx`, `store.ts`, `cmdk`, `require-admin.ts`, `split-users-table.mjs`, `export.ts`, `nav-store.ts`, `bilans.tsx`, `store-actions.test.ts`, `cn`, `archives-slice.ts`, `dossier-form.tsx`, `Dossier`, `parametres.tsx`, `@radix-ui/react-slot`, `zustand`, `require-admin.ts`, `@radix-ui/react-avatar`, `command-palette.tsx`, `UserRole`, `status-badge.tsx`, `contrat-detail.tsx`, `command-palette.tsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _458 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devis.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05580765862590558 - nodes in this community are weakly interconnected._
- **Should `print-modules.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12050078247261346 - nodes in this community are weakly interconnected._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10946589106292967 - nodes in this community are weakly interconnected._