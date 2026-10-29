export { htmlEscape } from "./html-escape";

export { printHTML } from "./print-document";

export { exportToExcel } from "./excel-export";

export {
  buildBonLivraisonHTML,
  buildBonSortieCaisseHTML,
  printBilan,
  printClasseur,
  printDevis,
  printDossiers,
  printDevisList,
  printFournisseurs,
  printFactureModule,
  printRecuPaiementBatch,
  printRecuPaiementTicket,
  printStockInventory,
  printTransporteurs,
  shouldShowTva,
  type BilanPrintRow,
  type BilanPrintTotals,
  type BonLivraisonModuleData,
  type BonSortieCaisseModuleData,
  type ClasseurPrintRow,
  type ClientPrintRow,
  type ContratPrintData,
  type ContratPrestationPrintRow,
  type DevisData,
  type DossierPrintRow,
  type DossierPrintTotals,
  type FournisseurPrintRow,
  type DevisListPrintRow,
  type FactureModuleData,
  type RecuPaiementModuleData,
  type RecuTicketData,
  type StockInventoryGroup,
  type StockInventoryRow,
  type TransporteurPrintRow,
} from "./print-modules";

export type { PrintHTMLBrand, SocieteBrand, SocieteLegalInfo } from "@/lib/societe-brand";
