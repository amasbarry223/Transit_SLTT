# Graph Report - Transit_SLTT  (2026-07-24)

## Corpus Check
- 333 files · ~693,408 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1474 nodes · 5461 edges · 117 communities (57 shown, 60 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cc6e85bf`
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
- dossier-amounts-section.tsx
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
- contrat-detail.tsx
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
- @radix-ui/react-label
- UserRole
- format.ts
- @radix-ui/react-tooltip
- excel-export.ts
- postcss.config.mjs
- tailwind.config.ts
- entreposage.tsx
- facture-edit-form.tsx
- route.test.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 229 edges
2. `useStore` - 107 edges
3. `formatFCFA()` - 101 edges
4. `useToast()` - 74 edges
5. `useNav` - 72 edges
6. `Button()` - 64 edges
7. `formatDateShort()` - 64 edges
8. `Card()` - 56 edges
9. `usePermission()` - 47 edges
10. `Input()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `CalendrierScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/calendrier.tsx → package.json
- `DashboardScreen()` --references--> `react`  [EXTRACTED]
  src/components/sltt/screens/dashboard.tsx → package.json
- `GuideDemarrage()` --references--> `react`  [EXTRACTED]
  src/components/sltt/dashboard/guide-demarrage.tsx → package.json
- `PaiementDialog()` --references--> `react`  [EXTRACTED]
  src/components/sltt/facture-detail/paiement-dialog.tsx → package.json
- `useFactureEditState()` --references--> `react`  [EXTRACTED]
  src/components/sltt/facture-detail/use-facture-edit-state.ts → package.json

## Import Cycles
- 3-file cycle: `src/lib/client-stats.ts -> src/lib/store.ts -> src/lib/store/dossiers-slice.ts -> src/lib/client-stats.ts`
- 3-file cycle: `src/lib/contrat-stats.ts -> src/lib/store.ts -> src/lib/store/contrats-slice.ts -> src/lib/contrat-stats.ts`

## Communities (117 total, 60 thin omitted)

### Community 0 - "devis.tsx"
Cohesion: 0.15
Nodes (35): beneficiairesSummary(), BonCaisseTabProps, CaisseMobileCard(), CaisseTableRow(), BonMarchandiseTabProps, BonMobileCard(), BonTableRow(), BonsTabProps (+27 more)

### Community 1 - "entreposage.tsx"
Cohesion: 0.13
Nodes (28): BonCaisseFormDialogProps, CaisseLigneForm, ClasseurSuiviDialogProps, PAIEMENT_MODES, Props, EMPTY_LIGNE, LigneForm, TABS (+20 more)

### Community 2 - "print-modules.ts"
Cohesion: 0.13
Nodes (49): FinancialSummary(), FactureDocumentHeader(), htmlEscape(), brandLogoImgHTML(), buildBrandSubHTML(), buildLegalLine(), buildPrintDocument(), BuildPrintDocumentOptions (+41 more)

### Community 3 - "store.ts"
Cohesion: 0.09
Nodes (21): BonSortieRow, ProfileRow, BonMotif, User, computeIncrementalPaye(), validatePaymentAmount(), BonInput, FactureInput (+13 more)

### Community 4 - "dossiers-slice.ts"
Cohesion: 0.12
Nodes (25): DEFAULT_PAIEMENT_MODE, DOSSIER_STATUT_DEDOUANE, DOSSIER_STATUT_EN_COURS, DOSSIER_STATUT_SOLDE, CHART_COLORS, DossierRow, DossierStatut, Ecriture (+17 more)

### Community 5 - "require-admin.ts"
Cohesion: 0.21
Nodes (8): AmountRow(), DossierDetailOverview(), DossierInfoGrid(), InfoTile(), TRANSITION_META, TransitionType, ActionsCard(), Separator()

### Community 6 - "use-toast.ts"
Cohesion: 0.09
Nodes (26): inter, metadata, sora, Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription (+18 more)

### Community 7 - "domain-types.ts"
Cohesion: 0.23
Nodes (16): syncContratStats(), BaseContrat, ContratRow, Contrat, ContratInput, ContratPrestation, ContratPrestationInput, ContratStatut (+8 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, examples, mini-services, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 9 - "export.ts"
Cohesion: 0.09
Nodes (27): EmptyState(), MetaTabItem, MetaTabsList(), ResponsiveColumn, ResponsiveDataList(), ArchiveTab, DocSource, RattachementKind (+19 more)

### Community 10 - "useStore"
Cohesion: 0.20
Nodes (10): actionTone, LOGO_ACCEPTED_TYPES, ParamTab, ProfileTabForm(), SocieteCard(), SocietesTab(), tabs, UsersTabBadge() (+2 more)

### Community 11 - "route-sync.tsx"
Cohesion: 0.08
Nodes (21): PageProps, PageProps, PageProps, PageProps, PageProps, ACTIVITY_EVENTS, AppRoot(), AppRootInner() (+13 more)

### Community 12 - "nav-store.ts"
Cohesion: 0.10
Nodes (34): AdminPanel(), AgentPanel(), AlertesCard(), MagasinierPanel(), StatutsDonutCard(), useDashboardMetrics(), BilansScreen(), currentYearMonth() (+26 more)

### Community 13 - "parametres.tsx"
Cohesion: 0.14
Nodes (19): BonsTab(), ClasseurSuiviDialog(), ClasseurTab(), ClientProfileCard(), ClientProfileCardProps, avatarGradient(), BON_MOTIF_TONE, bonStatutTone() (+11 more)

### Community 14 - "calendrier.tsx"
Cohesion: 0.09
Nodes (30): BonPreview(), InfoCallout(), SortableHead(), PrestatairesTable(), TarifsTable(), TypeBadge(), RolePicker(), AlertDialogOverlay() (+22 more)

### Community 15 - "dossiers-slice.ts"
Cohesion: 0.10
Nodes (29): DossierAmountsSection(), DossierAmountsSectionProps, CollapsibleSection(), FormField(), SectionTitle(), SummaryRow(), toneMap, DossierIdentityStep() (+21 more)

### Community 16 - "client-fiche.tsx"
Cohesion: 0.19
Nodes (13): CalendrierScreen(), CalEvent, DayPanel(), daysInMonth(), EventType, FR_DAYS, FR_MONTHS, isoDate() (+5 more)

### Community 17 - "contrat-stats.test.ts"
Cohesion: 0.10
Nodes (25): BonSortieCaisseLigneRow, BonSortieCaisseRow, BonSortieStatut, ClientRow, ContratPrestationRow, DepenseRow, DossierFichierRow, DossierFournisseurRow (+17 more)

### Community 18 - "contrat-fichiers-slice.ts"
Cohesion: 0.20
Nodes (10): ActifStatutBadge(), DEVIS_STATUT_TONE, DevisStatutBadge(), DOSSIER_STATUT_DOT, DOSSIER_STATUT_TONE, DossierStatutBadge(), dotClasses, EcritureStatutBadge() (+2 more)

### Community 19 - "fournisseurs.tsx"
Cohesion: 0.14
Nodes (13): viewTitles, Avatar(), AvatarFallback(), AvatarImage(), Badge(), badgeVariants, Sheet(), SheetContent() (+5 more)

### Community 21 - "transporteur-form-fields.tsx"
Cohesion: 0.09
Nodes (24): DossierDetailHero(), DossierDetailStepper(), STATUTS_ORDERED, FinancialBreakdown(), InfoRow(), NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW (+16 more)

### Community 22 - "dependencies"
Cohesion: 0.10
Nodes (21): class-variance-authority, clsx, cmdk, dependencies, class-variance-authority, clsx, cmdk, @radix-ui/react-alert-dialog (+13 more)

### Community 23 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css (+13 more)

### Community 24 - "dossier-detail-hero.tsx"
Cohesion: 0.22
Nodes (12): NEXT_STATUT, STATUT_CONFIG, STATUT_FLOW, StatutCfg, STATUTS_ALL, FactureSummaryHeader(), PipelineCard(), VerticalStepper() (+4 more)

### Community 25 - "dossier-form.tsx"
Cohesion: 0.11
Nodes (31): SORT_OPTIONS, SortKey, TransporteurFormModal(), CAPACITE_PRESETS, emptyTransporteurForm(), FieldProps, firstInvalidTransporteurStep(), isTransporteurFormValid() (+23 more)

### Community 26 - "UserRole"
Cohesion: 0.29
Nodes (11): DossierDetailDocuments(), FileDropZone(), SubDossierCard(), GlossaryLabel(), ContratFileDropZone(), DossierFichier, SubDossier, formatFileSize() (+3 more)

### Community 27 - "calendrier.tsx"
Cohesion: 0.13
Nodes (23): BreadcrumbNav(), DETAIL_PARENT, NavList(), Sidebar(), Topbar(), useCanManageUsers(), useCanView(), useEffectivePermissionUser() (+15 more)

### Community 28 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 29 - "users-tab.tsx"
Cohesion: 0.20
Nodes (17): BonFormDialog(), BonFormDialogProps, FactureEditForm(), InfoRow(), InformationsCard(), AlertDialog(), AlertDialogAction(), AlertDialogCancel() (+9 more)

### Community 33 - "Writing Guidelines for Postgres References"
Cohesion: 0.12
Nodes (15): 1. Concrete Transformation Patterns, 2. Error-First Structure, 3. Quantified Impact, 4. Self-Contained Examples, 5. Semantic Naming, Code Example Standards, Comments, Impact Level Guidelines (+7 more)

### Community 34 - "Supabase"
Cohesion: 0.13
Nodes (12): Fix suggestion, Source, What happened, Skill Feedback, Steps, Core Principles, Making and Committing Schema Changes, Reference Guides (+4 more)

### Community 35 - "Dossier"
Cohesion: 0.18
Nodes (12): EntryExitDialogs(), NewItemDialog(), StockTab(), SORTIE_MOTIFS, SortieMotif, EntrepotTab, tabs, resolveClasseurPrintBrand() (+4 more)

### Community 36 - "contrat-stats.test.ts"
Cohesion: 0.05
Nodes (61): POST(), RouteContext, AdminClient, assertCanTouchTarget(), assertNotLastActiveAdmin(), DELETE(), PATCH(), RouteContext (+53 more)

### Community 37 - "audit.ts"
Cohesion: 0.15
Nodes (18): AuditSourceType, buildClasseurJournal(), buildDossierLibelle(), classeurEntrySourceType(), ClasseurFilters, ClasseurMouvementRow, ClasseurTotals, ClasseurType (+10 more)

### Community 38 - "2. Fonctionnalités demandées"
Cohesion: 0.14
Nodes (13): 0. Contexte, 1. Principes directeurs (non négociables), 2. Fonctionnalités demandées, 3. Récapitulatif des changements techniques, 4. Points à confirmer avec le client avant / pendant l'implémentation, 5. Hors périmètre (pour éviter la dérive), F1 — Dimension « Société » (Top Doumani / Traoré Transit Logistique), F2 — TVA 18 % optionnelle sur les factures (+5 more)

### Community 43 - "scripts"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, lint, start, test (+2 more)

### Community 44 - "SLTT — Retour client V1 : Classeur Client & Architecture Bi-Sociétés"
Cohesion: 0.18
Nodes (10): 1. Contexte du retour, 2. Clarification métier CRITIQUE : deux sociétés, une plateforme, 3.1 Référence Excel actuelle, 3.2 Équivalent à implémenter, 3.3 Suivi des mouvements, 3. Fonctionnalité demandée : le Classeur Client, 4. Architecture données (orientation), 5. Contrainte technique (+2 more)

### Community 47 - "dossier-amounts-section.tsx"
Cohesion: 0.31
Nodes (7): ChartTooltipPayload, EcartsTooltip(), EncaissementsTooltip(), DerniersDossiersCard(), EncaissementsChart(), MargeChart(), formatFCFACompact()

### Community 48 - "Section Definitions"
Cohesion: 0.20
Nodes (9): 1. Query Performance (query), 2. Connection Management (conn), 3. Security & RLS (security), 4. Schema Design (schema), 5. Concurrency & Locking (lock), 6. Data Access Patterns (data), 7. Monitoring & Diagnostics (monitor), 8. Advanced Features (advanced) (+1 more)

### Community 49 - "archives-slice.ts"
Cohesion: 0.29
Nodes (9): UnifiedDoc, ArchiveRow, Archive, TypeDocument, AddArchiveInput, ArchivesSlice, createArchivesSlice(), mapArchiveFromDb() (+1 more)

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
Cohesion: 0.31
Nodes (10): ConvertDevisDialogProps, DevisRow, Devis, DevisInput, DevisStatut, canTransitionDevis(), createDevisSlice(), DevisSlice (+2 more)

### Community 55 - "archives.tsx"
Cohesion: 0.08
Nodes (39): iconWrap, KpiCard(), KpiTone, FilterChip, ListFilters(), ListFiltersProps, PageHeader(), clientTypes (+31 more)

### Community 56 - "next.config.ts"
Cohesion: 0.29
Nodes (6): csp, nextConfig, scriptSrc, securityHeaders, supabaseOrigin, supabaseWsOrigin

### Community 57 - "status-badge.tsx"
Cohesion: 0.38
Nodes (6): ContratFichierRow, ContratFichier, AddContratFichierInput, ContratFichiersSlice, createContratFichiersSlice(), mapContratFichierFromDb()

### Community 58 - "Supabase Postgres Best Practices"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 59 - "contrat-detail.tsx"
Cohesion: 0.10
Nodes (64): react, react, BonCaisseFormDialog(), BonCaisseTab(), BonMarchandiseTab(), useBonFilters(), ConvertDevisDialog(), ComptablePanel() (+56 more)

### Community 60 - "route.test.ts"
Cohesion: 0.25
Nodes (3): FakeProfile, { fakeState, resetFake }, validPatchBody

### Community 61 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): __dirname, eslintConfig, __filename

### Community 104 - "domain-types.ts"
Cohesion: 0.14
Nodes (19): BON_MOTIF_TONE, BON_MOTIFS, BON_STATUT_TONE, BonSortie, DepenseInput, DossierFournisseur, DossierFournisseurInput, EcritureStatut (+11 more)

### Community 112 - "excel-export.ts"
Cohesion: 0.15
Nodes (16): AuditAction, AuditModule, AuditSourceRef, insertAuditLog(), mapAuditLogFromDb(), resolveClientIp(), fetchMouvementSuivi(), SocieteRow (+8 more)

### Community 119 - "facture-edit-form.tsx"
Cohesion: 0.11
Nodes (17): ClientFormFieldsProps, TransitionDialogProps, LignesCard(), LignesTable(), deriveClientIdFromRattachement(), RattachementKind, syncClientStats(), Client (+9 more)

## Knowledge Gaps
- **390 isolated node(s):** `supabase`, `supabase`, `$schema`, `style`, `rsc` (+385 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **60 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `calendrier.tsx` to `devis.tsx`, `entreposage.tsx`, `print-modules.ts`, `require-admin.ts`, `use-toast.ts`, `export.ts`, `useStore`, `nav-store.ts`, `parametres.tsx`, `dossiers-slice.ts`, `client-fiche.tsx`, `contrat-fichiers-slice.ts`, `fournisseurs.tsx`, `transporteur-form-fields.tsx`, `dossier-detail-hero.tsx`, `dossier-form.tsx`, `UserRole`, `calendrier.tsx`, `users-tab.tsx`, `Dossier`, `contrat-stats.test.ts`, `dossier-amounts-section.tsx`, `archives.tsx`, `contrat-detail.tsx`, `@radix-ui/react-avatar`, `facture-edit-form.tsx`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `classeur.ts`, `lucide-react`, `@radix-ui/react-slot`, `@radix-ui/react-toast`, `@radix-ui/react-label`, `tailwind-merge`, `scripts`, `recharts`, `@radix-ui/react-tooltip`, `parametres.tsx`, `format.ts`, `UserRole`, `zustand`, `bilans.tsx`, `entreposage.tsx`, `contrat-detail.tsx`, `csv-export.ts`, `audit.ts`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `react` connect `contrat-detail.tsx` to `client-fiche.tsx`, `nav-store.ts`, `dependencies`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **What connects `supabase`, `supabase`, `$schema` to the rest of the system?**
  _390 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devis.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14630467571644043 - nodes in this community are weakly interconnected._
- **Should `entreposage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13197586726998492 - nodes in this community are weakly interconnected._
- **Should `print-modules.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1346153846153846 - nodes in this community are weakly interconnected._