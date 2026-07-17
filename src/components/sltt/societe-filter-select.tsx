"use client";

import { useStore } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { cn } from "@/lib/utils";
import { ToneBadge } from "@/components/sltt/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SocieteTone = "blue" | "indigo" | "slate";

/**
 * Couleur par société — mapping fixe (pas dérivé de l'id) pour rester stable
 * même si l'ordre de chargement change. Fallback slate pour une 3e société future.
 */
const SOCIETE_TONE: Record<string, SocieteTone> = {
  "Top Doumani": "blue",
  "Traoré Transit Logistique": "indigo",
};

/**
 * Filtre société partagé (F1) — mémorisé dans le nav-store (persisté) pour ne
 * pas être re-sélectionné à chaque écran. Utilisé identiquement sur tous les
 * écrans société-scopés (Entreposage, Bons, Comptabilité, Bilans, Contrats).
 */
export function SocieteFilterSelect({ className }: { className?: string }) {
  const societes = useStore((s) => s.societes);
  const selectedSocieteId = useNav((s) => s.selectedSocieteId);
  const setSelectedSocieteId = useNav((s) => s.setSelectedSocieteId);

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

export function SocieteBadge({ societeNom, size = "md" }: { societeNom?: string; size?: "sm" | "md" }) {
  if (!societeNom) return null;
  const tone = SOCIETE_TONE[societeNom] ?? "slate";
  return (
    <ToneBadge tone={tone} size={size}>
      {societeNom}
    </ToneBadge>
  );
}
