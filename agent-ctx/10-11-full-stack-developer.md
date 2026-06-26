# Task ID: 10-11 — full-stack-developer (Entreposage + Bons)

## Scope
Build two SLTT screens (pure frontend, mock data, client state only):
1. `src/components/sltt/screens/entreposage.tsx` — `EntreposageScreen`
2. `src/components/sltt/screens/bons.tsx` — `BonsScreen`

## Files Created
- `src/components/sltt/screens/entreposage.tsx`
- `src/components/sltt/screens/bons.tsx`

## Work Log
- Read worklog.md fully + inspected shared components (PageHeader, KpiCard,
  ToneBadge, StockStatutBadge), mock-data exports (stock, mouvements, bonsSortie,
  clients, BonMotif), format helpers (formatFCFA, formatDateShort), and shadcn
  primitives (Card, Button, Input, Label, Select, Table, Tabs, Dialog, Badge).
- EntreposageScreen:
  - PageHeader with two outline buttons (Entrée emerald, Sortie amber) → toasts.
  - 4 KPI cards computed from mock data (articles, valeur stock, mouvements, alertes).
  - Tabs "Stock" (default) / "Historique des mouvements".
  - Stock tab: 9-column table; low-stock rows get bg-red-50/40 + red AlertTriangle
    next to marchandise name; StockStatutBadge for statut; 3 ghost icon actions.
  - Historique tab: 6-column table; ToneBadge (emerald/amber) with ArrowDownToLine
    / ArrowUpFromLine for Entrée/Sortie; Bon lié as mono link if present.
- BonsScreen:
  - PageHeader with primary button opening controlled Dialog.
  - Filter bar Card: search Input, Select Client, Select Motif, date Input —
    client-side useMemo filtering.
  - List Card+Table: 8 columns (Référence mono / Date / Client / Motif ToneBadge /
    Quantité / Montant formatFCFA / Statut ToneBadge / actions Eye + FileText).
    Empty-state row.
  - Creation Dialog (sm:max-w-3xl/lg:max-w-4xl): grid grid-cols-1 md:grid-cols-2
    gap-6 → form (left) + BonPreview (right, hidden on small screens).
  - Form: Date / Client Select / Marchandise Select (shows stock) / Quantité
    number with red error when > stock / Motif Select / Montant number with FCFA
    suffix.
  - BonPreview: white card border-2 border-dashed border-slate-200, p-6 — Truck
    logo + SLTT name, centered "BON DE SORTIE" + reference, mini live table
    (Date/Client/Marchandise/Quantité/Motif/Montant), signature line.
  - DialogFooter: outline Annuler + primary Valider (Check). Validate disabled
    when quantite > stock or required fields missing or quantite <= 0. On
    validate: toast "Bon de sortie validé — stock décrémenté." then close + reset.
- Style rules respected: light theme only, French, formatFCFA + tabular-nums,
  Cards `p-5 shadow-sm border-border/80` (p-4 filter bar, p-0 tables in
  overflow-hidden), space-y-6 sections, no footer/page padding, responsive.

## Stage Summary
- 2 files created. AppShell already imports both screens; no other file touched.
- Validation UX is the central interaction in Bons: red error message + disabled
  validate button when the entered quantity exceeds the available stock.
- BonPreview is a self-contained sub-component driven by the live form state so
  the user sees a real document preview as they type.
