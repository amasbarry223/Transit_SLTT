"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, FileText, Search, Banknote, Wallet, Trash2, Loader2, AlertTriangle, Printer } from "lucide-react";
import type { BonSortieCaisse } from "@/lib/domain-types";
import { useStore } from "@/lib/store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { buildBonSortieCaisseHTML, type BonSortieCaisseModuleData } from "@/lib/export";
import { requirePrintHTMLBrand } from "@/lib/societe-brand";
import { KpiCard } from "@/components/sltt/kpi-card";
import { EmptyState } from "@/components/sltt/empty-state";
import { SocieteBadge } from "@/components/sltt/societe-filter-select";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { useToast } from "@/hooks/use-toast";
import { toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BonCaisseTabProps = {
  bons: BonSortieCaisse[];
  canWriteCaisse: boolean;
  onOpenCreateDialog: () => void;
};

type PreviewState =
  | { status: "closed" }
  | { status: "loading"; reference: string }
  | { status: "ready"; reference: string; html: string; montantTotal: number }
  | { status: "error"; reference: string; message: string };

function beneficiairesSummary(bon: BonSortieCaisse): string {
  if (bon.lignes.length === 0) return "—";
  const first = bon.lignes[0].beneficiaire;
  return bon.lignes.length > 1 ? `${first} +${bon.lignes.length - 1}` : first;
}

export function BonCaisseTab({ bons: bonsSortieCaisse, canWriteCaisse, onOpenCreateDialog }: BonCaisseTabProps) {
  const { toast } = useToast();
  const removeBonSortieCaisse = useStore((state) => state.removeBonSortieCaisse);
  const societes = useStore((state) => state.societes);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const [caisseSearch, setCaisseSearch] = useState("");
  const [preview, setPreview] = useState<PreviewState>({ status: "closed" });

  const { target: caisseDeleteTarget, setTarget: setCaisseDeleteTarget, confirm: handleDeleteCaisse } =
    useDeleteConfirm<BonSortieCaisse>(
      removeBonSortieCaisse,
      (bon) => bon.id,
      (bon) => bon.reference,
      "Bon supprimé",
      "Impossible de supprimer le bon.",
    );

  const caisseStats = useMemo(
    () => ({
      total: bonsSortieCaisse.length,
      montantTotal: bonsSortieCaisse.reduce((sum, bon) => sum + bon.montantTotal, 0),
    }),
    [bonsSortieCaisse],
  );

  const filteredCaisse = useMemo(() => {
    const query = caisseSearch.trim().toLowerCase();
    if (!query) return bonsSortieCaisse;
    return bonsSortieCaisse.filter(
      (bon) =>
        bon.reference.toLowerCase().includes(query) ||
        bon.lignes.some(
          (ligne) =>
            ligne.beneficiaire.toLowerCase().includes(query) || ligne.motif.toLowerCase().includes(query),
        ),
    );
  }, [bonsSortieCaisse, caisseSearch]);

  function buildCaissePrintData(bon: BonSortieCaisse): BonSortieCaisseModuleData | null {
    const societe = societes.find((item) => item.id === bon.societeId);
    const brand = societe
      ? {
          name: societe.nom,
          logoUrl: societe.logoUrl,
          afficherNomAvecLogo: societe.afficherNomAvecLogo,
          legal: {
            adresse: societe.adresse,
            telephone: societe.telephone,
            rccm: societe.rccm,
            nif: societe.nif,
          },
        }
      : bon.societeNom.trim()
        ? { name: bon.societeNom }
        : null;

    if (!requirePrintHTMLBrand(brand, "ce bon de sortie de caisse")) {
      return null;
    }

    return {
      reference: bon.reference,
      date: bon.date,
      societeNom: brand.name!,
      raisonSociale: societe?.raisonSociale,
      logoUrl: societe?.logoUrl,
      afficherNomAvecLogo: societe?.afficherNomAvecLogo,
      legal: societe
        ? {
            adresse: societe.adresse,
            telephone: societe.telephone,
            rccm: societe.rccm,
            nif: societe.nif,
          }
        : undefined,
      lignes: bon.lignes,
      montantTotal: bon.montantTotal,
      signataireDg: societe?.signataireDg,
      signatairePdg: societe?.signatairePdg,
    };
  }

  function handleOpenPreview(bon: BonSortieCaisse) {
    setPreview({ status: "loading", reference: bon.reference });

    if (bon.lignes.length === 0) {
      setPreview({
        status: "error",
        reference: bon.reference,
        message: "Aucune ligne à imprimer sur ce bon.",
      });
      toastWarning(toast, { title: "Document introuvable", description: "Ce bon de sortie de caisse n'a aucune ligne." });
      return;
    }

    const data = buildCaissePrintData(bon);
    if (!data) {
      // requirePrintHTMLBrand a déjà alerté l'utilisateur.
      setPreview({
        status: "error",
        reference: bon.reference,
        message:
          "Société introuvable — configurez-la dans Paramètres > Sociétés, puis réessayez.",
      });
      return;
    }

    try {
      const html = buildBonSortieCaisseHTML(data);
      setPreview({
        status: "ready",
        reference: bon.reference,
        html,
        montantTotal: bon.montantTotal,
      });
      toastSuccess(toast, { title: "Aperçu prêt", description: `${bon.reference} — ${formatFCFA(bon.montantTotal)}.` });
    } catch {
      setPreview({
        status: "error",
        reference: bon.reference,
        message: "Impossible de générer le document. Réessayez.",
      });
      toastWarning(toast, { title: "La génération du bon a échoué", description: "La génération du bon a échoué." });
    }
  }

  function handlePrintFromPreview() {
    const frame = previewIframeRef.current;
    const win = frame?.contentWindow;
    if (!win) {
      toastWarning(toast, { title: "Impression impossible", description: "L'aperçu n'est pas encore chargé." });
      return;
    }
    win.focus();
    win.print();
  }

  const previewOpen = preview.status !== "closed";

  return (
    <>
      <TabsContent value="caisse" className="mt-0 space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Bons émis"
            value={String(caisseStats.total)}
            icon={Banknote}
            tone="emerald"
            sublabel="décaissements enregistrés"
          />
          <KpiCard
            label="Total décaissé"
            value={formatFCFA(caisseStats.montantTotal)}
            icon={Wallet}
            tone="indigo"
            sublabel="toutes sorties de caisse"
          />
        </div>

        <Card className="p-4 shadow-sm border-border/80">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Référence, bénéficiaire, motif…"
                value={caisseSearch}
                onChange={(event) => setCaisseSearch(event.target.value)}
                className="h-10 pl-9"
                aria-label="Rechercher un bon de sortie de caisse"
              />
            </div>
            <p className="ml-auto text-xs tabular-nums text-muted-foreground">
              {filteredCaisse.length} bon{filteredCaisse.length !== 1 ? "s" : ""}
            </p>
          </div>
        </Card>

        <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Banknote className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Sorties de caisse</h2>
          </div>

          {filteredCaisse.length === 0 ? (
            <EmptyState
              illustration={
                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <Banknote className="size-5" />
                </div>
              }
              title={caisseSearch ? UI.empty.bons.filtered.title : UI.empty.bons.caisseZero.title}
              description={caisseSearch ? UI.empty.bons.filtered.description : UI.empty.bons.caisseZero.description}
              action={
                !caisseSearch && canWriteCaisse ? (
                  <Button onClick={onOpenCreateDialog}>
                    <Plus className="size-4" />
                    {UI.empty.bons.caisseZero.action}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="space-y-3 p-4 md:hidden">
                {filteredCaisse.map((bon) => (
                  <CaisseMobileCard
                    key={bon.id}
                    bon={bon}
                    canWriteCaisse={canWriteCaisse}
                    onPrint={handleOpenPreview}
                    onDelete={setCaisseDeleteTarget}
                  />
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <Table aria-label="Liste des bons de sortie de caisse">
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/50 hover:bg-muted">
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Référence
                      </TableHead>
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Date
                      </TableHead>
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Bénéficiaire(s)
                      </TableHead>
                      <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                        Société
                      </TableHead>
                      <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                        Motif
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Montant
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCaisse.map((bon) => (
                      <CaisseTableRow
                        key={bon.id}
                        bon={bon}
                        canWriteCaisse={canWriteCaisse}
                        onPrint={handleOpenPreview}
                        onDelete={setCaisseDeleteTarget}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </Card>
      </TabsContent>

      <Dialog
        open={previewOpen}
        onOpenChange={(open) => {
          if (!open) setPreview({ status: "closed" });
        }}
      >
        <DialogContent className="flex max-h-[90vh] w-[min(100%,880px)] max-w-[880px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[880px]">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>
              Aperçu — {preview.status !== "closed" ? preview.reference : "Bon de caisse"}
            </DialogTitle>
            <DialogDescription>
              Vérifiez le document puis imprimez ou enregistrez-le en PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[420px] flex-1 bg-muted/40">
            {preview.status === "loading" && (
              <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-sm">Génération de l&apos;aperçu…</p>
              </div>
            )}
            {preview.status === "error" && (
              <div className="flex h-[420px] flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <AlertTriangle className="size-5" />
                </div>
                <p className="text-sm font-medium text-foreground">Document introuvable</p>
                <p className="max-w-md text-sm text-muted-foreground">{preview.message}</p>
              </div>
            )}
            {preview.status === "ready" && (
              <iframe
                ref={previewIframeRef}
                title={`Aperçu ${preview.reference}`}
                srcDoc={preview.html}
                className="h-[min(60vh,560px)] w-full border-0 bg-white"
              />
            )}
          </div>

          <DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
            <Button variant="outline" onClick={() => setPreview({ status: "closed" })}>
              Fermer
            </Button>
            <Button
              disabled={preview.status !== "ready"}
              onClick={handlePrintFromPreview}
            >
              <Printer className="size-4" />
              Imprimer / Enregistrer en PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!caisseDeleteTarget}
        onOpenChange={(open) => !open && setCaisseDeleteTarget(null)}
        title="Supprimer ce bon de sortie ?"
        description="Cette action est irréversible. Le bon et ses lignes seront définitivement supprimés."
        onConfirm={handleDeleteCaisse}
      />
    </>
  );
}

function CaisseMobileCard({
  bon,
  canWriteCaisse,
  onPrint,
  onDelete,
}: {
  bon: BonSortieCaisse;
  canWriteCaisse: boolean;
  onPrint: (bon: BonSortieCaisse) => void;
  onDelete: (bon: BonSortieCaisse) => void;
}) {
  return (
    <Card className="border-border/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-xs font-medium text-foreground">{bon.reference}</p>
          <p className="mt-0.5 truncate text-sm font-medium text-foreground/90">
            {beneficiairesSummary(bon)}
          </p>
        </div>
        <SocieteBadge societeNom={bon.societeNom} size="sm" />
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Date</dt>
          <dd className="tabular-nums text-foreground/90">{formatDateShort(bon.date)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Motif</dt>
          <dd className="truncate text-right text-foreground/90">
            {bon.lignes.map((ligne) => ligne.motif).join(", ")}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Montant</dt>
          <dd className="tabular-nums font-medium text-foreground">{formatFCFA(bon.montantTotal)}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-11 text-muted-foreground hover:text-primary"
          aria-label={`Aperçu PDF ${bon.reference}`}
          title="PDF / Imprimer"
          onClick={() => onPrint(bon)}
        >
          <FileText className="size-4" />
        </Button>
        {canWriteCaisse && (
          <Button
            variant="ghost"
            size="icon"
            className="size-11 text-slate-400 hover:text-red-600"
            aria-label={`Supprimer ${bon.reference}`}
            title="Supprimer"
            onClick={() => onDelete(bon)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

function CaisseTableRow({
  bon,
  canWriteCaisse,
  onPrint,
  onDelete,
}: {
  bon: BonSortieCaisse;
  canWriteCaisse: boolean;
  onPrint: (bon: BonSortieCaisse) => void;
  onDelete: (bon: BonSortieCaisse) => void;
}) {
  return (
    <TableRow className="border-b border-border hover:bg-muted/60">
      <TableCell className="px-4 py-3.5">
        <p className="font-mono text-xs font-medium text-foreground">{bon.reference}</p>
      </TableCell>
      <TableCell className="px-4 py-3.5 tabular-nums text-muted-foreground">
        {formatDateShort(bon.date)}
      </TableCell>
      <TableCell className="max-w-[180px] px-4 py-3.5">
        <p className="truncate font-medium text-foreground/90">{beneficiairesSummary(bon)}</p>
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 md:table-cell">
        <SocieteBadge societeNom={bon.societeNom} size="sm" />
      </TableCell>
      <TableCell className="hidden max-w-[200px] px-4 py-3.5 md:table-cell">
        <p className="truncate text-sm text-muted-foreground">
          {bon.lignes.map((ligne) => ligne.motif).join(", ")}
        </p>
      </TableCell>
      <TableCell className="px-4 py-3.5 text-right tabular-nums font-medium text-foreground">
        {formatFCFA(bon.montantTotal)}
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 text-muted-foreground hover:text-primary"
            aria-label={`Aperçu PDF ${bon.reference}`}
            title="PDF / Imprimer"
            onClick={() => onPrint(bon)}
          >
            <FileText className="size-4" />
          </Button>
          {canWriteCaisse && (
            <Button
              variant="ghost"
              size="icon"
              className="size-11 text-slate-400 hover:text-red-600"
              aria-label={`Supprimer ${bon.reference}`}
              title="Supprimer"
              onClick={() => onDelete(bon)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
