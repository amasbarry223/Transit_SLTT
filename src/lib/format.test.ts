import { afterEach, describe, expect, it } from "vitest";
import { useUiPrefs } from "@/lib/session/ui-prefs-store";
import { formatFCFA, formatDateShort, formatDateTime } from "./format";

describe("formatFCFA", () => {
  afterEach(() => {
    useUiPrefs.getState().setCurrencyLabel("FCFA");
  });

  // Intl.NumberFormat("fr-FR") sépare les milliers par une espace fine
  // insécable (U+202F), pas une espace normale.
  const SEP = " ";

  it("affiche le libellé FCFA par défaut", () => {
    expect(formatFCFA(1_250_000)).toBe(`1${SEP}250${SEP}000 FCFA`);
  });

  it("omet le libellé quand withSymbol est false", () => {
    expect(formatFCFA(1_250_000, false)).toBe(`1${SEP}250${SEP}000`);
  });

  it("suit la préférence de libellé (XOF)", () => {
    useUiPrefs.getState().setCurrencyLabel("XOF");
    expect(formatFCFA(1_250_000)).toBe(`1${SEP}250${SEP}000 XOF`);
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
