"use client";

import { useState } from "react";
import { useStore, type Devis } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConvertDevisDialogProps {
  /** Le devis à convertir, ou null pour garder le dialogue fermé. */
  devis: Devis | null;
  onClose: () => void;
  onConverted: (dossierId: string) => void;
}

/**
 * Formulaire de conversion devis → dossier, partagé entre l'écran Devis et la
 * fiche détail. Demande BL/camion au lieu de laisser convertDevisToDossier
 * insérer des valeurs factices invisibles (LOGIC-audit).
 */
export function ConvertDevisDialog({ devis, onClose, onConverted }: ConvertDevisDialogProps) {
  const convertDevisToDossier = useStore((s) => s.convertDevisToDossier);
  const { toast } = useToast();
  const [bl, setBl] = useState("");
  const [camion, setCamion] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftMode, setDraftMode] = useState(false);

  const blError = !bl.trim() && !draftMode ? "Le numéro de BL est requis." : undefined;
  const camionError = !camion.trim() && !draftMode ? "L'immatriculation du camion est requise." : undefined;

  async function handleConvert(useDraft = false) {
    if (!devis) return;
    const blValue = useDraft ? "À compléter" : bl.trim();
    const camionValue = useDraft ? "À compléter" : camion.trim();
    if (!useDraft && (!blValue || !camionValue)) return;

    setSaving(true);
    try {
      const dossier = await convertDevisToDossier(devis.id, blValue, camionValue);
      if (dossier) {
        toastSuccess(toast, {
          title: useDraft ? "Dossier brouillon créé" : "Dossier créé",
          description: `${dossier.reference} ouvert depuis ${devis.reference}${useDraft ? " — complétez BL et camion depuis la fiche dossier." : ""}`,
        });
        onConverted(dossier.id);
      }
    } catch (e) {
      toastError(toast, e, {
        title: "Impossible de convertir le devis",
        fallback: UI.errors.saveFailed,
      });
    } finally {
      setSaving(false);
      onClose();
    }
  }

  return (
    <Dialog open={!!devis} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convertir en dossier de transit</DialogTitle>
          <DialogDescription>
            Un nouveau dossier sera créé à partir du devis {devis?.reference} ({devis?.clientNom}
            {devis?.nature ? ` — ${devis.nature}` : ""}). Le devis passera au statut{" "}
            <strong>Accepté</strong>.
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          Le BL et le camion identifient physiquement la marchandise — renseignez-les dès que
          disponibles pour le suivi logistique et les documents douaniers.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="conv-bl" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              N° BL {!draftMode && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="conv-bl"
              value={bl}
              onChange={(e) => setBl(e.target.value)}
              placeholder="BL-2026-0001"
              className="h-10"
              autoFocus
              disabled={draftMode}
              aria-invalid={!!blError}
            />
            {blError && <p className="text-xs text-red-600 dark:text-red-400">{blError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="conv-camion" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Camion {!draftMode && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="conv-camion"
              value={camion}
              onChange={(e) => setCamion(e.target.value)}
              placeholder="Immatriculation ou transporteur"
              className="h-10"
              disabled={draftMode}
              aria-invalid={!!camionError}
            />
            {camionError && <p className="text-xs text-red-600 dark:text-red-400">{camionError}</p>}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              onClick={() => handleConvert(false)}
              disabled={(!draftMode && (!bl.trim() || !camion.trim())) || saving}
            >
              {saving ? "Création…" : "Créer le dossier"}
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="text-xs text-slate-500"
            disabled={saving}
            onClick={() => {
              setDraftMode(true);
              void handleConvert(true);
            }}
          >
            Compléter plus tard — créer un dossier brouillon minimal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
