"use client";

import { useState } from "react";
import { Anchor, Pencil, Plus, Power } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Port, PortInput } from "@/lib/domain-types";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess } from "@/shared/utils/toast-helpers";
import { UI } from "@/shared/utils/ui-messages";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/components/ui/dialog";

const EMPTY_INPUT: PortInput = { code: "", nom: "", ville: "", pays: "" };

function PortFormDialog({
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

export function PortsTab() {
  const ports = useStore((s) => s.ports);
  const addPort = useStore((s) => s.addPort);
  const updatePort = useStore((s) => s.updatePort);
  const setPortActif = useStore((s) => s.setPortActif);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Port | null>(null);

  const sorted = [...ports].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(port: Port) {
    setEditing(port);
    setDialogOpen(true);
  }

  async function handleSave(input: PortInput) {
    try {
      if (editing) {
        await updatePort(editing.id, input);
        toastSuccess(toast, { title: "Port mis à jour", description: input.nom });
      } else {
        await addPort(input);
        toastSuccess(toast, { title: "Port créé", description: input.nom });
      }
    } catch (err) {
      toastError(toast, err, { title: "Impossible d'enregistrer ce port", fallback: UI.errors.saveFailed });
      throw err;
    }
  }

  async function handleToggleActif(port: Port) {
    try {
      await setPortActif(port.id, !port.actif);
      toastSuccess(toast, {
        title: port.actif ? "Port désactivé" : "Port réactivé",
        description: port.nom,
      });
    } catch (err) {
      toastError(toast, err, { title: "Impossible de modifier ce port", fallback: UI.errors.generic });
    }
  }

  return (
    <div className="space-y-5">
      <Card className="border-border/80 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Anchor className="size-4.5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Ports d&apos;embarquement</p>
              <p className="text-xs text-muted-foreground">
                Liste utilisée par le champ optionnel « Port » des devis — désactivez un port
                plutôt que de le supprimer s&apos;il est déjà référencé par des devis existants.
              </p>
            </div>
          </div>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="size-4" /> Ajouter
          </Button>
        </div>

        {sorted.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Aucun port enregistré pour l&apos;instant.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((port) => (
                <TableRow key={port.id}>
                  <TableCell className="font-medium">{port.nom}</TableCell>
                  <TableCell className="text-muted-foreground">{port.code}</TableCell>
                  <TableCell className="text-muted-foreground">{port.ville || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{port.pays || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={port.actif ? "default" : "secondary"}>
                      {port.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(port)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => void handleToggleActif(port)}>
                        <Power className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <PortFormDialog
        open={dialogOpen}
        port={editing}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
