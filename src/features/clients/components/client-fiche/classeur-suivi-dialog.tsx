"use client";

import { ExternalLink, History } from "lucide-react";
import type { AuditEntry } from "@/lib/audit";
import type { ClasseurEntry } from "@/lib/classeur";
import { formatDateShort } from "@/lib/format";
import { ToneBadge } from "@/components/sltt/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { classeurStatutTone } from "./shared";

type ClasseurSuiviDialogProps = {
  entry: ClasseurEntry | null;
  logs: AuditEntry[];
  loading: boolean;
  onClose: () => void;
  onOpenSource: (entry: ClasseurEntry) => void;
};

export function ClasseurSuiviDialog({
  entry,
  logs,
  loading,
  onClose,
  onOpenSource,
}: ClasseurSuiviDialogProps) {
  return (
    <Dialog open={entry !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-4 text-slate-400" />
            Suivi du mouvement
          </DialogTitle>
          {entry && (
            <DialogDescription asChild>
              <div className="space-y-1 pt-1 text-left">
                <p className="font-mono text-sm text-foreground">{entry.reference}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.type} · {entry.societeNom} · {formatDateShort(entry.date)}
                </p>
                <ToneBadge tone={classeurStatutTone(entry.statut)}>{entry.statut}</ToneBadge>
              </div>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun événement enregistré pour ce mouvement.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-foreground/90">{log.detail}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {log.module} · {log.action} · {log.user}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatDateShort(log.date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          {entry && (
            <Button onClick={() => onOpenSource(entry)}>
              <ExternalLink className="size-4" />
              Ouvrir la source
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
