import { getDefaultOcrProvider } from "./tesseract-provider";
import type { OcrExtractResult } from "./provider";
import { getSignedDocumentUrl } from "@/lib/documents/storage";

/** Télécharge une version document et lance l'OCR (client-side). */
export async function runOcrOnStoragePath(
  storagePath: string,
  mimeType: string,
): Promise<OcrExtractResult> {
  const url = await getSignedDocumentUrl(storagePath);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Téléchargement du document impossible pour l'OCR");
  const blob = await res.blob();
  const provider = getDefaultOcrProvider();
  return provider.extract(blob, mimeType || blob.type);
}
