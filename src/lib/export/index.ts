export { htmlEscape } from "./html-escape";

export { printHTML } from "./print-document";

export { exportToExcel } from "./excel-export";

export {
  buildBonSortieCaisseHTML,
  printBonSortieCaisseModule,
  printClasseur,
  printClients,
  printDevis,
  printDevisList,
  printFactureModule,
  printInvoice,
  buildRecuPaiementHTML,
  printRecuPaiementModule,
  printStockInventory,
  shouldShowTva,
  type BonSortieCaisseModuleData,
  type ClasseurPrintRow,
  type ClientPrintRow,
  type DevisData,
  type DevisListPrintRow,
  type FactureModuleData,
  type InvoiceData,
  type RecuPaiementModuleData,
  type StockInventoryGroup,
  type StockInventoryRow,
} from "./print-modules";

export type { PrintHTMLBrand, SocieteBrand, SocieteLegalInfo } from "@/lib/societe-brand";
