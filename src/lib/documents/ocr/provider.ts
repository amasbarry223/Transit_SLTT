/** Contrat OCR — permet de basculer Tesseract → cloud sans changer l'UI. */

export type OcrExtractedField = {
  fieldKey: string;
  fieldValue?: string;
  confidence?: number;
};

export type OcrPdfPagesInfo = {
  processed: number;
  total: number;
  truncated: boolean;
};

export type OcrExtractResult = {
  rawText: string;
  fields: OcrExtractedField[];
  /** Présent si la source était un PDF (v1 plafonne le nombre de pages). */
  pdfPages?: OcrPdfPagesInfo;
};

/** Convertit le texte OCR brut en champs structurés — un mapper par formulaire cible (dossier, opération comptable…). */
export type OcrFieldMapper = (rawText: string) => OcrExtractedField[];

export interface OcrProvider {
  readonly name: string;
  extract(
    blob: Blob,
    mimeType: string,
    mapper: OcrFieldMapper,
    signal?: AbortSignal,
  ): Promise<OcrExtractResult>;
}
