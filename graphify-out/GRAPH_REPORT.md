# Graph Report - Transit_SLTT  (2026-08-12)

## Corpus Check
- 584 files · ~810,015 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2409 nodes · 8957 edges · 184 communities (109 shown, 75 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1115256a`
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
- dossier-bulk-import-dialog.tsx
- societe-brand.ts
- sync-sequences.ts
- derniers-dossiers-card.tsx
- excel-export.ts
- postcss.config.mjs
- tailwind.config.ts
- use-benefice-par-societe.ts
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
- recharts
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
- tailwindcss-animate
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
- FactureDetailScreen
- cmdk
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- serwist
- tesseract.js
- @univerjs/preset-sheets-core
- guide-progress.ts
- recap-client-card.tsx
- brand-colors.ts
- @radix-ui/react-dropdown-menu
- InstallPWA.tsx
- lignes-card.tsx
- recap-client-card.tsx
- payment-dialog.tsx
- page.tsx
- cmdk
- factures-slice.test.ts
- class-variance-authority

## God Nodes (most connected - your core abstractions)
1. `cn()` - 300 edges
2. `formatFCFA()` - 158 edges
3. `useStore` - 149 edges
4. `useToast()` - 115 edges
5. `Button()` - 109 edges
6. `Card()` - 78 edges
7. `formatDateShort()` - 76 edges
8. `usePermission()` - 63 edges
9. `Input()` - 55 edges
10. `useNav` - 52 edges

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
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/ecritures-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/contrat-stats.ts`
- 3-file cycle: `src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/sync-sequences.ts -> src/lib/store.ts`
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`
- 4-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/ecritures-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/factures-slice.ts -> src/lib/client-stats.ts`
- 4-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/data-fetch-slice.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`

## Communities (184 total, 75 thin omitted)

### Community 0 - "devis.tsx"
Cohesion: 0.10
Nodes (36): ConvertDevisDialogProps, DevisFormProps, DevisRow, FactureRow, Devis, DevisInput, DevisStatut, FactureLigne (+28 more)

### Community 1 - "entreposage.tsx"
Cohesion: 0.13
Nodes (25): AuditAction, AuditModule, AuditSourceRef, insertAuditLog(), resolveClientIp(), ArchiveRow, RecuPaiementRow, Archive (+17 more)

### Community 2 - "print-modules.ts"
Cohesion: 0.24
Nodes (32): htmlEscape(), acquirePrintTarget(), brandLogoImgHTML(), buildBrandSubHTML(), buildLegalLine(), buildPrintDocument(), documentFooterHTML(), openPrintWindow() (+24 more)

### Community 3 - "store.ts"
Cohesion: 0.60
Nodes (4): DossierDetailScreen(), calculateDaysUntil(), isEcheanceDepassee(), isEcheanceImminente()

### Community 4 - "dossiers-slice.ts"
Cohesion: 0.13
Nodes (8): PageProps, PageProps, PageProps, PageProps, PageProps, RouteSync(), RouteSyncProps, syncNavFromRoute()

### Community 5 - "require-admin.ts"
Cohesion: 0.18
Nodes (15): ClotureDialog(), dayAfter(), firstDayOfMonth(), today(), OperationsTableProps, computeOperationsTotals(), computeRunningEcart(), filterOperationsByEntite() (+7 more)

### Community 6 - "utils.ts"
Cohesion: 0.18
Nodes (12): FactureEditForm(), FinancialSummary(), InfoRow(), InformationsCard(), LignesCard(), LignesTable(), PaymentRing(), SuiviPaiementCard() (+4 more)

### Community 7 - "domain-types.ts"
Cohesion: 0.33
Nodes (9): nextSeqFromValues(), parseIdSeq(), parseNumeroSeq(), parseOpcSeq(), parseRecuSeq(), parseTrailingSeq(), SequenceCounters, syncSequencesFromData() (+1 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (32): dom, dom.iterable, esnext, examples, mini-services, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+24 more)

### Community 9 - "export.ts"
Cohesion: 0.12
Nodes (36): BonCaisseTabProps, PreviewState, BonsTab(), BonsTabProps, DossiersTabProps, FacturesTabProps, LogistiqueTabProps, bonStatutTone() (+28 more)

### Community 10 - "useStore"
Cohesion: 0.05
Nodes (41): 0. Note d'architecture — À LIRE AVANT TOUT, 1.1 POST /api/admin/users, 1.2 PATCH /api/admin/users/:id, 1.3 DELETE /api/admin/users/:id, 1.4 POST /api/admin/users/:id/password, 1.5 PATCH /api/admin/users/:id/annexes, 1.6 PATCH /api/auth/password, 1.7 GET /api/client-ip (+33 more)

### Community 12 - "nav-store.ts"
Cohesion: 0.11
Nodes (24): RolePicker(), allRoles, FormMode, FormTab, RoleFilter, roleMeta, roleTone, UserFormState (+16 more)

### Community 13 - "contrats.tsx"
Cohesion: 0.22
Nodes (20): ImportAnyDialog(), isExcelFile(), CheckedState, Phase, ReviewRow, emptyForm(), FormState, OcrCaptureDialog() (+12 more)

### Community 15 - "dossier-wizard-steps.tsx"
Cohesion: 0.21
Nodes (16): RecapClientCard(), RepartitionCard(), currentYearMonth(), getPeriodeLabel(), Periode, PERIODES, useBilansScreen(), BilansScreen() (+8 more)

### Community 16 - "store-actions.test.ts"
Cohesion: 0.12
Nodes (21): DevisPipelineCard(), DevisNextStatut, DevisStatutConfig, NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, STATUTS_ALL, DossierDetailStepper() (+13 more)

### Community 17 - "contrat-stats.test.ts"
Cohesion: 0.09
Nodes (47): react, react, BonCaisseFormDialog(), BonCaisseTab(), BonMarchandiseTab(), useBonFilters(), ClasseurImportDialog(), ComptabiliteGeneraleImportDialog() (+39 more)

### Community 18 - "contrat-fichiers-slice.ts"
Cohesion: 0.08
Nodes (38): EcrituresTableProps, DossierFormErrors, numStr(), useDossierFormState(), UseDossierFormStateOptions, WIZARD_STEPS, getNextTransition(), sommeFacturesEncaissees() (+30 more)

### Community 19 - "fournisseurs.tsx"
Cohesion: 0.80
Nodes (3): applyFacturePaiement(), canDecrementStock(), simulateSequentialPaiements()

### Community 20 - "Facture"
Cohesion: 0.12
Nodes (27): EvolutionChartCard(), EvolutionChartCardProps, BonFormDialog(), NewItemDialog(), useStockMovementDialogs(), FACTURE_TABS, buildDossierPrefill(), useFacturesScreen() (+19 more)

### Community 21 - "cn"
Cohesion: 0.11
Nodes (28): ChartPayloadItem, ChartTooltip(), PiePayloadItem, PieTooltip(), JournalCaissePanel(), ConfirmActionDialog(), ConvertDevisDialog(), DevisEditForm() (+20 more)

### Community 22 - "dependencies"
Cohesion: 0.07
Nodes (27): ag-grid-community, ag-grid-react, clsx, lucide-react, dependencies, ag-grid-community, ag-grid-react, clsx (+19 more)

### Community 23 - "devDependencies"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, sharp, tailwindcss, @tailwindcss/postcss (+15 more)

### Community 24 - "archives-slice.ts"
Cohesion: 0.09
Nodes (23): DocumentMetaForm(), DocumentMetaValues, DocumentUploadFile, DocumentUploadZone(), DocumentViewer(), isDirectUrl(), useDossierDocumentsWarmup(), emptyForm() (+15 more)

### Community 25 - "dossier-form.tsx"
Cohesion: 0.13
Nodes (30): OfflineIndicator(), today(), useEcrituresScreen(), AppShell(), BreadcrumbNav(), DETAIL_PARENT, CommandPalette(), Sidebar() (+22 more)

### Community 26 - "UserRole"
Cohesion: 0.13
Nodes (14): 1. Isolation des données par annexe, 2. Sélecteur d'annexe, 3. Numérotation des documents, 4. Migration des données existantes, 5. Création d'une nouvelle annexe, CONTEXTE MÉTIER, CONTRAINTE UX — PRIORITÉ ABSOLUE, CONTRAINTES TECHNIQUES (+6 more)

### Community 27 - "UserRole"
Cohesion: 0.23
Nodes (14): DossierDetailDocuments(), FileDropZone(), SubDossierCard(), GlossaryLabel(), DossierFichierRow, SubDossierRow, DossierFichier, SubDossier (+6 more)

### Community 28 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 29 - "stock-slice.ts"
Cohesion: 0.30
Nodes (10): ClotureCaisseRow, OperationComptableRow, ClotureCaisse, EntiteComptableType, OperationComptableInput, ComptabiliteGeneraleSlice, createComptabiliteGeneraleSlice(), mapClotureCaisseFromDb() (+2 more)

### Community 30 - "csv-export.ts"
Cohesion: 0.08
Nodes (34): REALTIME_TABLES, fetchWithAuth(), ProfileRow, SocieteRow, Client, SocieteInput, User, ExcelWorkbook (+26 more)

### Community 31 - "ag-grid-community"
Cohesion: 0.25
Nodes (18): PATCH(), RouteContext, POST(), RouteContext, AdminClient, assertNotLastActiveAdmin(), DELETE(), PATCH() (+10 more)

### Community 33 - "Writing Guidelines for Postgres References"
Cohesion: 0.12
Nodes (15): 1. Concrete Transformation Patterns, 2. Error-First Structure, 3. Quantified Impact, 4. Self-Contained Examples, 5. Semantic Naming, Code Example Standards, Comments, Impact Level Guidelines (+7 more)

### Community 34 - "Supabase"
Cohesion: 0.13
Nodes (12): Fix suggestion, Source, What happened, Skill Feedback, Steps, Core Principles, Making and Committing Schema Changes, Reference Guides (+4 more)

### Community 35 - "@supabase/server"
Cohesion: 0.12
Nodes (16): Calling from database with pg_net, Cloudflare Workers, Cookie-based environments (compose with `@supabase/ssr`), Documentation, Edge Function recipes, Entry points, Function-to-function calls, Hono (+8 more)

### Community 37 - "createServerClient"
Cohesion: 0.13
Nodes (19): AnnexeSelector(), NavList(), NavSectionLabel(), SidebarBrand(), viewTitles, Sheet(), SheetContent(), SheetDescription() (+11 more)

### Community 38 - "2. Fonctionnalités demandées"
Cohesion: 0.14
Nodes (13): 0. Contexte, 1. Principes directeurs (non négociables), 2. Fonctionnalités demandées, 3. Récapitulatif des changements techniques, 4. Points à confirmer avec le client avant / pendant l'implémentation, 5. Hors périmètre (pour éviter la dérive), F1 — Dimension « Société » (Top Doumani / Traoré Transit Logistique), F2 — TVA 18 % optionnelle sur les factures (+5 more)

### Community 39 - "@radix-ui/react-slot"
Cohesion: 0.15
Nodes (13): ARCHIVE_COLUMNS, TYPE_DOC_BADGE, ContratFileDropZone(), DangerConfirmDialog(), EntityFileDropZone(), EntityFileDropZoneLabels, EntityFileItem, EntityFilePayload (+5 more)

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
Cohesion: 0.08
Nodes (36): ArchiveUploadDialog(), ArchiveTab, DocSource, RattachementKind, TAB_META, TYPES_DOCUMENT, UnifiedDoc, useArchivesScreen() (+28 more)

### Community 46 - "parametres.tsx"
Cohesion: 0.18
Nodes (13): ChartTooltipPayload, EcartsTooltip(), EncaissementsTooltip(), DerniersDossiersCard(), EncaissementsChart(), MargeChart(), DOSSIER_STATUT_DOT, DossierStatutBadge() (+5 more)

### Community 47 - "guide-progress.ts"
Cohesion: 0.17
Nodes (20): buildRecuPrintData(), formToModuleData(), printRecu(), printRecuFromForm(), RecuFormModuleInput, resolveGeneratorBrand(), resolveRecuBrand(), toRecuModuleData() (+12 more)

### Community 48 - "Section Definitions"
Cohesion: 0.20
Nodes (9): 1. Query Performance (query), 2. Connection Management (conn), 3. Security & RLS (security), 4. Schema Design (schema), 5. Concurrency & Locking (lock), 6. Data Access Patterns (data), 7. Monitoring & Diagnostics (monitor), 8. Advanced Features (advanced) (+1 more)

### Community 49 - "archives-slice.ts"
Cohesion: 0.30
Nodes (12): InfoCallout(), RecuGeneratorActionsProps, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter() (+4 more)

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
Nodes (35): clampConfidence(), findFirst(), isValidYmd(), mapDossierFieldsFromText(), normalizeDate(), parseMontant(), clampConfidence(), findFirst() (+27 more)

### Community 55 - "factures.tsx"
Cohesion: 0.08
Nodes (44): ExcelSaveStatus, ExcelToolbar(), QuickBtn(), ExcelWorkbookPanelProps, ClasseurType, buildColMapFromRow(), cellToString(), ClasseurImportApplyPlan (+36 more)

### Community 56 - "next.config.ts"
Cohesion: 0.40
Nodes (4): nextConfig, pwaHeaders, securityHeaders, withSerwist

### Community 57 - "dashboard-metrics.ts"
Cohesion: 0.18
Nodes (13): DossierFournisseur, DossierFournisseurInput, Fournisseur, FournisseurInput, syncFournisseurStats(), baseClient, baseDossier, { calls, remoteState, resetFake } (+5 more)

### Community 58 - "Supabase Postgres Best Practices"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 59 - "dashboard-metrics.ts"
Cohesion: 0.16
Nodes (20): RecuReceiptBody(), RecuReceiptBodyProps, RecuReceiptHeader(), RecuReceiptHeaderProps, RecuReceiptPreviewProps, resolveLogoUrl(), buildFieldLine(), buildHeaderLegalHTML() (+12 more)

### Community 60 - "route.test.ts"
Cohesion: 0.25
Nodes (3): FakeProfile, { fakeState, resetFake }, validPatchBody

### Community 61 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): __dirname, eslintConfig, __filename

### Community 98 - "require-admin.ts"
Cohesion: 0.14
Nodes (19): BonFormDialogProps, EntryExitDialogs(), SORTIE_MOTIFS, SortieMotif, EMPTY_LIGNE, LigneForm, AnnexeCard(), LOGO_ACCEPTED_TYPES (+11 more)

### Community 101 - "operation-form-dialog.tsx"
Cohesion: 0.15
Nodes (12): DossierIdentityStep(), DossierIdentityStepProps, DossierSuiviSection(), DossierSuiviSectionProps, DossierTransportSection(), DossierTransportSectionProps, DossierWizardNav(), DossierWizardNavProps (+4 more)

### Community 105 - "dossier-bulk-import-dialog.tsx"
Cohesion: 0.05
Nodes (49): ClientProfileCard(), ClientProfileCardProps, avatarGradient(), Heading(), StatPill(), AdminPanel(), DossiersEvolutionChart(), InfoRow() (+41 more)

### Community 107 - "societe-brand.ts"
Cohesion: 0.16
Nodes (17): FactureDocumentHeader(), BuildPrintDocumentOptions, ANNEXE_DOSSIER_COUT_LABELS, buildInvoiceBrandBlocks(), buildLegalLineHTML(), DEFAULT_DOSSIER_COUT_LABELS, DossierCoutLabels, escapeHtml() (+9 more)

### Community 109 - "sync-sequences.ts"
Cohesion: 0.16
Nodes (10): DevisActionsCard(), AmountRow(), TransitionDialogProps, ActionsCard(), Separator(), deriveClientIdFromRattachement(), RattachementKind, Dossier (+2 more)

### Community 116 - "use-benefice-par-societe.ts"
Cohesion: 0.27
Nodes (10): QuickAction, Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem(), CommandList() (+2 more)

### Community 117 - "contrat-detail.tsx"
Cohesion: 0.16
Nodes (21): BonCaisseFormDialogProps, CaisseLigneForm, ClientFormFields(), ClientFormFieldsProps, clientTypes, EcrituresFilters(), EcrituresFiltersProps, JournalCaissePanelProps (+13 more)

### Community 118 - "3. Modèle de données — détail champ par champ"
Cohesion: 0.12
Nodes (16): 3.10 bons_sortie (marchandise) + bons_sortie_caisse, 3.11 contrats + contrat_prestations + contrat_fichiers + depenses, 3.12 fournisseurs + transporteurs + dossier_fournisseurs, 3.13 archives, 3.14 documents / document_versions / ocr_jobs / ocr_fields (module OCR), 3.15 excel_workbooks & audit_logs, 3.1 profiles (extension de `auth.users`), 3.2 annexes (+8 more)

### Community 119 - "excel-export.ts"
Cohesion: 0.21
Nodes (12): Column, downloadBlob(), exportToExcel(), isValidXlsxBytes(), sanitizeFilename(), normalizeExportCell(), normalizeExportRows(), buildXlsxBuffer() (+4 more)

### Community 121 - "7. Spécification fonctionnelle par écran"
Cohesion: 0.12
Nodes (16): 7.10 Fournisseurs, 7.11 Transporteurs, 7.12 Calendrier, 7.13 Comptabilité, 7.14 Bilans, 7.15 Paramètres, 7.1 Dashboard, 7.2 Clients (+8 more)

### Community 123 - "dossier-detail-overview.tsx"
Cohesion: 0.23
Nodes (9): StockCard(), StockRow(), DEVIS_STATUT_TONE, DOSSIER_STATUT_TONE, DossierFournisseurStatutBadge(), dotClasses, EcritureStatutBadge(), FactureStatutBadge() (+1 more)

### Community 126 - "ocr-capture-dialog.tsx"
Cohesion: 0.06
Nodes (51): BonSortieCaisseLigneRow, BonSortieCaisseRow, BonSortieRow, BonSortieStatut, ClientRow, ContratFichierRow, DepenseRow, DocumentVersionRow (+43 more)

### Community 128 - "db-seed-demo.mjs"
Cohesion: 0.50
Nodes (3): result, root, seedFile

### Community 129 - "comptabilite-generale-import.ts"
Cohesion: 0.24
Nodes (12): buildColMap(), cellToString(), Field, findHeaderRow(), HEADER_ALIASES, isPlausibleDate(), normalizeHeader(), parseAmount() (+4 more)

### Community 130 - "@radix-ui/react-toast"
Cohesion: 0.22
Nodes (11): assertCellSizes(), POST(), sanitizeFilename(), createUserBodySchema, exportExcelBodySchema, resetPasswordBodySchema, updateUserAnnexesBodySchema, updateUserBodySchema (+3 more)

### Community 132 - "shared.tsx"
Cohesion: 0.08
Nodes (48): beneficiairesSummary(), CaisseMobileCard(), CaisseTableRow(), BonPreview(), ClasseurGrid(), ClasseurGridProps, ClasseurSuiviDialog(), ClasseurSuiviDialogProps (+40 more)

### Community 133 - "contrats.tsx"
Cohesion: 0.23
Nodes (11): CalendrierScreen(), CalEvent, daysInMonth(), EventType, FR_DAYS, FR_MONTHS, isoDate(), startOfMonth() (+3 more)

### Community 134 - "bon-marchandise-tab.tsx"
Cohesion: 0.24
Nodes (8): Phase, ReviewRow, StatPill(), Heading(), OperationsTable(), SOURCE_LABEL, Badge(), badgeVariants

### Community 135 - "dossier-amounts-section.tsx"
Cohesion: 0.06
Nodes (48): BeforeInstallPromptEvent, InstallPWA(), InstallPWAProps, isDesktopChromium(), isIos(), isStandalone(), OperationsKpiRow(), OperationsKpiRowProps (+40 more)

### Community 136 - "split-users-table.mjs"
Cohesion: 0.22
Nodes (8): 11. Temps réel, 12. Routes API custom (7), 13. Glossaire, 14. Références (fichiers sources), 4. Machines à états (FSM), 6. Matrice des permissions, Cahier des charges détaillé — Plateforme SLTT Transit, Sommaire

### Community 137 - "bons-slice.ts"
Cohesion: 0.11
Nodes (38): DocumentRow, buildDocumentStoragePath(), dataUrlToBlob(), getSignedDocumentUrl(), removeDocumentStoragePaths(), sha256Hex(), uploadDocumentBlob(), DocumentCategorie (+30 more)

### Community 139 - "recharts"
Cohesion: 0.10
Nodes (37): CONTRAT_STATUT_TONE, CONTRAT_STATUTS, contratToInput(), InfoRow(), MODES_PAIEMENT, PRESTATION_STATUT_TONE, PRESTATION_STATUTS, ActiveAnnexe (+29 more)

### Community 140 - "command-palette.tsx"
Cohesion: 0.13
Nodes (19): RecuGeneratorActions(), RecuGeneratorForm(), RecuGeneratorFormProps, ResteSummary(), STATUT_BADGE_CLASS, STATUT_LABELS, RecuReceiptPreview(), RecuWorkspace() (+11 more)

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

### Community 154 - "informations-card.tsx"
Cohesion: 0.31
Nodes (9): PATCH(), changePasswordBodySchema, getAdminClient(), getAuthenticatedProfile(), getServerClient(), requireUser(), createAdminClient(), createServerClient() (+1 more)

### Community 155 - "dossier-detail-stepper.tsx"
Cohesion: 0.14
Nodes (11): inter, metadata, sora, viewport, PwaGlobalEffects(), PwaUpdatePrompt(), AppSerwistProvider(), AppRoot() (+3 more)

### Community 156 - "clsx"
Cohesion: 0.50
Nodes (3): secureRuntimeCaching, serwist, WorkerGlobalScope

### Community 157 - "class-variance-authority"
Cohesion: 0.27
Nodes (7): NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, StatutCfg, STATUTS_ALL, PipelineCard(), VerticalStepper()

### Community 164 - "FactureDetailScreen"
Cohesion: 0.21
Nodes (11): ClotureDialogProps, ImportAnyDialogProps, ImportDialogProps, OcrCaptureDialogProps, OperationFormDialog(), OperationFormDialogProps, today(), NATURE_SUGGESTIONS (+3 more)

### Community 165 - "cmdk"
Cohesion: 0.24
Nodes (10): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+2 more)

### Community 167 - "@radix-ui/react-dropdown-menu"
Cohesion: 0.09
Nodes (32): EcrituresTable(), PaymentDialog(), deriveStatut(), AgentPanel(), AlertesCard(), ComptablePanel(), MagasinierPanel(), StockRepartitionChart() (+24 more)

### Community 172 - "guide-progress.ts"
Cohesion: 0.24
Nodes (10): GuideDemarrage(), emitGuideReset(), getGuideProgress(), getGuideStepsForRole(), GUIDE_STEP_DEFS, GuideStepDef, GuideStepId, GuideStepView (+2 more)

### Community 173 - "recap-client-card.tsx"
Cohesion: 0.33
Nodes (6): ACTIVITY_EVENTS, AppRootInner(), LoginScreen(), SupabaseRequiredScreen(), useSupabaseRealtime(), clearLegacyNavPersist()

### Community 174 - "brand-colors.ts"
Cohesion: 0.32
Nodes (6): CheckedState, Phase, ReviewRow, StatutHistorique, Checkbox(), DossierBulkImportRow

### Community 178 - "recap-client-card.tsx"
Cohesion: 0.36
Nodes (7): RecapClientCardProps, RecapRow, SortDir, SortKey, SortableHead(), EcartValue(), TableFooter()

### Community 179 - "payment-dialog.tsx"
Cohesion: 0.42
Nodes (5): NewEcritureDialog(), NewEcritureDialogProps, PaymentDialogProps, modeOptions, PaiementMode

### Community 180 - "page.tsx"
Cohesion: 0.15
Nodes (14): PieDatum, RepartitionCardProps, BonMarchandiseTabProps, BonMobileCard(), BonTableRow(), BON_MOTIF_TONE, BON_MOTIFS, BON_STATUT_TONE (+6 more)

## Knowledge Gaps
- **599 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+594 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **75 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `dossier-bulk-import-dialog.tsx` to `shared.tsx`, `require-admin.ts`, `bon-marchandise-tab.tsx`, `dossier-amounts-section.tsx`, `utils.ts`, `export.ts`, `contrats.tsx`, `nav-store.ts`, `contrats.tsx`, `command-palette.tsx`, `dossier-wizard-steps.tsx`, `store-actions.test.ts`, `contrat-stats.test.ts`, `Facture`, `cn`, `archives-slice.ts`, `dossier-form.tsx`, `UserRole`, `createServerClient`, `cmdk`, `@radix-ui/react-slot`, `@radix-ui/react-dropdown-menu`, `guide-progress.ts`, `operation-form-dialog.tsx`, `parametres.tsx`, `brand-colors.ts`, `InstallPWA.tsx`, `archives-slice.ts`, `recap-client-card.tsx`, `page.tsx`, `factures.tsx`, `dashboard-metrics.ts`, `require-admin.ts`, `operation-form-dialog.tsx`, `sync-sequences.ts`, `use-benefice-par-societe.ts`, `contrat-detail.tsx`, `dossier-detail-overview.tsx`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `react` connect `contrat-stats.test.ts` to `contrats.tsx`, `utils.ts`, `@radix-ui/react-dropdown-menu`, `guide-progress.ts`, `Facture`, `cn`, `dependencies`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `tailwind-merge`, `@radix-ui/react-switch`, `@radix-ui/react-select`, `calendrier.tsx`, `contrat-stats.test.ts`, `@radix-ui/react-label`, `package.json`, `tailwindcss-animate`, `next`, `@radix-ui/react-separator`, `classeur.ts`, `@radix-ui/react-toast`, `server-only`, `@radix-ui/react-alert-dialog`, `@supabase/supabase-js`, `@radix-ui/react-dialog`, `serwist`, `tesseract.js`, `@univerjs/preset-sheets-core`, `@radix-ui/react-dropdown-menu`, `cmdk`, `class-variance-authority`, `excel-export.ts`, `heic2any`, `pdfjs-dist`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _599 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devis.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10101010101010101 - nodes in this community are weakly interconnected._
- **Should `entreposage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12807881773399016 - nodes in this community are weakly interconnected._
- **Should `dossiers-slice.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12857142857142856 - nodes in this community are weakly interconnected._