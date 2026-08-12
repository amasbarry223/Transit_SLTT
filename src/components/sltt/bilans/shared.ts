export type Periode = "mensuel" | "trimestriel" | "semestriel" | "annuel";
export type SortKey = "client" | "investi" | "encaisse" | "reste" | "ecart";
export type SortDir = "asc" | "desc";

export const PERIODES: { value: Periode; label: string }[] = [
  { value: "mensuel", label: "Mensuel" },
  { value: "trimestriel", label: "Trimestriel" },
  { value: "semestriel", label: "Semestriel" },
  { value: "annuel", label: "Annuel" },
];

/** "AAAA-MM" du mois courant — mois par défaut du filtre Bilans (jamais figé dans le passé). */
export function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getPeriodeLabel(periode: Periode, mois: string): string {
  const [year, month] = (mois || currentYearMonth()).split("-").map(Number);
  switch (periode) {
    case "mensuel":
      return new Date(year, month - 1).toLocaleString("fr-FR", {
        month: "long",
        year: "numeric",
      });
    case "trimestriel":
      return `T${Math.ceil(month / 3)} ${year}`;
    case "semestriel":
      return `S${month <= 6 ? 1 : 2} ${year}`;
    case "annuel":
      return String(year);
    default:
      return mois;
  }
}
