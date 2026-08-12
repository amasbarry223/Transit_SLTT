/**
 * Mapping heuristique FR : texte OCR brut (bon de caisse, reçu, page
 * photographiée du classeur) → champs d'une opération de comptabilité
 * générale. Même principe que dossier-mapper.ts : confiance heuristique
 * (longueur / pattern match), jamais un score ML — toujours revalidé par un
 * humain dans le dialog de revue avant tout enregistrement.
 */
import type { OcrExtractedField } from "../provider";
import { normalizeDate, parseMontant } from "./dossier-mapper";

function clampConfidence(n: number): number {
  return Math.max(0, Math.min(1, Math.round(n * 1000) / 1000));
}

function findFirst(text: string, patterns: RegExp[]): { value: string; confidence: number } | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const value = m[1].trim();
      const confidence = clampConfidence(0.55 + Math.min(0.4, value.length / 40));
      return { value, confidence };
    }
  }
  return null;
}

const ENTREE_KEYWORDS = /\b(entr[ée]e|encaissement|re[çc]u\s+de|versement\s+de|remboursement)\b/i;
const SORTIE_KEYWORDS = /\b(sortie|d[ée]caissement|pay[ée]\s+[àa]|frais|honoraire|loyer|achat)\b/i;

export function mapOperationComptableFieldsFromText(rawText: string): OcrExtractedField[] {
  const text = rawText.replace(/\r/g, "");
  const fields: OcrExtractedField[] = [];

  const date = findFirst(text, [
    /(?:date)\s*[:\-]?\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i,
    /\b(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})\b/,
    /\b(\d{4}-\d{2}-\d{2})\b/,
  ]);
  if (date) {
    const normalized = normalizeDate(date.value);
    if (normalized) {
      fields.push({ fieldKey: "date", fieldValue: normalized, confidence: date.confidence * (normalized === date.value ? 0.9 : 0.95) });
    }
  }

  const clientNom = findFirst(text, [
    /(?:client|tiers|b[ée]n[ée]ficiaire|re[çc]u\s+de|vers[ée]\s+(?:par|[àa]))\s*[:\-]?\s*([A-Za-zÀ-ÿ0-9 &\-'.]{3,60})/i,
  ]);
  if (clientNom) {
    fields.push({ fieldKey: "client_nom", fieldValue: clientNom.value.replace(/\s+/g, " ").slice(0, 80), confidence: clientNom.confidence * 0.8 });
  }

  const nature = findFirst(text, [
    /(?:motif|nature|objet|libell[ée])\s*[:\-]?\s*([A-Za-zÀ-ÿ0-9 &\-'.]{3,80})/i,
  ]);
  if (nature) {
    fields.push({ fieldKey: "nature", fieldValue: nature.value.replace(/\s+/g, " ").slice(0, 100), confidence: nature.confidence * 0.75 });
  }

  const montant = findFirst(text, [
    /(?:montant|somme|total)\s*[:\-]?\s*([\d\s.,]+)\s*(?:F(?:CFA)?|XOF|€|EUR)?/i,
    /\b([\d]{1,3}(?:[\s.]\d{3})+(?:,\d{2})?)\s*(?:F(?:CFA)?|XOF)?/i,
  ]);
  if (montant) {
    const parsed = parseMontant(montant.value);
    if (parsed != null && parsed > 0) {
      fields.push({ fieldKey: "montant", fieldValue: String(parsed), confidence: montant.confidence * 0.8 });
    }
  }

  const hasEntree = ENTREE_KEYWORDS.test(text);
  const hasSortie = SORTIE_KEYWORDS.test(text);
  if (hasEntree !== hasSortie) {
    fields.push({ fieldKey: "type", fieldValue: hasEntree ? "Entrée" : "Sortie", confidence: 0.6 });
  }

  return fields;
}
