export type DevisStatut = "Brouillon" | "Envoyé" | "Accepté" | "Refusé" | "Expiré";

export interface Devis {
  id: string;
  reference: string;
  clientId: string;
  clientNom: string;
  societeId: string;
  societeNom: string;
  annexeId: string;
  annexeNom?: string;
  nature: string;
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  total: number;
  statut: DevisStatut;
  dateCreation: string;
  dateValidite: string;
  notes?: string;
  dossierId?: string | null;
}

export interface DevisInput {
  clientId: string;
  clientNom: string;
  societeId: string;
  nature: string;
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  dateValidite: string;
  notes?: string;
}

export interface DevisListPrintRow {
  reference: string;
  clientNom: string;
  nature: string;
  total: number;
  statut: string;
  dateCreation: string;
  dateValidite: string;
}
