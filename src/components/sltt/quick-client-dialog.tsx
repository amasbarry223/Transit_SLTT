"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useStore, type ClientInput } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { getErrorMessage } from "@/lib/utils";
import { ClientFormFields, emptyClientForm } from "@/components/sltt/client-form-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  onCreated: (clientId: string) => void;
}

export function QuickClientButton({ onCreated }: Props) {
  const { toast } = useToast();
  const addClient = useStore((s) => s.addClient);
  const canCreateClient = usePermission("clients:write");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ClientInput>(emptyClientForm());
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm(emptyClientForm());
  }

  async function handleCreate() {
    const trimmed = form.nom.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const newClient = await addClient({ ...form, nom: trimmed });
      toast({ title: "Client créé", description: trimmed });
      onCreated(newClient.id);
      setOpen(false);
      reset();
    } catch (e) {
      toast({
        title: "Erreur",
        description: getErrorMessage(e, "Impossible de créer le client"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!canCreateClient) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        title="Créer un nouveau client"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
            <DialogDescription>
              Créez un client rapidement. Vous pourrez compléter sa fiche ultérieurement.
            </DialogDescription>
          </DialogHeader>

          <ClientFormFields
            values={form}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            idPrefix="qc"
            autoFocusNom
          />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setOpen(false); reset(); }} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!form.nom.trim() || saving}>
              <UserPlus className="size-4" />
              {saving ? "Création…" : "Créer le client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
