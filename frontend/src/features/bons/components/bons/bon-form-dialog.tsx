"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Check, FilePen, Package, Plus, Trash2, Truck } from "lucide-react";
import type { BonMotif, BonSortie, StockItem } from "@/lib/domain-types";
import { useStore } from "@/lib/store";
import { QuickClientButton } from "@/features/clients";
import { formatDateShort, formatFCFA } from "@/lib/format";
import { useCurrentUser } from "@/shared/hooks/use-permission";
import { useSession } from "@/lib/session/session-store";
import { normalizeRole } from "@/lib/permissions";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/shared/utils/toast-helpers";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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
import { computeAnnexeScopedReference } from "@/lib/store/reference";
import { resolveSlttBrand } from "@/lib/societe-brand";
import { BON_MOTIFS } from "./use-bon-filters";

type BonFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextReference: string;
  canWrite: boolean;
  editing?: BonSortie | null;
};

interface FormArticleLigne {
  id: string;
  stockId: string;
  quantite: string;
  montant: string;
}

function createEmptyLigne(): FormArticleLigne {
  return {
    id: crypto.randomUUID(),
    stockId: "",
    quantite: "",
    montant: "",
  };
}

export function BonFormDialog({ open, onOpenChange, nextReference, canWrite, editing }: BonFormDialogProps) {
  const { toast } = useToast();
  const sessionRole = useSession((state) => state.currentRole);
  const currentUser = useCurrentUser();
  const effectiveRole = currentUser?.role || sessionRole;
  const isAdmin =
    (effectiveRole as string) === "ADMIN" ||
    effectiveRole === "Administrateur" ||
    normalizeRole(effectiveRole) === "Administrateur";
  const canAct = canWrite || isAdmin;
  const [confirmValiderOpen, setConfirmValiderOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const editingValidated = editing?.statut === "Validé";
  const addBon = useStore((state) => state.addBon);
  const updateBon = useStore((state) => state.updateBon);
  const validateBon = useStore((state) => state.validateBon);
  const stock = useStore((state) => state.stock);
  const clients = useStore((state) => state.clients);
  const societes = useStore((state) => state.societes);
  const annexes = useStore((state) => state.annexes);
  const bons = useStore((state) => state.bons);
  const bonSeq = useStore((state) => state.bonSeq);

  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formClientId, setFormClientId] = useState("");
  const [formMotif, setFormMotif] = useState<BonMotif | "">("");
  const [formLignes, setFormLignes] = useState<FormArticleLigne[]>([createEmptyLigne()]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === formClientId),
    [clients, formClientId],
  );

  // Réinitialisation / pré-remplissage du formulaire à l'ouverture
  const [prevDialogOpen, setPrevDialogOpen] = useState(open);
  const [prevEditingId, setPrevEditingId] = useState<string | undefined>(editing?.id);
  if (open !== prevDialogOpen || editing?.id !== prevEditingId) {
    setPrevDialogOpen(open);
    setPrevEditingId(editing?.id);
    if (open) {
      if (editing) {
        setFormDate(editing.date ? editing.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
        setFormClientId(editing.clientId || "");
        setFormMotif((editing.motif as BonMotif) || "");
        if (editing.lignes && editing.lignes.length > 0) {
          setFormLignes(
            editing.lignes.map((l) => ({
              id: l.id || crypto.randomUUID(),
              stockId: l.stockId || "",
              quantite: String(l.quantite || ""),
              montant: String(l.montant || ""),
            })),
          );
        } else {
          setFormLignes([
            {
              id: crypto.randomUUID(),
              stockId: editing.stockId || "",
              quantite: String(editing.quantite || ""),
              montant: String(editing.montant || ""),
            },
          ]);
        }
      } else {
        setFormDate(new Date().toISOString().slice(0, 10));
        setFormClientId("");
        setFormMotif("");
        setFormLignes([createEmptyLigne()]);
      }
      setSaving(false);
    }
  }

  // Analyses des lignes
  const lignesAnalysis = useMemo(() => {
    return formLignes.map((ligne) => {
      const item = stock.find((s) => s.id === ligne.stockId);
      const qte = Number(ligne.quantite) || 0;
      const mnt = Number(ligne.montant) || 0;
      let stockDispo = item?.quantite ?? 0;
      if (editingValidated && editing) {
        if (editing.lignes && editing.lignes.length > 0) {
          const origQty = editing.lignes
            .filter((l) => l.stockId === ligne.stockId)
            .reduce((sum, l) => sum + (Number(l.quantite) || 0), 0);
          stockDispo += origQty;
        } else if (editing.stockId === ligne.stockId) {
          stockDispo += Number(editing.quantite) || 0;
        }
      }
      const depasse = item !== undefined && qte > stockDispo;
      return {
        ...ligne,
        stockItem: item,
        quantiteNum: qte,
        montantNum: mnt,
        stockDispo,
        depasse,
        valide: Boolean(item && qte > 0 && !depasse),
      };
    });
  }, [formLignes, stock, editingValidated, editing]);

  const hasInvalidStock = lignesAnalysis.some((l) => l.depasse);
  const allLignesValid =
    lignesAnalysis.length > 0 &&
    lignesAnalysis.every((l) => l.stockItem && l.quantiteNum > 0 && !l.depasse);

  const totalMontant = lignesAnalysis.reduce((acc, l) => acc + l.montantNum, 0);
  const totalQuantite = lignesAnalysis.reduce((acc, l) => acc + l.quantiteNum, 0);

  // Identité société pour l'aperçu imprimé — résolue (pas un societes[0]
  // brut) pour rester cohérente avec le reste des impressions.
  const selectedSociete = resolveSlttBrand(societes);

  // Stock principal / Annexe pour calcul de la référence
  const firstStockItem = lignesAnalysis.find((l) => l.stockItem)?.stockItem;
  const previewReference = firstStockItem
    ? computeAnnexeScopedReference(
        // 1er paramètre jamais lu par computeAnnexeScopedReference (typé
        // `unknown`) — un societes[0] brut était passé ici sans jamais
        // influencer la référence calculée.
        undefined,
        annexes.find((a) => a.id === firstStockItem.annexeId),
        "BS",
        bons.map((b) => b.reference),
        bonSeq,
      ).reference
    : nextReference;

  function handleLigneChange(id: string, field: keyof FormArticleLigne, value: string) {
    setFormLignes((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: value };
        if (field === "stockId") {
          const picked = stock.find((s) => s.id === value);
          if (picked && !formClientId && picked.clientId) {
            setFormClientId(picked.clientId);
          }
        }
        return updated;
      }),
    );
  }

  function handleAddLigne() {
    setFormLignes((prev) => [...prev, createEmptyLigne()]);
  }

  function handleRemoveLigne(id: string) {
    if (formLignes.length <= 1) return;
    setFormLignes((prev) => prev.filter((l) => l.id !== id));
  }

  function prepareBonPayload(statut: "Validé" | "Brouillon") {
    if (!selectedClient || !formMotif || !firstStockItem) return null;

    const payloadLignes = lignesAnalysis
      .filter((l) => l.stockItem && l.quantiteNum > 0)
      .map((l) => ({
        stockId: l.stockItem!.id,
        marchandise: l.stockItem!.marchandise,
        quantite: l.quantiteNum,
        unite: l.stockItem!.unite,
        montant: l.montantNum,
      }));

    return {
      date: formDate,
      clientId: formClientId,
      clientNom: selectedClient.nom,
      annexeId: firstStockItem.annexeId,
      stockId: firstStockItem.id,
      marchandise: payloadLignes.map((l) => l.marchandise).join(", "),
      quantite: totalQuantite,
      unite: firstStockItem.unite,
      motif: formMotif,
      montant: totalMontant,
      statut,
      lignes: payloadLignes,
    };
  }

  // Le dialog Radix reste monté et cliquable ~200ms pendant son animation de
  // fermeture (data-[state=closed]:animate-out, duration-200). Si `saving`
  // repassait à false dans un `finally` après un succès, un second clic
  // pendant cette fenêtre resoumettait les MÊMES lignes (pas encore
  // réinitialisées — ça ne se faisait qu'à la réouverture) et créait un vrai
  // bon en double. On ne réarme donc `saving` que sur les branches qui ne
  // ferment pas le dialog ; sur les branches de succès, on vide le formulaire
  // avant de fermer pour qu'un clic résiduel ne puisse plus rejouer la saisie.
  async function handleValider() {
    if (!canAct || !allLignesValid || !selectedClient || !formMotif) return;
    const payload = prepareBonPayload("Validé");
    if (!payload) return;

    setSaving(true);
    try {
      if (editingValidated && editing) {
        await updateBon(editing.id, payload);
        toastSuccess(toast, {
          title: "Correction enregistrée",
          description: `${editing.reference} corrigé — stock et mouvements mis à jour.`,
        });
      } else if (editing) {
        await updateBon(editing.id, payload);
        // Même contrat que addBon : un refus de validation (stock local
        // insuffisant) doit remonter au catch, pas fermer le dialogue en silence.
        const ok = await validateBon(editing.id);
        if (!ok) {
          throw new Error("Stock insuffisant pour valider ce bon de sortie.");
        }
        toastSuccess(toast, {
          title: "Bon de sortie validé",
          description: `${editing.reference} validé — stock décrémenté.`,
        });
      } else {
        await addBon(payload);
        toastSuccess(toast, {
          title: "Bon de sortie validé",
          description: `Bon de sortie validé — ${payload.lignes.length} article(s) décrémenté(s) du stock.`,
        });
      }
      setFormLignes([createEmptyLigne()]);
      onOpenChange(false);
    } catch (error: unknown) {
      const stockInsuffisant = error instanceof Error && error.message.includes("Stock insuffisant");
      if (stockInsuffisant) {
        toastWarning(toast, {
          title: "Validation impossible — stock insuffisant",
          description:
            "Le stock disponible est inférieur à la quantité demandée sur un ou plusieurs articles. Le bon a été enregistré comme brouillon.",
        });
        setFormLignes([createEmptyLigne()]);
        onOpenChange(false);
      } else {
        toastError(toast, error, {
          title: "Impossible d'enregistrer le bon de sortie",
          fallback: "Impossible d'enregistrer le bon de sortie.",
        });
        setSaving(false);
      }
    }
  }

  async function handleSaveDraft() {
    if (!canAct || !selectedClient || !formMotif || !firstStockItem) return;
    const targetStatut = editingValidated ? "Validé" : "Brouillon";
    const payload = prepareBonPayload(targetStatut);
    if (!payload || payload.lignes.length === 0) return;

    setSaving(true);
    try {
      if (editing) {
        await updateBon(editing.id, payload);
        toastSuccess(toast, {
          title: editingValidated ? "Correction enregistrée" : "Bon de sortie modifié",
          description: editingValidated
            ? `Le bon ${editing.reference} a été corrigé et le stock réajusté.`
            : `Le bon ${editing.reference} a été mis à jour avec succès.`,
        });
      } else {
        await addBon(payload);
        toastSuccess(toast, {
          title: "Brouillon enregistré",
          description: "Le bon de sortie multi-articles a été sauvegardé comme brouillon.",
        });
      }
      setFormLignes([createEmptyLigne()]);
      onOpenChange(false);
    } catch (error: unknown) {
      toastError(toast, error, {
        title: "Impossible d'enregistrer le bon",
        fallback: "Impossible d'enregistrer le bon.",
      });
      setSaving(false);
    }
  }

  const isFormReady =
    Boolean(canAct && formClientId && formMotif && allLignesValid && !hasInvalidStock);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-3">
            <DialogTitle>{editing ? `Modifier le bon ${editing.reference}` : "Nouveau bon de sortie"}</DialogTitle>
            <Badge
              variant="outline"
              className="border-slate-200 dark:border-slate-700 bg-slate-50 font-mono text-xs text-muted-foreground"
            >
              {editing ? editing.reference : previewReference}
            </Badge>
          </div>
          <DialogDescription>
            {editingValidated
              ? "Bon déjà validé : à l'enregistrement, l'ancienne sortie est remise en stock et la nouvelle est décrémentée (mouvements tracés)."
              : editing
                ? "Modifiez le client, le motif ou les articles de ce bon de sortie."
                : "Sélectionnez le client, le motif et ajoutez les articles à sortir du stock."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Formulaire à gauche */}
          <div className="space-y-5 lg:col-span-7">
            {/* Informations générales */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="bs-date" className="text-xs font-medium text-foreground/90">
                  Date
                </Label>
                <Input
                  id="bs-date"
                  type="date"
                  value={formDate}
                  onChange={(event) => setFormDate(event.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="bs-client" className="text-xs font-medium text-foreground/90">
                  Client <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Select value={formClientId} onValueChange={setFormClientId}>
                    <SelectTrigger id="bs-client" className="h-9 w-full">
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <QuickClientButton onCreated={setFormClientId} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bs-motif" className="text-xs font-medium text-foreground/90">
                Motif commun <span className="text-red-500">*</span>
              </Label>
              <Select value={formMotif} onValueChange={(value) => setFormMotif(value as BonMotif)}>
                <SelectTrigger id="bs-motif" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner un motif de sortie" />
                </SelectTrigger>
                <SelectContent>
                  {BON_MOTIFS.map((motif) => (
                    <SelectItem key={motif} value={motif}>
                      {motif}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section Articles */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Articles concernés ({formLignes.length})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLigne}
                  className="h-8 gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  Ajouter un article
                </Button>
              </div>

              <div className="space-y-3">
                {formLignes.map((ligne, index) => {
                  const analysis = lignesAnalysis[index];
                  const item = analysis?.stockItem;
                  const depasse = analysis?.depasse;

                  return (
                    <div
                      key={ligne.id}
                      className={cn(
                        "relative rounded-lg border p-3.5 space-y-3 transition-colors",
                        depasse
                          ? "border-red-300 bg-red-50/40 dark:border-red-900/60 dark:bg-red-950/20"
                          : "border-border/80 bg-muted/20 hover:bg-muted/30",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Ligne #{index + 1}
                        </span>
                        {formLignes.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveLigne(ligne.id)}
                            className="size-7 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                            title="Supprimer cette ligne"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-foreground/80">
                          Marchandise en stock <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={ligne.stockId}
                          onValueChange={(val) => handleLigneChange(ligne.id, "stockId", val)}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="Choisir un article en stock" />
                          </SelectTrigger>
                          <SelectContent>
                            {stock.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.marchandise} ({s.quantite} {s.unite} dispo)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-foreground/80">
                            Quantité {item ? `(${item.unite})` : ""} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            placeholder="0"
                            value={ligne.quantite}
                            onChange={(e) => handleLigneChange(ligne.id, "quantite", e.target.value)}
                            className={cn("h-9", depasse && "border-red-500 focus-visible:ring-red-500")}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-foreground/80">
                            Montant (FCFA)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={ligne.montant}
                            onChange={(e) => handleLigneChange(ligne.id, "montant", e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>

                      {depasse && item && (
                        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                          <AlertCircle className="size-3.5 shrink-0" />
                          <span>
                            Dépasse le stock dispo ({item.quantite} {item.unite}).
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Barre de totaux */}
              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-2.5 text-sm">
                <span className="text-xs text-muted-foreground">
                  Total : <strong>{totalQuantite}</strong> article(s) cumulé(s)
                </span>
                <span className="font-semibold text-foreground">
                  Total : {formatFCFA(totalMontant)}
                </span>
              </div>
            </div>
          </div>

          {/* Aperçu à droite */}
          <div className="lg:col-span-5">
            <BonPreview
              reference={editing ? editing.reference : previewReference}
              date={formDate}
              client={selectedClient?.nom}
              motif={formMotif}
              lignes={lignesAnalysis}
              totalMontant={totalMontant}
              totalQuantite={totalQuantite}
              societeNom={selectedSociete?.nom}
              logoUrl={selectedSociete?.logoUrl}
              afficherNomAvecLogo={selectedSociete?.afficherNomAvecLogo}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={!canAct || saving || !formClientId || !formMotif || !firstStockItem}
          >
            <FilePen className="size-4" />
            {editingValidated ? "Enregistrer la correction" : editing ? "Enregistrer" : "Brouillon"}
          </Button>
          {/* Un bon déjà validé ne se revalide pas : l'enregistrement corrige
              directement le stock côté serveur. */}
          {!editingValidated && (
            <Button
              onClick={() => setConfirmValiderOpen(true)}
              disabled={!isFormReady || saving}
            >
              <Check className="size-4" />
              Valider le bon
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={confirmValiderOpen} onOpenChange={setConfirmValiderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valider ce bon de sortie multi-articles ?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Cette action décrémente réellement le stock pour les articles suivants :
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {lignesAnalysis
                    .filter((l) => l.stockItem && l.quantiteNum > 0)
                    .map((l, i) => (
                      <li key={i}>
                        <strong>{l.quantiteNum} {l.stockItem?.unite}</strong> — {l.stockItem?.marchandise}
                      </li>
                    ))}
                </ul>
                <p className="text-xs text-amber-600 dark:text-amber-400 pt-1">
                  Cette validation mettra immédiatement à jour l'inventaire en stock.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmValiderOpen(false);
                void handleValider();
              }}
            >
              Confirmer la sortie
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

function BonPreview({
  reference,
  date,
  client,
  motif,
  lignes,
  totalMontant,
  totalQuantite,
  societeNom,
  logoUrl,
  afficherNomAvecLogo = true,
}: {
  reference: string;
  date: string;
  client?: string;
  motif: BonMotif | "";
  lignes: Array<{
    stockItem?: StockItem;
    quantiteNum: number;
    montantNum: number;
  }>;
  totalMontant: number;
  totalQuantite: number;
  societeNom?: string;
  logoUrl?: string;
  afficherNomAvecLogo?: boolean;
}) {
  const validLignes = lignes.filter((l) => l.stockItem || l.quantiteNum > 0);

  return (
    <div className="rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-5 font-[var(--font-heading)]">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={societeNom || "Logo société"}
            width={112}
            height={40}
            className="h-10 w-auto max-w-28 object-contain"
          />
        ) : (
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="size-4" />
          </div>
        )}
        {afficherNomAvecLogo && (
          <div>
            <p className="font-bold text-sm leading-tight text-foreground">{societeNom || "—"}</p>
            <p className="text-[11px] leading-tight text-muted-foreground">Bon de sortie — Marchandise</p>
          </div>
        )}
      </div>

      <div className="my-4 text-center">
        <p className="text-base font-bold tracking-tight text-foreground">BON DE SORTIE</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{reference}</p>
      </div>

      {/* Métadonnées */}
      <div className="mb-4 space-y-1.5 text-xs">
        <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
          <span className="text-muted-foreground">Date :</span>
          <span className="font-medium text-foreground">{date ? formatDateShort(date) : "—"}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
          <span className="text-muted-foreground">Client :</span>
          <span className="font-medium text-foreground">{client || "À renseigner"}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
          <span className="text-muted-foreground">Motif :</span>
          <span className="font-medium text-foreground">{motif || "À renseigner"}</span>
        </div>
      </div>

      {/* Tableau des articles */}
      <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/60 border-b border-slate-200 dark:border-slate-700 text-muted-foreground">
              <th className="px-2 py-1.5 text-left font-medium">Article</th>
              <th className="px-2 py-1.5 text-right font-medium">Qté</th>
              <th className="px-2 py-1.5 text-right font-medium">Montant</th>
            </tr>
          </thead>
          <tbody>
            {validLignes.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-2 py-3 text-center text-muted-foreground italic">
                  Aucun article sélectionné
                </td>
              </tr>
            ) : (
              validLignes.map((l, index) => (
                <tr
                  key={index}
                  className={cn(
                    "border-b border-slate-100 dark:border-slate-800 last:border-0",
                    index % 2 === 0 && "bg-muted/30",
                  )}
                >
                  <td className="px-2 py-1.5 font-medium text-foreground truncate max-w-[120px]">
                    {l.stockItem?.marchandise || "Article"}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-foreground/90">
                    {l.quantiteNum > 0 ? `${l.quantiteNum} ${l.stockItem?.unite || ""}` : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-foreground/90">
                    {l.montantNum > 0 ? formatFCFA(l.montantNum) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {validLignes.length > 0 && (
            <tfoot>
              <tr className="bg-muted/80 font-semibold border-t border-slate-200 dark:border-slate-700">
                <td className="px-2 py-1.5 text-foreground">Total</td>
                <td className="px-2 py-1.5 text-right text-foreground tabular-nums">{totalQuantite}</td>
                <td className="px-2 py-1.5 text-right text-foreground tabular-nums">{formatFCFA(totalMontant)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="mt-6 flex items-end justify-between text-[11px] text-muted-foreground">
        <div>Signature du magasinier</div>
        <div>Cachet SLTT</div>
      </div>
    </div>
  );
}

