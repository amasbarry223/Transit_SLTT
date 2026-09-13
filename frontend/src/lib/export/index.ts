export { htmlEscape } from "./html-escape";

export { printHTML, printHtmlDocument } from "./print-document";

export { exportToExcel } from "./excel-export";

export {
  buildBonSortieCaisseHTML,
  printBilan,
  printBonSortieCaisseModule,
  printClasseur,
  printClients,
  printDevis,
  printDevisList,
  printFactureModule,
  buildRecuPaiementHTML,
  printRecuPaiementModule,
  printStockInventory,
  printTransporteurs,
  shouldShowTva,
  type BilanPrintRow,
  type BilanPrintTotals,
  type BonSortieCaisseModuleData,
  type ClasseurPrintRow,
  type ClientPrintRow,
  type DevisData,
  type DevisListPrintRow,
  type FactureModuleData,
  type RecuPaiementModuleData,
  type StockInventoryGroup,
  type StockInventoryRow,
  type TransporteurPrintRow,
} from "./print-modules";

export type { PrintHTMLBrand, SocieteBrand, SocieteLegalInfo } from "@/lib/societe-brand";
