import { hasPermission, type PermissionUser } from "@/lib/permissions";

export type DashboardSection =
  | "kpi_encaisse"
  | "kpi_restes"
  | "kpi_dossiers"
  | "kpi_stock"
  | "kpi_benefice"
  | "chart_dossiers_evolution"
  | "chart_stock_repartition"
  | "chart_tresorerie"
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
  chart_dossiers_evolution: (u) => hasPermission(u, "dossiers:read"),
  chart_stock_repartition: (u) => hasPermission(u, "stock:read"),
  chart_tresorerie: (u) => hasPermission(u, "comptabilite:read"),
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

