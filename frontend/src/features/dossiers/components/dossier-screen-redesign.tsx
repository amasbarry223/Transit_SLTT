"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  X,
  FileText,
  Save,
  Loader2,
  ArrowRightCircle,
  Trash2,
  MoreVertical,
  Wallet,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import type { Dossier, DossierStatut } from "@/lib/domain-types";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import {
  MODE_PAIEMENT_LABELS,
  type ModePaiementDossier,
  CATEGORIE_DEPENSE_LABELS,
  type CategorieDepense,
} from "@/lib/domain/dossier-finances";
import { useDossierFormState } from "./dossier-form/use-dossier-form-state";
import { useDossierFormActions } from "./dossier-form/use-dossier-form-actions";
import { useToast } from "@/shared/hooks/use-toast";
import { toastWarning } from "@/shared/utils/toast-helpers";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/shared/utils/cn";

const CATEGORIES_DEPENSES_PRESETS = [
  "Frais de circuit",
  "Port",
  "Avance transport",
  "Frais de frontière",
  "Droit de douane",
  "Transport",
  "Manutention",
  "Divers",
];

const MODES_PAIEMENTS_PRESETS = [
  "Espèces",
  "Virement",
  "Chèque",
  "Mobile Money",
];

interface DossierScreenRedesignProps {
  existingDossier?: Dossier;
  isEdit?: boolean;
  onPdfExport?: () => void;
  onTransition?: () => void;
  onDelete?: () => void;
  nextTransitionLabel?: string | null;
  extraTabsHeader?: React.ReactNode;
}

export function DossierScreenRedesign({
  existingDossier,
  isEdit = false,
  onPdfExport,
  onTransition,
  onDelete,
  nextTransitionLabel,
  extraTabsHeader,
}: DossierScreenRedesignProps) {
  const { go } = useNav();
  const { toast } = useToast();
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const dossiers = useStore((s) => s.dossiers);
  const dossierSeq = useStore((s) => s.dossierSeq);
  const { annexes, activeAnnexeId } = useActiveAnnexe();

  const form = useDossierFormState({
    existing: existingDossier,
    isEdit,
    dossierSeq,
    dossiers,
    societes,
    annexes,
    defaultAnnexeId: activeAnnexeId ?? undefined,
  });

  const { canWrite, saving, handleSave, handlePdf } = useDossierFormActions({
    form,
    isEdit,
    selectedId: existingDossier?.id ?? null,
  });

  // Client actuellement sélectionné (entièrement dynamique)
  const clientActuel = useMemo(() => {
    return (
      clients.find((c) => c.id === form.clientId) ??
      (existingDossier?.clientNom ? { nom: existingDossier.clientNom } : null)
    );
  }, [clients, form.clientId, existingDossier]);

  // État local pour la ligne d'ajout rapide de paiement
  const [newPayDate, setNewPayDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [newPayMode, setNewPayMode] = useState<string>("Espèces");
  const [newPayRef, setNewPayRef] = useState("");
  const [newPayAmount, setNewPayAmount] = useState("");

  // État local pour la ligne d'ajout rapide de dépense
  const [newDepNature, setNewDepNature] = useState("");
  const [newDepCat, setNewDepCat] = useState<string>("Frais de circuit");
  const [newDepAmount, setNewDepAmount] = useState("");

  // Ajouter un paiement dynamiquement
  function handleAddPayment() {
    if (!canWrite) return;
    const rawNum = parseFloat(newPayAmount.replace(/\s+/g, "").replace(",", "."));
    if (isNaN(rawNum) || rawNum <= 0) {
      toastWarning(toast, {
        title: "Montant invalide",
        description: "Veuillez saisir un montant supérieur à 0.",
      });
      return;
    }

    const modeCode =
      newPayMode === "Espèces"
        ? "ESPECES"
        : newPayMode === "Virement"
          ? "VIREMENT"
          : newPayMode === "Chèque"
            ? "CHEQUE"
            : "ORANGE_MONEY";

    form.addPaiement({
      date: newPayDate || new Date().toISOString().slice(0, 10),
      mode: modeCode as any,
      reference: newPayRef.trim() || undefined,
      montant: String(rawNum),
    });

    setNewPayAmount("");
    setNewPayRef("");
  }

  // Ajouter une dépense dynamiquement
  function handleAddDepense() {
    if (!canWrite) return;
    const rawNum = parseFloat(newDepAmount.replace(/\s+/g, "").replace(",", "."));
    if (isNaN(rawNum) || rawNum <= 0) {
      toastWarning(toast, {
        title: "Montant invalide",
        description: "Veuillez saisir un montant de dépense supérieur à 0.",
      });
      return;
    }

    const catCode =
      newDepCat === "Droit de douane"
        ? "DOUANE"
        : newDepCat === "Transport" || newDepCat === "Avance transport"
          ? "TRANSPORT"
          : newDepCat === "Port"
            ? "FRAIS_PORTUAIRES"
            : newDepCat === "Manutention"
              ? "MANUTENTION"
              : "DIVERS";

    form.addDepense({
      date: new Date().toISOString().slice(0, 10),
      nature: newDepNature.trim() || newDepCat,
      categorie: catCode as any,
      montant: String(rawNum),
    });

    setNewDepNature("");
    setNewDepAmount("");
  }

  // Saisie du montant Total Contrat
  function handleTotalContratChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!canWrite) return;
    const val = e.target.value.replace(/[^\d]/g, "");
    form.setTotalContrat(val);
  }

  // Format d'affichage du total contrat dans la grande boîte
  const totalContratDisplay = useMemo(() => {
    if (!form.totalContrat) return "";
    const num = parseInt(form.totalContrat, 10);
    return isNaN(num) ? form.totalContrat : formatFCFA(num, false);
  }, [form.totalContrat]);

  // Statut dynamique & Badge
  const statutActuel: DossierStatut =
    existingDossier?.statut ?? (form.statut || "En cours");
  const isFinancierementSolde =
    form.finances.resteAPayer <= 0 && form.finances.montantPaye > 0;

  // Marge calculée en temps réel
  const margeCalc = useMemo(() => {
    if (!form.finances.totalContrat || form.finances.totalContrat <= 0) return "0,0";
    const pct = (form.finances.beneficeNet / form.finances.totalContrat) * 100;
    return pct.toFixed(1).replace(".", ",");
  }, [form.finances.beneficeNet, form.finances.totalContrat]);

  // Taux de recouvrement du contrat (0 à 100%)
  const tauxRecouvrement = useMemo(() => {
    if (!form.finances.totalContrat || form.finances.totalContrat <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((form.finances.montantPaye / form.finances.totalContrat) * 100)));
  }, [form.finances.montantPaye, form.finances.totalContrat]);

  // Position de trésorerie directe du dossier (Cashflow actuel SLTT)
  const soldeTresorerie = useMemo(() => {
    return form.finances.montantPaye - form.finances.totalDepenses;
  }, [form.finances.montantPaye, form.finances.totalDepenses]);

  // Ventilation des débours par catégorie
  const depensesParCategorie = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of form.depenses) {
      const montant = parseFloat(d.montant.replace(/\s+/g, "").replace(",", ".")) || 0;
      if (montant > 0) {
        const cat =
          (d.categorie && CATEGORIE_DEPENSE_LABELS[d.categorie as CategorieDepense]) ||
          d.categorie ||
          "Divers";
        map[cat] = (map[cat] || 0) + montant;
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [form.depenses]);

  // Sauvegarde dynamique
  async function onSaveClick() {
    if (!form.clientId) {
      toastWarning(toast, {
        title: "Client obligatoire",
        description: "Veuillez sélectionner un client pour ce dossier.",
      });
      return;
    }
    await handleSave();
  }

  return (
    <div className="w-full space-y-6 pb-12 font-sans text-slate-800 dark:text-slate-100">
      {extraTabsHeader}

      {/* 1. Fil d'Ariane (Breadcrumbs) */}
      <nav className="flex items-center gap-1.5 text-xs text-[#2563eb] font-medium">
        <button
          type="button"
          onClick={() => go("dossiers")}
          className="hover:underline transition-colors"
        >
          Dossiers
        </button>
        <span className="text-slate-400 font-normal">›</span>
        <span className="text-slate-500 dark:text-slate-400 font-normal">
          {isEdit ? form.reference || "Détail dossier" : "Nouveau dossier"}
        </span>
      </nav>

      {/* 2. En-tête Titre, Client, Date & Badge Statut */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {form.nature.trim() ||
              (isEdit
                ? existingDossier?.nature || `Dossier ${form.reference}`
                : "Nouveau dossier de transit")}
          </h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            <span>Client :</span>
            <span className="font-semibold text-[#2563eb] dark:text-blue-400">
              {clientActuel?.nom || "Aucun client sélectionné"}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span>{form.date ? formatDateShort(form.date) : "—"}</span>
          </div>
        </div>

        {/* Badge Statut opérationnel dynamique & indicateur de paiement */}
        <div className="flex items-center gap-2 self-start flex-wrap">
          {isFinancierementSolde && statutActuel !== "Soldé" && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shadow-xs">
              <span className="size-2 rounded-full bg-emerald-500" />
              Payé à 100%
            </span>
          )}

          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold shadow-xs border",
              statutActuel === "Soldé"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                : statutActuel === "Dédouané"
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                  : statutActuel === "Livré"
                    ? "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                    : "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                statutActuel === "Soldé"
                  ? "bg-emerald-500"
                  : statutActuel === "Dédouané"
                    ? "bg-indigo-500"
                    : statutActuel === "Livré"
                      ? "bg-purple-500"
                      : "bg-blue-500",
              )}
            />
            {statutActuel}
          </span>

          {(onTransition || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onTransition && nextTransitionLabel && (
                  <DropdownMenuItem onClick={onTransition} className="gap-2">
                    <ArrowRightCircle className="size-4 text-blue-600" />
                    <span>{nextTransitionLabel}</span>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="gap-2 text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="size-4" />
                    <span>Supprimer le dossier</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* 3. Grille Principale en Plein Écran (Full Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* Colonne Gauche (Sections 1 à 4) */}
        <div className="space-y-6 lg:col-span-8 w-full">
          {/* SECTION 1: Informations */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5 w-full">
            <div className="flex items-center gap-3">
              <div className="size-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold text-sm flex items-center justify-center shrink-0">
                1
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Informations
              </h2>
            </div>

            <div className="space-y-4">
              {/* Row 1: Client & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                    Client
                  </label>
                  <Select
                    value={form.clientId}
                    disabled={!canWrite}
                    onValueChange={(val) => {
                      form.setClientId(val);
                      form.setTouched((p) => ({ ...p, clientId: true }));
                    }}
                  >
                    <SelectTrigger className="h-10 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white text-slate-900 dark:text-slate-100 w-full disabled:opacity-60 disabled:cursor-not-allowed">
                      <SelectValue placeholder="Sélectionner le client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                    Date
                  </label>
                  <Input
                    type="date"
                    disabled={!canWrite}
                    className="h-10 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white text-slate-900 dark:text-slate-100 w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    value={form.date}
                    onChange={(e) => form.setDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 2: Nature, Quantité, Facture N° */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                    Nature de la marchandise
                  </label>
                  <Input
                    disabled={!canWrite}
                    className="h-10 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white text-slate-900 dark:text-slate-100 w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Ex. Conteneur pompes à eau, matériel..."
                    value={form.nature}
                    onChange={(e) => form.setNature(e.target.value)}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                    Quantité
                  </label>
                  <Input
                    disabled={!canWrite}
                    className="h-10 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white text-slate-900 dark:text-slate-100 w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Ex. 1"
                    value={form.nombreColis}
                    onChange={(e) => form.setNombreColis(e.target.value)}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                    Facture N° / BL
                  </label>
                  <Input
                    disabled={!canWrite}
                    className="h-10 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white text-slate-900 dark:text-slate-100 w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Ex. 0124"
                    value={form.bl}
                    onChange={(e) => form.setBl(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 3: Mode, N° conteneur, Poids total (kg) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                    Mode
                  </label>
                  <Select
                    value={form.modeTransport || "Maritime"}
                    disabled={!canWrite}
                    onValueChange={form.setModeTransport}
                  >
                    <SelectTrigger className="h-10 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white text-slate-900 dark:text-slate-100 w-full disabled:opacity-60 disabled:cursor-not-allowed">
                      <SelectValue placeholder="Maritime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maritime">Maritime</SelectItem>
                      <SelectItem value="Aérien">Aérien</SelectItem>
                      <SelectItem value="Routier">Routier</SelectItem>
                      <SelectItem value="Ferroviaire">Ferroviaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                    N° conteneur
                  </label>
                  <Input
                    disabled={!canWrite}
                    className="h-10 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white text-slate-900 dark:text-slate-100 w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Ex. CONT123456"
                    value={form.noConteneur}
                    onChange={(e) => form.setNoConteneur(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                    Poids total (kg)
                  </label>
                  <Input
                    disabled={!canWrite}
                    className="h-10 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white text-slate-900 dark:text-slate-100 w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Ex. 15 000 kg"
                    value={form.poidsTotal}
                    onChange={(e) => form.setPoidsTotal(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Total contrat */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4 w-full">
            <div className="flex items-center gap-3">
              <div className="size-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold text-sm flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Total contrat
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  Montant convenu avec le client
                </p>
              </div>
            </div>

            <div className="rounded-xl border-2 border-blue-600 bg-white dark:bg-slate-900 py-3.5 px-6 flex items-center justify-center gap-2 shadow-xs w-full">
              <input
                type="text"
                disabled={!canWrite}
                className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight text-center bg-transparent border-0 outline-none w-full max-w-[340px] disabled:opacity-60 disabled:cursor-not-allowed"
                value={totalContratDisplay}
                onChange={handleTotalContratChange}
                placeholder="0"
              />
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 shrink-0">
                FCFA
              </span>
            </div>
          </div>

          {/* SECTION 3: Paiements du client */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="size-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-sm flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Paiements du client
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                    Chaque versement reçu pour ce dossier
                  </p>
                </div>
              </div>

              <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 sm:text-right">
                Total payé{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400 ml-1">
                  {formatFCFA(form.finances.montantPaye)}
                </span>
              </div>
            </div>

            {/* En-têtes du tableau */}
            <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 px-1">
              <div className="col-span-3">Date</div>
              <div className="col-span-3">Mode</div>
              <div className="col-span-3">Référence</div>
              <div className="col-span-2 text-right">Montant</div>
              <div className="col-span-1 text-center"></div>
            </div>

            {/* Liste des paiements existants */}
            <div className="space-y-2">
              {form.paiements.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 italic">
                  Aucun versement enregistré. Utilisez la ligne ci-dessous pour en ajouter un.
                </div>
              ) : (
                form.paiements.map((p) => {
                  const modeLabel =
                    (p.mode && MODE_PAIEMENT_LABELS[p.mode as ModePaiementDossier]) ||
                    p.mode ||
                    "Autre";

                  return (
                    <div
                      key={p.key}
                      className="grid grid-cols-12 gap-2 items-center text-xs sm:text-sm py-2 px-1 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-lg transition-colors"
                    >
                      <div className="col-span-3 font-medium text-slate-800 dark:text-slate-200">
                        {p.date ? formatDateShort(p.date) : "—"}
                      </div>
                      <div className="col-span-3">
                        <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-0.5 rounded-full text-xs font-medium">
                          {modeLabel}
                        </span>
                      </div>
                      <div className="col-span-3 text-slate-500 dark:text-slate-400 truncate">
                        {p.reference || "—"}
                      </div>
                      <div className="col-span-2 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatFCFA(parseFloat(p.montant) || 0, false)}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          disabled={!canWrite}
                          onClick={() => form.removePaiement(p.key)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Supprimer ce paiement"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Formulaire d'ajout rapide de paiement en ligne (Bouton vert fonctionnel) */}
            <div className="grid grid-cols-12 gap-2 items-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="col-span-3">
                <Input
                  type="date"
                  disabled={!canWrite}
                  className="h-9 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-lg text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                  value={newPayDate}
                  onChange={(e) => setNewPayDate(e.target.value)}
                />
              </div>

              <div className="col-span-3">
                <Select value={newPayMode} onValueChange={setNewPayMode} disabled={!canWrite}>
                  <SelectTrigger className="h-9 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-lg text-xs disabled:opacity-60 disabled:cursor-not-allowed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODES_PAIEMENTS_PRESETS.map((m) => (
                      <SelectItem key={m} value={m} className="text-xs">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-3">
                <Input
                  disabled={!canWrite}
                  className="h-9 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-lg text-xs placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Optionnel"
                  value={newPayRef}
                  onChange={(e) => setNewPayRef(e.target.value)}
                />
              </div>

              <div className="col-span-2">
                <Input
                  disabled={!canWrite}
                  className="h-9 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-lg text-xs text-right placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Montant"
                  value={newPayAmount}
                  onChange={(e) => setNewPayAmount(e.target.value.replace(/[^\d]/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPayment();
                    }
                  }}
                />
              </div>

              <div className="col-span-1 text-center">
                <Button
                  type="button"
                  onClick={handleAddPayment}
                  disabled={!canWrite}
                  className="size-9 p-0 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Ajouter le paiement"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* SECTION 4: Dépenses */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="size-7 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 font-bold text-sm flex items-center justify-center shrink-0">
                  4
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Dépenses
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                    Douane, circuit, transport, port... une ligne par frais
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
              Total dépenses{" "}
              <span className="font-bold text-[#c2410c] dark:text-orange-400 ml-1">
                {formatFCFA(form.finances.totalDepenses)}
              </span>
            </div>

            {/* En-têtes du tableau */}
            <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 px-1">
              <div className="col-span-5">Nature</div>
              <div className="col-span-3">Catégorie</div>
              <div className="col-span-3 text-right">Montant</div>
              <div className="col-span-1 text-center"></div>
            </div>

            {/* Liste des dépenses existantes */}
            <div className="space-y-2">
              {form.depenses.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 italic">
                  Aucune dépense enregistrée. Utilisez la ligne ci-dessous pour en ajouter une.
                </div>
              ) : (
                form.depenses.map((d) => {
                  const catLabel =
                    (d.categorie && CATEGORIE_DEPENSE_LABELS[d.categorie as CategorieDepense]) ||
                    d.categorie ||
                    "Frais divers";

                  return (
                    <div
                      key={d.key}
                      className="grid grid-cols-12 gap-2 items-center text-xs sm:text-sm py-2 px-1 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-lg transition-colors"
                    >
                      <div className="col-span-5 font-medium text-slate-800 dark:text-slate-200">
                        {d.nature || "Frais divers"}
                      </div>
                      <div className="col-span-3">
                        <span className="inline-block bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                          {catLabel}
                        </span>
                      </div>
                      <div className="col-span-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatFCFA(parseFloat(d.montant) || 0, false)}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          disabled={!canWrite}
                          onClick={() => form.removeDepense(d.key)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Supprimer cette dépense"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Formulaire d'ajout rapide de dépense en ligne (Bouton rouille fonctionnel) */}
            <div className="grid grid-cols-12 gap-2 items-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="col-span-5">
                <Input
                  disabled={!canWrite}
                  className="h-9 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-lg text-xs placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Ex. Frais de magasinage, manutention..."
                  value={newDepNature}
                  onChange={(e) => setNewDepNature(e.target.value)}
                />
              </div>

              <div className="col-span-3">
                <Select value={newDepCat} onValueChange={setNewDepCat} disabled={!canWrite}>
                  <SelectTrigger className="h-9 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-lg text-xs disabled:opacity-60 disabled:cursor-not-allowed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES_DEPENSES_PRESETS.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-3">
                <Input
                  disabled={!canWrite}
                  className="h-9 bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-lg text-xs text-right placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Montant"
                  value={newDepAmount}
                  onChange={(e) => setNewDepAmount(e.target.value.replace(/[^\d]/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddDepense();
                    }
                  }}
                />
              </div>

              <div className="col-span-1 text-center">
                <Button
                  type="button"
                  onClick={handleAddDepense}
                  disabled={!canWrite}
                  className="size-9 p-0 rounded-lg bg-[#c2410c] hover:bg-[#9a3412] text-white shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Ajouter la dépense"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Droite (Carte Récapitulatif Refondue - Full Width & Sticky) */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 w-full space-y-4">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5 w-full">
            {/* 1. En-tête Récapitulatif & Statut Recouvrement */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Wallet className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                      Récapitulatif
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Bilan financier & opérationnel
                    </p>
                  </div>
                </div>

                {/* Badge statut de paiement dynamique */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border",
                    form.finances.totalContrat <= 0
                      ? "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      : form.finances.resteAPayer < 0
                        ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                        : form.finances.montantPaye === 0
                          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                          : form.finances.resteAPayer === 0
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      form.finances.totalContrat <= 0
                        ? "bg-slate-400"
                        : form.finances.resteAPayer < 0
                          ? "bg-purple-500"
                          : form.finances.montantPaye === 0
                            ? "bg-red-500"
                            : form.finances.resteAPayer === 0
                              ? "bg-emerald-500"
                              : "bg-amber-500",
                    )}
                  />
                  {form.finances.totalContrat <= 0
                    ? "Nouveau"
                    : form.finances.resteAPayer < 0
                      ? "Trop-perçu"
                      : form.finances.montantPaye === 0
                        ? "Impayé (0%)"
                        : form.finances.resteAPayer === 0
                          ? "Soldé (100%)"
                          : `Partiel (${tauxRecouvrement}%)`}
                </span>
              </div>

              {/* Jauge visuelle de recouvrement */}
              {form.finances.totalContrat > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Recouvrement client</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {tauxRecouvrement}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300 rounded-full",
                        tauxRecouvrement === 100
                          ? "bg-emerald-500"
                          : tauxRecouvrement > 0
                            ? "bg-amber-500"
                            : "bg-slate-300 dark:bg-slate-700",
                      )}
                      style={{ width: `${tauxRecouvrement}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Lignes Chiffrées du Contrat */}
            <div className="space-y-3 text-sm divide-y divide-slate-100 dark:divide-slate-800/80">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  Total contrat
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {formatFCFA(form.finances.totalContrat)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2.5">
                <div className="flex flex-col">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Montant payé
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {form.paiements.length} versement{form.paiements.length > 1 ? "s" : ""} reçu{form.paiements.length > 1 ? "s" : ""}
                  </span>
                </div>
                <span
                  className={cn(
                    "font-extrabold tabular-nums",
                    form.finances.montantPaye > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400 dark:text-slate-500",
                  )}
                >
                  {formatFCFA(form.finances.montantPaye)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2.5">
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {form.finances.resteAPayer < 0 ? "Trop-perçu client" : "Reste à payer"}
                </span>
                <span
                  className={cn(
                    "font-extrabold tabular-nums",
                    form.finances.resteAPayer < 0
                      ? "text-purple-600 dark:text-purple-400"
                      : form.finances.resteAPayer === 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {formatFCFA(Math.abs(form.finances.resteAPayer))}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2.5">
                <div className="flex flex-col">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Dépenses
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {form.depenses.length} débours enregistré{form.depenses.length > 1 ? "s" : ""}
                  </span>
                </div>
                <span className="font-extrabold text-[#c2410c] dark:text-orange-400 tabular-nums">
                  {formatFCFA(form.finances.totalDepenses)}
                </span>
              </div>
            </div>

            {/* 3. Bloc Indicateur Métier Transit : Position de Trésorerie Caisse SLTT */}
            {form.finances.totalDepenses > 0 && (
              <div
                className={cn(
                  "p-3 rounded-xl border text-xs space-y-1 transition-all",
                  soldeTresorerie < 0
                    ? "bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/80 text-amber-900 dark:text-amber-200"
                    : "bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200",
                )}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    {soldeTresorerie < 0 ? (
                      <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    )}
                    {soldeTresorerie < 0 ? "Avance de fonds SLTT" : "Trésorerie couverte"}
                  </span>
                  <span className="font-extrabold tabular-nums">
                    {soldeTresorerie < 0 ? "-" : "+"}
                    {formatFCFA(Math.abs(soldeTresorerie))}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {soldeTresorerie < 0
                    ? "L'agence avance les frais sur sa trésorerie en attente du paiement client."
                    : "Les versements reçus couvrent les dépenses engagées à ce jour."}
                </p>
              </div>
            )}

            {/* 4. Bloc Héro Bénéfice Net & Marge Commerciale */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>Bénéfice net</span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    form.finances.beneficeNet >= 0
                      ? "bg-emerald-100/60 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-red-100/60 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
                  )}
                >
                  {form.finances.beneficeNet >= 0 ? "Rentable" : "Déficit"}
                </span>
              </div>

              <div
                className={cn(
                  "text-3xl font-black tracking-tight tabular-nums pt-1",
                  form.finances.beneficeNet >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {form.finances.beneficeNet >= 0 ? "+" : ""}
                {formatFCFA(form.finances.beneficeNet)}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 pt-0.5 font-medium">
                Marge <span className="font-bold text-slate-700 dark:text-slate-200">{margeCalc} %</span> · Total contrat – Dépenses
              </p>
            </div>

            {/* 5. Ventilation des dépenses par catégorie (si existantes) */}
            {depensesParCategorie.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Postes de dépenses
                </span>
                <div className="space-y-1.5 text-xs">
                  {depensesParCategorie.slice(0, 4).map(([cat, montant]) => (
                    <div key={cat} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="truncate pr-2 text-[11px]">{cat}</span>
                      <span className="font-semibold text-slate-900 dark:text-white shrink-0 tabular-nums text-[11px]">
                        {formatFCFA(montant)}
                      </span>
                    </div>
                  ))}
                  {depensesParCategorie.length > 4 && (
                    <span className="text-[10px] text-slate-400 italic block pt-0.5">
                      + {depensesParCategorie.length - 4} autre(s) poste(s)...
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 6. Synthèse Opérationnelle du Dossier (Toutes les données de la page) */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Fiche d&apos;expédition
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 truncate">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Client</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block" title={clientActuel?.nom || ""}>
                    {clientActuel?.nom || "Non renseigné"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 truncate">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Mode</span>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {form.modeTransport || "Maritime"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 truncate">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Colis / Poids</span>
                  <span className="font-bold text-slate-900 dark:text-white block truncate">
                    {form.nombreColis ? `${form.nombreColis} colis` : "—"} · {form.poidsTotal ? `${form.poidsTotal} kg` : "—"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 truncate">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">BL / Conteneur</span>
                  <span className="font-bold text-slate-900 dark:text-white block truncate" title={form.noConteneur || form.bl}>
                    {form.noConteneur || form.bl || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* 7. Boutons d'action (Enregistrer le dossier & Générer le PDF) */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                onClick={onSaveClick}
                disabled={!canWrite || saving}
                className="w-full h-11 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold rounded-xl shadow-xs text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {saving ? "Enregistrement…" : "Enregistrer le dossier"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onPdfExport ?? handlePdf}
                className="w-full h-11 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="size-4 text-slate-500 dark:text-slate-400" />
                Générer le PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
