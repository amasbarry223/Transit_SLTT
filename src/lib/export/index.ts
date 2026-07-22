export { htmlEscape } from "./html-escape";

export {
  PRINT_BODY_SLTT_CSS,
  PRINT_BODY_SECTION_CSS,
  PRINT_BRAND_CSS,
  PRINT_DOC_HEADER_CSS,
  PRINT_DOC_META_CSS,
  PRINT_FOOTER_CSS,
  PRINT_HTML_DOCUMENT_CSS,
  PRINT_NO_PRINT_BAR_CSS,
  PRINT_NO_PRINT_BAR_HTML,
  PRINT_RESET_CSS,
  PRINT_SLTT_COMMON_CSS,
  PRINT_TABLE_BASE_CSS,
  PRINT_WRAP_CSS,
} from "./print-styles";

export {
  brandLogoImgHTML,
  buildBrandSubHTML,
  buildLegalLine,
  buildPrintDocument,
  documentFooterHTML,
  openPrintWindow,
  platformFooterHTML,
  printHTML,
  resolveLogoUrl,
  triggerPrint,
  warnPopupBlocked,
  type BuildPrintDocumentOptions,
} from "./print-document";

export { buildCsvBlob, exportToCSV } from "./csv-export";

export {
  printBonSortieCaisseModule,
  printClasseur,
  printClients,
  printContratModule,
  printDevis,
  printFactureModule,
  printInvoice,
  printStockInventory,
  shouldShowTva,
  type BonSortieCaisseModuleData,
  type ClasseurPrintRow,
  type ClientPrintRow,
  type ContratModuleData,
  type DevisData,
  type FactureModuleData,
  type InvoiceData,
  type StockInventoryPrintOptions,
  type StockInventoryRow,
} from "./print-modules";

export type { PrintHTMLBrand, SocieteBrand, SocieteLegalInfo } from "@/lib/societe-brand";
