"use client";

import { useState } from "react";
import { useStore, type Devis } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";
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
 *
 * Le parent doit monter ce composant avec `key={devis?.id ?? "closed"}` pour
 * que les champs se réinitialisent proprement d'un devis à l'autre.
 */
export function ConvertDevisDialog({ devis, onClose, onConverted }: ConvertDevisDialogProps) {
  const convertDevisToDossier = useStore((s) => s.convertDevisToDossier);
  const { toast } = useToast();
  const [bl, setBl] = useState("");
  const [camion, setCamion] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleConvert() {
    if (!devis || !bl.trim() || !camion.trim()) return;
    setSaving(true);
    try {
      const dossier = await convertDevisToDossier(devis.id, bl.trim(), camion.trim());
      if (dossier) {
        toast({
          title: "Dossier créé",
          description: `${dossier.reference} ouvert depuis ${devis.reference}`,
        });
        onConverted(dossier.id);
      }
    } catch (e) {
      toast({
        title: "Erreur",
        description: getErrorMessage(e, "Impossible de convertir le devis"),
        variant: "destructive",
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
            Un nouveau dossier sera créé à partir du devis {devis?.reference}. Le devis passera au
            statut <strong>Accepté</strong> et vous serez redirigé vers la fiche dossier.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="conv-bl" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              N° BL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="conv-bl"
              value={bl}
              onChange={(e) => setBl(e.target.value)}
              placeholder="BL-2026-0001"
              className="h-10"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conv-camion" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Camion <span className="text-red-500">*</span>
            </Label>
            <Input
              id="conv-camion"
              value={camion}
              onChange={(e) => setCamion(e.target.value)}
              placeholder="Immatriculation"
              className="h-10"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleConvert} disabled={!bl.trim() || !camion.trim() || saving}>
            {saving ? "Création…" : "Créer le dossier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
