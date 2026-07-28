# Graph Report - Transit_SLTT  (2026-07-28)

## Corpus Check
- 378 files · ~718,713 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1689 nodes · 6165 edges · 129 communities (61 shown, 68 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5edc30cf`
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
- client-fiche.tsx
- contrat-stats.test.ts
- contrat-fichiers-slice.ts
- fournisseurs.tsx
- Facture
- dependencies
- devDependencies
- dossier-detail-hero.tsx
- dossier-form.tsx
- UserRole
- components.json
- users-tab.tsx
- csv-export.ts
- audit.ts
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
- status-badge.tsx
- devis-slice.ts
- contrat-detail.tsx
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
- sheet.tsx
- cmdk
- route.test.ts
- heic2any
- pdfjs-dist
- @radix-ui/react-select
- @radix-ui/react-toast
- tailwind-merge
- tesseract.js
- clsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 247 edges
2. `useStore` - 116 edges
3. `formatFCFA()` - 105 edges
4. `useToast()` - 84 edges
5. `useNav` - 74 edges
6. `formatDateShort()` - 69 edges
7. `Button()` - 67 edges
8. `Card()` - 58 edges
9. `usePermission()` - 55 edges
10. `SLTTState` - 39 edges

## Surprising Connections (you probably didn't know these)
- `GuideDemarrage()` --references--> `react`  [EXTRACTED]
  src/components/sltt/dashboard/guide-demarrage.tsx → package.json
- `PaiementDialog()` --references--> `react`  [EXTRACTED]
  src/components/sltt/facture-detail/paiement-dialog.tsx → package.json
- `CalendrierScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/calendrier.tsx → package.json
- `FournisseursScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/fournisseurs.tsx → package.json
- `useFactureEditState()` --references--> `react`  [EXTRACTED]
  src/components/sltt/facture-detail/use-facture-edit-state.ts → package.json

## Import Cycles
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`

## Communities (129 total, 68 thin omitted)

### Community 0 - "devis.tsx"
Cohesion: 0.06
Nodes (35): DerniersDossiersCard(), EncaissementsChart(), MargeChart(), AmountRow(), DossierDetailOverview(), DossierInfoGrid(), InfoTile(), DossierIdentityStep() (+27 more)

### Community 1 - "entreposage.tsx"
Cohesion: 0.13
Nodes (19): ACTIVITY_EVENTS, AppRootInner(), SupabaseRequiredScreen(), REALTIME_TABLES, useSupabaseRealtime(), ContratFichierRow, ContratFichier, ExcelWorkbook (+11 more)

### Community 2 - "print-modules.ts"
Cohesion: 0.12
Nodes (56): FactureDocumentHeader(), htmlEscape(), acquirePrintTarget(), brandLogoImgHTML(), buildBrandSubHTML(), buildLegalLine(), buildPrintDocument(), BuildPrintDocumentOptions (+48 more)

### Community 3 - "store.ts"
Cohesion: 0.12
Nodes (29): BonMarchandiseTabProps, BON_MOTIF_TONE, BON_MOTIFS, BON_STATUT_TONE, useBonFilters(), CATEGORIES, STATUT_TONE, STATUTS (+21 more)

### Community 4 - "dossiers-slice.ts"
Cohesion: 0.09
Nodes (34): numStr(), useDossierFormState(), UseDossierFormStateOptions, getNextTransition(), DevisFormDialog(), DEFAULT_PAIEMENT_MODE, DOSSIER_STATUT_DEDOUANE, DOSSIER_STATUT_EN_COURS (+26 more)

### Community 5 - "require-admin.ts"
Cohesion: 0.18
Nodes (21): BonCaisseTab(), DossierDocumentsPanel(), ExcelWorkbookPanel(), CommandPalette(), Sidebar(), Topbar(), BonsScreen(), avatarGradient() (+13 more)

### Community 6 - "use-toast.ts"
Cohesion: 0.36
Nodes (7): fetchWithAuth(), Column, downloadBlob(), exportToExcel(), isValidXlsxBytes(), sanitizeFilename(), normalizeExportCell()

### Community 7 - "domain-types.ts"
Cohesion: 0.07
Nodes (50): ClientFormFieldsProps, AuditAction, AuditEntry, AuditModule, AuditSourceRef, AuditSourceType, insertAuditLog(), mapAuditLogFromDb() (+42 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, examples, mini-services, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 9 - "export.ts"
Cohesion: 0.14
Nodes (34): BonCaisseTabProps, PreviewState, BonsTab(), BonsTabProps, ClasseurSuiviDialog(), ClasseurTabProps, ClasseurViewMode, DossiersTabProps (+26 more)

### Community 10 - "useStore"
Cohesion: 0.13
Nodes (31): BonCaisseFormDialogProps, CaisseLigneForm, BonFormDialogProps, ClasseurSuiviDialogProps, ClientFormFields(), clientTypes, emptyClientForm(), FIELD_LABELS (+23 more)

### Community 11 - "route-sync.tsx"
Cohesion: 0.16
Nodes (19): AppShell(), BreadcrumbNav(), DETAIL_PARENT, NavList(), ParametresScreen(), useCanManageUsers(), useCanView(), useEffectivePermissionUser() (+11 more)

### Community 12 - "nav-store.ts"
Cohesion: 0.12
Nodes (19): EntryExitDialogs(), MouvementsTab(), NewItemDialog(), StockTab(), CalendrierScreen(), CalEvent, DayPanel(), daysInMonth() (+11 more)

### Community 13 - "contrats.tsx"
Cohesion: 0.05
Nodes (57): DocumentPreviewBody(), DocumentViewer(), FetchedDocumentPreview(), isDirectUrl(), DossierDetailStepper(), STATUTS_ORDERED, EmptyState(), InfoCallout() (+49 more)

### Community 14 - "calendrier.tsx"
Cohesion: 0.23
Nodes (16): syncContratStats(), BaseContrat, ContratRow, Contrat, ContratInput, ContratPrestation, ContratPrestationInput, ContratStatut (+8 more)

### Community 15 - "comptabilite.tsx"
Cohesion: 0.29
Nodes (10): emptyForm(), OcrReviewDialog(), BilansScreen(), currentYearMonth(), getPeriodeLabel(), DossierDetailScreen(), calculateDaysUntil(), isEcheanceDepassee() (+2 more)

### Community 16 - "client-fiche.tsx"
Cohesion: 0.23
Nodes (16): POST(), RouteContext, AdminClient, assertCanTouchTarget(), assertNotLastActiveAdmin(), DELETE(), PATCH(), RouteContext (+8 more)

### Community 17 - "contrat-stats.test.ts"
Cohesion: 0.10
Nodes (24): BonSortieCaisseLigneRow, BonSortieStatut, ClientRow, ContratPrestationRow, DepenseRow, DocumentVersionRow, DossierFichierRow, DossierFournisseurRow (+16 more)

### Community 18 - "contrat-fichiers-slice.ts"
Cohesion: 0.08
Nodes (19): PageProps, PageProps, PageProps, PageProps, PageProps, AppRoot(), RouteSync(), RouteSyncProps (+11 more)

### Community 19 - "fournisseurs.tsx"
Cohesion: 0.80
Nodes (3): applyFacturePaiement(), canDecrementStock(), simulateSequentialPaiements()

### Community 22 - "dependencies"
Cohesion: 0.09
Nodes (23): ag-grid-community, class-variance-authority, lucide-react, dependencies, ag-grid-community, class-variance-authority, lucide-react, @radix-ui/react-checkbox (+15 more)

### Community 23 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css (+13 more)

### Community 24 - "dossier-detail-hero.tsx"
Cohesion: 0.26
Nodes (10): EXPORT_PERMISSIONS, POST(), sanitizeFilename(), exportExcelBodySchema, normalizeExportRows(), buildXlsxBuffer(), cellDisplayLength(), computeColumnWidths() (+2 more)

### Community 25 - "dossier-form.tsx"
Cohesion: 0.14
Nodes (20): TransporteurFormModal(), CAPACITE_PRESETS, emptyTransporteurForm(), FieldProps, firstInvalidTransporteurStep(), isTransporteurFormValid(), isTransporteurStepValid(), maxReachableStep() (+12 more)

### Community 26 - "UserRole"
Cohesion: 0.09
Nodes (28): NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, StatutCfg, STATUTS_ALL, LignesCard(), LignesTable(), PipelineCard() (+20 more)

### Community 28 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 29 - "users-tab.tsx"
Cohesion: 0.24
Nodes (15): viewTitles, DossierFormInner(), AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter() (+7 more)

### Community 31 - "audit.ts"
Cohesion: 0.47
Nodes (5): ClientProfileCard(), ClientProfileCardProps, avatarGradient(), ProfileTabForm(), getInitials()

### Community 33 - "Writing Guidelines for Postgres References"
Cohesion: 0.12
Nodes (15): 1. Concrete Transformation Patterns, 2. Error-First Structure, 3. Quantified Impact, 4. Self-Contained Examples, 5. Semantic Naming, Code Example Standards, Comments, Impact Level Guidelines (+7 more)

### Community 34 - "Supabase"
Cohesion: 0.13
Nodes (12): Fix suggestion, Source, What happened, Skill Feedback, Steps, Core Principles, Making and Committing Schema Changes, Reference Guides (+4 more)

### Community 35 - "Dossier"
Cohesion: 0.10
Nodes (34): beneficiairesSummary(), CaisseMobileCard(), CaisseTableRow(), BonPreview(), BonMobileCard(), BonTableRow(), ClasseurTab(), DossiersTab() (+26 more)

### Community 36 - "parametres.tsx"
Cohesion: 0.10
Nodes (35): defaultSelectionForRole(), PermissionMatrix(), PermissionMatrixProps, permissionsFromSelection(), allRoles, emptyFormState(), FormMode, FormTab (+27 more)

### Community 37 - "audit.ts"
Cohesion: 0.05
Nodes (67): FICHE_TABS, FicheTab, StockTab(), ExcelSaveStatus, ExcelToolbar(), QuickBtn(), ExcelWorkbookPanelProps, ExcelWorkbookLazy() (+59 more)

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
Cohesion: 0.15
Nodes (12): name, private, scripts, build, dev, lint, postinstall, start (+4 more)

### Community 44 - "SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés"
Cohesion: 0.18
Nodes (10): 1. Contexte du retour, 2. Clarification métier CRITIQUE : deux sociétés, une plateforme, 3.1 Référence Excel actuelle, 3.2 Équivalent à implémenter, 3.3 Suivi des mouvements, 3. Fonctionnalité demandée : le Classeur Client, 4. Architecture données (orientation), 5. Contrainte technique (+2 more)

### Community 45 - "zustand"
Cohesion: 0.14
Nodes (28): DocumentRow, OcrJobRow, buildDocumentStoragePath(), dataUrlToBlob(), removeDocumentStoragePaths(), sha256Hex(), uploadDocumentBlob(), DepenseInput (+20 more)

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
Cohesion: 0.17
Nodes (15): clampConfidence(), findFirst(), mapDossierFieldsFromText(), normalizeDate(), parseMontant(), rasterizePdfToBlobs(), preprocessImageBlob(), OcrExtractedField (+7 more)

### Community 56 - "next.config.ts"
Cohesion: 0.29
Nodes (6): csp, nextConfig, scriptSrc, securityHeaders, supabaseOrigin, supabaseWsOrigin

### Community 57 - "status-badge.tsx"
Cohesion: 0.07
Nodes (36): AdminPanel(), AgentPanel(), AlertesCard(), GuideDemarrage(), MagasinierPanel(), StatutsDonutCard(), useDashboardMetrics(), TransitionDialogProps (+28 more)

### Community 58 - "Supabase Postgres Best Practices"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 60 - "route.test.ts"
Cohesion: 0.25
Nodes (3): FakeProfile, { fakeState, resetFake }, validPatchBody

### Community 61 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): __dirname, eslintConfig, __filename

### Community 98 - "lucide-react"
Cohesion: 0.35
Nodes (8): PATCH(), getAdminClient(), getAuthenticatedProfile(), getServerClient(), requireUser(), createAdminClient(), createServerClient(), getPublicKey()

### Community 101 - "@radix-ui/react-avatar"
Cohesion: 0.09
Nodes (40): react, react, BonCaisseFormDialog(), BonFormDialog(), BonMarchandiseTab(), ClasseurGrid(), ClasseurGridProps, ConvertDevisDialog() (+32 more)

### Community 104 - "domain-types.ts"
Cohesion: 0.17
Nodes (13): DossierFournisseur, DossierFournisseurInput, Fournisseur, FournisseurInput, syncFournisseurStats(), baseClient, baseDossier, { calls, remoteState, resetFake } (+5 more)

### Community 106 - "UserRole"
Cohesion: 0.08
Nodes (28): DocumentMetaForm(), DocumentMetaValues, DocumentUploadFile, DocumentUploadZone(), useDossierDocumentsWarmup(), DossierDetailDocuments(), FileDropZone(), SubDossierCard() (+20 more)

### Community 107 - "status-badge.tsx"
Cohesion: 0.09
Nodes (30): ConfirmDeleteDialog(), iconWrap, KpiCard(), KpiTone, PageHeader(), FinancialBreakdown(), InfoRow(), NEXT_STATUT (+22 more)

### Community 108 - "devis-slice.ts"
Cohesion: 0.29
Nodes (11): ConvertDevisDialogProps, DevisFormProps, DevisRow, Devis, DevisInput, DevisStatut, canTransitionDevis(), createDevisSlice() (+3 more)

### Community 109 - "contrat-detail.tsx"
Cohesion: 0.16
Nodes (8): FinancialSummary(), CONTRAT_STATUT_TONE, CONTRAT_STATUTS, MODES_PAIEMENT, PRESTATION_STATUT_TONE, PRESTATION_STATUTS, Switch(), Textarea()

### Community 123 - "sheet.tsx"
Cohesion: 0.18
Nodes (7): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle()

## Knowledge Gaps
- **419 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+414 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **68 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `@radix-ui/react-select`, `@radix-ui/react-toast`, `tailwind-merge`, `tesseract.js`, `clsx`, `Facture`, `csv-export.ts`, `classeur.ts`, `@radix-ui/react-toast`, `recharts`, `scripts`, `parametres.tsx`, `archives-slice.ts`, `archives.tsx`, `@radix-ui/react-avatar`, `excel-export.ts`, `require-admin.ts`, `users-tab.tsx`, `dashboard-metrics.ts`, `react-dom`, `server-only`, `@univerjs/preset-sheets-core`, `cmdk`, `heic2any`, `pdfjs-dist`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `react` connect `@radix-ui/react-avatar` to `Dossier`, `require-admin.ts`, `nav-store.ts`, `dependencies`, `status-badge.tsx`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `cn()` connect `contrats.tsx` to `devis.tsx`, `store.ts`, `require-admin.ts`, `export.ts`, `useStore`, `route-sync.tsx`, `nav-store.ts`, `comptabilite.tsx`, `contrat-fichiers-slice.ts`, `dossier-form.tsx`, `UserRole`, `users-tab.tsx`, `audit.ts`, `Dossier`, `parametres.tsx`, `audit.ts`, `@radix-ui/react-slot`, `status-badge.tsx`, `@radix-ui/react-avatar`, `UserRole`, `status-badge.tsx`, `contrat-detail.tsx`, `sheet.tsx`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _419 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devis.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06086956521739131 - nodes in this community are weakly interconnected._
- **Should `entreposage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13230769230769232 - nodes in this community are weakly interconnected._
- **Should `print-modules.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12354124748490945 - nodes in this community are weakly interconnected._