export type ClientType = "Particulier" | "Entreprise";

export interface Client {
  id: string;
  nom: string;
  type: ClientType;
  telephone: string;
  email: string;
  adresse: string;
  annexeId: string;
  annexeNom?: string;
  societeId: string;
  societeNom?: string;
  nbDossiers: number;
  totalDu: number;
  totalPaye: number;
}

export interface ClientInput {
  nom: string;
  type: ClientType;
  telephone: string;
  email: string;
  adresse: string;
  annexeId: string;
  societeId: string;
}

export interface ClientPrintRow {
  nom: string;
  type: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  nbDossiers: number;
  totalDu: number;
}
