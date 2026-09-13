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
    /(?:N[°o.]?\s*(?:BL|B\/L)|B\/L|connaissement|bill\s*of\s*lading)\s*[:\-]?\s*([A-Z0-9\-\/]{5,30})/i,
    /\bBL\s*[:\-]?\s*([A-Z0-9\-\/]{5,30})/i,
    /(?:n[°o.]?\s*(?:de\s+)?(?:connaissement|bordereau))\s*[:\-]?\s*([A-Z0-9\-\/]{5,30})/i,
  ]);
  if (bl) fields.push({ fieldKey: "bl", fieldValue: bl.value.toUpperCase(), confidence: bl.confidence });

  const date = findFirst(text, [
    /(?:date(?:\s+d[e']?\s*(?:émission|embarq|arrivée))?|du)\s*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
    /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4})\b/,
    /\b(\d{4}-\d{2}-\d{2})\b/,
  ]);
  if (date) {
    const normalized = normalizeDate(date.value);
    if (normalized) {
      fields.push({
        fieldKey: "date",
        fieldValue: normalized,
        confidence: date.confidence * (normalized === date.value ? 0.9 : 0.95),
      });
    }
  }

  const client = findFirst(text, [
    /(?:client|destinataire|consignee|importateur|nom)\s*[:\-]?\s*([A-Za-zÀ-ÿ0-9 &\-'.]{3,60})/i,
  ]);
  if (client) {
    fields.push({
      fieldKey: "client_nom",
      fieldValue: client.value.replace(/\s+/g, " ").slice(0, 80),
      confidence: client.confidence * 0.85,
    });
  }

  const montant = findFirst(text, [
    /(?:montant(?:\s+total|\s+investi)?|total\s*ttc|ttc|investi)\s*[:\-]?\s*([\d\s.,]+)\s*(?:F(?:CFA)?|XOF|€|EUR)?/i,
    /\b([\d]{1,3}(?:[\s.]\d{3})+(?:,\d{2})?)\s*(?:F(?:CFA)?|XOF)?/i,
    /\b([\d]{1,3}(?:,\d{3})+(?:\.\d{2})?)\s*(?:F(?:CFA)?|XOF|\$)?/i,
  ]);
  if (montant) {
    const parsed = parseMontant(montant.value);
    if (parsed != null && parsed > 0) {
      fields.push({
        fieldKey: "montant",
        fieldValue: String(parsed),
        confidence: montant.confidence * 0.8,
      });
    }
  }

  const refDouane = findFirst(text, [
    /(?:réf(?:érence)?\.?\s*douanière|DAU|SYDONIA|n[°o.]?\s*déclaration)\s*[:\-]?\s*([A-Z0-9\-\/]{4,40})/i,
  ]);
  if (refDouane) {
    fields.push({
      fieldKey: "ref_douaniere",
      fieldValue: refDouane.value.toUpperCase(),
      confidence: refDouane.confidence,
    });
  }

  const nature = findFirst(text, [
    /(?:nature|marchandise|description|désignation)\s*[:\-]?\s*([A-Za-zÀ-ÿ0-9 &\-'.]{3,80})/i,
  ]);
  if (nature) {
    fields.push({
      fieldKey: "nature",
      fieldValue: nature.value.replace(/\s+/g, " ").slice(0, 100),
      confidence: nature.confidence * 0.75,
    });
  }

  const camion = findFirst(text, [
    /(?:camion|immatriculation|véhicule|plaque)\s*[:\-]?\s*([A-Z0-9\-\s]{4,20})/i,
  ]);
  if (camion) {
    fields.push({
      fieldKey: "camion",
      fieldValue: camion.value.trim().toUpperCase(),
      confidence: camion.confidence * 0.8,
    });
  }

  return fields;
}

/** Retourne YYYY-MM-DD ou null si invalide. */
export function normalizeDate(raw: string): string | null {
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    if (!isValidYmd(y, m, d)) return null;
    return raw;
  }

  const parts = raw.split(/[\/\-.]/).map((p) => p.trim());
  if (parts.length !== 3) return null;
  let [a, b, c] = parts;
  if (c.length === 2) c = `20${c}`;
  // Assume DD/MM/YYYY (FR)
  if (a.length <= 2 && b.length <= 2 && c.length === 4) {
    const d = Number(a);
    const m = Number(b);
    const y = Number(c);
    if (!isValidYmd(y, m, d)) return null;
    return `${c}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return null;
}

function isValidYmd(y: number, m: number, d: number): boolean {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
  if (y < 1990 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * Parse montants FR (1 234 567,89 / 1.234.567,89) et EN (1,234,567.89).
 * Retourne null si ambigu ou non numérique (évite de préremplir 0).
 */
export function parseMontant(raw: string): number | null {
  let s = raw.trim().replace(/\s/g, "");
  if (!s) return null;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    // Le séparateur décimal est le dernier des deux.
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      // 1.234.567,89
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      // 1,234,567.89
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    // 1234,56 ou 1.234 via comma as decimal (FR)
    const parts = s.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      s = `${parts[0].replace(/\./g, "")}.${parts[1]}`;
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasDot) {
    const parts = s.split(".");
    // 1.234.567 → thousands ; 1234.56 → decimal
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3)) {
      s = s.replace(/\./g, "");
    }
  }

  const cleaned = s.replace(/[^\d.]/g, "");
  if (!cleaned || cleaned === ".") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  // Évite de préremplir 0 quand le texte n'avait aucun chiffre significatif
  if (n === 0 && !/\d/.test(raw)) return null;
  return Math.round(n);
}
