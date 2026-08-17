export { shouldShowTva } from "./shared";
export { printDevis, printDevisList, type DevisData, type DevisListPrintRow } from "./devis";
export { printFactureModule, type FactureModuleData } from "./facture";
export {
  buildRecuPaiementHTML,
  printRecuPaiementModule,
  type RecuPaiementModuleData,
} from "./recu-paiement";
export {
  buildBonSortieCaisseHTML,
  printBonSortieCaisseModule,
  type BonSortieCaisseModuleData,
} from "./bon-caisse";
export { printInvoice, type InvoiceData } from "./invoice";
export {
  printStockInventory,
  type StockInventoryRow,
  type StockInventoryGroup,
} from "./stock-inventory";
export { printClients, type ClientPrintRow } from "./clients";
export {
  printClasseur,
  type ClasseurPrintRow,
  type ClasseurPrintTotals,
} from "./classeur";
export {
  printBilan,
  type BilanPrintRow,
  type BilanPrintTotals,
} from "./bilan";
