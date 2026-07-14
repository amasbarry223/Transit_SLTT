import { hasPermission, type PermissionUser } from "@/lib/permissions";

export type DashboardSection =
  | "kpi_encaisse"
  | "kpi_restes"
  | "kpi_dossiers"
  | "kpi_stock"
  | "kpi_benefice"
  | "chart_encaissements"
  | "chart_marges"
  | "chart_statuts"
  | "alertes_stock"
  | "alertes_dossiers"
  | "derniers_dossiers"
  | "role_panel";

const SECTION_PERMISSIONS: Record<DashboardSection, (user: PermissionUser) => boolean> = {
  kpi_encaisse: (u) =>
    hasPermission(u, "comptabilite:read") || hasPermission(u, "factures:read"),
  kpi_restes: (u) => hasPermission(u, "dossiers:read"),
  kpi_dossiers: (u) => hasPermission(u, "dossiers:read"),
  kpi_stock: (u) => hasPermission(u, "stock:read"),
  kpi_benefice: (u) => hasPermission(u, "comptabilite:read"),
  chart_encaissements: (u) => hasPermission(u, "comptabilite:read"),
  chart_marges: (u) => hasPermission(u, "dossiers:read"),
  chart_statuts: (u) => hasPermission(u, "dossiers:read"),
  alertes_stock: (u) => hasPermission(u, "stock:read"),
  alertes_dossiers: (u) => hasPermission(u, "dossiers:read"),
  derniers_dossiers: (u) => hasPermission(u, "dossiers:read"),
  role_panel: () => true,
};

export function getDashboardSections(user: PermissionUser | null | undefined): Set<DashboardSection> {
  const sections = new Set<DashboardSection>();
  if (!user || user.actif === false) return sections;

  for (const [section, check] of Object.entries(SECTION_PERMISSIONS) as [
    DashboardSection,
    (u: PermissionUser) => boolean,
  ][]) {
    if (check(user)) sections.add(section);
  }
  return sections;
}

export function kpiGridClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2";
  if (count === 3) {
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  }
  if (count === 4) {
    return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";
  }
  // 5+ : auto-fit remplit toute la largeur (plus de cellule orpheline vide)
  return "grid-cols-1 sm:[grid-template-columns:repeat(auto-fit,minmax(min(100%,13.5rem),1fr))]";
}
