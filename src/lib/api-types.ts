/**
 * Formes brutes (JSON) renvoyées par l'API NestJS, avant mapping vers les
 * types domaine du front (data-fetch-slice.ts) ou avant écriture (api-client.ts).
 * Champs optionnels dès que la relation Prisma peut être absente (include non
 * demandé côté service) ou que la colonne elle-même est nullable — ces types
 * ne visent pas l'exhaustivité du schéma Prisma, seulement les champs
 * effectivement lus côté front (cf. api/prisma/schema.prisma pour le détail
 * complet de chaque modèle).
 */

export interface RawAnnexeRef {
  id?: string;
  nom?: string;
}

export interface RawClientRef {
  id?: string;
  nom?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
}

export interface RawPortRef {
  id?: string;
  nom?: string;
  code?: string;
}

export interface RawDossier {
  id: string;
  numero?: string;
  reference?: string;
  annexeId?: string;
  annexe_id?: string;
  annexe?: RawAnnexeRef;
  clientId?: string;
  client_id?: string;
  client?: RawClientRef;
  numeroBl?: string;
  bl?: string;
  navireVol?: string;
  camion?: string;
  marchandise?: string;
  nature?: string;
  valeurDouane?: number;
  droitDouane?: number;
  fraisCircuit?: number;
  fraisPrestation?: number;
  montantInvesti?: number;
  montantPaye?: number;
  statut?: string;
  voieTransport?: string;
  dateDepart?: string;
  date?: string;
  createdAt?: string;
  dateArriveePrevue?: string;
  dateEcheance?: string;
  dateArriveeEffective?: string;
  dateDedouanement?: string;
  dateSolde?: string;
  conteneurs?: { numero?: string }[];
  noConteneur?: string;
  portDestination?: string;
  portEntree?: string;
  poids?: number;
  poidsTotal?: number;
  notes?: string;
}

export interface RawLigneFacture {
  id?: string;
  designation?: string;
  description?: string;
  quantite?: number;
  prixUnitaire?: number;
  montantTotal?: number;
  montantHT?: number;
}

export interface RawFacture {
  id: string;
  numero?: string;
  dossierId?: string | null;
  clientId?: string;
  client?: RawClientRef;
  annexeId?: string;
  dateEmission?: string;
  dateEcheance?: string;
  statut?: string;
  lignes?: RawLigneFacture[];
  tauxTva?: number;
  tauxTVA?: number;
  montantHt?: number;
  montantHT?: number;
  montantTva?: number;
  montantTVA?: number;
  montantTtc?: number;
  montantTTC?: number;
  montantPaye?: number;
  notes?: string;
  creeParId?: string;
  createdAt?: string;
}

export interface RawContrat {
  id: string;
  reference?: string;
  annexeId?: string;
  annexe?: RawAnnexeRef;
  clientId?: string;
  client?: RawClientRef;
  objet?: string;
  dateDebut?: string;
  dateFin?: string;
  montant?: number;
  statut?: string;
  notes?: string;
  creePar?: string;
  createdAt?: string;
}

export interface RawLigneDevis {
  designation?: string;
  prixUnitaire?: number;
}

export interface RawDevis {
  id: string;
  numero?: string;
  clientId?: string;
  client?: RawClientRef;
  annexeId?: string;
  annexe?: RawAnnexeRef;
  nature?: string;
  dossierId?: string | null;
  portId?: string | null;
  port?: RawPortRef | null;
  lignes?: RawLigneDevis[];
  montantHt?: number;
  montantTtc?: number;
  statut?: string;
  createdAt?: string;
  dateValidite?: string;
  notes?: string;
}

export interface RawCaisse {
  id: string;
  code?: string;
  nom?: string;
  annexeId?: string;
  soldeActuel?: number;
  devise?: string;
  statut?: string;
}

export interface RawDepense {
  id: string;
  numero?: string;
  dossierId?: string;
  annexeId?: string;
  fournisseurId?: string;
  categorie?: string;
  statut?: string;
  montant?: number;
  devise?: string;
  justificatif?: string;
  description?: string;
  dateDepense?: string;
  createdAt?: string;
}

export interface RawFournisseur {
  id: string;
  nom: string;
  type?: string;
  contact?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  tarifContractuel?: number;
  actif?: boolean;
  statut?: string;
  annexeId?: string;
  _count?: { depenses?: number };
}

export interface RawTransporteur {
  id: string;
  nom: string;
  contact?: string;
  telephone?: string;
  email?: string;
  vehicule?: string;
  immatriculation?: string;
  trajet?: string;
  capacite?: number;
  statut?: string;
  dateCreation?: string;
  createdAt?: string;
  notes?: string;
  annexeId?: string;
}

export interface RawStockItem {
  id: string;
  clientId?: string;
  client?: RawClientRef;
  annexeId?: string;
  annexe?: RawAnnexeRef;
  marchandise: string;
  quantite?: number;
  unite?: string;
  seuil?: number;
  depositaire?: string;
  commercial?: string;
  sommePayee?: number;
  resteAPayer?: number;
  date?: string;
}

export interface RawMouvementStock {
  id: string;
  stockId?: string;
  annexeId?: string;
  annexe?: RawAnnexeRef;
  date?: string;
  createdAt?: string;
  type?: string;
  marchandise?: string;
  stock?: { marchandise?: string };
  quantite?: number;
  unite?: string;
  responsable?: string;
  bonRef?: string;
  motif?: string;
}

export interface RawBonSortie {
  id: string;
  reference?: string;
  date?: string;
  clientId?: string;
  client?: RawClientRef;
  clientNom?: string;
  annexeId?: string;
  annexe?: RawAnnexeRef;
  stockId?: string;
  marchandise?: string;
  quantite?: number;
  unite?: string;
  motif?: string;
  montant?: number;
  statut?: string;
}

export interface RawLigneBonSortieCaisse {
  id?: string;
  date?: string;
  beneficiaire?: string;
  motif?: string;
  montant?: number;
}

export interface RawBonSortieCaisse {
  id: string;
  reference?: string;
  date?: string;
  annexeId?: string;
  annexe?: RawAnnexeRef;
  montantTotal?: number;
  creePar?: string;
  createdAt?: string;
  lignes?: RawLigneBonSortieCaisse[];
}

export interface RawRecuPaiement {
  id: string;
  reference?: string;
  annexeId?: string;
  annexe?: RawAnnexeRef;
  nom?: string;
  prenom?: string;
  somme?: number;
  motif?: string;
  montantPaye?: number;
  reste?: number;
  statut?: string;
  creePar?: string;
  createdAt?: string;
}

export interface RawOperationComptable {
  id: string;
  reference?: string;
  annexeId?: string;
  date?: string;
  clientId?: string;
  dossierId?: string;
  clientNom?: string;
  nature?: string;
  type?: string;
  montant?: number;
  modePaiement?: string;
  source?: string;
  importRef?: string;
  creePar?: string;
}

export interface RawClotureCaisse {
  id: string;
  annexeId?: string;
  periodeDebut?: string;
  periodeFin?: string;
  soldeTheorique?: number;
  soldeConstate?: number;
  ecart?: number;
  note?: string;
  cloturePar?: string;
  clotureLe?: string;
}

export interface RawAnnexe {
  id: string;
  nom: string;
  code?: string;
  villeSiege?: string;
  ville?: string;
  adresse?: string;
  telephone?: string;
  rccm?: string;
  nif?: string;
  devise?: string;
  actif?: boolean;
}

export interface RawPort {
  id: string;
  code: string;
  nom: string;
  ville?: string;
  pays?: string;
  actif?: boolean;
}

export interface RawClient {
  id: string;
  nom: string;
  type?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  annexeId?: string;
  annexe_id?: string;
  annexe?: RawAnnexeRef;
  createdAt?: string;
  _count?: { dossiers?: number };
}

export interface RawUserAnnexe {
  annexeId?: string;
  annexe?: { id?: string };
}

export interface RawSetting {
  id?: string;
  cle: string;
  valeur?: string;
  description?: string;
}

export interface RawTrackingPublic {
  id?: string;
  dossierId?: string;
  codeTracking?: string;
  actif?: boolean;
  dernierePosition?: string;
  statutAffiche?: string;
}

export interface RawDocument {
  id: string;
  dossierId?: string;
  nomFichier?: string;
  nomOriginal?: string;
  typeMime?: string;
  taille?: number;
  url?: string;
}

export interface RawUser {
  id: string;
  nom: string;
  email: string;
  role: string;
  permissions?: string[];
  actif?: boolean;
  derniereConnexion?: string;
  userAnnexes?: RawUserAnnexe[];
}

/** Enveloppe de pagination utilisée par /dossiers et /factures. */
export interface RawPaginated<T> {
  data: T[];
  meta?: Record<string, unknown>;
}
