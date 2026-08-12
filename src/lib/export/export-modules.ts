/** Modules d'export Excel — chaque module exige sa permission `:read` dédiée. */
export const EXPORT_MODULES = [
  "clients",
  "dossiers",
  "devis",
  "factures",
  "comptabilite",
  "comptabilite-generale",
  "stock",
  "contrats",
  "transporteurs",
  "bilans",
] as const;

export type ExportModule = (typeof EXPORT_MODULES)[number];

export const EXPORT_MODULE_PERMISSIONS: Record<ExportModule, string> = {
  clients: "clients:read",
  dossiers: "dossiers:read",
  devis: "devis:read",
  factures: "factures:read",
  comptabilite: "comptabilite:read",
  "comptabilite-generale": "comptabilite:read",
  stock: "stock:read",
  contrats: "contrats:read",
  transporteurs: "transporteurs:read",
  bilans: "rapports:read",
};
