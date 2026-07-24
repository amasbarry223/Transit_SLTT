export { htmlEscape } from "./html-escape";

export { printHTML } from "./print-document";

export { exportToExcel } from "./excel-export";

export {
  printBonSortieCaisseModule,
  printClasseur,
  printClients,
  printDevis,
  printFactureModule,
  printInvoice,
  printStockInventory,
  shouldShowTva,
  type BonSortieCaisseModuleData,
  type ClasseurPrintRow,
  type ClientPrintRow,
  type DevisData,
  type FactureModuleData,
  type InvoiceData,
  type StockInventoryPrintOptions,
  type StockInventoryRow,
} from "./print-modules";

export type { PrintHTMLBrand, SocieteBrand, SocieteLegalInfo } from "@/lib/societe-brand";
