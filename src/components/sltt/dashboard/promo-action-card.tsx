"use client";

import * as React from "react";
import { Button } from "@/shared/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface PromoActionCardProps {
  onNewDossier: () => void;
  className?: string;
}

export function PromoActionCard({ onNewDossier, className }: PromoActionCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl text-white shadow-md border border-border/40",
        "min-h-[220px] flex flex-col justify-between p-6 sm:p-7 bg-[#0B2A78]",
        className,
      )}
    >
      {/* Photorealistic Logistics Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
        style={{ backgroundImage: "url('/assets/logistics_banner.jpg')" }}
      />

      {/* Dark gradient overlay on the left to ensure crisp readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B2A78] via-[#0B2A78]/85 to-transparent/40" />

      {/* Content */}
      <div className="relative z-10 space-y-2 max-w-md">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight drop-shadow-sm">
          Votre partenaire de confiance
        </h2>
        <p className="text-xs sm:text-sm font-medium text-blue-200/90">
          Transport • Transit • Logistique
        </p>
        <p className="pt-1 text-xs text-white/85 leading-relaxed max-w-sm">
          Des solutions efficaces pour vos opérations de transport et de transit, partout dans le monde.
        </p>
      </div>

      {/* Red Action Button */}
      <div className="relative z-10 pt-5">
        <Button
          type="button"
          onClick={onNewDossier}
          className={cn(
            "bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold px-5 py-2.5 h-10 rounded-xl",
            "shadow-lg shadow-red-600/30 border border-red-500/40",
            "transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]",
          )}
        >
          <Plus className="size-4 shrink-0 stroke-[3]" />
          <span>Nouveau dossier</span>
        </Button>
      </div>
    </div>
  );
}
