"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Package, Banknote } from "lucide-react";
import type { BonLigne, BonMotif, BonSortie, BonSortieCaisse } from "@/lib/domain-types";
import { useStore } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { formatDateShort, formatFCFA } from "@/lib/format";
import { printHTML, htmlEscape } from "@/lib/export";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/shared/utils/toast-helpers";
import { usePermission } from "@/shared/hooks/use-permission";
import { PageHeader } from "@/components/sltt/page-header";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { cn } from "@/shared/utils/cn";
import { filterByAnnexe } from "@/lib/filter-by-annexe";
import { resolveSlttBrand } from "@/lib/societe-brand";
import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import { BonMarchandiseTab } from "./bons/bon-marchandise-tab";
import { BonCaisseTab } from "./bons/bon-caisse-tab";
import { BonFormDialog } from "./bons/bon-form-dialog";
import { BonCaisseFormDialog } from "./bons/bon-caisse-form-dialog";

export function BonsScreen() {
  const { toast } = useToast();
  const canWrite = usePermission("bons:write");
  const canWriteCaisse = usePermission("bons:write-caisse");
  const go = useNav((state) => state.go);
  const selectedId = useNav((state) => state.selectedId);
  const { selectedAnnexeId } = useActiveAnnexe();

  const allBons = useStore((state) => state.bons);
  const validateBon = useStore((state) => state.validateBon);
  const societes = useStore((state) => state.societes);
  const bonSeq = useStore((state) => state.bonSeq);
  const bonSortieCaisseSeq = useStore((state) => state.bonSortieCaisseSeq);
  const bonsSortieCaisse = useStore((state) => state.bonsSortieCaisse);

  const [activeTab, setActiveTab] = useState<"marchandise" | "caisse">("marchandise");
  const [marchandiseDialogOpen, setMarchandiseDialogOpen] = useState(false);
  const [caisseDialogOpen, setCaisseDialogOpen] = useState(false);
  const [editingBonCaisse, setEditingBonCaisse] = useState<BonSortieCaisse | null>(null);
  const [validatingIds, setValidatingIds] = useState<Set<string>>(new Set());
  const [confirmValidate, setConfirmValidate] = useState<{ id: string; ref: string } | null>(null);
  const [deepLinkSearch, setDeepLinkSearch] = useState<string | undefined>(undefined);

  function openCreateCaisseDialog() {
    setEditingBonCaisse(null);
    setCaisseDialogOpen(true);
  }

  function openEditCaisseDialog(bon: BonSortieCaisse) {
    setEditingBonCaisse(bon);
    setCaisseDialogOpen(true);
  }

  const bons = useMemo(
    () => filterByAnnexe(allBons, selectedAnnexeId),
    [allBons, selectedAnnexeId],
  );

  const bonsCaisse = useMemo(
    () => filterByAnnexe(bonsSortieCaisse, selectedAnnexeId),
    [bonsSortieCaisse, selectedAnnexeId],
  );

  const nextReference = `BS-${new Date().getFullYear()}-${String(bonSeq).padStart(4, "0")}`;
  const nextCaisseReference = `N°${bonSortieCaisseSeq}`;

  useEffect(() => {
    if (selectedId === "new") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronise avec le routeur (nav-store) : ouvre le dialogue puis consomme le marqueur "new" de l'URL
      if (canWrite) setMarchandiseDialogOpen(true);
      go("bons");
      return;
    }
    // Arrivée depuis un lien direct vers un bon précis : pas de vue de détail
    // dédiée pour les bons, donc on atterrit sur la liste avec la recherche
    // préremplie sur sa référence plutôt que la liste générique.
    if (selectedId) {
      const target = allBons.find((b) => b.id === selectedId);
      if (target) {
        setDeepLinkSearch(target.reference);
        setActiveTab("marchandise");
      }
      go("bons");
    }
  }, [selectedId, go, canWrite, allBons]);

  function buildBonHTML(bon: BonSortie) {
    const motifColors: Record<string, string> = {
      Vente: "background:#dfeefa;color:#155a93",
      Livraison: "background:#e0e7ff;color:#3730a3",
      Transfert: "background:#fef3c7;color:#92400e",
    };

    const hasLignes = Boolean(bon.lignes && bon.lignes.length > 0);

    const lignesTableHTML = hasLignes
      ? `
      <table style="margin-top:16px">
        <thead>
          <tr>
            <th style="text-align:left;width:30px">#</th>
            <th style="text-align:left">Marchandise</th>
            <th style="text-align:right">Quantité</th>
            <th style="text-align:right">Montant</th>
          </tr>
        </thead>
        <tbody>
          ${bon.lignes!
            .map(
              (l: BonLigne, idx: number) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${htmlEscape(l.marchandise)}</td>
              <td style="text-align:right">${l.quantite} ${htmlEscape(l.unite)}</td>
              <td style="text-align:right" class="num">${formatFCFA(l.montant)}</td>
            </tr>
          `,
            )
            .join("")}
          <tr class="total-row">
            <th colspan="2">Total</th>
            <td style="text-align:right;font-weight:bold">${bon.quantite}</td>
            <td style="text-align:right" class="num">${formatFCFA(bon.montant)}</td>
          </tr>
        </tbody>
      </table>
      `
      : "";

    return `
      <h1>Bon de sortie — Marchandise</h1>
      <div class="subtitle">Référence : <strong>${htmlEscape(bon.reference)}</strong> · <span class="badge" style="${motifColors[bon.motif] ?? ""}">${htmlEscape(bon.motif)}</span></div>
      <table>
        <tbody>
          <tr><th style="width:40%">Date</th><td>${formatDateShort(bon.date)}</td></tr>
          <tr><th>Client</th><td>${htmlEscape(bon.clientNom)}</td></tr>
          <tr><th>Motif de sortie</th><td>${htmlEscape(bon.motif)}</td></tr>
          ${
            !hasLignes
              ? `
          <tr><th>Marchandise</th><td>${htmlEscape(bon.marchandise)}</td></tr>
          <tr><th>Quantité sortie</th><td>${bon.quantite} ${htmlEscape(bon.unite)}</td></tr>
          <tr class="total-row"><th>Montant</th><td class="num">${formatFCFA(bon.montant)}</td></tr>
          `
              : ""
          }
        </tbody>
      </table>
      ${lignesTableHTML}
      <div style="margin-top:64px;display:flex;justify-content:space-between">
        <div>
          <div style="border-top:1px solid #92a3ba;width:200px;padding-top:6px;font-size:11px;color:#6b7280">Signature du responsable</div>
        </div>
        <div>
          <div style="border-top:1px solid #92a3ba;width:200px;padding-top:6px;font-size:11px;color:#6b7280;text-align:right">Cachet</div>
        </div>
      </div>
    `;
  }

  function handlePrint(reference: string) {
    const bon = bons.find((item) => item.reference === reference);
    if (!bon) {
      // Bon supprimé (autre onglet/utilisateur) entre le rendu de la ligne
      // et le clic — sans ce message, imprimer ne faisait rien, ce qui se
      // lisait comme un bouton cassé.
      toastWarning(toast, {
        title: "Bon introuvable",
        description: "Ce bon n'existe plus — rafraîchissez la liste.",
      });
      return;
    }
    printHTML(`Bon ${reference}`, buildBonHTML(bon), resolveSlttBrand(societes));
  }

  async function handleValidateBon(id: string, reference: string) {
    if (validatingIds.has(id)) return;
    setValidatingIds((previous) => new Set(previous).add(id));
    try {
      const stockSuffisant = await validateBon(id);
      if (stockSuffisant) {
        toastSuccess(toast, { title: "Bon validé", description: `${reference} — stock décrémenté.` });
      } else {
        toastWarning(toast, {
          title: "Validation impossible — stock insuffisant",
          description: `${reference} n'a pas été validé : le stock disponible est inférieur à la quantité demandée.`,
        });
      }
    } catch (err: unknown) {
      toastError(toast, err, {
        title: "Impossible de valider le bon",
        fallback: "Impossible de valider le bon de sortie.",
      });
    } finally {
      setValidatingIds((previous) => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
    }
  }

  const tabMeta = {
    marchandise: {
      description: "Sorties de stock : validation, stock et justificatifs clients.",
      cta: "Nouveau bon de sortie",
      onCreate: () => setMarchandiseDialogOpen(true),
    },
    caisse: {
      description: "Décaissements espèces : honoraires, frais divers, justificatifs caisse.",
      cta: "Nouvelle sortie de caisse",
      onCreate: () => setCaisseDialogOpen(true),
    },
  } as const;

  const currentTab = tabMeta[activeTab];

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "marchandise" | "caisse")}
        className="gap-5"
      >
        <PageHeader title="Bons de sortie" description={currentTab.description}>
          {(activeTab === "caisse" ? canWriteCaisse : canWrite) && (
            <Button
              onClick={currentTab.onCreate}
              className="bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold px-5 h-10 rounded-xl shadow-lg shadow-red-600/25 border border-red-500/40 gap-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shrink-0 self-start"
            >
              <Plus className="size-4 shrink-0 stroke-[3]" />
              <span>{currentTab.cta}</span>
            </Button>
          )}
        </PageHeader>

        <TabsList
          className={cn(
            "grid h-auto w-full grid-cols-1 gap-1 p-1.5 bg-muted/60 sm:grid-cols-2",
            "rounded-xl",
          )}
        >
          <TabsTrigger
            value="marchandise"
            className={cn(
              "group h-auto flex-col items-stretch gap-1 rounded-lg px-4 py-3 text-left",
              "data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/80",
              "dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:ring-slate-700",
            )}
          >
            <span className="flex w-full items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    "bg-blue-50 text-blue-700 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500",
                    "dark:bg-blue-950/50 dark:text-blue-300 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
                  )}
                >
                  <Package className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">Marchandises</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    Entreposage · sorties stock
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
                  "group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600",
                  "dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
                )}
              >
                {bons.length}
              </span>
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="caisse"
            className={cn(
              "group h-auto flex-col items-stretch gap-1 rounded-lg px-4 py-3 text-left",
              "data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/80",
              "dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:ring-slate-700",
            )}
          >
            <span className="flex w-full items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    "bg-emerald-50 text-emerald-700 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500",
                    "dark:bg-emerald-950/50 dark:text-emerald-300 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
                  )}
                >
                  <Banknote className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">Caisse</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    Décaissements · espèces
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
                  "group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600",
                  "dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
                )}
              >
                {bonsCaisse.length}
              </span>
            </span>
          </TabsTrigger>
        </TabsList>

        <BonMarchandiseTab
          key={deepLinkSearch ?? "default"}
          bons={bons}
          canWrite={canWrite}
          validatingIds={validatingIds}
          onOpenCreateDialog={() => setMarchandiseDialogOpen(true)}
          onConfirmValidate={setConfirmValidate}
          onPrint={handlePrint}
          initialSearch={deepLinkSearch}
        />

        <BonCaisseTab
          bons={bonsCaisse}
          canWriteCaisse={canWriteCaisse}
          onOpenCreateDialog={openCreateCaisseDialog}
          onOpenEditDialog={openEditCaisseDialog}
        />
      </Tabs>

      <BonFormDialog
        open={marchandiseDialogOpen}
        onOpenChange={setMarchandiseDialogOpen}
        nextReference={nextReference}
        canWrite={canWrite}
      />

      <BonCaisseFormDialog
        key={editingBonCaisse?.id ?? "new"}
        open={caisseDialogOpen}
        onOpenChange={setCaisseDialogOpen}
        nextReference={nextCaisseReference}
        editing={editingBonCaisse}
      />

      <AlertDialog open={!!confirmValidate} onOpenChange={(open) => !open && setConfirmValidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valider le bon {confirmValidate?.ref} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action décrémente réellement le stock de la quantité indiquée sur le bon. Elle n'est pas
              annulable directement depuis cet écran.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmValidate) void handleValidateBon(confirmValidate.id, confirmValidate.ref);
                setConfirmValidate(null);
              }}
            >
              Valider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
