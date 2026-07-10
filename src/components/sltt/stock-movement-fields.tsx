"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StockMovementFieldsProps {
  idPrefix: string;
  qty: string;
  onQtyChange: (value: string) => void;
  responsable: string;
  onResponsableChange: (value: string) => void;
  motif?: string;
  onMotifChange?: (value: string) => void;
  showMotif?: boolean;
}

/** Champs communs entrée/sortie de stock (entreposage). */
export function StockMovementFields({
  idPrefix,
  qty,
  onQtyChange,
  responsable,
  onResponsableChange,
  motif,
  onMotifChange,
  showMotif,
}: StockMovementFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-qty`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Quantité *
        </Label>
        <Input
          id={`${idPrefix}-qty`}
          type="number"
          min="1"
          value={qty}
          onChange={(e) => onQtyChange(e.target.value)}
          className="h-10"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-resp`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Responsable
        </Label>
        <Input
          id={`${idPrefix}-resp`}
          value={responsable}
          onChange={(e) => onResponsableChange(e.target.value)}
          className="h-10"
        />
      </div>
      {showMotif && onMotifChange && (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-motif`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Motif
          </Label>
          <Input
            id={`${idPrefix}-motif`}
            value={motif ?? ""}
            onChange={(e) => onMotifChange(e.target.value)}
            className="h-10"
            placeholder="Raison de la sortie"
          />
        </div>
      )}
    </>
  );
}
