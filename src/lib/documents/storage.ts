import { supabase } from "@/lib/supabase";

export const DOCUMENTS_BUCKET = "documents";

/** Construit un chemin Storage unique pour une version de document. */
export function buildDocumentStoragePath(
  documentId: string,
  version: number,
  fileName: string,
): string {
  const safeName = fileName.replace(/[^\w.\-]+/g, "_");
  const month = new Date().toISOString().slice(0, 7);
  return `${month}/${documentId}/v${version}-${Date.now()}-${safeName}`;
}

export async function uploadDocumentBlob(
  path: string,
  blob: Blob,
  contentType?: string,
): Promise<void> {
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, blob, {
    contentType: contentType || blob.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
}

export async function getSignedDocumentUrl(
  storagePath: string,
  expiresIn = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeDocumentStoragePaths(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove(paths);
  if (error) {
    console.error("[documents] Échec suppression storage:", error.message);
  }
}

/** Hash SHA-256 hex (navigateur). */
export async function sha256Hex(blob: Blob): Promise<string | undefined> {
  try {
    const buffer = await blob.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return undefined;
  }
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
