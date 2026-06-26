# Task 6-7 — full-stack-developer (Dossiers)

## Scope
Build two pure-frontend screens for the SLTT logistics app:
1. `DossiersListScreen` — transit dossiers list with filters, table, pagination.
2. `DossierFormScreen` — create/edit dossier form with live ecart calculation + sticky récapitulatif.

## Files created
- `/home/z/my-project/src/components/sltt/screens/dossiers-list.tsx`
- `/home/z/my-project/src/components/sltt/screens/dossier-form.tsx`

No other files modified. No backend, no API routes. Mock data + client-side state only.

## What was read first
- `worklog.md` (design system, shared component APIs, style rules — non-negotiable).
- `src/lib/nav-store.ts` — `useNav` API (view, selectedId, dossierFormMode, go, openDossier).
- `src/lib/mock-data.ts` — `dossiers`, `clients`, `getDossierById`, `calculerEcart`,
  `resteAPayer`, types.
- `src/lib/format.ts` — `formatFCFA`, `parseAmount`.
- `src/components/sltt/status-badge.tsx` — `DossierStatutBadge`, `EcartValue`.
- `src/components/sltt/page-header.tsx` — `PageHeader`.
- shadcn primitives: Button, Card, Input, Label, Select, Table, Textarea, Separator.
- `src/hooks/use-toast.ts` — `useToast`.

## Key implementation notes
- Écart formula = `fraisPrestation − (droitDouane + fraisCircuit)` — follows the actual code in
  `calculerEcart` from mock-data (the docstring above it is misleading). The form recomputes it
  via `useMemo` from string-backed inputs parsed with `parseAmount`.
- `Reste à payer` = `max(0, montantInvesti − montantPaye)`. `montantPaye` is taken from the
  existing dossier in edit mode, 0 in create mode.
- Form state is string-backed for amount fields (natural editing) and re-synced in a
  `useEffect` watching `[selectedId, dossierFormMode]` so create↔edit transitions work even if
  React keeps the component mounted.
- Edit mode + missing dossier → dedicated "Dossier introuvable" empty state with a back button
  (no crash).
- Reference is auto-generated `SLTT-TR-2026-0043` in create mode and shown as a greyed
  `bg-slate-100 text-slate-500 font-mono` readOnly badge.
- Save (header button + récapitulatif button) → `toast({ title: "Succès", description:
  "Dossier enregistré avec succès" })` then `go("dossiers")`.
- Sticky right-column récapitulatif uses `lg:sticky lg:top-24`.
- Filter bar: real client-side filtering via `useState` + `useMemo` (search across
  ref/client/BL/camion/nature; client Select; statut Select; période 31j/92j from a fixed
  2026-01-10 mock "today" that aligns with the latest mock dossier date 2026-01-08).
- Export buttons (PDF / Excel) and PDF action icon are visual-only (no backend).
- Pagination is visual-only (page 1 active = default primary variant, page 2 outline).
- All French, all money via `formatFCFA`, `tabular-nums` on numeric cells, Cards
  `p-5 shadow-sm border-border/80`, inputs `h-10`, labels
  `text-sm font-medium text-slate-700 mb-1.5`, lucide icons only. No footer / no page padding.

## Icons used
ArrowLeft, Plus, Save, FileText, Pencil, Eye, Search, FileSpreadsheet, Info, Wallet,
FolderKanban, ListChecks, ChevronLeft, ChevronRight.

## Compliance checklist
- [x] "use client" on both files.
- [x] Only the two requested files were created/modified.
- [x] Light theme only (no `dark:` classes).
- [x] No indigo/blue primary misuse beyond the design system tokens.
- [x] AppShell handles footer/padding — screens don't add their own.
- [x] Worklog appended (not overwritten).
- [x] No dev server / lint runs.
