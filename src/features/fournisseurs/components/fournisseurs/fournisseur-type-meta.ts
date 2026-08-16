import {
  Truck,
  Package,
  UserCheck,
  Wrench,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { FournisseurType } from "@/lib/store";

export const TYPES: FournisseurType[] = [
  "Transporteur",
  "Manutentionnaire",
  "Commissionnaire en douane",
  "Loueur",
  "Autre",
];

export const TYPE_META: Record<
  FournisseurType,
  { icon: LucideIcon; color: string; bg: string; short: string }
> = {
  Transporteur: {
    icon: Truck,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    short: "Transport",
  },
  Manutentionnaire: {
    icon: Package,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    short: "Manutention",
  },
  "Commissionnaire en douane": {
    icon: UserCheck,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    short: "Douane",
  },
  Loueur: {
    icon: Wrench,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    short: "Location",
  },
  Autre: {
    icon: MoreHorizontal,
    color: "text-muted-foreground",
    bg: "bg-muted",
    short: "Autre",
  },
};
