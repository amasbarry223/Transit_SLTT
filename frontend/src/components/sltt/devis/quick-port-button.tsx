"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import type { PortInput } from "@/lib/domain-types";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess } from "@/shared/utils/toast-helpers";
import { UI } from "@/shared/utils/ui-messages";
import { usePermission } from "@/shared/hooks/use-permission";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { PortFormDialog } from "@/components/sltt/parametres/port-form-dialog";

interface Props {
  onCreated: (portId: string) => void;
  className?: string;
}

/** Bouton de création rapide d'un port depuis le formulaire Devis — évite
 *  d'obliger l'utilisateur à aller le créer depuis Paramètres > Ports. */
export function QuickPortButton({ onCreated, className }: Props) {
  const { toast } = useToast();
  const addPort = useStore((s) => s.addPort);
  const canManagePorts = usePermission("parametres:write");
  const [open, setOpen] = useState(false);

  async function handleSave(input: PortInput) {
    try {
      const created = await addPort(input);
      toastSuccess(toast, { title: "Port créé", description: input.nom });
      onCreated(created.id);
    } catch (err) {
      toastError(toast, err, { title: "Impossible de créer ce port", fallback: UI.errors.saveFailed });
      throw err;
    }
  }

  if (!canManagePorts) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn("h-9 w-9 shrink-0", className)}
        title="Créer un nouveau port"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
      </Button>

      <PortFormDialog open={open} port={null} onClose={() => setOpen(false)} onSave={handleSave} />
    </>
  );
}
