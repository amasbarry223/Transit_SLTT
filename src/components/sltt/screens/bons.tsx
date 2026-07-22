"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Package, Banknote } from "lucide-react";
import type { BonMotif } from "@/lib/domain-types";
import { useStore } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { formatDateShort, formatFCFA } from "@/lib/format";
import { printHTML, htmlEscape } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { BonMarchandiseTab } from "@/components/sltt/bons/bon-marchandise-tab";
import { BonCaisseTab } from "@/components/sltt/bons/bon-caisse-tab";
import { BonFormDialog } from "@/components/sltt/bons/bon-form-dialog";
import { BonCaisseFormDialog } from "@/components/sltt/bons/bon-caisse-form-dialog";

export function BonsScreen() {
  const { toast } = useToast();
  const canWrite = usePermission("bons:write");
  const canWriteCaisse = usePermission("bons:write-caisse");
  const go = useNav((state) => state.go);
  const selectedId = useNav((state) => state.selectedId);
  const selectedSocieteId = useNav((state) => state.selectedSocieteId);

  const allBons = useStore((state) => state.bons);
  const validateBon = useStore((state) => state.validateBon);
  const societes = useStore((state) => state.societes);
  const bonSeq = useStore((state) => state.bonSeq);
  const bonSortieCaisseSeq = useStore((state) => state.bonSortieCaisseSeq);
  const bonsSortieCaisse = useStore((state) => state.bonsSortieCaisse);

  const [activeTab, setActiveTab] = useState<"marchandise" | "caisse">("marchandise");
  const [marchandiseDialogOpen, setMarchandiseDialogOpen] = useState(false);
  const [caisseDialogOpen, setCaisseDialogOpen] = useState(false);
  const [validatingIds, setValidatingIds] = useState<Set<string>>(new Set());
  const [confirmValidate, setConfirmValidate] = useState<{ id: string; ref: string } | null>(null);

  const bons = useMemo(
    () => (selectedSocieteId ? allBons.filter((bon) => bon.societeId === selectedSocieteId) : allBons),
    [allBons, selectedSocieteId],
  );

  const nextReference = `BS-${new Date().getFullYear()}-${String(bonSeq).padStart(4, "0")}`;
  const nextCaisseReference = `N°${bonSortieCaisseSeq}`;

  useEffect(() => {
    if (selectedId === "new") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronise avec le routeur (nav-store) : ouvre le dialogue puis consomme le marqueur "new" de l'URL
      if (canWrite) setMarchandiseDialogOpen(true);
      go("bons");
    }
  }, [selectedId, go, canWrite]);

  function buildBonHTML(bon: {
    reference: string;
    date: string;
    clientNom: string;
    societeNom: string;
    marchandise: string;
    quantite: number;
    unite: string;
    motif: BonMotif;
    montant: number;
  }) {
    const motifColors: Record<string, string> = {
      Vente: "background:#dbeafe;color:#1e3a8a",
      Livraison: "background:#e0e7ff;color:#3730a3",
      Transfert: "background:#fef3c7;color:#92400e",
    };
    return `
      <h1>Bon de sortie — Marchandise</h1>
      <div class="subtitle">Référence : <strong>${htmlEscape(bon.reference)}</strong> · <span class="badge" style="${motifColors[bon.motif] ?? ""}">${htmlEscape(bon.motif)}</span></div>
      <table>
        <tbody>
          <tr><th style="width:40%">Date</th><td>${formatDateShort(bon.date)}</td></tr>
          <tr><th>Société</th><td>${htmlEscape(bon.societeNom)}</td></tr>
          <tr><th>Client</th><td>${htmlEscape(bon.clientNom)}</td></tr>
          <tr><th>Marchandise</th><td>${htmlEscape(bon.marchandise)}</td></tr>
          <tr><th>Quantité sortie</th><td>${bon.quantite} ${htmlEscape(bon.unite)}</td></tr>
          <tr><th>Motif de sortie</th><td>${htmlEscape(bon.motif)}</td></tr>
          <tr class="total-row"><th>Montant</th><td class="num">${formatFCFA(bon.montant)}</td></tr>
        </tbody>
      </table>
      <div style="margin-top:64px;display:flex;justify-content:space-between">
        <div>
          <div style="border-top:1px solid #94a3b8;width:200px;padding-top:6px;font-size:11px;color:#64748b">Signature du responsable</div>
        </div>
        <div>
          <div style="border-top:1px solid #94a3b8;width:200px;padding-top:6px;font-size:11px;color:#64748b;text-align:right">Cachet ${htmlEscape(bon.societeNom)}</div>
        </div>
      </div>
    `;
  }

  function bonBrand(societeId: string) {
    const societe = societes.find((item) => item.id === societeId);
    if (!societe) return undefined;
    return {
      logoUrl: societe.logoUrl,
      name: societe.nom,
      afficherNomAvecLogo: societe.afficherNomAvecLogo,
      legal: {
        adresse: societe.adresse,
        telephone: societe.telephone,
        rccm: societe.rccm,
        nif: societe.nif,
      },
    };
  }

  function handleView(reference: string) {
    const bon = bons.find((item) => item.reference === reference);
    if (!bon) return;
    printHTML(`Bon ${reference}`, buildBonHTML(bon), bonBrand(bon.societeId));
  }

  function handlePrint(reference: string) {
    const bon = bons.find((item) => item.reference === reference);
    if (!bon) return;
    printHTML(`Bon ${reference}`, buildBonHTML(bon), bonBrand(bon.societeId));
    toast({
      title: "Bon prêt à imprimer",
      description: `${reference} — ${bon.clientNom}.`,
    });
  }

  async function handleValidateBon(id: string, reference: string) {
    if (validatingIds.has(id)) return;
    setValidatingIds((previous) => new Set(previous).add(id));
    try {
      const stockSuffisant = await validateBon(id);
      if (stockSuffisant) {
        toast({
          title: "Bon validé",
          description: `${reference} — stock décrémenté.`,
        });
      } else {
        toast({
          title: "Validation impossible — stock insuffisant",
          description: `${reference} n'a pas été validé : le stock disponible est inférieur à la quantité demandée.`,
          variant: "destructive",
        });
      }
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{currentTab.description}</p>
          </div>
          {(activeTab === "caisse" ? canWriteCaisse : canWrite) && (
            <Button onClick={currentTab.onCreate} className="shrink-0 self-start">
              <Plus className="size-4" />
              {currentTab.cta}
            </Button>
          )}
        </div>

        <TabsList
          className={cn(
            "grid h-auto w-full grid-cols-1 gap-1 bg-slate-100/90 p-1.5 dark:bg-slate-800/60 sm:grid-cols-2",
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
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">Marchandises</span>
                  <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">
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
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">Caisse</span>
                  <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">
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
                {bonsSortieCaisse.length}
              </span>
            </span>
          </TabsTrigger>
        </TabsList>

        <BonMarchandiseTab
          bons={bons}
          canWrite={canWrite}
          validatingIds={validatingIds}
          onOpenCreateDialog={() => setMarchandiseDialogOpen(true)}
          onConfirmValidate={setConfirmValidate}
          onView={handleView}
          onPrint={handlePrint}
        />

        <BonCaisseTab canWriteCaisse={canWriteCaisse} onOpenCreateDialog={() => setCaisseDialogOpen(true)} />
      </Tabs>

      <BonFormDialog
        open={marchandiseDialogOpen}
        onOpenChange={setMarchandiseDialogOpen}
        nextReference={nextReference}
        canWrite={canWrite}
      />

      <BonCaisseFormDialog
        open={caisseDialogOpen}
        onOpenChange={setCaisseDialogOpen}
        nextReference={nextCaisseReference}
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
