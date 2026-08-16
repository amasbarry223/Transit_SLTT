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
    label: "Constituez votre annuaire clients",
    sub: "Nom, contacts et historique en un clic",
    view: "clients",
    roles: ["Administrateur", "Agent de transit", "Comptable"],
  },
  {
    id: "dossiers",
    label: "Ouvrez votre premier dossier",
    sub: "Camion, BL, montants — tout au même endroit",
    view: "dossiers",
    // Comptable n'a que dossiers:read (pas :write) — retiré pour éviter une
    // étape d'onboarding sans bouton "Nouveau dossier" disponible.
    roles: ["Administrateur", "Agent de transit"],
  },
  {
    id: "paiements",
    label: "Tracez vos encaissements",
    sub: "Recettes, modes de paiement, soldes",
    view: "comptabilite",
    roles: ["Administrateur", "Comptable"],
  },
  {
    id: "bilans",
    label: "Clôturez et soldez un dossier",
    sub: "Le bilan se remplit automatiquement",
    view: "bilans",
    roles: ["Administrateur", "Comptable"],
  },
  {
    id: "stock",
    label: "Renseignez votre stock",
    sub: "Articles, seuils et mouvements",
    view: "entreposage",
    roles: ["Administrateur", "Magasinier"],
  },
  {
    id: "bons",
    label: "Autorisez une sortie de marchandise",
    sub: "Bon de sortie en quelques champs",
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
