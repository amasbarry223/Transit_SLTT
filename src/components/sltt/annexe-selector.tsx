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
 * Sélecteur d'annexe (topbar) — choisit sous quelle annexe créer les
 * nouveaux enregistrements. Pas un filtre de lecture : la RLS restreint déjà
 * les données visibles aux annexes assignées à l'utilisateur (cf.
 * has_annexe_access). Masqué pour les utilisateurs mono-annexe.
 */
export function AnnexeSelector({ className }: { className?: string }) {
  const { annexes, activeAnnexeId, isMultiAnnexe, setActiveAnnexeId } = useActiveAnnexe();

  if (!isMultiAnnexe) return null;

  return (
    <Select value={activeAnnexeId ?? undefined} onValueChange={setActiveAnnexeId}>
      <SelectTrigger className={cn("h-10 w-full sm:w-44", className)} aria-label="Annexe active">
        <SelectValue placeholder="Annexe" />
      </SelectTrigger>
      <SelectContent>
        {annexes.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.nom}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
