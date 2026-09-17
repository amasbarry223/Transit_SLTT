"use client";

import { useMemo, useState } from "react";
import {
  Users,
  Search,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Receipt,
  FolderKanban,
  FileSignature,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { exportToExcel } from "@/lib/export";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { EmptyState } from "@/components/sltt/empty-state";
import { cn } from "@/shared/utils/cn";

export interface ClientSituation {
  clientId: string;
  clientNom: string;
  annexeId?: string;
  annexeNom?: string;
  nbDossiers: number;
  nbContrats: number;
  nbFactures: number;
  totalFacture: number;
  totalDepenses: number;
  avancesPayees: number;
  resteAPayer: number;
}

export function SituationClientsPanel() {
  const clients = useStore((s) => s.clients);
  const dossiers = useStore((s) => s.dossiers);
  const contrats = useStore((s) => s.contrats);
  const factures = useStore((s) => s.factures);
  const depenses = useStore((s) => s.depenses);
  const operations = useStore((s) => s.operationsComptables);
  const annexes = useStore((s) => s.annexes);
  const { selectedAnnexeId } = useActiveAnnexe();

  const [annexeFilter, setAnnexeFilter] = useState<string>(selectedAnnexeId ?? "all");
  const [search, setSearch] = useState("");
  const [soldeFilter, setSoldeFilter] = useState<"all" | "debiteur" | "solde" | "crediteur">("all");
  const [selectedClientDetail, setSelectedClientDetail] = useState<ClientSituation | null>(null);

  // Calcul de la situation de chaque client
  const situations = useMemo<ClientSituation[]>(() => {
    return clients.map((client) => {
      // Filtrer les objets rattachés à ce client et éventuellement à l'annexe
      const clientDossiers = dossiers.filter((d) => {
        if (d.clientId !== client.id) return false;
        if (annexeFilter !== "all" && d.annexeId !== annexeFilter) return false;
        return true;
      });

      const clientContrats = contrats.filter((c) => {
        if (c.clientId !== client.id) return false;
        if (annexeFilter !== "all" && c.annexeId && c.annexeId !== annexeFilter) return false;
        return true;
      });

      // Exclut les factures Annulée, comme `cfActives`/`sommeFacturesEncaissees`
      // (lib/client-stats.ts) : une facture annulée ne doit plus compter dans
      // le total facturé/reste à payer d'un client.
      const clientFactures = factures.filter((f) => {
        if (f.clientId !== client.id) return false;
        if (f.statut === "Annulée") return false;
        if (annexeFilter !== "all" && f.annexeId && f.annexeId !== annexeFilter) return false;
        return true;
      });

      // Identifiants des dossiers et contrats de ce client
      const clientDossierIds = new Set(clientDossiers.map((d) => d.id));
      const clientContratIds = new Set(clientContrats.map((c) => c.id));
      const clientDepenses = depenses.filter((d) => clientContratIds.has(d.contratId));

      // Opérations comptables (journal de caisse) pour ce client
      const clientOps = operations.filter((o) => {
        if (annexeFilter !== "all" && o.annexeId && o.annexeId !== annexeFilter) return false;
        if (o.clientId === client.id) return true;
        if (o.clientNom && o.clientNom.toLowerCase() === client.nom.toLowerCase()) return true;
        if (o.dossierId && clientDossierIds.has(o.dossierId)) return true;
        return false;
      });

      // Calculs financiers
      // 1. Total facturé
      const totalFacture = clientFactures.reduce((sum, f) => sum + f.montantTTC, 0);

      // 2. Dépenses engagées
      const totalDepensesContrats = clientDepenses.reduce((sum, d) => sum + d.montant, 0);
      const totalDepensesOps = clientOps
        .filter((o) => o.type === "Sortie")
        .reduce((sum, o) => sum + o.montant, 0);
      const totalDepenses = totalDepensesContrats + totalDepensesOps;

      // 3. Avances payées (encaissements / règlements reçus du client)
      const avancesOps = clientOps
        .filter((o) => o.type === "Entrée")
        .reduce((sum, o) => sum + o.montant, 0);
      const avancesFactures = clientFactures
        .filter((f) => f.statut === "Soldée")
        .reduce((sum, f) => sum + f.montantTTC, 0);
      const avancesPayees = Math.max(avancesOps, avancesFactures);

      // 4. Montant global dû par le client (soit total factures si existantes, soit dépenses + honoraires)
      const baseDû = totalFacture > 0 ? totalFacture : totalDepenses;

      // 5. Reste à payer
      const resteAPayer = Math.max(0, baseDû - avancesPayees);

      const annexeObj = client.annexeId ? annexes.find((a) => a.id === client.annexeId) : undefined;

      return {
        clientId: client.id,
        clientNom: client.nom,
        annexeId: client.annexeId,
        annexeNom: annexeObj?.nom,
        nbDossiers: clientDossiers.length,
        nbContrats: clientContrats.length,
        nbFactures: clientFactures.length,
        totalFacture,
        totalDepenses,
        avancesPayees,
        resteAPayer,
      };
    });
  }, [clients, dossiers, contrats, factures, depenses, operations, annexes, annexeFilter]);

  // Filtrage selon la recherche et le solde
  const filteredSituations = useMemo(() => {
    return situations.filter((s) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!s.clientNom.toLowerCase().includes(q)) return false;
      }
      if (soldeFilter === "debiteur" && s.resteAPayer <= 0) return false;
      if (soldeFilter === "solde" && s.resteAPayer !== 0) return false;
      if (soldeFilter === "crediteur" && s.avancesPayees <= s.totalDepenses) return false;
      return true;
    });
  }, [situations, search, soldeFilter]);

  // Totaux globaux
  const totals = useMemo(() => {
    return filteredSituations.reduce(
      (acc, s) => ({
        depenses: acc.depenses + s.totalDepenses,
        avances: acc.avances + s.avancesPayees,
        reste: acc.reste + s.resteAPayer,
      }),
      { depenses: 0, avances: 0, reste: 0 },
    );
  }, [filteredSituations]);

  async function handleExportExcel() {
    await exportToExcel(
      "comptabilite-generale",
      `situation-clients-${new Date().toISOString().slice(0, 10)}`,
      [
        { header: "Client", accessor: (s) => s.clientNom },
        { header: "Annexe", accessor: (s) => s.annexeNom ?? "Toutes" },
        { header: "Dossiers", accessor: (s) => s.nbDossiers },
        { header: "Contrats", accessor: (s) => s.nbContrats },
        { header: "Total Facturé (FCFA)", accessor: (s) => s.totalFacture },
        { header: "Total Dépenses (FCFA)", accessor: (s) => s.totalDepenses },
        { header: "Avances Payées (FCFA)", accessor: (s) => s.avancesPayees },
        { header: "Reste à Payer (FCFA)", accessor: (s) => s.resteAPayer },
      ],
      filteredSituations,
      { module: "Comptabilité" },
    );
  }

  // Opérations et détails pour la modale client
  const clientDetailOps = useMemo(() => {
    if (!selectedClientDetail) return [];
    return operations.filter(
      (o) =>
        o.clientId === selectedClientDetail.clientId ||
        o.clientNom.toLowerCase() === selectedClientDetail.clientNom.toLowerCase(),
    );
  }, [selectedClientDetail, operations]);

  const clientDetailDossiers = useMemo(() => {
    if (!selectedClientDetail) return [];
    return dossiers.filter((d) => d.clientId === selectedClientDetail.clientId);
  }, [selectedClientDetail, dossiers]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Clients actifs</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">{filteredSituations.length}</p>
            </div>
          </div>
        </Card>

        <Card className="border-border/80 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <ArrowDownRight className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total dépenses engagées</p>
              <p className="text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                {formatFCFA(totals.depenses)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-border/80 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <ArrowUpRight className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Avances & Règlements reçus</p>
              <p className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatFCFA(totals.avances)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-border/80 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Reste global à recouvrer</p>
              <p className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {formatFCFA(totals.reste)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Barre de filtres et d'action */}
      <Card className="border-border/80 p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>

            {/* Filtre Annexe : Isolement Mali vs Abidjan */}
            <div className="flex items-center gap-1.5">
              <Building2 className="size-4 text-muted-foreground" />
              <Select value={annexeFilter} onValueChange={setAnnexeFilter}>
                <SelectTrigger className="h-9 w-[180px] text-xs">
                  <SelectValue placeholder="Toutes les annexes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les annexes</SelectItem>
                  {annexes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      Annexe {a.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre Solde */}
            <Select value={soldeFilter} onValueChange={(v) => setSoldeFilter(v as typeof soldeFilter)}>
              <SelectTrigger className="h-9 w-[170px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les états</SelectItem>
                <SelectItem value="debiteur">Reste à payer &gt; 0</SelectItem>
                <SelectItem value="solde">Soldé / À jour</SelectItem>
                <SelectItem value="crediteur">Avances excédentaires</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={filteredSituations.length === 0}
            className="gap-2"
          >
            <FileSpreadsheet className="size-4 text-emerald-600" />
            Exporter la situation (Excel)
          </Button>
        </div>
      </Card>

      {/* Tableau récapitulatif */}
      <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
        {filteredSituations.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun client trouvé"
            description="Modifiez vos critères de recherche ou filtre d'annexe."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/50">
                  <TableHead className="h-10 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Client
                  </TableHead>
                  <TableHead className="h-10 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Annexe
                  </TableHead>
                  <TableHead className="h-10 px-4 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Dossiers / Contrats
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Dépenses engagées
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Avances payées
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Reste à payer
                  </TableHead>
                  <TableHead className="h-10 px-4 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    État
                  </TableHead>
                  <TableHead className="h-10 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSituations.map((sit) => (
                  <TableRow key={sit.clientId} className="border-b border-border hover:bg-muted/40 transition-colors">
                    <TableCell className="px-4 py-3 font-medium text-foreground">
                      {sit.clientNom}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {sit.annexeNom ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-normal text-[11px]",
                            sit.annexeNom.toLowerCase().includes("mali")
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                              : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300",
                          )}
                        >
                          {sit.annexeNom}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center tabular-nums text-xs text-muted-foreground">
                      {sit.nbDossiers} dossier{sit.nbDossiers > 1 ? "s" : ""} · {sit.nbContrats} contrat{sit.nbContrats > 1 ? "s" : ""}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums text-rose-600 dark:text-rose-400 font-medium">
                      {formatFCFA(sit.totalDepenses)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatFCFA(sit.avancesPayees)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums font-bold">
                      <span
                        className={
                          sit.resteAPayer > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {formatFCFA(sit.resteAPayer)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      {sit.resteAPayer > 0 ? (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[10px]">
                          Reste dû
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]">
                          Soldé
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400"
                        onClick={() => setSelectedClientDetail(sit)}
                      >
                        Fiche situation
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Modal Fiche Situation Client */}
      {selectedClientDetail && (
        <Dialog open={!!selectedClientDetail} onOpenChange={(open) => !open && setSelectedClientDetail(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="size-5 text-blue-600" />
                Situation financière : {selectedClientDetail.clientNom}
              </DialogTitle>
              <DialogDescription>
                Récapitulatif des dépenses, avances perçues et dossiers rattachés.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-3 gap-3 rounded-xl border border-border/80 bg-muted/40 p-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total Dépenses</p>
                  <p className="mt-1 text-lg font-bold text-rose-600">{formatFCFA(selectedClientDetail.totalDepenses)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Avances Payées</p>
                  <p className="mt-1 text-lg font-bold text-emerald-600">{formatFCFA(selectedClientDetail.avancesPayees)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Reste à Payer</p>
                  <p className="mt-1 text-lg font-bold text-amber-600">{formatFCFA(selectedClientDetail.resteAPayer)}</p>
                </div>
              </div>

              {/* Liste des dossiers du client */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <FolderKanban className="size-4" /> Dossiers ({clientDetailDossiers.length})
                </p>
                {clientDetailDossiers.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Aucun dossier en cours pour ce client.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 rounded-lg border border-border/70 p-2">
                    {clientDetailDossiers.map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/30">
                        <span className="font-mono font-medium">{d.reference}</span>
                        <span className="text-muted-foreground">{d.nature}</span>
                        <span className="font-semibold">{formatFCFA(d.fraisPrestation)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Historique récent des mouvements de caisse */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Receipt className="size-4" /> Mouvements récents de caisse ({clientDetailOps.length})
                </p>
                {clientDetailOps.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Aucun mouvement enregistré pour ce client.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border border-border/70 p-2">
                    {clientDetailOps.map((op) => (
                      <div key={op.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-muted/40 border-b border-border/40 last:border-0">
                        <div>
                          <p className="font-medium">{op.nature}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDateShort(op.date)} · Réf. {op.reference}</p>
                        </div>
                        <span
                          className={cn(
                            "font-bold tabular-nums",
                            op.type === "Entrée" ? "text-emerald-600" : "text-rose-600",
                          )}
                        >
                          {op.type === "Entrée" ? "+" : "-"} {formatFCFA(op.montant)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
