"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Pencil, Printer, Search, Trash2, Truck } from "lucide-react";
import type { BonLivraison } from "@/lib/domain-types";
import { useStore } from "@/lib/store";
import { formatDateShort } from "@/lib/format";
import { KpiCard } from "@/components/sltt/kpi-card";
import { EmptyState } from "@/components/sltt/empty-state";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { ConfirmActionDialog } from "@/components/sltt/confirm-action-dialog";
import { useDeleteConfirm } from "@/shared/hooks/use-delete-confirm";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess } from "@/shared/utils/toast-helpers";
import { cn } from "@/shared/utils/cn";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { TabsContent } from "@/shared/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

type Props = {
  bons: BonLivraison[];
  canWrite: boolean;
  onPrint: (bon: BonLivraison) => void;
  onEdit: (bon: BonLivraison) => void;
};

function StatutBadge({ statut }: { statut: BonLivraison["statut"] }) {
  const livre = statut === "Livré";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        livre
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      )}
    >
      {livre ? <CheckCircle2 className="size-3" aria-hidden /> : <Clock className="size-3" aria-hidden />}
      {statut}
    </span>
  );
}

function transportLabel(bon: BonLivraison): string {
  return [bon.transporteurNom, bon.immatriculation].filter(Boolean).join(" · ") || "—";
}

export function BonLivraisonTab({ bons, canWrite, onPrint, onEdit }: Props) {
  const { toast } = useToast();
  const removeBonLivraison = useStore((s) => s.removeBonLivraison);
  const updateBonLivraison = useStore((s) => s.updateBonLivraison);
  const [search, setSearch] = useState("");
  const [livrerTarget, setLivrerTarget] = useState<BonLivraison | null>(null);

  const { target: deleteTarget, setTarget: setDeleteTarget, confirm: confirmDelete } = useDeleteConfirm<BonLivraison>(
    removeBonLivraison,
    (b) => b.id,
    (b) => b.reference,
    "Bon de livraison supprimé",
    "Impossible de supprimer le bon de livraison.",
  );

  const stats = useMemo(
    () => ({
      total: bons.length,
      enCours: bons.filter((b) => b.statut === "En cours").length,
      livres: bons.filter((b) => b.statut === "Livré").length,
    }),
    [bons],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bons;
    return bons.filter((b) =>
      [b.reference, b.clientNom, b.bonSortieReference, b.transporteurNom, b.immatriculation, b.chauffeurNom]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [bons, search]);

  // Rejette en cas d'échec : ConfirmActionDialog reste alors ouvert pour
  // permettre de réessayer (même contrat que useDeleteConfirm).
  async function confirmLivrer() {
    if (!livrerTarget) return;
    try {
      const updated = await updateBonLivraison(livrerTarget.id, { statut: "Livré" });
      toastSuccess(toast, { title: "Livraison confirmée", description: `${updated.reference} — ${updated.clientNom}` });
      setLivrerTarget(null);
    } catch (err) {
      toastError(toast, err, { title: "Impossible de confirmer la livraison", fallback: "Réessayez." });
      throw err;
    }
  }

  const actions = (bon: BonLivraison) => {
    const enCours = bon.statut === "En cours";
    return (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon" className="size-9" onClick={() => onPrint(bon)} aria-label={`Imprimer ${bon.reference}`} title="Aperçu / imprimer">
          <Printer className="size-4" />
        </Button>
        {canWrite && enCours && (
          <>
            <Button variant="ghost" size="icon" className="size-9" onClick={() => onEdit(bon)} aria-label={`Modifier ${bon.reference}`} title="Modifier le transport">
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-emerald-600 hover:text-emerald-700"
              onClick={() => setLivrerTarget(bon)}
              aria-label={`Marquer ${bon.reference} comme livré`}
              title="Confirmer la livraison"
            >
              <CheckCircle2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-slate-400 hover:text-red-600"
              onClick={() => setDeleteTarget(bon)}
              aria-label={`Supprimer ${bon.reference}`}
              title="Supprimer"
            >
              <Trash2 className="size-4" />
            </Button>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <TabsContent value="livraison" className="mt-0 space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <KpiCard label="Bons de livraison" value={String(stats.total)} icon={Truck} tone="blue" sublabel="émis" />
          <KpiCard label="En cours" value={String(stats.enCours)} icon={Clock} tone="amber" sublabel="en route ou à livrer" />
          <KpiCard label="Livrés" value={String(stats.livres)} icon={CheckCircle2} tone="emerald" sublabel="réception confirmée" />
        </div>

        <Card className="border-border/80 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Référence, client, camion, chauffeur…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-9"
                aria-label="Rechercher un bon de livraison"
              />
            </div>
            <p className="ml-auto text-xs tabular-nums text-muted-foreground">
              {filtered.length} bon{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </Card>

        <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Truck className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Bons de livraison</h2>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              illustration={
                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <Truck className="size-5" />
                </div>
              }
              title={search ? "Aucun résultat" : "Aucun bon de livraison"}
              description={
                search
                  ? "Aucun bon ne correspond à cette recherche."
                  : "Validez un bon de sortie de marchandise, puis cliquez sur l'icône camion pour établir son bon de livraison."
              }
            />
          ) : (
            <>
              <div className="space-y-3 p-4 md:hidden">
                {filtered.map((bon) => (
                  <Card key={bon.id} className="gap-2 border-border/70 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold text-foreground">{bon.reference}</p>
                        <p className="truncate text-sm text-foreground">{bon.clientNom}</p>
                      </div>
                      <StatutBadge statut={bon.statut} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(bon.date)} · {bon.bonSortieReference ?? "—"} · {transportLabel(bon)}
                    </p>
                    {actions(bon)}
                  </Card>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <Table aria-label="Liste des bons de livraison">
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/50 hover:bg-muted">
                      {["Référence", "Date", "Client", "Bon de sortie", "Transport", "Statut"].map((h) => (
                        <TableHead key={h} className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {h}
                        </TableHead>
                      ))}
                      <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((bon) => (
                      <TableRow key={bon.id}>
                        <TableCell className="px-4 font-mono text-sm font-semibold">{bon.reference}</TableCell>
                        <TableCell className="px-4 text-sm text-muted-foreground">{formatDateShort(bon.date)}</TableCell>
                        <TableCell className="max-w-[220px] truncate px-4 text-sm font-medium">{bon.clientNom}</TableCell>
                        <TableCell className="px-4 font-mono text-xs text-muted-foreground">{bon.bonSortieReference ?? "—"}</TableCell>
                        <TableCell className="max-w-[220px] truncate px-4 text-sm">{transportLabel(bon)}</TableCell>
                        <TableCell className="px-4">
                          <StatutBadge statut={bon.statut} />
                        </TableCell>
                        <TableCell className="px-4">{actions(bon)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </Card>
      </TabsContent>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Supprimer le bon de livraison ${deleteTarget?.reference ?? ""} ?`}
        description="Le bon de sortie d'origine sera de nouveau disponible pour établir un bon de livraison."
        onConfirm={confirmDelete}
      />

      <ConfirmActionDialog
        open={!!livrerTarget}
        onOpenChange={(open) => !open && setLivrerTarget(null)}
        title={`Confirmer la livraison ${livrerTarget?.reference ?? ""} ?`}
        description="Le bon passera au statut « Livré » et ne pourra plus être modifié ni supprimé. Faites-le une fois le bon signé par le réceptionnaire."
        confirmLabel="Confirmer la livraison"
        onConfirm={confirmLivrer}
      />
    </>
  );
}
