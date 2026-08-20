import { afterEach, describe, expect, it } from "vitest";
import { useUiPrefs } from "@/lib/session/ui-prefs-store";
import { formatFCFA, formatDateShort, formatDateTime, parseAmount } from "./format";

describe("parseAmount", () => {
  it("parse un entier simple", () => {
    expect(parseAmount("18200000")).toBe(18_200_000);
  });

  it("parse un montant FR avec espaces milliers et virgule décimale", () => {
    expect(parseAmount("1 234 567,89")).toBe(1_234_568);
  });

  it("parse un montant EN avec virgules milliers et point décimal (bug réel : l'ancien code ne remplaçait que la première virgule)", () => {
    expect(parseAmount("1,234.56")).toBe(1_235);
    expect(parseAmount("1,234,567.89")).toBe(1_234_568);
  });

  it("parse un montant FR avec points milliers et virgule décimale", () => {
    expect(parseAmount("1.234.567,89")).toBe(1_234_568);
  });

  it("distingue point décimal isolé (1234.56) de points milliers seuls (1.234.567)", () => {
    expect(parseAmount("1234.56")).toBe(1235);
    expect(parseAmount("1.234.567")).toBe(1_234_567);
  });

  it("rejette les montants négatifs (retourne 0)", () => {
    expect(parseAmount("-500")).toBe(0);
  });

  it("retourne 0 pour une chaîne vide ou non numérique", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("abc")).toBe(0);
  });
});

describe("formatFCFA", () => {
  // Intl.NumberFormat("fr-FR") sépare les milliers par une espace fine
  // insécable (U+202F), pas une espace normale.
  const SEP = " ";

  it("affiche le libellé FCFA par défaut", () => {
    expect(formatFCFA(1_250_000)).toBe(`1${SEP}250${SEP}000 FCFA`);
  });

  it("omet le libellé quand withSymbol est false", () => {
    expect(formatFCFA(1_250_000, false)).toBe(`1${SEP}250${SEP}000`);
  });
});

describe("formatDateShort", () => {
  afterEach(() => {
    useUiPrefs.getState().setDateFormat("dmy");
  });

  it("formate en JJ/MM/AAAA par défaut", () => {
    expect(formatDateShort("2026-02-05")).toBe("05/02/2026");
  });

  it("formate en MM/JJ/AAAA selon la préférence", () => {
    useUiPrefs.getState().setDateFormat("mdy");
    expect(formatDateShort("2026-02-05")).toBe("02/05/2026");
  });

  it("formate en AAAA-MM-JJ selon la préférence", () => {
    useUiPrefs.getState().setDateFormat("ymd");
    expect(formatDateShort("2026-02-05")).toBe("2026-02-05");
  });

  it("renvoie — pour une valeur manquante ou invalide", () => {
    expect(formatDateShort(null)).toBe("—");
    expect(formatDateShort("pas une date")).toBe("—");
  });
});

describe("formatDateTime", () => {
  afterEach(() => {
    useUiPrefs.getState().setDateFormat("dmy");
  });

  it("inclut l'heure après la date formatée selon la préférence", () => {
    useUiPrefs.getState().setDateFormat("ymd");
    expect(formatDateTime("2026-02-05T14:30:00")).toBe("2026-02-05 14:30");
  });
});
