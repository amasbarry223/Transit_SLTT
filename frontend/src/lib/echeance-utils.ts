import { ECHEANCE_IMMINENTE_JOURS, MS_PER_DAY } from "@/lib/constants";

export function calculateDaysUntil(dueDate: Date, referenceDate: Date): number {
  return Math.ceil((dueDate.getTime() - referenceDate.getTime()) / MS_PER_DAY);
}

export function isEcheanceDepassee(joursRestants: number | null): boolean {
  return joursRestants !== null && joursRestants < 0;
}

export function isEcheanceImminente(joursRestants: number | null): boolean {
  return (
    joursRestants !== null &&
    joursRestants >= 0 &&
    joursRestants <= ECHEANCE_IMMINENTE_JOURS
  );
}
