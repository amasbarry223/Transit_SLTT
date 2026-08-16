import type { Annexe, Societe } from "@/lib/domain-types";
import type { RecuPaiementModuleData } from "@/lib/export";
import {
  buildRecuPaiementHTML,
  printRecuPaiementModule,
  type RecuPaiementModuleData as ModuleData,
} from "@/lib/export";
import { mergeAnnexeIntoBrand, resolveSlttBrand, type SocieteBrand } from "@/lib/societe-brand";
import type { RecuPaiement } from "@/lib/domain-types";

export interface RecuFormModuleInput {
  nom: string;
  prenom: string;
  somme: number;
  motif: string;
  montantPaye: number;
  reste: number;
  date: string;
  signature?: string;
}

export function resolveGeneratorBrand(
  societes: Societe[],
  annexes: Annexe[],
  activeAnnexeId: string | null,
): SocieteBrand | null {
  const base = resolveSlttBrand(societes);
  if (!base) return null;
  const annexe = activeAnnexeId ? annexes.find((a) => a.id === activeAnnexeId) : undefined;
  return annexe ? mergeAnnexeIntoBrand(base, annexe) : base;
}

export function formToModuleData(input: RecuFormModuleInput): RecuPaiementModuleData {
  return {
    date: input.date,
    nom: input.nom,
    prenom: input.prenom,
    somme: input.somme,
    motif: input.motif,
    montantPaye: input.montantPaye,
    reste: input.reste,
    signature: input.signature,
  };
}

function toRecuModuleData(recu: RecuPaiement): ModuleData {
  return {
    date: recu.createdAt,
    nom: recu.nom,
    prenom: recu.prenom,
    somme: recu.somme,
    motif: recu.motif,
    montantPaye: recu.montantPaye,
    reste: recu.reste,
  };
}

function resolveRecuBrand(recu: RecuPaiement, societes: Societe[], annexes: Annexe[]): SocieteBrand | null {
  const base = resolveSlttBrand(societes);
  if (!base) return null;
  const annexe = annexes.find((a) => a.id === recu.annexeId);
  return annexe ? mergeAnnexeIntoBrand(base, annexe) : base;
}

/** Données d'impression / aperçu — résout l'identité société transit + coordonnées annexe. */
export function buildRecuPrintData(
  recu: RecuPaiement,
  societes: Societe[],
  annexes: Annexe[],
): { html: string; brand: SocieteBrand } | null {
  const brand = resolveRecuBrand(recu, societes, annexes);
  if (!brand) return null;
  return {
    brand,
    html: buildRecuPaiementHTML(toRecuModuleData(recu), brand),
  };
}

/** Imprime un reçu enregistré — ouvre la fenêtre d'impression directement. */
export function printRecu(recu: RecuPaiement, societes: Societe[], annexes: Annexe[]): boolean {
  const brand = resolveRecuBrand(recu, societes, annexes);
  if (!brand) return false;
  return printRecuPaiementModule(toRecuModuleData(recu), brand);
}

/** Imprime les données du générateur (formulaire en cours). */
export function printRecuFromForm(data: RecuPaiementModuleData, brand: SocieteBrand | null): boolean {
  if (!brand) return false;
  return printRecuPaiementModule(data, brand);
}
