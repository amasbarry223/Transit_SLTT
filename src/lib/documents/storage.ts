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
