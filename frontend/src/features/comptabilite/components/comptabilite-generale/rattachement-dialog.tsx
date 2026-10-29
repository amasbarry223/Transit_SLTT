"use client";

import { useEffect, useMemo, useState } from "react";
import type { OperationComptable } from "@/lib/domain-types";
import { grouperOperationsARattacher } from "@/lib/rattachement-operations";
import { useStore } from "@/lib/store";
import { formatFCFA } from "@/lib/format";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess } from "@/shared/utils/toast-helpers";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface RattachementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Écritures de l'entité affichée (celles sans client sont proposées). */
  operations: OperationComptable[];
}

interface Choix {
  clientId: string;
  coche: boolean;
}

export function RattachementDialog({ open, onOpenChange, operations }: RattachementDialogProps) {
  const { toast } = useToast();
  const clients = useStore((s) => s.clients);
  const rattacher = useStore((s) => s.rattacherOperationsComptables);
  const clientsTries = useMemo(() => [...clients].sort((a, b) => a.nom.localeCompare(b.nom, "fr")), [clients]);
  const groupes = useMemo(() => grouperOperationsARattacher(operations, clients), [operations, clients]);

  const [choix, setChoix] = useState<Record<string, Choix>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Pré-remplissage : correspondance exacte cochée, probable proposée sans être cochée.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- réinitialisation à l'ouverture du dialog
    setChoix(
      Object.fromEntries(
        groupes.map((g) => [
          g.cle,
          { clientId: g.suggestion?.clientId ?? "", coche: g.suggestion?.confiance === "exacte" },
        ]),
      ),
    );
    setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uniquement à l'ouverture
  }, [open]);

  const liens = groupes.flatMap((g) => {
    const c = choix[g.cle];
    return c?.coche && c.clientId ? g.operations.map((o) => ({ operationId: o.id, clientId: c.clientId })) : [];
  });

  function maj(cle: string, patch: Partial<Choix>) {
    setChoix((prev) => ({ ...prev, [cle]: { clientId: "", coche: false, ...prev[cle], ...patch } }));
  }

  async function valider() {
    if (liens.length === 0) return;
    setSubmitting(true);
    try {
      const n = await rattacher(liens);
      toastSuccess(toast, {
        title: "Écritures rattachées",
        description: `${n} écriture${n > 1 ? "s" : ""} rattachée${n > 1 ? "s" : ""} à un client.`,
      });
      onOpenChange(false);
    } catch (error) {
      toastError(toast, error, { title: "Échec du rattachement", fallback: "Réessayez." });
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Rattacher des écritures à un client</DialogTitle>
          <DialogDescription>
            Écritures saisies avec un simple nom de tiers. Une fois rattachées, elles apparaissent dans la situation du
            client. Les montants ne changent pas ; une correspondance « probable » est à vérifier avant de cocher.
          </DialogDescription>
        </DialogHeader>

        {groupes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Toutes les écritures sont rattachées à un client.</p>
        ) : (
          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {groupes.map((g) => {
              const c = choix[g.cle] ?? { clientId: "", coche: false };
              return (
                <div key={g.cle} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center">
                  <Checkbox
                    checked={c.coche}
                    disabled={!c.clientId}
                    onCheckedChange={(v) => maj(g.cle, { coche: v === true })}
                    aria-label={`Rattacher ${g.clientNom}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{g.clientNom}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.operations.length} écriture{g.operations.length > 1 ? "s" : ""} · {formatFCFA(g.total)}
                      {g.suggestion && (
                        <Badge variant="outline" className="ml-2 text-[10px] font-normal">
                          {g.suggestion.confiance === "exacte" ? "Correspondance exacte" : "Correspondance probable"}
                        </Badge>
                      )}
                    </p>
                  </div>
                  <Select
                    value={c.clientId || "none"}
                    onValueChange={(v) => maj(g.cle, { clientId: v === "none" ? "" : v, coche: v !== "none" })}
                  >
                    <SelectTrigger className="h-9 w-full sm:w-64">
                      <SelectValue placeholder="Choisir un client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Ne pas rattacher —</SelectItem>
                      {clientsTries.map((cl) => (
                        <SelectItem key={cl.id} value={cl.id}>
                          {cl.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={valider} disabled={submitting || liens.length === 0}>
            Rattacher {liens.length > 0 ? `${liens.length} écriture${liens.length > 1 ? "s" : ""}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
