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
  Layers,
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
  type Tone,
} from "@/components/sltt/status-badge";
import { getNextTransition, TRANSITION_META } from "@/components/sltt/dossier-transition-dialog";

/** Palette par statut : chaque statut a sa couleur de dossier, à la Windows. */
const CARD_TONE: Record<
  Tone,
  {
    accent: string;
    iconWrap: string;
    icon: string;
    tint: string;
    selectedRing: string;
    selectedBg: string;
    pill: string;
  }
> = {
  blue: {
    accent: "from-blue-400 to-blue-600",
    iconWrap: "bg-blue-100 group-hover:bg-blue-200/80 dark:bg-blue-950/60 dark:group-hover:bg-blue-900/60",
    icon: "text-blue-600 dark:text-blue-300",
    tint: "hover:bg-blue-50/60 dark:hover:bg-blue-950/20",
    selectedRing: "ring-blue-500/40 border-blue-400",
    selectedBg: "bg-blue-50/80 dark:bg-blue-950/30",
    pill: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  },
  indigo: {
    accent: "from-indigo-400 to-indigo-600",
    iconWrap: "bg-indigo-100 group-hover:bg-indigo-200/80 dark:bg-indigo-950/60 dark:group-hover:bg-indigo-900/60",
    icon: "text-indigo-600 dark:text-indigo-300",
    tint: "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20",
    selectedRing: "ring-indigo-500/40 border-indigo-400",
    selectedBg: "bg-indigo-50/80 dark:bg-indigo-950/30",
    pill: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
  },
  amber: {
    accent: "from-amber-400 to-amber-600",
    iconWrap: "bg-amber-100 group-hover:bg-amber-200/80 dark:bg-amber-950/60 dark:group-hover:bg-amber-900/60",
    icon: "text-amber-600 dark:text-amber-300",
    tint: "hover:bg-amber-50/60 dark:hover:bg-amber-950/20",
    selectedRing: "ring-amber-500/40 border-amber-400",
    selectedBg: "bg-amber-50/80 dark:bg-amber-950/30",
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  },
  emerald: {
    accent: "from-emerald-400 to-emerald-600",
    iconWrap: "bg-emerald-100 group-hover:bg-emerald-200/80 dark:bg-emerald-950/60 dark:group-hover:bg-emerald-900/60",
    icon: "text-emerald-600 dark:text-emerald-300",
    tint: "hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20",
    selectedRing: "ring-emerald-500/40 border-emerald-400",
    selectedBg: "bg-emerald-50/80 dark:bg-emerald-950/30",
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  red: {
    accent: "from-red-400 to-red-600",
    iconWrap: "bg-red-100 dark:bg-red-950/60",
    icon: "text-red-600 dark:text-red-300",
    tint: "hover:bg-red-50/60 dark:hover:bg-red-950/20",
    selectedRing: "ring-red-500/40 border-red-400",
    selectedBg: "bg-red-50/80 dark:bg-red-950/30",
    pill: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  },
  slate: {
    accent: "from-slate-300 to-slate-500",
    iconWrap: "bg-slate-100 dark:bg-slate-800/60",
    icon: "text-slate-500 dark:text-slate-300",
    tint: "hover:bg-slate-50 dark:hover:bg-slate-900/30",
    selectedRing: "ring-slate-400/40 border-slate-400",
    selectedBg: "bg-slate-50 dark:bg-slate-900/40",
    pill: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300",
  },
};

type DossierCardProps = {
  dossier: Dossier;
  itemCount: number;
  /** Dossier actuellement ouvert (surbrillance passive). */
  current: boolean;
  canWrite: boolean;
  canTransition: boolean;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onTransition: (dossier: Dossier) => void;
  onDelete: (dossier: Dossier) => void;
};

export const DossierCard = memo(function DossierCard({
  dossier,
  itemCount,
  current,
  canWrite,
  canTransition,
  onOpen,
  onEdit,
  onTransition,
  onDelete,
}: DossierCardProps) {
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const nextTrans = getNextTransition(dossier.statut);
  const tone = CARD_TONE[DOSSIER_STATUT_TONE[dossier.statut]] ?? CARD_TONE.slate;
  const highlighted = hover || current || menuOpen;
  const FolderIcon = highlighted ? FolderOpen : Folder;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Ouvrir le dossier ${dossier.reference} — ${dossier.clientNom}`}
      aria-current={current ? "page" : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onClick={() => onOpen(dossier.id)}
      onDoubleClick={() => onOpen(dossier.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(dossier.id);
        }
      }}
      className={cn(
        "group relative flex h-full cursor-pointer select-none flex-col overflow-hidden rounded-2xl border bg-card pt-4 pb-4 px-4 text-left shadow-2xs outline-none transition-all",
        "hover:-translate-y-0.5 hover:shadow-lg",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        current
          ? cn("ring-2", tone.selectedRing, tone.selectedBg)
          : cn("border-border/80", tone.tint),
      )}
    >
      {/* Bandeau couleur du statut */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r transition-opacity",
          tone.accent,
          highlighted ? "opacity-100" : "opacity-60",
        )}
      />

      {/* En-tête : tuile icône dossier + menu */}
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors",
            tone.iconWrap,
          )}
        >
          <FolderIcon
            className={cn("size-6 transition-transform group-hover:scale-105", tone.icon)}
            strokeWidth={2}
          />
        </div>

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
                <DropdownMenuItem variant="destructive" onSelect={() => onDelete(dossier)}>
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

      {/* Métadonnées : date + pastille "pièces" colorée */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span className="tabular-nums">{formatDateShort(dossier.date)}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium tabular-nums",
            tone.pill,
          )}
        >
          <Layers className="size-3" />
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
