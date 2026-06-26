# SLTT — Worklog

This file tracks all work on the SLTT (Société Traoré de Logistique, Transit et Transport)
frontend application. Every agent MUST read this before working and append their section after.

---
Task ID: 1
Agent: main (orchestrator)
Task: Foundation — design system, navigation store, mock data, shared components, app shell

Work Log:
- Set up Inter (body) + Sora (headings) fonts in `src/app/layout.tsx` (lang="fr").
- Rewrote `src/app/globals.css` with SLTT light-theme tokens:
  - Primary blue #1E40AF, accent emerald #059669, amber #D97706, red #DC2626.
  - Background #F8FAFC, cards #FFFFFF, borders #E2E8F0, text #0F172A / #64748B.
  - `--font-sans` = Inter, `--font-heading` = Sora. Added `.tabular-nums` and `.sltt-scroll` scrollbar.
  - radius 0.75rem. NO dark theme (light only, per spec).
- Created `src/lib/format.ts`: `formatFCFA`, `formatFCFACompact`, `formatDate`, `formatDateShort`, `parseAmount`.
- Created `src/lib/nav-store.ts` (Zustand): `useNav` with `view`, `selectedId`, `isAuthenticated`,
  `go(view, {id})`, `openDossier(id, mode)`, `openClient(id)`, `login()`, `logout()`.
  ViewKey union = dashboard | dossiers | dossier-form | comptabilite | bilans | entreposage | bons | clients | client-fiche | parametres.
- Created `src/lib/mock-data.ts` with full typed datasets: clients(7), dossiers(10), ecritures(8),
  stock(7), mouvements(7), bonsSortie(5), users(5), alertes(6), chart series, and helpers
  `calculerEcart`, `resteAPayer`, `getClientById`, `getDossierById`, `getDossiersByClient`, etc.
- Created shared components in `src/components/sltt/`:
  - `status-badge.tsx`: `ToneBadge` (tones: blue/emerald/amber/red/indigo/slate),
    `DossierStatutBadge`, `EcritureStatutBadge`, `StockStatutBadge`, `EcartValue`.
  - `kpi-card.tsx`: `KpiCard` (label, value, icon, tone, variation, variationLabel, sublabel).
  - `page-header.tsx`: `PageHeader` (title, description, children for actions).
- Created layout in `src/components/sltt/layout/`:
  - `sidebar.tsx`: fixed 250px left nav (Sidebar) + MobileNav (horizontal scroll, lg:hidden).
    Menu items: Tableau de bord, Dossiers de transit, Comptabilité, Entreposage, Bons de sortie,
    Clients, Bilans & rapports, Paramètres. User profile "Amadou T." at bottom.
  - `topbar.tsx`: sticky top bar with page title/subtitle, global search input, notifications
    dropdown (Bell with red dot), avatar dropdown with logout.
  - `app-shell.tsx`: `AppShell` combining Sidebar + MobileNav + Topbar + main content (max-w-7xl)
    + sticky AppFooter (mt-auto). Renders the active screen based on `useNav().view`.

Stage Summary:
- Design system is FIXED. All screens MUST use these tokens and shared components.
- Navigation is client-side via Zustand `useNav`. NO Next.js routes other than `/`.
- AppRoot (in page.tsx) will toggle between LoginScreen and AppShell based on `isAuthenticated`.
- Screen files go in `src/components/sltt/screens/`. Each is a named export, e.g.
  `export function DashboardScreen()`.
- All UI text in FRENCH. All money in FCFA with `formatFCFA()`. Numbers use `tabular-nums`.
- Each screen receives NO props; it reads data from mock-data and navigation from `useNav`.

=== SHARED COMPONENT API REFERENCE (for screen builders) ===

`import { KpiCard } from "@/components/sltt/kpi-card"`
  <KpiCard label="..." value="8 750 000 FCFA" icon={Wallet} tone="blue"
    variation={12} variationLabel="vs mois dernier" />

`import { PageHeader } from "@/components/sltt/page-header"`
  <PageHeader title="..." description="...">
    <Button>...</Button>
  </PageHeader>

`import { ToneBadge, DossierStatutBadge, EcritureStatutBadge, StockStatutBadge, EcartValue } from "@/components/sltt/status-badge"`

shadcn/ui available: Button, Card, Input, Label, Select, Table (Table/TableHeader/TableBody/TableRow/TableHead/TableCell),
  Tabs (Tabs/TabsList/TabsTrigger/TabsContent), Badge, Avatar, DropdownMenu, Dialog, Sheet (side panel),
  Checkbox, Switch, Separator, ScrollArea, Tooltip, Pagination, Progress, Textarea, Sheet.

Icons: `import { ... } from "lucide-react"`.

Charts: `recharts` is installed (AreaChart, BarChart, LineChart, PieChart, ResponsiveContainer, etc.).
  Use SLTT chart colors: blue #1E40AF, emerald #059669, amber #D97706, indigo #4F46E5, red #DC2626.

Mock data: `import { ... } from "@/lib/mock-data"` (see file for all exports).

Format helpers: `import { formatFCFA, formatFCFACompact, formatDate, formatDateShort } from "@/lib/format"`.

Nav: `import { useNav } from "@/lib/nav-store"`. Use `go("dossiers")`, `openDossier(id, "edit")`,
  `openClient(id)`, `openDossier(null, "create")` for new dossier.

STYLE RULES (NON-NEGOTIABLE):
- Light theme only. Never use dark: classes. Background of content area is bg-background (#F8FAFC).
- Cards: `<Card className="p-5 shadow-sm border-border/80">` or similar. Rounded-lg/xl.
- Page padding handled by AppShell main (p-4 sm:p-6 lg:p-8). Screens start at the PageHeader.
- Tables: use shadcn Table. Header row `bg-slate-50 text-xs text-slate-500 font-medium uppercase`.
  Body rows `hover:bg-slate-50/60 border-b border-border`. Money cells `text-right tabular-nums`.
- Buttons: primary `<Button>` (blue), secondary `<Button variant="outline">`, danger `<Button variant="destructive">`.
- Spacing: use gap-4 / gap-6 between cards, space-y-6 between sections.
- Sticky footer is handled by AppShell. Screens should NOT add their own footer.

---
Task ID: 5
Agent: full-stack-developer (Dashboard)
Task: Build the Dashboard (Tableau de bord) screen

Work Log:
- Read worklog.md fully to lock in design tokens, shared component APIs, and mock-data shapes.
- Inspected `kpi-card.tsx`, `page-header.tsx`, `status-badge.tsx`, `nav-store.ts`, `mock-data.ts`, `format.ts` for exact prop signatures and field names.
- Confirmed `recharts@2.15.4` and `zustand@5` are present in `package.json`.
- Created `/home/z/my-project/src/components/sltt/screens/dashboard.tsx` (client component) with the `DashboardScreen` named export.
- Implemented the 4-block layout required by the spec:
  1. PageHeader with "Janvier 2026" period chip + RefreshCw icon button on the right.
  2. Row of 4 KpiCards (Chiffre encaissé / Total restes à payer / Dossiers en cours / Valeur du stock) with the exact tones, icons and sublabels.
  3. Charts row (lg:grid-cols-2): blue AreaChart "Encaissements par mois" with gradient fill + colored BarChart "Écarts par période" (emerald for positive, red for negative via Cell). Both wrapped in p-5 shadow-sm rounded-xl Cards, ResponsiveContainer height 280, Y-axis ticks formatted via formatFCFACompact, custom white rounded-lg tooltips using formatFCFA.
  4. Blocks row (lg:grid-cols-3): "Derniers dossiers" table (lg:col-span-2) with first 6 dossiers using montantInvesti + DossierStatutBadge + right-aligned tabular-nums FCFA, footer "Voir tout" button calling `go("dossiers")`; "Alertes" card (lg:col-span-1) with max-h-[360px] overflow-y-auto sltt-scroll list, red AlertTriangle for danger, amber AlertCircle for warning, divide-y divide-border separators.
- Followed all NON-NEGOTIABLE style rules: light theme only, French text, tabular-nums for numbers, SLTT colors (#1E40AF / #059669 / #D97706 / #DC2626), space-y-6 between sections, no footer, no page padding (AppShell handles it).

Stage Summary:
- File created: `src/components/sltt/screens/dashboard.tsx` (single file, named export `DashboardScreen`).
- Key decisions: used recharts `<defs>` linear gradient for the area fill (0.25 → 0.02 opacity) for a softer look; built two custom Tooltip components instead of the default recharts tooltip to keep the FCFA formatting and white rounded-lg shadow-md style consistent with the design system; left the refresh button as a visual-only outline icon button (no action) per spec; alert icon wrapper uses the same tone-bg pattern as KpiCard for visual consistency.
- All imports verified against existing files (`KpiCard`, `PageHeader`, `DossierStatutBadge`, `useNav`, `formatFCFA`, `formatFCFACompact`, mock data: `dossiers`, `alertes`, `encaissementsParMois`, `ecartsParPeriode`).
- Did NOT run dev server or lint — orchestrator handles that.

---
Task ID: 10-11
Agent: full-stack-developer (Entreposage + Bons)
Task: Build Entreposage + Bons de sortie screens

Work Log:
- Read worklog.md and inspected shared components (PageHeader, KpiCard, ToneBadge,
  StockStatutBadge), mock-data (stock, mouvements, bonsSortie, clients), format
  helpers (formatFCFA, formatDateShort), and shadcn primitives (Card, Button,
  Table, Tabs, Dialog, Select, Input, Label, Badge).
- Created `src/components/sltt/screens/entreposage.tsx` exporting `EntreposageScreen`:
  - PageHeader with two outline action buttons (Entrée emerald-toned, Sortie amber-toned)
    wired to toasts.
  - Row of 4 KPI cards (Articles en stock / Valeur du stock / Mouvements ce mois /
    Alertes stock faible) computed from mock data.
  - Tabs: "Stock" (default) and "Historique des mouvements".
  - Stock tab: Card+Table with 9 columns; low-stock rows get bg-red-50/40 and an
    AlertTriangle icon next to the marchandise name; Statut via StockStatutBadge;
    3 ghost icon actions (PackagePlus / PackageMinus / History).
  - Historique tab: Card+Table with Date / Type badge (ToneBadge emerald/amber with
    ArrowDownToLine / ArrowUpFromLine) / Marchandise / Quantité / Responsable /
    Bon lié (mono link if present, else —).
- Created `src/components/sltt/screens/bons.tsx` exporting `BonsScreen`:
  - PageHeader with primary Button "+ Nouveau bon de sortie" opening a Dialog.
  - Filter bar Card: search Input (ref/client), Select "Client", Select "Motif"
    (Tous/Vente/Livraison/Transfert), date Input. Client-side filtering via useMemo.
  - List Card+Table with 8 columns (Référence mono / Date / Client / Motif ToneBadge
    blue|indigo|amber / Quantité / Montant formatFCFA / Statut ToneBadge
    emerald|slate / actions Eye+FileText). Empty-state row when no match.
  - Creation Dialog (controlled, sm:max-w-3xl/4xl):
    - Title + greyed "BS-2026-0052" reference badge.
    - grid grid-cols-1 md:grid-cols-2 gap-6: form (left) + printable preview (right,
      hidden on small screens).
    - Form fields (Label above, space-y-4): Date, Client (Select), Marchandise
      (Select showing "{marchandise} (stock : {quantite} {unite})"), Quantité à
      sortir (number, with red error message when > stock disponible), Motif
      (Select Vente/Livraison/Transfert), Montant (number with FCFA suffix).
    - Preview: white card border-2 border-dashed border-slate-200, p-6 — Truck logo
      box + SLTT name, centered "BON DE SORTIE" title + reference, mini table
      (Date/Client/Marchandise/Quantité/Motif/Montant) live from form state,
      signature line at bottom.
    - DialogFooter: outline "Annuler" (X icon) + primary "Valider le bon" (Check)
      disabled when quantity exceeds stock or required fields missing; on validate,
      toast "Bon de sortie validé — stock décrémenté." then closes + resets form.
- Followed all style rules: light theme only, French throughout, formatFCFA /
  tabular-nums for money, Cards `p-5 shadow-sm border-border/80` (p-4 for the
  filter bar, p-0 for tables wrapped in overflow-hidden Cards), space-y-6 sections,
  no footer / no page padding (handled by AppShell), responsive grids.
- Did NOT touch any other file (AppShell already imports both screens).

Stage Summary:
- Files created:
  - `src/components/sltt/screens/entreposage.tsx` (EntreposageScreen)
  - `src/components/sltt/screens/bons.tsx` (BonsScreen)
- Key decisions:
  - Used controlled Dialog (open state) so we can close + reset after validation.
  - Validation: validate button disabled if quantite > stockDisponible OR any of
    (client, marchandise, motif) missing OR quantite <= 0.
  - Low-stock visual: bg-red-50/40 on row + red AlertTriangle next to marchandise.
  - Bon preview built as a small reusable BonPreview component using Tailwind
    border-dashed to look like a document, fed live by form state.
  - All actions (view/print/entry/exit) are demo toasts per the visual-only spec.

---
Task ID: 8-9
Agent: full-stack-developer (Comptabilité + Bilans)
Task: Build Comptabilité + Bilans screens

Work Log:
- Read worklog.md and all referenced shared components (KpiCard, PageHeader, status-badge, format helpers, mock-data) to align with the existing design system.
- Read shadcn primitives actually in the repo (Sheet, Select, Tabs, Table, Card, Badge, Button) to confirm exact prop APIs (SheetContent side + className override, Tabs onValueChange, TableFooter styling, Card default `flex flex-col gap-6 py-6`).
- Created `src/components/sltt/screens/comptabilite.tsx`:
  - PageHeader with primary "Nouvelle écriture" button (Plus).
  - 3 KPI cards: Total investi (blue, TrendingUp, sublabel "Cumul des dossiers"), Total encaissé (emerald, Wallet, variation=12 "vs période préc."), Total dû (amber, Clock, sublabel "Restes à encaisser"). Values summed from `ecritures` via useMemo on a local `rows` copy (so payment updates reflect visually).
  - Card "Écritures comptables" + count Badge (secondary/slate). Table columns: Date (formatDateShort), Client (font-medium slate-700), Montant investi (right tabular-nums), Montant payé (right tabular-nums emerald), Reste à payer (right tabular-nums amber font-medium), Écart (EcartValue of payé - investi), Mode (icon + label — Banknote/ArrowLeftRight/Smartphone/CreditCard), Statut (EcritureStatutBadge "Soldé" if reste===0 else "En attente"), Actions ("Enregistrer un paiement" outline sm button with HandCoins, only when reste>0).
  - Payment Sheet (side="right", width sm:max-w-md, full-height flex layout with header / scrollable body / footer). Pre-fills montant with reste, mode with the ecriture's current mode, date with today, note with existing note. Shows a recap mini-card (investi / déjà payé / reste). Footer: outline "Annuler" + primary "Valider le paiement" (Wallet icon). On validate: updates local `rows` state (caps montantPaye at montantInvesti), fires `toast({ title: "Paiement enregistré", description: "Le solde a été mis à jour." })`, closes sheet.
- Created `src/components/sltt/screens/bilans.tsx`:
  - PageHeader with two outline export buttons (FileText PDF, FileSpreadsheet Excel).
  - Period selector Card: shadcn Tabs (Mensuel/Trimestriel/Semestriel/Annuel) + Input type="month" on the right (responsive flex-col → flex-row).
  - Synthesis banner: 4 KPI cards (investi blue/TrendingUp, encaissé emerald/Wallet, dû amber/Clock, écart global indigo/Scale). Values summed from `evolutionEncaissements`.
  - Main chart Card: recharts LineChart over `evolutionEncaissements` with two series — investi (blue #1E40AF) and encaissé (emerald #059669). CartesianGrid dashed #E2E8F0 (vertical=false), XAxis (periode), YAxis (formatFCFACompact), custom white rounded-lg shadow-md bordered Tooltip formatting with formatFCFA, Legend (iconType circle). Height 320 (h-80). ResponsiveContainer.
  - Two-block grid (lg:grid-cols-3): left col-span-2 Card "Récapitulatif par client" with Table (Client / Investi / Encaissé / Reste / Écart via EcartValue) + TableFooter Total row in bold (bg-slate-50) summing each column. Right col-span-1 Card "Répartition" with recharts PieChart donut (innerRadius 58, outerRadius 86, two slices emerald + amber), absolutely-centered total label, custom PieTooltip, legend below with values + percentages.
- Used SLTT chart colors (#1E40AF, #059669, #D97706, #4F46E5). All money via formatFCFA / formatFCFACompact, all axis/totals with tabular-nums. Section spacing space-y-6, no footer/page padding (AppShell handles it).

Stage Summary:
- Files created (only these two):
  - `src/components/sltt/screens/comptabilite.tsx` — exports `ComptabiliteScreen`
  - `src/components/sltt/screens/bilans.tsx` — exports `BilansScreen`
- Key decisions:
  - Comptabilité uses a local `rows` state seeded from `ecritures` so the payment Sheet can visually update `montantPaye`/`statut` without a backend; values recompute via useMemo.
  - Écart column in the comptabilité table follows the spec: `EcartValue` of (payé - investi) so positive = surplus/good, negative = reste to recover, 0 = soldé.
  - Bilans Sheet width overridden via tailwind-merge (`sm:max-w-md` wins over the default `sm:max-w-sm`) for a comfortable payment form.
  - Pie donut center label uses an absolutely-positioned overlay (pointer-events-none) because recharts has no built-in center label primitive.
  - No backend / API routes / state mutation beyond the local component state — pure visual.

---
Task ID: 6-7
Agent: full-stack-developer (Dossiers)
Task: Build Dossiers list + Dossier form screens

Work Log:
- Read worklog.md, nav-store.ts, mock-data.ts, format.ts, status-badge.tsx, page-header.tsx and
  shadcn ui primitives (Button, Card, Input, Label, Select, Table, Textarea, Separator) to align
  with the shared design system.
- Created `src/components/sltt/screens/dossiers-list.tsx` exporting `DossiersListScreen`:
  - PageHeader ("Dossiers de transit" / "Suivi des dossiers douaniers et de leur soldage") +
    primary "+ Nouveau dossier" button wired to `useNav().openDossier(null, "create")`.
  - Filter Card (p-4, flex flex-wrap gap-3): Search Input (Search icon, w-full sm:w-64),
    Selects Client / Statut / Période + two outline export buttons (FileText / FileSpreadsheet).
    Real client-side filtering via useState + useMemo (search by ref/client/BL/camion/nature,
    client filter, statut filter, période 31j / 92j from a 2026-01-10 mock "today").
  - Data table Card (overflow-hidden p-0 gap-0) with shadcn Table. Header row uses
    bg-slate-50 text-xs text-slate-500 font-medium uppercase tracking-wide. Columns: Référence,
    Client (truncate max-w-[200px]), N° BL & N° camion (font-mono text-xs), Nature marchandise,
    Frais prestation (right tabular-nums, formatFCFA), Écart (EcartValue + calculerEcart(d)),
    Statut (DossierStatutBadge), Actions (Eye / Pencil / FileText ghost icon buttons calling
    openDossier(d.id, "edit")). Empty state row when no results.
  - Pagination footer (border-t, flex justify-between): "1–{filtered.length} sur {dossiers.length}"
    on the left; prev/next ChevronLeft/ChevronRight outline icon buttons + page number buttons
    (page 1 active = default primary variant) on the right.
- Created `src/components/sltt/screens/dossier-form.tsx` exporting `DossierFormScreen`:
  - Reads `useNav()` for selectedId & dossierFormMode. Edit mode loads dossier via
    getDossierById(selectedId); if not found, renders an "Dossier introuvable" empty state with
    an ArrowLeft back button.
  - Create mode starts empty; reference badge auto-set to "SLTT-TR-2026-0043" (greyed,
    bg-slate-100 text-slate-500 font-mono, displayed readOnly).
  - useState for: clientId, nature, bl, camion, date, droitDouane, fraisCircuit,
    fraisPrestation, montantInvesti, statut, notes. useEffect re-syncs form state when
    selectedId / dossierFormMode changes (defensive against React keeping the component
    mounted across create<->edit transitions).
  - Live calculations via useMemo: ecart = fraisPrestation − (droitDouane + fraisCircuit);
    reste = max(0, montantInvesti − montantPaye). (montantPaye pre-filled from existing dossier,
    0 in create mode.)
  - Layout: grid grid-cols-1 lg:grid-cols-3 gap-6.
    • Left main column (lg:col-span-2, space-y-6): back button (ghost ArrowLeft → go("dossiers")),
      header row (title + reference badge + DossierStatutBadge + Annuler / Enregistrer buttons),
      then three section Cards — "Informations générales" (Client Select, Nature, N° BL, N° camion,
      Date), "Montants (FCFA)" (4 amount inputs + full-width highlighted Écart box, green when
      >= 0, red when < 0, with formula caption), "Suivi" (Statut Select + Notes Textarea).
    • Right column (lg:col-span-1): sticky (`lg:sticky lg:top-24`) "Récapitulatif" Card with
      divide-y list (Frais prestation, Montant investi, Reste à payer highlighted amber) + big
      bold colored Écart + Save & "Générer le PDF" buttons. Save triggers
      `useToast().toast({ title: "Succès", description: "Dossier enregistré avec succès" })`
      then `go("dossiers")`.
  - Reusable sub-components (file-local): SectionTitle (icon in colored rounded box + title +
    optional description), Field (Label + control), AmountField (right-aligned tabular-nums Input
    with absolute "FCFA" hint), SummaryRow (label / value with optional amber tone).
- Style compliance: light theme only, French throughout, formatFCFA for money, tabular-nums on
  numeric cells, Cards `p-5 shadow-sm border-border/80`, inputs h-10, labels
  text-sm font-medium text-slate-700 mb-1.5, lucide icons only (ArrowLeft, Plus, Save, FileText,
  Pencil, Eye, Search, FileSpreadsheet, Info, Wallet, FolderKanban, ListChecks). No footer / no
  page padding (handled by AppShell). Only the two screen files were touched.

Stage Summary:
- Files created:
  • `src/components/sltt/screens/dossiers-list.tsx` — `DossiersListScreen` (filter bar + table + pagination).
  • `src/components/sltt/screens/dossier-form.tsx` — `DossierFormScreen` (create/edit form with
    live ecart + sticky récapitulatif + toast on save).
- Key decisions:
  • Écart formula implemented as `fraisPrestation − (droitDouane + fraisCircuit)` (per spec and
    matching the mock-data `calculerEcart` helper) — NOT `fraisPrestation − montantInvesti` (the
    helper's docstring is misleading; the code in `calculerEcart` is authoritative).
  • Form uses string state for amount inputs (parsed via `parseAmount`) to keep editing natural
    while feeding useMemo numeric values.
  • Sticky summary panel uses `lg:sticky lg:top-24` so it stays visible while scrolling the
    longer left column.
  • Page 1 is shown as active in the list pagination using the default (primary) Button variant;
    page 2 uses outline variant. Pagination is visual-only (no real pagination of mock data).
  • Période filter computed relative to a fixed "today" of 2026-01-10 to match the mock data
    timeline (latest dossier dated 2026-01-08).
- No backend, no API routes, no other files modified.

---
Task ID: 12-14
Agent: full-stack-developer (Clients + Paramètres)
Task: Build Clients list + Client fiche + Paramètres screens

Work Log:
- Read worklog.md (foundation + style rules + Dashboard/Entreposage/Bons/Comptabilité/Bilans/Dossiers sections) to align on the design system: tokens, KpiCard, PageHeader, ToneBadge family, nav-store, mock-data helpers, format helpers.
- Read mock-data.ts to confirm shape of clients (7), users (5), dossiers, ecritures, bonsSortie and helpers getClientById / getDossiersByClient / getEcrituresByClient / getBonsByClient.
- Created `src/components/sltt/screens/clients.tsx` (ClientsScreen):
  - PageHeader "Clients" + primary "+ Nouveau client" (UserPlus).
  - Search Card with controlled Input (Search icon, placeholder "Rechercher par nom, téléphone, e-mail…", w-full sm:w-96), client-side filter over nom/téléphone/e-mail/adresse via useState + useMemo.
  - Clients table (Card p-0 overflow-hidden). Header bg-slate-50 uppercase text-xs text-slate-500. Columns: Nom (clickable button → openClient), Type (ToneBadge blue/slate), Téléphone (font-mono text-xs), Adresse (truncate max-w-[220px]), Nb dossiers (center tabular-nums), Total dû (right tabular-nums — amber font-medium if >0 else slate "—"), Actions (ghost icon buttons Eye→openClient, Pencil).
  - Rows hover:bg-slate-50/60 border-b border-border. Empty-state row when filter returns nothing.
- Created `src/components/sltt/screens/client-fiche.tsx` (ClientFicheScreen):
  - Reads useNav().selectedId; loads client via getClientById. Not found → ghost "← Retour aux clients" + "Client introuvable" Card.
  - Back button (go("clients")), then client header Card (p-6): avatar (initials, gradient blue-600→blue-800), name (text-xl font-bold), ToneBadge type, contact info (Phone/Mail/MapPin, mono téléphone). Right: outline "Modifier la fiche" (Pencil) + primary "Nouveau dossier pour ce client" (Plus → openDossier(null, "create")).
  - 3 KpiCards (sm:grid-cols-3): Total dossiers (FolderKanban, blue), Total payé (Wallet, emerald, formatFCFA), Reste à payer (Clock, amber, formatFCFA).
  - Tabs (Dossiers / Paiements / Bons de sortie) with count chips. Each tab is a Card with a header row (title + count) + Table or centered "Aucun enregistrement" empty state.
    - Dossiers: Référence, Date (formatDateShort), N° BL (mono), Statut (DossierStatutBadge), Montant (formatFCFA).
    - Paiements: Date, Montant investi, Montant payé (emerald), Reste à payer (amber or "—", via resteAPayer), Mode, Statut (EcritureStatutBadge — derived: montantPaye >= montantInvesti ? "Soldé" : "En attente").
    - Bons: Référence, Date, Marchandise, Quantité (with unit), Motif (ToneBadge — Vente blue / Livraison emerald / Transfert indigo), Montant, Statut (ToneBadge — Validé emerald / Brouillon amber).
- Created `src/components/sltt/screens/parametres.tsx` (ParametresScreen):
  - Two-column layout grid-cols-1 lg:grid-cols-4 gap-6.
  - Left sidebar (Card p-2, lg:col-span-1, h-fit): custom vertical nav with 4 buttons (Users/User/Shield/Globe icons). Active item: bg-sidebar-accent text-primary font-medium. State via useState<ParamTab>.
  - Right (lg:col-span-3): conditional render of the active sub-component.
  - UsersTab: header "Utilisateurs" + "+ Ajouter un utilisateur" (UserPlus) opens a controlled Sheet (side=right, max-w-md). Users table with avatar initials circle, e-mail, Rôle ToneBadge (Administrateur red / Agent de transit blue / Comptable emerald / Magasinier amber / Commercial indigo), Statut ToneBadge (Actif emerald / Inactif slate), Dernière connexion (formatDateShort), actions (Pencil, MoreHorizontal). Add-user Sheet form: Nom, E-mail, Rôle (Select over allRoles), "Code d'accès" (readonly Input, 6-char code, RefreshCw button regenerates), permissions Checkboxes (6 modules in 2-col grid). Footer: outline "Annuler" + primary "Créer le compte" → toast "Utilisateur créé" then close.
  - ProfileTab: Card form with avatar (AT), Nom, E-mail, Téléphone, Poste (2-col grid). Submit → toast.
  - SecurityTab: Card "Mot de passe" (3 inputs + Mettre à jour), Card "Préférences de sécurité" (Switch auto-logout checked + Switch 2FA unchecked, with description), Card "Journal des connexions" (table Date/Utilisateur/Adresse IP/Appareil, 4 static rows).
  - PreferencesTab: Card form — Select Langue (Français), Select Format de date (JJ/MM/AAAA), Select Devise (FCFA), Switch "Notifications par e-mail" (checked). Submit → toast.
- All French copy, light theme only, no footer added, money via formatFCFA, tabular-nums on numbers, gradient blue avatars for client/user initials. No backend / no API routes.

Stage Summary:
- Files created:
  - `src/components/sltt/screens/clients.tsx` → ClientsScreen
  - `src/components/sltt/screens/client-fiche.tsx` → ClientFicheScreen
  - `src/components/sltt/screens/parametres.tsx` → ParametresScreen (with UsersTab/ProfileTab/SecurityTab/PreferencesTab sub-components)
- Key decisions:
  - Client filtering uses useState + useMemo over nom/telephone/email/adresse.
  - EcritureStatut is derived (montantPaye >= montantInvesti → "Soldé") since the Ecriture interface has no statut field.
  - Paramètres uses a custom vertical sidebar (buttons + useState) instead of shadcn vertical Tabs for simpler styling control with bg-sidebar-accent token.
  - Add-user Sheet is controlled (open/onOpenChange) so the parent "Ajouter un utilisateur" button can open it without a SheetTrigger.
  - Used `cn` for conditional class composition on the sidebar nav.
  - Only the lucide icons actually used were imported (removed unused Briefcase/Mail/Phone from parametres imports to keep it lint-clean).
- No dev server or lint run per instructions.

---
Task ID: FINAL
Agent: main (orchestrator)
Task: Wire up, verify, and launch

Work Log:
- Created AppRoot (src/components/sltt/app-root.tsx) toggling LoginScreen / AppShell via useNav().isAuthenticated.
- Updated src/app/page.tsx to render <AppRoot />.
- Fixed bug in client-fiche.tsx: `resteAPayer` was imported from @/lib/format but lives in @/lib/mock-data. Corrected import.
- Removed unused eslint-disable directive in dossier-form.tsx (lint now fully clean: 0 errors, 0 warnings).
- Started dev server (next dev -p 3000). All screens compile and render with HTTP 200.
- Agent Browser end-to-end verification (all passed, ZERO console errors):
  * Login page renders (split layout, blue gradient + form, all fields).
  * "Se connecter" click -> Dashboard (sidebar, 4 KPIs, area+bar charts, dossiers table, alerts).
  * Dossiers list (filters, 9-col table, pagination, export buttons).
  * Dossier form create (Informations générales, Montants FCFA with auto-écart, Suivi, sticky Récapitulatif).
  * Comptabilité (3 KPIs, entries table, payment Sheet panel with pre-filled montant/note/mode).
  * Entreposage (4 KPIs, stock table with low-stock highlights, movements history tab).
  * Bons de sortie (list, creation Dialog with stock validation + printable preview, Valider disabled until valid).
  * Clients list -> Client fiche (tabs: Dossiers/Paiements/Bons with counts).
  * Bilans & rapports (period tabs, 4 synthesis KPIs, evolution line chart, recap table, donut).
  * Paramètres (vertical tabs: Utilisateurs & rôles, Mon profil, Sécurité, Préférences).
- VLM visual verification confirmed dashboard + login match all design spec requirements
  (blue primary #1E40AF, light theme, Inter/Sora fonts, FCFA formatting, French text, sidebar nav, KPI cards, charts).

Stage Summary:
- Application is COMPLETE and FULLY FUNCTIONAL (frontend only, mock data).
- 11 screen files + 4 layout/shared files + 3 lib files + layout/globals/page updates.
- Lint: 0 errors, 0 warnings. Runtime: 0 console errors across all screens.
- Dev server running on port 3000 for preview.
