/** Rasterise les pages PDF en images via pdf.js (max 5 pages v1). */

const MAX_PAGES = 5;

export async function rasterizePdfToBlobs(pdfBlob: Blob): Promise<Blob[]> {
  const pdfjs = await import("pdfjs-dist");
  // Worker CDN — évite la config webpack Next pour le worker local.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await pdfBlob.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pageCount = Math.min(doc.numPages, MAX_PAGES);
  const blobs: Blob[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (blob) blobs.push(blob);
  }

  return blobs;
}
