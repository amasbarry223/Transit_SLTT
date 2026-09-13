"use client";

import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Sélecteur d'annexe (topbar) — double rôle : (1) filtre de vue partagé entre
 * tous les écrans annexe-scopés ("Toutes les annexes" = aucun filtre, la RLS
 * restreint déjà aux annexes assignées — ce choix sert la traçabilité, pas la
 * sécurité), et (2) contexte de création des nouveaux enregistrements (repli
 * automatique sur la 1ère annexe assignée quand "Toutes" est sélectionné, cf.
 * resolveActiveAnnexeId). Masqué pour les utilisateurs mono-annexe : rien à
 * filtrer ni à choisir.
 */
export function AnnexeSelector({ className }: { className?: string }) {
  const { annexes, selectedAnnexeId, isMultiAnnexe, setActiveAnnexeId } = useActiveAnnexe();

  if (!isMultiAnnexe) return null;

  return (
    <Select
      value={selectedAnnexeId ?? "all"}
      onValueChange={(v) => setActiveAnnexeId(v === "all" ? null : v)}
    >
      <SelectTrigger className={cn("h-10 w-full sm:w-44", className)} aria-label="Annexe">
        <SelectValue placeholder="Annexe" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Toutes les annexes</SelectItem>
        {annexes.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.nom}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
