import type { ViewKey } from "@/lib/nav-store";
import type { UserRole } from "@/lib/domain-types";

export const GUIDE_DISMISS_KEY = "sltt-guide-dismissed-v1";
export const GUIDE_RESET_EVENT = "sltt-guide-reset";

export type GuideStepId =
  | "clients"
  | "dossiers"
  | "paiements"
  | "bilans"
  | "stock"
  | "bons";

export type GuideStepView = Extract<
  ViewKey,
  "clients" | "dossiers" | "comptabilite" | "bilans" | "entreposage" | "bons"
>;

export interface GuideStepDef {
  id: GuideStepId;
  label: string;
  sub: string;
  view: GuideStepView;
  roles?: UserRole[];
}

export const GUIDE_STEP_DEFS: GuideStepDef[] = [
  {
    id: "clients",
    label: "Ajoutez vos clients",
    sub: "Annuaire et fiches clients",
    view: "clients",
    roles: ["Administrateur", "Agent de transit", "Comptable"],
  },
  {
    id: "dossiers",
    label: "Archivez un dossier",
    sub: "Client, camion, BL, montants",
    view: "dossiers",
    // Comptable n'a que dossiers:read (pas :write) — retiré pour éviter une
    // étape d'onboarding sans bouton "Nouveau dossier" disponible.
    roles: ["Administrateur", "Agent de transit"],
  },
  {
    id: "paiements",
    label: "Enregistrez les paiements",
    sub: "Écritures comptables",
    view: "comptabilite",
    roles: ["Administrateur", "Comptable"],
  },
  {
    id: "bilans",
    label: "Soldez votre premier dossier",
    sub: "Le bilan s'alimente une fois un dossier clôturé",
    view: "bilans",
    roles: ["Administrateur", "Comptable"],
  },
  {
    id: "stock",
    label: "Gérez le stock",
    sub: "Entrées, sorties, dépositaires",
    view: "entreposage",
    roles: ["Administrateur", "Magasinier"],
  },
  {
    id: "bons",
    label: "Émettez des bons de sortie",
    sub: "Date, client, motif, montant",
    view: "bons",
    roles: ["Administrateur", "Magasinier"],
  },
];

export interface GuideStoreSnapshot {
  clientsCount: number;
  dossiersCount: number;
  ecrituresCount: number;
  dossiersSoldesCount: number;
  stockCount: number;
  bonsCount: number;
}

export function isGuideStepComplete(
  stepId: GuideStepId,
  data: GuideStoreSnapshot,
): boolean {
  switch (stepId) {
    case "clients":
      return data.clientsCount > 0;
    case "dossiers":
      return data.dossiersCount > 0;
    case "paiements":
      return data.ecrituresCount > 0;
    case "bilans":
      return data.dossiersSoldesCount > 0;
    case "stock":
      return data.stockCount > 0;
    case "bons":
      return data.bonsCount > 0;
    default:
      return false;
  }
}

export function getGuideStepsForRole(role: UserRole): GuideStepDef[] {
  return GUIDE_STEP_DEFS.filter((s) => !s.roles || s.roles.includes(role)).slice(0, 4);
}

export function getGuideProgress(
  role: UserRole,
  data: GuideStoreSnapshot,
): { steps: GuideStepDef[]; completed: number; total: number; allComplete: boolean } {
  const steps = getGuideStepsForRole(role);
  const completed = steps.filter((s) => isGuideStepComplete(s.id, data)).length;
  return {
    steps,
    completed,
    total: steps.length,
    allComplete: steps.length > 0 && completed === steps.length,
  };
}

export function emitGuideReset(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GUIDE_RESET_EVENT));
}
