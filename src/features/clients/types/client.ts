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
  nbDossiers: number;
  totalDu: number;
  totalPaye: number;
  /** Date de création côté API (Prisma createdAt) — permet un calcul réel
   *  de variation mensuelle (nouveaux clients ce mois-ci vs le précédent). */
  createdAt?: string;
}

export interface ClientInput {
  nom: string;
  type: ClientType;
  telephone: string;
  email: string;
  adresse: string;
  annexeId: string;
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
