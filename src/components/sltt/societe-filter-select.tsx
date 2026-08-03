"use client";

import { useUiPrefs } from "@/lib/session/ui-prefs-store";

import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ToneBadge } from "@/components/sltt/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { societeToneById } from "@/lib/societe-brand";

/**
 * Filtre société partagé (F1) — mémorisé dans le nav-store (persisté) pour ne
 * pas être re-sélectionné à chaque écran. Utilisé identiquement sur tous les
 * écrans société-scopés (Entreposage, Bons, Comptabilité, Bilans, Contrats).
 */
export function SocieteFilterSelect({ className }: { className?: string }) {
  const societes = useStore((s) => s.societes);
  const selectedSocieteId = useUiPrefs((s) => s.selectedSocieteId);
  const setSelectedSocieteId = useUiPrefs((s) => s.setSelectedSocieteId);

  return (
    <Select
      value={selectedSocieteId ?? "all"}
      onValueChange={(v) => setSelectedSocieteId(v === "all" ? null : v)}
    >
      <SelectTrigger className={cn("h-10 w-full sm:w-52", className)} aria-label="Filtrer par société">
        <SelectValue placeholder="Société" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Toutes les sociétés</SelectItem>
        {societes.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.nom}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SocieteBadge({
  societeNom,
  societeId,
  size = "md",
}: {
  societeNom?: string;
  societeId?: string;
  size?: "sm" | "md";
}) {
  const societes = useStore((s) => s.societes);
  if (!societeNom) return null;
  const match = societeId
    ? societes.find((s) => s.id === societeId)
    : societes.find((s) => s.nom === societeNom);
  const id = match?.id ?? societeId;
  const tone = id
    ? societeToneById(id, { isTransit: match?.isTransit })
    : "slate";
  return (
    <ToneBadge tone={tone} size={size}>
      {societeNom}
    </ToneBadge>
  );
}
