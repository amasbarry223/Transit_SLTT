"use client";

import { useState } from "react";
import type { Port, PortInput } from "@/lib/domain-types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/components/ui/dialog";

const EMPTY_INPUT: PortInput = { code: "", nom: "", ville: "", pays: "" };

/** Formulaire de création/édition d'un port — utilisé depuis Paramètres > Ports
 *  et depuis le bouton de création rapide dans le formulaire Devis. */
export function PortFormDialog({
  open,
  port,
  onClose,
  onSave,
}: {
  open: boolean;
  port: Port | null;
  onClose: () => void;
  onSave: (input: PortInput) => Promise<void>;
}) {
  const [values, setValues] = useState<PortInput>(EMPTY_INPUT);
  const [saving, setSaving] = useState(false);
  const isEdit = port !== null;

  const openKey = open ? (port?.id ?? "new") : null;
  const [prevOpenKey, setPrevOpenKey] = useState(openKey);
  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey);
    if (openKey !== null) {
      setValues(
        port
          ? { code: port.code, nom: port.nom, ville: port.ville ?? "", pays: port.pays ?? "" }
          : EMPTY_INPUT,
      );
    }
  }

  function set<K extends keyof PortInput>(key: K, value: PortInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const valid = !!values.code.trim() && !!values.nom.trim();

  async function handleSubmit() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave({
        code: values.code.trim(),
        nom: values.nom.trim(),
        ville: values.ville?.trim() || undefined,
        pays: values.pays?.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le port" : "Nouveau port"}</DialogTitle>
          <DialogDescription>
            Table de référence utilisée par le champ « Port d&apos;embarquement » des devis.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>
                Code <span className="text-red-500">*</span>
              </Label>
              <Input value={values.code} onChange={(e) => set("code", e.target.value)} placeholder="ex. ABJ" />
            </div>
            <div className="space-y-2">
              <Label>
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input value={values.nom} onChange={(e) => set("nom", e.target.value)} placeholder="ex. Port d'Abidjan" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input value={values.ville} onChange={(e) => set("ville", e.target.value)} placeholder="ex. Abidjan" />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Input value={values.pays} onChange={(e) => set("pays", e.target.value)} placeholder="ex. Côte d'Ivoire" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!valid || saving}>
            {isEdit ? "Enregistrer" : "Créer le port"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
