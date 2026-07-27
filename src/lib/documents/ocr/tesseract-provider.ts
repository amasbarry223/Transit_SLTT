import type { OcrExtractResult, OcrProvider } from "./provider";
import { preprocessImageBlob } from "./preprocess";
import { rasterizePdfToBlobs } from "./pdf-rasterize";
import { mapDossierFieldsFromText } from "./mappers/dossier-mapper";

/**
 * Chemins locaux (/public/ocr) — compatibles CSP (pas de CDN jsDelivr).
 * Assets synchronisés via `npm run sync:ocr-assets`.
 */
const OCR_WORKER_OPTIONS = {
  workerPath: "/ocr/worker.min.js",
  corePath: "/ocr",
  langPath: "/ocr/lang",
  // workerBlobURL + importScripts('/ocr/worker...') reste same-origin.
  workerBlobURL: true,
  gzip: true,
  logger: () => undefined,
} as const;

export class TesseractOcrProvider implements OcrProvider {
  readonly name = "tesseract";

  async extract(blob: Blob, mimeType: string): Promise<OcrExtractResult> {
    const Tesseract = await import("tesseract.js");
    const images: Blob[] = [];

    if (mimeType.includes("pdf") || mimeType === "application/pdf") {
      const pages = await rasterizePdfToBlobs(blob);
      if (pages.length === 0) {
        throw new Error("Impossible de rasteriser le PDF");
      }
      for (const page of pages) {
        images.push(await preprocessImageBlob(page));
      }
    } else {
      images.push(await preprocessImageBlob(blob));
    }

    const texts: string[] = [];
    let meanConfidence = 0;

    for (const img of images) {
      const result = await Tesseract.recognize(img, "fra+eng", {
        ...OCR_WORKER_OPTIONS,
      });
      texts.push(result.data.text || "");
      meanConfidence += (result.data.confidence || 0) / 100;
    }

    const rawText = texts.join("\n\n---\n\n").trim();
    if (!rawText) {
      throw new Error("Aucun texte détecté — document illisible ou scan trop dégradé");
    }

    const avgConf = meanConfidence / images.length;
    const fields = mapDossierFieldsFromText(rawText).map((f) => ({
      ...f,
      // Combine heuristic field confidence with page OCR confidence
      confidence:
        f.confidence != null
          ? Math.round(f.confidence * (0.5 + 0.5 * avgConf) * 1000) / 1000
          : avgConf,
    }));

    return { rawText, fields };
  }
}

let singleton: TesseractOcrProvider | null = null;

export function getDefaultOcrProvider(): OcrProvider {
  if (!singleton) singleton = new TesseractOcrProvider();
  return singleton;
}
