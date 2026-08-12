/** Constantes visuelles partagées entre l'aperçu React et le HTML d'impression. */
export const RECEIPT_BLUE = "#1e4a8a";
export const RECEIPT_PAPER = "#dce8f5";
/** Format horizontal — carnet papier TRAORE DE LOGISTIQUE (paysage). */
export const RECEIPT_WIDTH_MM = 240;
export const RECEIPT_HEIGHT_MM = 100;

/** Répartit un texte long sur N lignes (équilibré par mots). */
export function splitTextIntoLines(text: string, lineCount: number): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return Array.from({ length: lineCount }, () => "");
  if (words.length <= lineCount) {
    const lines = [...words];
    while (lines.length < lineCount) lines.push("");
    return lines;
  }
  const lines: string[] = [];
  const chunkSize = Math.ceil(words.length / lineCount);
  for (let i = 0; i < lineCount; i++) {
    lines.push(words.slice(i * chunkSize, (i + 1) * chunkSize).join(" "));
  }
  return lines;
}
