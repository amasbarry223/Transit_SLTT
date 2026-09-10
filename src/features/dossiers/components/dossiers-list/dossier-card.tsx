"use client";

import { memo, useState } from "react";
import {
  Folder,
  FolderOpen,
  MoreVertical,
  FolderInput,
  Pencil,
  ArrowRightCircle,
  Trash2,
} from "lucide-react";
import { calculerEcart, type Dossier } from "@/lib/domain-types";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  DossierStatutBadge,
  EcartValue,
  DOSSIER_STATUT_TONE,
} from "@/components/sltt/status-badge";
import { getNextTransition, TRANSITION_META } from "@/components/sltt/dossier-transition-dialog";

/** Teinte de l'icône dossier selon le statut (réutilise la charte des badges). */
const ICON_TONE: Record<string, string> = {
  blue: "text-blue-500 dark:text-blue-400",
  indigo: "text-indigo-500 dark:text-indigo-400",
  amber: "text-amber-500 dark:text-amber-400",
  emerald: "text-emerald-500 dark:text-emerald-400",
  red: "text-red-500 dark:text-red-400",
  slate: "text-slate-400",
};

type DossierCardProps = {
  dossier: Dossier;
  itemCount: number;
  selected: boolean;
  canWrite: boolean;
  canTransition: boolean;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onTransition: (dossier: Dossier) => void;
  onDelete: (dossier: Dossier) => void;
};

export const DossierCard = memo(function DossierCard({
  dossier,
  itemCount,
  selected,
  canWrite,
  canTransition,
  onSelect,
  onOpen,
  onEdit,
  onTransition,
  onDelete,
}: DossierCardProps) {
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const nextTrans = getNextTransition(dossier.statut);
  const tone = DOSSIER_STATUT_TONE[dossier.statut];
  const FolderIcon = hover || selected || menuOpen ? FolderOpen : Folder;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Dossier ${dossier.reference} — ${dossier.clientNom}`}
      aria-pressed={selected}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onClick={() => onSelect(dossier.id)}
      onDoubleClick={() => onOpen(dossier.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onOpen(dossier.id);
        } else if (e.key === " ") {
          e.preventDefault();
          onSelect(dossier.id);
        }
      }}
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border bg-card p-4 text-left shadow-2xs outline-none transition-all",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        selected
          ? "border-primary ring-2 ring-primary/25 bg-primary/[0.04]"
          : "border-border/80",
      )}
    >
      {/* En-tête : icône dossier + menu */}
      <div className="flex items-start justify-between gap-2">
        <FolderIcon
          className={cn("size-11 shrink-0 transition-colors", ICON_TONE[tone] ?? ICON_TONE.slate)}
          strokeWidth={1.5}
        />

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-8 shrink-0 text-muted-foreground transition-opacity hover:text-foreground",
                "sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
                menuOpen && "sm:opacity-100",
              )}
              aria-label={`Actions pour ${dossier.reference}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => onOpen(dossier.id)}>
              <FolderInput className="size-4" />
              Ouvrir
            </DropdownMenuItem>
            {canWrite && (
              <DropdownMenuItem onSelect={() => onEdit(dossier.id)}>
                <Pencil className="size-4" />
                Modifier
              </DropdownMenuItem>
            )}
            {canTransition && nextTrans && (
              <DropdownMenuItem onSelect={() => onTransition(dossier)}>
                <ArrowRightCircle className="size-4" />
                {TRANSITION_META[nextTrans].actionLabel.replace(/^→\s*/, "Faire évoluer : ")}
              </DropdownMenuItem>
            )}
            {canWrite && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDelete(dossier)}
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Nom + client */}
      <div className="mt-3 min-w-0">
        <p className="truncate font-semibold text-foreground" title={dossier.reference}>
          {dossier.reference}
        </p>
        <p className="truncate text-sm text-muted-foreground" title={dossier.clientNom}>
          {dossier.clientNom}
        </p>
      </div>

      {/* Métadonnées */}
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="tabular-nums">{formatDateShort(dossier.date)}</span>
        <span aria-hidden>·</span>
        <span className="tabular-nums">
          {itemCount} pièce{itemCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Pied : statut + marge */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <DossierStatutBadge statut={dossier.statut} />
        <EcartValue value={calculerEcart(dossier)} />
      </div>
    </div>
  );
});
