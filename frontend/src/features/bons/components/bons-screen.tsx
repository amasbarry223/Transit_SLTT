"use client";

import { useEffect, useMemo, useState } from "react";
import { FileSpreadsheet, Plus, Package, Banknote, Truck } from "lucide-react";
import type { BonLigne, BonLivraison, BonSortie, BonSortieCaisse } from "@/lib/domain-types";
import { useStore } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { formatDateShort, formatFCFA } from "@/lib/format";
import { printHTML, htmlEscape, exportToExcel } from "@/lib/export";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/shared/utils/toast-helpers";
import { usePermission, useCurrentUser } from "@/shared/hooks/use-permission";
import { useSession } from "@/lib/session/session-store";
import { normalizeRole } from "@/lib/permissions";
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
import { BonLivraisonTab } from "./bons/bon-livraison-tab";
import { BonLivraisonFormDialog } from "./bons/bon-livraison-form-dialog";
import { BonLivraisonPreviewDialog } from "./bons/bon-livraison-preview-dialog";

type BonsTab = "marchandise" | "caisse" | "livraison";

export function BonsScreen() {
  const { toast } = useToast();
  const sessionRole = useSession((state) => state.currentRole);
  const currentUser = useCurrentUser();
  const effectiveRole = currentUser?.role || sessionRole;
  const isAdmin = normalizeRole(effectiveRole) === "Administrateur";
  const canWrite = usePermission("bons:write") || isAdmin;
  const canWriteCaisse = usePermission("bons:write-caisse") || isAdmin;
  const go = useNav((state) => state.go);
  const selectedId = useNav((state) => state.selectedId);
  const { selectedAnnexeId } = useActiveAnnexe();

  const allBons = useStore((state) => state.bons);
  const validateBon = useStore((state) => state.validateBon);
  const removeBon = useStore((state) => state.removeBon);
  const societes = useStore((state) => state.societes);
  const bonSeq = useStore((state) => state.bonSeq);
  const bonSortieCaisseSeq = useStore((state) => state.bonSortieCaisseSeq);
  const bonsSortieCaisse = useStore((state) => state.bonsSortieCaisse);
  const allBonsLivraison = useStore((state) => state.bonsLivraison);

  const [activeTab, setActiveTab] = useState<BonsTab>("marchandise");
  // Bon de livraison : création (depuis un bon de sortie), édition, aperçu.
  const [livraisonSource, setLivraisonSource] = useState<BonSortie | null>(null);
  const [editingLivraison, setEditingLivraison] = useState<BonLivraison | null>(null);
  const [livraisonPreview, setLivraisonPreview] = useState<BonLivraison | null>(null);
  const [marchandiseDialogOpen, setMarchandiseDialogOpen] = useState(false);
  const [caisseDialogOpen, setCaisseDialogOpen] = useState(false);
  const [editingBonMarchandise, setEditingBonMarchandise] = useState<BonSortie | null>(null);
  const [editingBonCaisse, setEditingBonCaisse] = useState<BonSortieCaisse | null>(null);
  const [bonDeleteTarget, setBonDeleteTarget] = useState<BonSortie | null>(null);
  const [validatingIds, setValidatingIds] = useState<Set<string>>(new Set());
  const [confirmValidate, setConfirmValidate] = useState<{ id: string; ref: string } | null>(null);
  const [deepLinkSearch, setDeepLinkSearch] = useState<string | undefined>(undefined);

  function openCreateMarchandiseDialog() {
    setEditingBonMarchandise(null);
    setMarchandiseDialogOpen(true);
  }

  function openEditMarchandiseDialog(bon: BonSortie) {
    setEditingBonMarchandise(bon);
    setMarchandiseDialogOpen(true);
  }

  function openCreateCaisseDialog() {
    setEditingBonCaisse(null);
    setCaisseDialogOpen(true);
  }

  function openEditCaisseDialog(bon: BonSortieCaisse) {
    setEditingBonCaisse(bon);
    setCaisseDialogOpen(true);
  }

  /** Un bon de sortie n'a qu'un bon de livraison : s'il existe, on l'ouvre
   *  (aperçu/impression) plutôt que de proposer un doublon voué au 409. */
  function handleLivraisonFromBonSortie(bon: BonSortie) {
    const existing = allBonsLivraison.find((bl) => bl.bonSortieId === bon.id);
    if (existing) setLivraisonPreview(existing);
    else setLivraisonSource(bon);
  }

  async function handleDeleteBon(bon: BonSortie) {
    try {
      await removeBon(bon.id);
      toastSuccess(toast, {
        title: "Bon supprimé",
        description: `Le bon ${bon.reference} a été supprimé.`,
      });
    } catch (err) {
      toastError(toast, err, { title: "Impossible de supprimer le bon" });
    } finally {
      setBonDeleteTarget(null);
    }
  }

  const bons = useMemo(
    () => filterByAnnexe(allBons, selectedAnnexeId),
    [allBons, selectedAnnexeId],
  );

  const bonsLivraison = useMemo(
    () => filterByAnnexe(allBonsLivraison, selectedAnnexeId),
    [allBonsLivraison, selectedAnnexeId],
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
      if (canWrite) {
        setEditingBonMarchandise(null);
        setMarchandiseDialogOpen(true);
      }
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
      onCreate: openCreateMarchandiseDialog,
    },
    caisse: {
      description: "Décaissements espèces : honoraires, frais divers, justificatifs caisse.",
      cta: "Nouvelle sortie de caisse",
      onCreate: openCreateCaisseDialog,
    },
    // Pas de création directe : un bon de livraison naît toujours d'un bon
    // de sortie validé (icône camion dans l'onglet Marchandises).
    livraison: {
      description: "Livraisons clients : bon N° LIV, transporteur et réception signée.",
      cta: null,
      onCreate: null,
    },
  } as const;

  const currentTab = tabMeta[activeTab];

  async function handleExportExcel() {
    if (activeTab === "marchandise") {
      await exportToExcel(
        "bons",
        `bons-sortie-marchandises-${new Date().toISOString().slice(0, 10)}`,
        [
          { header: "Référence", accessor: (b) => b.reference },
          { header: "Date", accessor: (b) => b.date },
          { header: "Client", accessor: (b) => b.clientNom },
          { header: "Marchandise", accessor: (b) => b.marchandise },
          { header: "Quantité", accessor: (b) => `${b.quantite} ${b.unite}` },
          { header: "Montant (FCFA)", accessor: (b) => b.montant },
          { header: "Motif", accessor: (b) => b.motif },
          { header: "Statut", accessor: (b) => b.statut },
        ],
        bons,
        { module: "Bons" },
      );
    } else if (activeTab === "livraison") {
      await exportToExcel(
        "bons",
        `bons-livraison-${new Date().toISOString().slice(0, 10)}`,
        [
          { header: "Référence", accessor: (b) => b.reference },
          { header: "Date", accessor: (b) => b.date },
          { header: "Client", accessor: (b) => b.clientNom },
          { header: "Bon de sortie", accessor: (b) => b.bonSortieReference || "" },
          { header: "Articles", accessor: (b) => b.lignes.map((l) => `${l.marchandise} (${l.quantite} ${l.unite})`).join(", ") },
          { header: "Transporteur", accessor: (b) => b.transporteurNom || "" },
          { header: "Immatriculation", accessor: (b) => b.immatriculation || "" },
          { header: "Chauffeur", accessor: (b) => b.chauffeurNom || "" },
          { header: "Statut", accessor: (b) => b.statut },
        ],
        bonsLivraison,
        { module: "Bons" },
      );
    } else {
      await exportToExcel(
        "bons",
        `bons-sortie-caisse-${new Date().toISOString().slice(0, 10)}`,
        [
          { header: "Référence", accessor: (b) => b.reference },
          { header: "Date", accessor: (b) => b.date },
          { header: "Montant Total (FCFA)", accessor: (b) => b.montantTotal },
          { header: "Bénéficiaires", accessor: (b) => b.lignes.map((l) => l.beneficiaire).filter(Boolean).join(", ") },
          { header: "Motifs", accessor: (b) => b.lignes.map((l) => l.motif).filter(Boolean).join(", ") },
          { header: "Créé par", accessor: (b) => b.creePar || "" },
        ],
        bonsCaisse,
        { module: "Bons" },
      );
    }
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as BonsTab)}
        className="gap-5"
      >
        <PageHeader title="Bons de sortie" description={currentTab.description}>
          <div className="flex items-center gap-2">
            {{ marchandise: bons, caisse: bonsCaisse, livraison: bonsLivraison }[activeTab].length > 0 && (
              <Button
                variant="outline"
                onClick={handleExportExcel}
                className="gap-2 font-semibold h-10 rounded-xl"
              >
                <FileSpreadsheet className="size-4 text-emerald-600" />
                <span>Exporter Excel</span>
              </Button>
            )}
            {currentTab.onCreate && (activeTab === "caisse" ? canWriteCaisse : canWrite) && (
              <Button
                onClick={currentTab.onCreate}
                className="bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold px-5 h-10 rounded-xl shadow-lg shadow-red-600/25 border border-red-500/40 gap-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shrink-0 self-start"
              >
                <Plus className="size-4 shrink-0 stroke-[3]" />
                <span>{currentTab.cta}</span>
              </Button>
            )}
          </div>
        </PageHeader>

        <TabsList
          className={cn(
            "grid h-auto w-full grid-cols-1 gap-1 p-1.5 bg-muted/60 sm:grid-cols-3",
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

          <TabsTrigger
            value="livraison"
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
                    "bg-violet-50 text-violet-700 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500",
                    "dark:bg-violet-950/50 dark:text-violet-300 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
                  )}
                >
                  <Truck className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">Livraison</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    Bons de livraison · clients
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
                  "group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600",
                  "dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
                )}
              >
                {bonsLivraison.length}
              </span>
            </span>
          </TabsTrigger>
        </TabsList>

        <BonMarchandiseTab
          key={deepLinkSearch ?? "default"}
          bons={bons}
          canWrite={canWrite}
          validatingIds={validatingIds}
          onOpenCreateDialog={openCreateMarchandiseDialog}
          onOpenEditDialog={openEditMarchandiseDialog}
          onDeleteBon={setBonDeleteTarget}
          onConfirmValidate={setConfirmValidate}
          onPrint={handlePrint}
          onLivraison={handleLivraisonFromBonSortie}
          initialSearch={deepLinkSearch}
        />

        <BonCaisseTab
          bons={bonsCaisse}
          canWriteCaisse={canWriteCaisse}
          onOpenCreateDialog={openCreateCaisseDialog}
          onOpenEditDialog={openEditCaisseDialog}
        />

        <BonLivraisonTab
          bons={bonsLivraison}
          canWrite={canWrite}
          onPrint={setLivraisonPreview}
          onEdit={setEditingLivraison}
        />
      </Tabs>

      <BonLivraisonFormDialog
        key={editingLivraison?.id ?? livraisonSource?.id ?? "none"}
        open={!!livraisonSource || !!editingLivraison}
        onOpenChange={(open) => {
          if (open) return;
          setLivraisonSource(null);
          setEditingLivraison(null);
        }}
        bonSortie={livraisonSource}
        editing={editingLivraison}
        // Création : on enchaîne sur l'aperçu, le bon doit partir imprimé
        // avec la marchandise.
        onSaved={(bl) => {
          if (!editingLivraison) setLivraisonPreview(bl);
        }}
      />

      <BonLivraisonPreviewDialog bon={livraisonPreview} onClose={() => setLivraisonPreview(null)} />

      <BonFormDialog
        key={editingBonMarchandise?.id ?? "new"}
        open={marchandiseDialogOpen}
        onOpenChange={(open) => {
          setMarchandiseDialogOpen(open);
          if (!open) setEditingBonMarchandise(null);
        }}
        nextReference={nextReference}
        canWrite={canWrite || isAdmin}
        editing={editingBonMarchandise}
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

      <AlertDialog open={!!bonDeleteTarget} onOpenChange={(open) => !open && setBonDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le bon {bonDeleteTarget?.reference} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {bonDeleteTarget?.statut === "Validé"
                ? `Ce bon est validé : la quantité sortie (${bonDeleteTarget.quantite} ${bonDeleteTarget.unite}) sera remise en stock et un mouvement d'annulation sera tracé.${
                    allBonsLivraison.some((bl) => bl.bonSortieId === bonDeleteTarget.id)
                      ? " Le bon de livraison associé sera également supprimé."
                      : ""
                  } Cette action est irréversible.`
                : "Cette action est irréversible. Le bon de sortie et ses lignes associées seront définitivement supprimés."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (bonDeleteTarget) void handleDeleteBon(bonDeleteTarget);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
