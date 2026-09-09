import { getDefaultOcrProvider } from "./tesseract-provider";
import type { OcrExtractResult, OcrFieldMapper } from "./provider";

/** Télécharge une version document et lance l'OCR (client-side). */
export async function runOcrOnStoragePath(
  storagePath: string,
  mimeType: string,
  mapper: OcrFieldMapper,
  signal?: AbortSignal,
): Promise<OcrExtractResult> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const res = await fetch(storagePath, { signal });
  if (!res.ok) throw new Error("Téléchargement du document impossible pour l'OCR");
  const blob = await res.blob();
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const provider = getDefaultOcrProvider();
  return provider.extract(blob, mimeType || blob.type, mapper, signal);
}

/** Lance l'OCR directement sur un Blob local (pas encore uploadé) — utilisé par les flux de capture autonomes (ex. comptabilité générale). */
export async function runOcrOnBlob(
  blob: Blob,
  mimeType: string,
  mapper: OcrFieldMapper,
  signal?: AbortSignal,
): Promise<OcrExtractResult> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const provider = getDefaultOcrProvider();
  return provider.extract(blob, mimeType || blob.type, mapper, signal);
}
