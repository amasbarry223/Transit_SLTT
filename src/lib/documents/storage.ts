import { supabase } from "@/lib/supabase";
import { logError } from "@/shared/logger";
import { SIGNED_URL_TTL_SEC } from "@/lib/constants";

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
  expiresIn = SIGNED_URL_TTL_SEC,
): Promise<string> {
  // Pont legacy : fichiers encore dans dossier_fichiers (data_url / bucket public).
  if (storagePath.startsWith("legacy/dossier_fichiers/")) {
    const id = storagePath.split("/")[2];
    if (id) {
      const { data } = await supabase
        .from("dossier_fichiers")
        .select("data_url")
        .eq("id", id)
        .maybeSingle();
      if (data?.data_url) return data.data_url as string;
    }
  }

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

/** Retourne false si la suppression a échoué (fichier(s) resté(s) orphelin(s) en Storage) — à surfacer à l'appelant plutôt qu'avaler silencieusement. */
export async function removeDocumentStoragePaths(paths: string[]): Promise<boolean> {
  if (paths.length === 0) return true;
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove(paths);
  if (error) {
    logError("[documents] Échec suppression storage", error, { message: error.message });
    return false;
  }
  return true;
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

/**
 * Convertit une data: URL en Blob sans passer par fetch() : la CSP
 * (connect-src) n'autorise pas les requêtes vers le schéma data:, donc
 * fetch(dataUrl) échoue silencieusement (upload bloqué) dès que la CSP est
 * active — y compris en dev, connect-src étant identique aux deux environnements.
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const match = /^data:([^;,]*)?(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) throw new Error("URL de données invalide.");
  const [, mime = "application/octet-stream", isBase64, data] = match;
  if (!isBase64) {
    return new Blob([decodeURIComponent(data)], { type: mime });
  }
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
