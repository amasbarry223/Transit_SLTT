export { htmlEscape } from "./html-escape";

export { printHTML } from "./print-document";

export { exportToExcel } from "./excel-export";

export {
  buildBonSortieCaisseHTML,
  printBilan,
  printClasseur,
  printClients,
  printContrat,
  printDevis,
  printDossiers,
  printDevisList,
  printFournisseurs,
  printFactureModule,
  printRecuPaiementModule,
  printRecuPaiementBatch,
  printStockInventory,
  printTransporteurs,
  shouldShowTva,
  type BilanPrintRow,
  type BilanPrintTotals,
  type BonSortieCaisseModuleData,
  type ClasseurPrintRow,
  type ClientPrintRow,
  type ContratPrintData,
  type ContratPrestationPrintRow,
  type ContratDepensePrintRow,
  type DevisData,
  type DossierPrintRow,
  type DossierPrintTotals,
  type FournisseurPrintRow,
  type DevisListPrintRow,
  type FactureModuleData,
  type RecuPaiementModuleData,
  type StockInventoryGroup,
  type StockInventoryRow,
  type TransporteurPrintRow,
} from "./print-modules";

export type { PrintHTMLBrand, SocieteBrand, SocieteLegalInfo } from "@/lib/societe-brand";
