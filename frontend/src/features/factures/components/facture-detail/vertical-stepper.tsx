"use client";

import type { FactureStatut } from "@/lib/store";
import { FACTURE_ALLOWED_TRANSITIONS } from "@/lib/status-flow";
import { StatusVerticalStepper } from "@/components/sltt/status-vertical-stepper";
import { STATUT_CONFIG, STATUT_FLOW } from "./facture-statut-config";

export function VerticalStepper({
  statut,
  onSelect,
  canWrite,
}: {
  statut: FactureStatut;
  onSelect: (s: FactureStatut) => void;
  canWrite: boolean;
}) {
  const terminalCfg = STATUT_CONFIG.Annulée;
  const TerminalIcon = terminalCfg.icon;

  return (
    <StatusVerticalStepper
      statut={statut}
      flow={STATUT_FLOW}
      config={STATUT_CONFIG}
      allowedNext={FACTURE_ALLOWED_TRANSITIONS[statut] ?? []}
      onSelect={onSelect}
      canWrite={canWrite}
      blockedManual={["Partielle"]}
      isTerminal={statut === "Annulée"}
      renderTerminal={
        <div className="flex items-center gap-2.5 rounded-xl bg-red-50 p-3 text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <TerminalIcon className="size-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Annulée</p>
            <p className="text-xs opacity-70">{terminalCfg.desc}</p>
          </div>
        </div>
      }
    />
  );
}
