"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Wallet,
  Clock,
  TrendingUp,
  Percent,
  FileText,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { formatFCFA, formatFCFACompact, formatDateShort, parseLocalDate } from "@/lib/format";
import { exportToCSV, printHTML, htmlEscape } from "@/lib/export";
import { resolvePrintHTMLBrand } from "@/lib/societe-brand";
import { filterBySocieteAndPeriode, computeBenefice } from "@/lib/benefice";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { EcartValue } from "@/components/sltt/status-badge";
import { GlossaryLabel } from "@/components/sltt/glossary-label";
import { SocieteFilterSelect } from "@/components/sltt/societe-filter-select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CHART_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Periode = "mensuel" | "trimestriel" | "semestriel" | "annuel";
type SortKey = "client" | "investi" | "encaisse" | "reste" | "ecart";
type SortDir = "asc" | "desc";

const periodes: { value: Periode; label: string }[] = [
  { value: "mensuel", label: "Mensuel" },
  { value: "trimestriel", label: "Trimestriel" },
  { value: "semestriel", label: "Semestriel" },
  { value: "annuel", label: "Annuel" },
];

/** "AAAA-MM" du mois courant — mois par défaut du filtre Bilans (jamais figé dans le passé). */
function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getPeriodeLabel(periode: Periode, mois: string): string {
  const [year, month] = (mois || currentYearMonth()).split("-").map(Number);
  switch (periode) {
    case "mensuel":
      return new Date(year, month - 1).toLocaleString("fr-FR", {
        month: "long",
        year: "numeric",
      });
    case "trimestriel":
      return `T${Math.ceil(month / 3)} ${year}`;
    case "semestriel":
      return `S${month <= 6 ? 1 : 2} ${year}`;
    case "annuel":
      return String(year);
    default:
      return mois;
  }
}

/* ------------------------------------------------------------------ */
/* Tooltips                                                            */
/* ------------------------------------------------------------------ */

interface ChartPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm shadow-md">
      <p className="mb-1.5 font-semibold text-slate-900 dark:text-slate-100">{label}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            <span>{p.name}</span>
            <span className="ml-auto font-medium tabular-nums text-slate-900 dark:text-slate-100">
              {formatFCFA(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PiePayloadItem {
  name: string;
  value: number;
  payload: { name: string; value: number; color: string };
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: PiePayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm shadow-md">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: p.payload.color }} />
        <span className="text-slate-600 dark:text-slate-300">{p.name}</span>
        <span className="ml-auto font-medium tabular-nums text-slate-900 dark:text-slate-100">
          {formatFCFA(p.value)}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sortable table header cell                                          */
/* ------------------------------------------------------------------ */

function SortableHead({
  col,
  label,
  sortKey,
  sortDir,
  onSort,
  align = "right",
}: {
  col: SortKey;
  label: ReactNode;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === col;
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none bg-slate-50 text-xs font-medium uppercase hover:text-slate-900 dark:hover:text-slate-100",
        align === "right" ? "text-right text-slate-500 dark:text-slate-400" : "text-slate-500 dark:text-slate-400",
        active && "text-primary",
      )}
      onClick={() => onSort(col)}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1",
          align === "right" && "w-full justify-end",
        )}
      >
        {align === "left" && <Icon className="size-3 shrink-0" />}
        {label}
        {align === "right" && <Icon className="size-3 shrink-0" />}
      </span>
    </TableHead>
  );
}

/* ------------------------------------------------------------------ */
/* Main screen                                                         */
/* ------------------------------------------------------------------ */

export function BilansScreen() {
  const { toast } = useToast();
  const [periode, setPeriode] = useState<Periode>("mensuel");
  const [mois, setMois] = useState(currentYearMonth);
  const [sortKey, setSortKey] = useState<SortKey>("reste");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const allEcritures = useStore((s) => s.ecritures);
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const factures = useStore((s) => s.factures);
  const depenses = useStore((s) => s.depenses);
  const bonsSortieCaisse = useStore((s) => s.bonsSortieCaisse);
  const selectedSocieteId = useNav((s) => s.selectedSocieteId);

  // F1 : quand une société précise est sélectionnée, les écritures non
  // affectées (transit global) sont exclues des récaps/graphiques de cet écran.
  const ecritures = useMemo(
    () => (selectedSocieteId ? allEcritures.filter((e) => e.societeId === selectedSocieteId) : allEcritures),
    [allEcritures, selectedSocieteId],
  );

  const periodeLabel = getPeriodeLabel(periode, mois);

  const filteredEcritures = useMemo(() => {
    const [year, month] = (mois || currentYearMonth()).split("-").map(Number);
    return ecritures.filter((e) => {
      const d = parseLocalDate(e.date);
      const eYear = d.getFullYear();
      const eMonth = d.getMonth() + 1;
      switch (periode) {
        case "mensuel":
          return eYear === year && eMonth === month;
        case "trimestriel":
          return eYear === year && Math.ceil(eMonth / 3) === Math.ceil(month / 3);
        case "semestriel":
          return eYear === year && (eMonth <= 6) === (month <= 6);
        case "annuel":
          return eYear === year;
        default:
          return true;
      }
    });
  }, [ecritures, mois, periode]);

  // F5 : le Bénéfice compte une écriture au mois où l'argent est réellement
  // arrivé (datePaiement), pas au mois de création de l'écriture.
  const ecrituresAvecDate = useMemo(
    () => allEcritures.map((e) => ({ ...e, date: e.datePaiement ?? e.date })),
    [allEcritures],
  );
  const depensesAvecDate = useMemo(
    () => depenses.map((d) => ({ ...d, date: d.dateDepense })),
    [depenses],
  );
  // Sorties de caisse : chaque bon porte désormais sa propre société (F1).
  const caisseAvecDate = useMemo(
    () =>
      bonsSortieCaisse.flatMap((b) =>
        b.lignes.map((l) => ({ societeId: b.societeId as string | undefined, date: l.date, montant: l.montant })),
      ),
    [bonsSortieCaisse],
  );

  // F5 — Bénéfice sur le mois de référence sélectionné (indépendant de la
  // granularité "période" choisie, qui ne s'applique qu'au récap client).
  const benefice = useMemo(() => {
    const [year, month] = (mois || currentYearMonth()).split("-").map(Number);
    const m = month - 1;
    const computeFor = (societeId: string | null) => {
      const recettes =
        filterBySocieteAndPeriode(ecrituresAvecDate, societeId, year, m).reduce((sum, e) => sum + e.montantPaye, 0) +
        filterBySocieteAndPeriode(factures, societeId, year, m).reduce((sum, f) => sum + f.montantPaye, 0);
      const depensesMois =
        filterBySocieteAndPeriode(depensesAvecDate, societeId, year, m).reduce((sum, d) => sum + d.montant, 0) +
        filterBySocieteAndPeriode(caisseAvecDate, societeId, year, m).reduce((sum, d) => sum + d.montant, 0);
      return { recettes, depenses: depensesMois, benefice: computeBenefice(recettes, depensesMois) };
    };
    return {
      consolide: computeFor(null),
      parSociete: societes.map((s) => ({ societe: s, ...computeFor(s.id) })),
    };
  }, [ecrituresAvecDate, factures, depensesAvecDate, caisseAvecDate, societes, mois]);

  // Le calcul ci-dessus porte toujours sur un seul mois de référence, quelle
  // que soit la granularité "période" choisie (voir commentaire F5 plus haut)
  // — le libellé doit donc toujours nommer ce mois, jamais l'année ou le
  // trimestre sélectionné, sous peine de laisser croire à un chiffre agrégé.
  const beneficeMoisLabel = useMemo(() => {
    const [year, month] = (mois || currentYearMonth()).split("-").map(Number);
    return new Date(year, month - 1).toLocaleString("fr-FR", { month: "long", year: "numeric" });
  }, [mois]);

  const chartData = useMemo(() => {
    const [year] = (mois || currentYearMonth()).split("-").map(Number);
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const monthEcritures = ecritures.filter((e) => {
        const d = parseLocalDate(e.date);
        return d.getFullYear() === year && d.getMonth() + 1 === m;
      });
      return {
        periode: new Date(year, i).toLocaleString("fr-FR", { month: "short" }),
        investi: monthEcritures.reduce((s, e) => s + e.montantInvesti, 0),
        encaisse: monthEcritures.reduce((s, e) => s + e.montantPaye, 0),
      };
    });
  }, [ecritures, mois]);

  const recapParClient = useMemo(() => {
    return clients
      .map((c) => {
        const clientEcritures = filteredEcritures.filter((e) => e.clientId === c.id);
        const investi = clientEcritures.reduce((s, e) => s + e.montantInvesti, 0);
        const encaisse = clientEcritures.reduce((s, e) => s + e.montantPaye, 0);
        const reste = Math.max(0, investi - encaisse);
        const ecart = encaisse - investi;
        return { client: c.nom, investi, encaisse, reste, ecart };
      })
      .filter((r) => r.investi > 0 || r.encaisse > 0);
  }, [clients, filteredEcritures]);

  const recapTotaux = useMemo(
    () =>
      recapParClient.reduce(
        (acc, r) => {
          acc.investi += r.investi;
          acc.encaisse += r.encaisse;
          acc.reste += r.reste;
          acc.ecart += r.ecart;
          return acc;
        },
        { investi: 0, encaisse: 0, reste: 0, ecart: 0 },
      ),
    [recapParClient],
  );

  const tauxRecouvrement =
    recapTotaux.investi > 0
      ? Math.round((recapTotaux.encaisse / recapTotaux.investi) * 100)
      : 0;

  const sortedRecap = useMemo(() => {
    const mult = sortDir === "asc" ? 1 : -1;
    return [...recapParClient].sort((a, b) => {
      if (sortKey === "client") return mult * a.client.localeCompare(b.client, "fr");
      return mult * (a[sortKey] - b[sortKey]);
    });
  }, [recapParClient, sortKey, sortDir]);

  const pieData = [
    { name: "Encaissé", value: recapTotaux.encaisse, color: CHART_COLORS.emerald },
    { name: "Reste à payer", value: recapTotaux.reste, color: CHART_COLORS.amber },
  ];
  const pieTotal = recapTotaux.encaisse + recapTotaux.reste;
  const hasData = recapParClient.length > 0;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "client" ? "asc" : "desc");
    }
  }

  function handleExportExcel() {
    if (recapParClient.length === 0) {
      toast({
        title: "Rien à exporter",
        description: "Aucune écriture pour la période sélectionnée.",
        variant: "destructive",
      });
      return;
    }
    exportToCSV(
      `bilans-${periode}-${mois}`,
      [
        { header: "Client", accessor: (r) => r.client },
        { header: "Investi (FCFA)", accessor: (r) => r.investi },
        { header: "Encaissé (FCFA)", accessor: (r) => r.encaisse },
        { header: "Reste à payer (FCFA)", accessor: (r) => r.reste },
        { header: "Écart de règlement (FCFA)", accessor: (r) => r.ecart },
      ],
      recapParClient,
      { module: "Comptabilité" },
    );
    toast({
      title: "Export Excel généré",
      description: `${recapParClient.length} client${recapParClient.length !== 1 ? "s" : ""} exportés — ${periodeLabel}.`,
    });
  }

  function handleExportPDF() {
    const rowsHTML = recapParClient
      .map(
        (r) => `<tr>
          <td>${htmlEscape(r.client)}</td>
          <td class="num">${formatFCFA(r.investi, false)}</td>
          <td class="num">${formatFCFA(r.encaisse, false)}</td>
          <td class="num">${formatFCFA(r.reste, false)}</td>
          <td class="num">${r.ecart.toLocaleString("fr-FR")}</td>
        </tr>`,
      )
      .join("");
    printHTML(`Bilan ${periodeLabel}`, `
      <h1>Bilan financier — ${periodeLabel}</h1>
      <div class="subtitle">Taux de recouvrement : ${tauxRecouvrement}% · Édité le ${formatDateShort(new Date())}</div>
      <table>
        <thead><tr>
          <th>Client</th><th class="num">Investi</th><th class="num">Encaissé</th>
          <th class="num">Reste à payer</th><th class="num">Écart de règlement</th>
        </tr></thead>
        <tbody>${rowsHTML}</tbody>
        <tfoot><tr class="total-row">
          <td>Total</td>
          <td class="num">${formatFCFA(recapTotaux.investi, false)}</td>
          <td class="num">${formatFCFA(recapTotaux.encaisse, false)}</td>
          <td class="num">${formatFCFA(recapTotaux.reste, false)}</td>
          <td class="num">${recapTotaux.ecart.toLocaleString("fr-FR")}</td>
        </tr></tfoot>
      </table>
    `, resolvePrintHTMLBrand(societes));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bilans périodiques"
        description="Analyse financière par période, basée sur les écritures comptables (hors module Factures)"
      >
        <Button variant="outline" onClick={handleExportPDF} disabled={!hasData}>
          <FileText className="size-4" />
          Exporter PDF
        </Button>
        <Button variant="outline" onClick={handleExportExcel} disabled={!hasData}>
          <FileSpreadsheet className="size-4" />
          Exporter Excel
        </Button>
      </PageHeader>

      {/* Period selector */}
      <Card className="p-4 shadow-sm border-border/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={periode} onValueChange={(v) => setPeriode(v as Periode)}>
            <TabsList>
              {periodes.map((p) => (
                <TabsTrigger key={p.value} value={p.value}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Mois de référence :</span>
            <Input
              type="month"
              value={mois}
              onChange={(e) => setMois(e.target.value)}
              className="w-44"
            />
            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              {periodeLabel}
            </span>
            <SocieteFilterSelect className="w-full sm:w-44" />
          </div>
        </div>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total investi"
          value={formatFCFA(recapTotaux.investi)}
          icon={TrendingUp}
          tone="blue"
          sublabel={periodeLabel}
        />
        <KpiCard
          label="Total encaissé"
          value={formatFCFA(recapTotaux.encaisse)}
          icon={Wallet}
          tone="emerald"
          sublabel={periodeLabel}
        />
        <KpiCard
          label="Total dû"
          value={formatFCFA(recapTotaux.reste)}
          icon={Clock}
          tone="amber"
          sublabel={periodeLabel}
        />
        <KpiCard
          label="Taux de recouvrement"
          value={`${tauxRecouvrement} %`}
          icon={Percent}
          tone={
            recapTotaux.investi === 0
              ? "blue"
              : tauxRecouvrement >= 80
              ? "emerald"
              : tauxRecouvrement >= 50
              ? "amber"
              : "red"
          }
          sublabel={periodeLabel}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Bénéfice entreposage — {beneficeMoisLabel}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label="Toutes sociétés"
            value={formatFCFA(benefice.consolide.benefice)}
            icon={TrendingUp}
            tone={benefice.consolide.benefice >= 0 ? "emerald" : "red"}
            sublabel="Recettes − Dépenses, consolidé"
            tooltip={`Recettes = écritures + paiements factures du mois de référence. Dépenses = dépenses de contrats du mois. Consolidé = somme de toutes les sociétés (${societes.length}) + activité non affectée (transit).`}
          />
          {benefice.parSociete.map(({ societe, benefice: b }) => (
            <KpiCard
              key={societe.id}
              label={societe.nom}
              value={formatFCFA(b)}
              icon={TrendingUp}
              tone={b >= 0 ? "emerald" : "red"}
              sublabel="bénéfice du mois"
            />
          ))}
        </div>
      </div>

      {/* Bar chart — full year overview */}
      <Card className="p-5 shadow-sm border-border/80 gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Évolution des encaissements
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Investi vs encaissé — mois par mois —{" "}
            {(mois || currentYearMonth()).split("-")[0]}
          </p>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              barGap={2}
              barCategoryGap="30%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E2E8F0"
                vertical={false}
              />
              <XAxis
                dataKey="periode"
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatFCFACompact(Number(v))}
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "rgba(241,245,249,0.6)" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="investi"
                name="Investi"
                fill={CHART_COLORS.blue}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="encaisse"
                name="Encaissé"
                fill={CHART_COLORS.emerald}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recap table + Pie */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 shadow-sm border-border/80 lg:col-span-2 gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Récapitulatif par client
            </h2>
            <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {recapParClient.length} client{recapParClient.length !== 1 ? "s" : ""} · {periodeLabel}
            </span>
          </div>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <SortableHead
                  col="client"
                  label="Client"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                  align="left"
                />
                <SortableHead
                  col="investi"
                  label="Investi"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortableHead
                  col="encaisse"
                  label="Encaissé"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortableHead
                  col="reste"
                  label={<GlossaryLabel term="resteAPayer" short />}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortableHead
                  col="ecart"
                  label={<GlossaryLabel term="ecartReglement" short />}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecap.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    Aucune écriture pour cette période.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRecap.map((r) => (
                  <TableRow
                    key={r.client}
                    className="border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                  >
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                      {r.client}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {formatFCFA(r.investi)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatFCFA(r.encaisse)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-amber-600 dark:text-amber-400">
                      {formatFCFA(r.reste)}
                    </TableCell>
                    <TableCell className="text-right">
                      <EcartValue value={r.ecart} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {hasData && (
              <TableFooter>
                <TableRow className="border-0 bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatFCFA(recapTotaux.investi)}
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatFCFA(recapTotaux.encaisse)}
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatFCFA(recapTotaux.reste)}
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatFCFA(recapTotaux.ecart)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
          </div>
        </Card>

        <Card className="p-5 shadow-sm border-border/80 lg:col-span-1 gap-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Répartition</h2>
          {pieTotal === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                <Percent className="size-6" />
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Aucune donnée pour cette période.
              </p>
            </div>
          ) : (
            <>
              <div className="relative h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={86}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {pieData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
                  <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatFCFA(pieTotal)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {pieData.map((d) => {
                  const pct =
                    pieTotal > 0 ? (d.value / pieTotal) * 100 : 0;
                  return (
                    <div
                      key={d.name}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: d.color }}
                      />
                      <span className="text-slate-600 dark:text-slate-300">{d.name}</span>
                      <span className="ml-auto font-medium tabular-nums text-slate-900 dark:text-slate-100">
                        {formatFCFA(d.value)}
                      </span>
                      <span className="w-10 text-right text-xs tabular-nums text-slate-400 dark:text-slate-500">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
                <div className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Taux de recouvrement</p>
                  <p
                    className={cn(
                      "mt-0.5 text-xl font-bold tabular-nums",
                      tauxRecouvrement >= 80
                        ? "text-emerald-600 dark:text-emerald-400"
                        : tauxRecouvrement >= 50
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {tauxRecouvrement} %
                  </p>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
