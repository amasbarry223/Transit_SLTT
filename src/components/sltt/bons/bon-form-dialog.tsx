"use client";

import { useMemo, useState } from "react";
import { Check, FilePen, Truck } from "lucide-react";
import type { BonMotif, StockItem } from "@/lib/domain-types";
import { useStore } from "@/lib/store";
import { QuickClientButton } from "@/components/sltt/quick-client-dialog";
import { formatDateShort, formatFCFA } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { BON_MOTIFS } from "./use-bon-filters";

type BonFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextReference: string;
  canWrite: boolean;
};

export function BonFormDialog({ open, onOpenChange, nextReference, canWrite }: BonFormDialogProps) {
  const { toast } = useToast();
  const [confirmValiderOpen, setConfirmValiderOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const addBon = useStore((state) => state.addBon);
  const stock = useStore((state) => state.stock);
  const clients = useStore((state) => state.clients);
  const societes = useStore((state) => state.societes);

  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formClientId, setFormClientId] = useState("");
  const [formSocieteId, setFormSocieteId] = useState("");
  const [formStockId, setFormStockId] = useState("");
  const [formQuantite, setFormQuantite] = useState("");
  const [formMotif, setFormMotif] = useState<BonMotif | "">("");
  const [formMontant, setFormMontant] = useState("");

  const selectedStock: StockItem | undefined = useMemo(
    () => stock.find((item) => item.id === formStockId),
    [stock, formStockId],
  );
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === formClientId),
    [clients, formClientId],
  );

  const quantiteNum = Number(formQuantite) || 0;
  const stockDisponible = selectedStock?.quantite ?? 0;
  const depasseStock = selectedStock !== undefined && quantiteNum > stockDisponible;
  const montantNum = Number(formMontant) || 0;

  const [prevDialogOpen, setPrevDialogOpen] = useState(open);
  if (open !== prevDialogOpen) {
    setPrevDialogOpen(open);
    if (open) {
      setFormDate(new Date().toISOString().slice(0, 10));
      setFormClientId("");
      setFormSocieteId("");
      setFormStockId("");
      setFormQuantite("");
      setFormMotif("");
      setFormMontant("");
    }
  }

  async function handleValider() {
    if (!canWrite || !selectedStock || !selectedClient || !formMotif || !formSocieteId) return;
    setSaving(true);
    try {
      await addBon({
        date: formDate,
        clientId: formClientId,
        clientNom: selectedClient.nom,
        societeId: formSocieteId,
        stockId: selectedStock.id,
        marchandise: selectedStock.marchandise,
        quantite: quantiteNum,
        unite: selectedStock.unite,
        motif: formMotif,
        montant: montantNum,
        statut: "Validé",
      });
      toast({
        title: "Bon de sortie validé",
        description: "Bon de sortie validé — stock décrémenté.",
      });
      onOpenChange(false);
    } catch (error: unknown) {
      const stockInsuffisant = error instanceof Error && error.message.includes("Stock insuffisant");
      if (stockInsuffisant) {
        toast({
          title: "Validation impossible — stock insuffisant",
          description:
            "Le stock disponible est inférieur à la quantité demandée. Le bon a été enregistré comme brouillon.",
          variant: "destructive",
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Impossible d'enregistrer le bon de sortie.",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    if (!canWrite || !selectedStock || !selectedClient || !formMotif || !formSocieteId) return;
    setSaving(true);
    try {
      await addBon({
        date: formDate,
        clientId: formClientId,
        clientNom: selectedClient.nom,
        societeId: formSocieteId,
        stockId: selectedStock.id,
        marchandise: selectedStock.marchandise,
        quantite: quantiteNum,
        unite: selectedStock.unite,
        motif: formMotif,
        montant: montantNum,
        statut: "Brouillon",
      });
      toast({
        title: "Brouillon enregistré",
        description: "Le bon a été sauvegardé comme brouillon.",
      });
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'enregistrer le brouillon.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleStockChange(stockId: string) {
    setFormStockId(stockId);
    const picked = stock.find((item) => item.id === stockId);
    if (picked) {
      setFormSocieteId(picked.societeId);
      if (!formClientId && picked.clientId) setFormClientId(picked.clientId);
    }
  }

  const selectedSociete = societes.find((societe) => societe.id === formSocieteId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-3">
            <DialogTitle>Nouveau bon de sortie</DialogTitle>
            <Badge
              variant="outline"
              className="border-slate-200 dark:border-slate-700 bg-slate-50 font-mono text-xs text-slate-500 dark:text-slate-400"
            >
              {nextReference}
            </Badge>
          </div>
          <DialogDescription>
            Sélectionnez le client, la marchandise et la quantité à sortir du stock.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bs-date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Date
              </Label>
              <Input
                id="bs-date"
                type="date"
                value={formDate}
                onChange={(event) => setFormDate(event.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bs-client" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Client <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Select value={formClientId} onValueChange={setFormClientId}>
                  <SelectTrigger id="bs-client" className="h-10 w-full">
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

            <div className="space-y-2">
              <Label htmlFor="bs-stock" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Marchandise <span className="text-red-500">*</span>
              </Label>
              <Select value={formStockId} onValueChange={handleStockChange}>
                <SelectTrigger id="bs-stock" className="h-10 w-full">
                  <SelectValue placeholder="Sélectionner une marchandise" />
                </SelectTrigger>
                <SelectContent>
                  {stock.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.marchandise} — {item.societeNom} (stock : {item.quantite} {item.unite})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStock && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Société :{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStock.societeNom}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bs-quantite" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Quantité à sortir <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bs-quantite"
                type="number"
                min={0}
                value={formQuantite}
                onChange={(event) => setFormQuantite(event.target.value)}
                aria-invalid={depasseStock}
                placeholder="0"
                className="h-10"
              />
              {depasseStock && selectedStock && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  La quantité dépasse le stock disponible ({stockDisponible} {selectedStock.unite}).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bs-motif" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Motif <span className="text-red-500">*</span>
              </Label>
              <Select value={formMotif} onValueChange={(value) => setFormMotif(value as BonMotif)}>
                <SelectTrigger id="bs-motif" className="h-10 w-full">
                  <SelectValue placeholder="Sélectionner un motif" />
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

            <div className="space-y-2">
              <Label htmlFor="bs-montant" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Montant <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="bs-montant"
                  type="number"
                  min={0}
                  value={formMontant}
                  onChange={(event) => setFormMontant(event.target.value)}
                  placeholder="0"
                  className="h-10 pr-16"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 dark:text-slate-500">
                  FCFA
                </span>
              </div>
            </div>
          </div>

          <div>
            <BonPreview
              reference={nextReference}
              date={formDate}
              client={selectedClient?.nom}
              marchandise={selectedStock?.marchandise}
              quantite={quantiteNum}
              unite={selectedStock?.unite}
              motif={formMotif}
              montant={montantNum}
              societeNom={selectedStock?.societeNom}
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
            disabled={
              !canWrite || saving || !formClientId || !formStockId || !formMotif || quantiteNum <= 0 || montantNum <= 0
            }
          >
            <FilePen className="size-4" />
            Brouillon
          </Button>
          <Button
            onClick={() => setConfirmValiderOpen(true)}
            disabled={
              !canWrite ||
              saving ||
              depasseStock ||
              !formClientId ||
              !formStockId ||
              !formMotif ||
              quantiteNum <= 0 ||
              montantNum <= 0
            }
          >
            <Check className="size-4" />
            Valider le bon
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={confirmValiderOpen} onOpenChange={setConfirmValiderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valider ce bon de sortie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action décrémente réellement le stock de{" "}
              <strong>
                {quantiteNum} {selectedStock?.unite ?? ""}
              </strong>{" "}
              sur « {selectedStock?.marchandise} ». Elle n'est pas annulable directement depuis cet écran.
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
              Valider
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
  marchandise,
  quantite,
  unite,
  motif,
  montant,
  societeNom,
  logoUrl,
  afficherNomAvecLogo = true,
}: {
  reference: string;
  date: string;
  client?: string;
  marchandise?: string;
  quantite: number;
  unite?: string;
  motif: BonMotif | "";
  montant: number;
  societeNom?: string;
  logoUrl?: string;
  afficherNomAvecLogo?: boolean;
}) {
  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Date",
      value: date ? formatDateShort(date) : "—",
    },
    {
      label: "Client",
      value: client || <span className="text-slate-400 dark:text-slate-500">À renseigner</span>,
    },
    {
      label: "Marchandise",
      value: marchandise || <span className="text-slate-400 dark:text-slate-500">À renseigner</span>,
    },
    {
      label: "Quantité",
      value: quantite > 0 ? `${quantite} ${unite || ""}`.trim() : "—",
    },
    {
      label: "Motif",
      value: motif || <span className="text-slate-400 dark:text-slate-500">À renseigner</span>,
    },
    {
      label: "Montant",
      value: montant > 0 ? formatFCFA(montant) : "—",
    },
  ];

  return (
    <div className="rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 font-[var(--font-heading)]">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
        {logoUrl ? (
          <img src={logoUrl} alt={societeNom || "Logo société"} className="h-10 w-auto max-w-28 object-contain" />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="size-5" />
          </div>
        )}
        {afficherNomAvecLogo && (
          <div>
            <p className="font-bold leading-tight text-slate-900 dark:text-slate-100">{societeNom || "SLTT"}</p>
            <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">Bon de sortie — Marchandise</p>
          </div>
        )}
      </div>

      <div className="my-5 text-center">
        <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">BON DE SORTIE — MARCHANDISE</p>
        <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{reference}</p>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.label}
                className={cn(
                  "border-b border-slate-100 dark:border-slate-800 last:border-0",
                  index % 2 === 0 && "bg-slate-50/50 dark:bg-slate-800/50",
                )}
              >
                <td className="w-1/3 px-3 py-1.5 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  {row.label}
                </td>
                <td className="px-3 py-1.5 tabular-nums text-slate-800 dark:text-slate-200">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex items-end justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-400">Signature du responsable</div>
        <div className="text-xs text-slate-400 dark:text-slate-500">__________</div>
      </div>
    </div>
  );
}
