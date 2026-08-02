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
  workerBlobURL: true,
  gzip: true,
  logger: () => undefined,
} as const;

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

/** Reconnaît une image ; abandonne proprement si AbortSignal se déclenche. */
async function recognizeWithAbort(
  Tesseract: any,
  img: Blob,
  signal?: AbortSignal,
): Promise<{ text: string; confidence: number }> {
  assertNotAborted(signal);

  const recognizePromise = Tesseract.recognize(img, "fra+eng", OCR_WORKER_OPTIONS).then(
    (result: { data: { text?: string; confidence?: number } }) => ({
      text: result.data.text || "",
      confidence: (result.data.confidence || 0) / 100,
    }),
  );

  if (!signal) return recognizePromise;

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    recognizePromise
      .then((value: { text: string; confidence: number }) => {
        signal.removeEventListener("abort", onAbort);
        if (signal.aborted) {
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        resolve(value);
      })
      .catch((err: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(err);
      });
  });
}

export class TesseractOcrProvider implements OcrProvider {
  readonly name = "tesseract";

  async extract(
    blob: Blob,
    mimeType: string,
    signal?: AbortSignal,
  ): Promise<OcrExtractResult> {
    assertNotAborted(signal);
    const Tesseract = await import("tesseract.js");
    const images: Blob[] = [];
    let pdfPages: OcrExtractResult["pdfPages"];

    if (mimeType.includes("pdf") || mimeType === "application/pdf") {
      const raster = await rasterizePdfToBlobs(blob);
      assertNotAborted(signal);
      if (raster.blobs.length === 0) {
        throw new Error("Impossible de rasteriser le PDF");
      }
      pdfPages = {
        processed: raster.blobs.length,
        total: raster.totalPages,
        truncated: raster.truncated,
      };
      for (const page of raster.blobs) {
        assertNotAborted(signal);
        images.push(await preprocessImageBlob(page));
      }
    } else {
      images.push(await preprocessImageBlob(blob));
    }

    const texts: string[] = [];
    let meanConfidence = 0;

    for (const img of images) {
      assertNotAborted(signal);
      const page = await recognizeWithAbort(Tesseract, img, signal);
      texts.push(page.text);
      meanConfidence += page.confidence;
    }

    assertNotAborted(signal);

    const rawText = texts.join("\n\n---\n\n").trim();
    if (!rawText) {
      throw new Error("Aucun texte détecté — document illisible ou scan trop dégradé");
    }

    const avgConf = meanConfidence / images.length;
    const fields = mapDossierFieldsFromText(rawText).map((f) => ({
      ...f,
      confidence:
        f.confidence != null
          ? Math.round(f.confidence * (0.5 + 0.5 * avgConf) * 1000) / 1000
          : avgConf,
    }));

    return { rawText, fields, pdfPages };
  }
}

let singleton: TesseractOcrProvider | null = null;

export function getDefaultOcrProvider(): OcrProvider {
  if (!singleton) singleton = new TesseractOcrProvider();
  return singleton;
}
