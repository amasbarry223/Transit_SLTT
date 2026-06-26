"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  FileText,
  FileSpreadsheet,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import {
  calculerEcart,
  type DossierStatut,
} from "@/lib/mock-data";
import { formatFCFA } from "@/lib/format";
import { PageHeader } from "@/components/sltt/page-header";
import { DossierStatutBadge, EcartValue } from "@/components/sltt/status-badge";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUT_OPTIONS: (DossierStatut | "Tous")[] = [
  "Tous",
  "En cours",
  "Dédouané",
  "Livré",
  "Soldé",
];

/**
 * DossiersListScreen — liste des dossiers de transit.
 * Filtres client-side : recherche texte, client, statut, période.
 */
export function DossiersListScreen() {
  const { openDossier } = useNav();
  const dossiers = useStore((s) => s.dossiers);
  const clients = useStore((s) => s.clients);

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("Tous");
  const [periode, setPeriode] = useState<string>("all");

  const filtered = useMemo(() => {
    // Date "aujourd'hui" simulée (en cohérence avec les données mock qui
    // s'arrêtent début janvier 2026).
    const today = new Date("2026-01-10");

    return dossiers.filter((d) => {
      // Recherche texte
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack =
          `${d.reference} ${d.clientNom} ${d.bl} ${d.camion} ${d.nature}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Filtre client
      if (clientFilter !== "all" && d.clientId !== clientFilter) return false;

      // Filtre statut
      if (statutFilter !== "Tous" && d.statut !== statutFilter) return false;

      // Filtre période
      if (periode !== "all") {
        const dDate = new Date(d.date);
        const diffDays =
          (today.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24);
        if (periode === "month") {
          if (diffDays > 31 || diffDays < 0) return false;
        } else if (periode === "quarter") {
          if (diffDays > 92 || diffDays < 0) return false;
        }
      }

      return true;
    });
  }, [dossiers, search, clientFilter, statutFilter, periode]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dossiers de transit"
        description="Suivi des dossiers douaniers et de leur soldage"
      >
        <Button onClick={() => openDossier(null, "create")}>
          <Plus className="size-4" />
          Nouveau dossier
        </Button>
      </PageHeader>

      {/* === Filter bar === */}
      <Card className="p-4 shadow-sm border-border/80">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <Input
              className="h-10 pl-9"
              placeholder="Rechercher par réf., client, BL…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher un dossier"
            />
          </div>

          {/* Client filter */}
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="h-10 w-full sm:w-56" aria-label="Filtrer par client">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Statut filter */}
          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Filtrer par statut">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {STATUT_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "Tous" ? "Tous les statuts" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Période filter */}
          <Select value={periode} onValueChange={setPeriode}>
            <SelectTrigger className="h-10 w-full sm:w-48" aria-label="Filtrer par période">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes périodes</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">3 derniers mois</SelectItem>
            </SelectContent>
          </Select>

          {/* Export buttons (visuel uniquement) */}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" className="h-9">
              <FileText className="size-4" />
              Exporter PDF
            </Button>
            <Button variant="outline" className="h-9">
              <FileSpreadsheet className="size-4" />
              Exporter Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* === Data table === */}
      <Card className="p-0 gap-0 shadow-sm border-border/80 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-border">
                <TableHead className="text-xs text-slate-500 font-medium uppercase tracking-wide h-10 px-4">
                  Référence
                </TableHead>
                <TableHead className="text-xs text-slate-500 font-medium uppercase tracking-wide h-10 px-4">
                  Client
                </TableHead>
                <TableHead className="text-xs text-slate-500 font-medium uppercase tracking-wide h-10 px-4">
                  N° BL
                </TableHead>
                <TableHead className="text-xs text-slate-500 font-medium uppercase tracking-wide h-10 px-4">
                  N° camion
                </TableHead>
                <TableHead className="text-xs text-slate-500 font-medium uppercase tracking-wide h-10 px-4">
                  Nature marchandise
                </TableHead>
                <TableHead className="text-xs text-slate-500 font-medium uppercase tracking-wide h-10 px-4 text-right">
                  Frais prestation
                </TableHead>
                <TableHead className="text-xs text-slate-500 font-medium uppercase tracking-wide h-10 px-4 text-right">
                  Écart
                </TableHead>
                <TableHead className="text-xs text-slate-500 font-medium uppercase tracking-wide h-10 px-4">
                  Statut
                </TableHead>
                <TableHead className="text-xs text-slate-500 font-medium uppercase tracking-wide h-10 px-4 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow
                  key={d.id}
                  className="hover:bg-slate-50/60 border-b border-border"
                >
                  <TableCell className="px-4 py-3 font-medium text-slate-900">
                    {d.reference}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-slate-700 truncate max-w-[200px]">
                    {d.clientNom}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-slate-600 font-mono text-xs">
                    {d.bl}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-slate-600 font-mono text-xs">
                    {d.camion}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-slate-600">
                    {d.nature}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums text-slate-900">
                    {formatFCFA(d.fraisPrestation, false)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    <EcartValue value={calculerEcart(d)} />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <DossierStatutBadge statut={d.statut} />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-slate-400 hover:text-primary"
                        aria-label="Voir le dossier"
                        onClick={() => openDossier(d.id, "edit")}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-slate-400 hover:text-primary"
                        aria-label="Modifier le dossier"
                        onClick={() => openDossier(d.id, "edit")}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-slate-400 hover:text-primary"
                        aria-label="Générer le PDF"
                      >
                        <FileText className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Aucun dossier trouvé pour les critères sélectionnés.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* === Pagination footer === */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-slate-500">
            {filtered.length > 0
              ? `1–${filtered.length} sur ${dossiers.length}`
              : `0 sur ${dossiers.length}`}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled
              aria-label="Page précédente"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              size="sm"
              className="size-8 p-0 min-w-8"
              aria-label="Page 1"
            >
              1
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="size-8 p-0 min-w-8"
              aria-label="Page 2"
            >
              2
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="Page suivante"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
