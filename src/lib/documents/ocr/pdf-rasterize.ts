/** Rasterise les pages PDF en images via pdf.js (max 5 pages v1). */

export const OCR_PDF_MAX_PAGES = 5;

export type PdfRasterizeResult = {
  blobs: Blob[];
  totalPages: number;
  truncated: boolean;
  maxPages: number;
};

export async function rasterizePdfToBlobs(pdfBlob: Blob): Promise<PdfRasterizeResult> {
  const pdfjs = await import("pdfjs-dist");
  // Worker servi en local (/public) — compatible CSP worker-src 'self'.
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = new Uint8Array(await pdfBlob.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const totalPages = doc.numPages;
  const pageCount = Math.min(totalPages, OCR_PDF_MAX_PAGES);
  const blobs: Blob[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error(`Impossible de créer le canvas pour la page PDF ${i}`);
    }
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) {
      throw new Error(`Rasterisation PNG échouée (page ${i})`);
    }
    blobs.push(blob);
  }

  return {
    blobs,
    totalPages,
    truncated: totalPages > OCR_PDF_MAX_PAGES,
    maxPages: OCR_PDF_MAX_PAGES,
  };
}
