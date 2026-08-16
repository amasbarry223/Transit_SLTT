"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useStore } from "@/lib/store";
import type { ClientInput } from "@/features/clients/types";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess } from "@/shared/utils/toast-helpers";
import { UI } from "@/shared/utils/ui-messages";
import { usePermission } from "@/shared/hooks/use-permission";
import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import { resolveTransitSociete } from "@/lib/societe-brand";
import { ClientFormFields, emptyClientForm } from "@/features/clients/components/client-form-fields";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

interface Props {
  onCreated: (clientId: string) => void;
  /** Société du formulaire parent (ex. modal contrat) — masque l'annexe si Top Doumani. */
  defaultSocieteId?: string;
}

export function QuickClientButton({ onCreated, defaultSocieteId }: Props) {
  const { toast } = useToast();
  const addClient = useStore((s) => s.addClient);
  const societes = useStore((s) => s.societes);
  const canCreateClient = usePermission("clients:write");
  const { annexes, activeAnnexeId } = useActiveAnnexe();
  const resolvedSocieteId =
    defaultSocieteId ?? resolveTransitSociete(societes)?.id ?? "";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ClientInput>(
    emptyClientForm(activeAnnexeId ?? "", resolvedSocieteId),
  );
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm(emptyClientForm(activeAnnexeId ?? "", resolvedSocieteId));
  }

  async function handleCreate() {
    const trimmed = form.nom.trim();
    if (!trimmed || !form.societeId || saving) return;
    setSaving(true);
    try {
      const newClient = await addClient({ ...form, nom: trimmed });
      toastSuccess(toast, { title: "Client créé", description: trimmed });
      onCreated(newClient.id);
      setOpen(false);
      reset();
    } catch (e) {
      toastError(toast, e, {
        title: "Impossible de créer le client",
        fallback: UI.errors.saveFailed,
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
            annexes={annexes}
            societes={societes}
            idPrefix="qc"
            autoFocusNom
          />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setOpen(false); reset(); }} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!form.nom.trim() || !form.societeId || saving}>
              <UserPlus className="size-4" />
              {saving ? "Création…" : "Créer le client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
