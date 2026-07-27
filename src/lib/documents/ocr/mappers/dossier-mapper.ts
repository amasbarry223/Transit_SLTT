/**
 * Mapping heuristique FR : texte OCR brut → champs dossier de transit.
 * Confiance = score heuristique (longueur / pattern match), pas un score ML.
 */

import type { OcrExtractedField } from "../provider";

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

export function mapDossierFieldsFromText(rawText: string): OcrExtractedField[] {
  const text = rawText.replace(/\r/g, "");
  const fields: OcrExtractedField[] = [];

  const bl = findFirst(text, [
    /(?:N[°o.]?\s*(?:BL|B\/L)|B\/L|connaissement)\s*[:\-]?\s*([A-Z0-9\-\/]{5,30})/i,
    /\bBL\s*[:\-]?\s*([A-Z0-9\-\/]{5,30})/i,
  ]);
  if (bl) fields.push({ fieldKey: "bl", fieldValue: bl.value, confidence: bl.confidence });

  const date = findFirst(text, [
    /(?:date|du)\s*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
    /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4})\b/,
  ]);
  if (date) {
    fields.push({
      fieldKey: "date",
      fieldValue: normalizeDate(date.value),
      confidence: date.confidence * 0.95,
    });
  }

  const client = findFirst(text, [
    /(?:client|destinataire|consignee|nom)\s*[:\-]?\s*([A-Za-zÀ-ÿ0-9 &\-'.]{3,60})/i,
  ]);
  if (client) {
    fields.push({
      fieldKey: "client_nom",
      fieldValue: client.value.replace(/\s+/g, " ").slice(0, 80),
      confidence: client.confidence * 0.85,
    });
  }

  const montant = findFirst(text, [
    /(?:montant|total|ttc|investi)\s*[:\-]?\s*([\d\s.,]+)\s*(?:F(?:CFA)?|XOF)?/i,
    /\b([\d]{1,3}(?:[\s.,]\d{3})+(?:[.,]\d{2})?)\s*(?:F(?:CFA)?|XOF)?/i,
  ]);
  if (montant) {
    fields.push({
      fieldKey: "montant",
      fieldValue: String(parseMontant(montant.value)),
      confidence: montant.confidence * 0.8,
    });
  }

  const refDouane = findFirst(text, [
    /(?:réf(?:érence)?\.?\s*douanière|DAU|SYDONIA|n[°o.]?\s*déclaration)\s*[:\-]?\s*([A-Z0-9\-\/]{4,40})/i,
  ]);
  if (refDouane) {
    fields.push({
      fieldKey: "ref_douaniere",
      fieldValue: refDouane.value,
      confidence: refDouane.confidence,
    });
  }

  const nature = findFirst(text, [
    /(?:nature|marchandise|description)\s*[:\-]?\s*([A-Za-zÀ-ÿ0-9 &\-'.]{3,80})/i,
  ]);
  if (nature) {
    fields.push({
      fieldKey: "nature",
      fieldValue: nature.value.replace(/\s+/g, " ").slice(0, 100),
      confidence: nature.confidence * 0.75,
    });
  }

  const camion = findFirst(text, [
    /(?:camion|immatriculation|véhicule)\s*[:\-]?\s*([A-Z0-9\-\s]{4,20})/i,
  ]);
  if (camion) {
    fields.push({
      fieldKey: "camion",
      fieldValue: camion.value.trim(),
      confidence: camion.confidence * 0.8,
    });
  }

  return fields;
}

function normalizeDate(raw: string): string {
  const parts = raw.split(/[\/\-.]/).map((p) => p.trim());
  if (parts.length !== 3) return raw;
  let [a, b, c] = parts;
  if (c.length === 2) c = `20${c}`;
  // Assume DD/MM/YYYY
  if (a.length <= 2 && b.length <= 2 && c.length === 4) {
    return `${c}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`;
  }
  return raw;
}

function parseMontant(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/,(?=\d{3}\b)/g, "").replace(",", ".");
  const n = Number(cleaned.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}
