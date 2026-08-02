/**
 * Conversion nombre → texte français, pour le montant en toutes lettres des
 * factures (modèle CI). Couvre 0 à 999 999 999 999 (largement suffisant pour
 * des montants FCFA) en français standard (accords "vingt"/"cent" au pluriel
 * uniquement s'ils ne sont pas suivis d'un autre nombre).
 */

const UNITS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
  "dix-sept", "dix-huit", "dix-neuf",
];

const TENS = [
  "", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix",
];

function twoDigitsToWords(n: number): string {
  if (n < 20) return UNITS[n];
  const ten = Math.floor(n / 10);
  const unit = n % 10;

  // 70-79 et 90-99 se construisent sur soixante/quatre-vingt + 11..19.
  if (ten === 7 || ten === 9) {
    return `${TENS[ten - 1]}-${UNITS[10 + unit]}`;
  }
  if (unit === 0) {
    return ten === 8 ? `${TENS[ten]}s` : TENS[ten];
  }
  if (unit === 1 && ten !== 8) {
    return `${TENS[ten]} et un`;
  }
  return `${TENS[ten]}-${UNITS[unit]}`;
}

function threeDigitsToWords(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds > 0) {
    parts.push(hundreds === 1 ? "cent" : `${UNITS[hundreds]} cent${rest === 0 ? "s" : ""}`);
  }
  if (rest > 0) parts.push(twoDigitsToWords(rest));
  return parts.join(" ");
}

/** Convertit un entier positif en toutes lettres françaises (sans devise). */
export function numberToWordsFr(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "zéro";

  const groups: { value: number; singular: string; plural: string }[] = [
    { value: 1_000_000_000, singular: "milliard", plural: "milliards" },
    { value: 1_000_000, singular: "million", plural: "millions" },
    { value: 1_000, singular: "mille", plural: "mille" },
  ];

  let remaining = n;
  const parts: string[] = [];

  for (const group of groups) {
    const count = Math.floor(remaining / group.value);
    if (count > 0) {
      const label =
        group.value === 1_000 && count === 1
          ? group.singular
          : `${threeDigitsToWords(count)} ${count > 1 ? group.plural : group.singular}`;
      parts.push(label);
      remaining %= group.value;
    }
  }

  if (remaining > 0 || parts.length === 0) {
    parts.push(threeDigitsToWords(remaining));
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** Montant FCFA en toutes lettres, tel qu'affiché sur une facture imprimée. */
export function montantEnLettresFCFA(fcfa: number): string {
  const words = numberToWordsFr(fcfa);
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return `${capitalized} franc${Math.floor(Math.abs(fcfa)) > 1 ? "s" : ""} CFA`;
}
