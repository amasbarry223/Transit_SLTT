/** Contrat OCR — permet de basculer Tesseract → cloud sans changer l'UI. */

export type OcrExtractedField = {
  fieldKey: string;
  fieldValue?: string;
  confidence?: number;
};

export type OcrExtractResult = {
  rawText: string;
  fields: OcrExtractedField[];
};

export interface OcrProvider {
  readonly name: string;
  extract(blob: Blob, mimeType: string): Promise<OcrExtractResult>;
}
