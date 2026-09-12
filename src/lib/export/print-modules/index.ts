export { shouldShowTva } from "./shared";
export {
  printDevis,
  printDevisList,
  type DevisData,
  type DevisListPrintRow,
} from "@/features/devis/services/devis-print";
export { printFactureModule, type FactureModuleData } from "./facture";
export {
  printRecuPaiementModule,
  printRecuPaiementBatch,
  type RecuPaiementModuleData,
} from "./recu-paiement";
export {
  buildBonSortieCaisseHTML,
  type BonSortieCaisseModuleData,
} from "./bon-caisse";
export {
  printStockInventory,
  type StockInventoryRow,
  type StockInventoryGroup,
} from "./stock-inventory";
export {
  printDossiers,
  type DossierPrintRow,
  type DossierPrintTotals,
} from "./dossiers";
export {
  printContrat,
  type ContratPrintData,
  type ContratPrestationPrintRow,
  type ContratDepensePrintRow,
} from "@/features/contrats/services/contrat-print";
export { printClients } from "@/features/clients/services/client-print";
export type { ClientPrintRow } from "@/features/clients/types";
export { printTransporteurs, type TransporteurPrintRow } from "./transporteurs";
export { printFournisseurs, type FournisseurPrintRow } from "./fournisseurs";
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
