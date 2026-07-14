/**
 * Domain types for the SLTT application.
 * All amounts are in FCFA. All text in French.
 */

export type DossierStatut = "En cours" | "Dédouané" | "Livré" | "Soldé";
export type PaiementMode =
  | "Espèces"
  | "Virement"
  | "Mobile Money"
  | "Chèque";
export type EcritureStatut = "Soldé" | "En attente";
export type StockStatut = "Disponible" | "Stock faible";
export type BonMotif = "Vente" | "Livraison" | "Transfert";
export type ClientType = "Particulier" | "Entreprise";
export type UserRole =
  | "Administrateur"
  | "Agent de transit"
  | "Comptable"
  | "Magasinier";

export interface Client {
  id: string;
  nom: string;
  type: ClientType;
  telephone: string;
  email: string;
  adresse: string;
  nbDossiers: number;
  totalDu: number;
  totalPaye: number;
}

export interface Dossier {
  id: string;
  reference: string;
  clientId: string;
  clientNom: string;
  bl: string;
  camion: string;
  nature: string;
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  montantInvesti: number;
  montantPaye: number;
  statut: DossierStatut;
  date: string;
  /** Date limite de dédouanement / livraison. Dépassée = surestaries. */
  dateEcheance?: string;
  /** Date réelle de dédouanement (remplie quand statut → Dédouané). */
  dateDedouanement?: string;
  /** IDs des documents de la checklist reçus. */
  checklistDocs?: string[];
  /** Mode de transport principal. */
  modeTransport?: "Maritime" | "Aérien" | "Routier" | "Ferroviaire";
  /** Numéro de conteneur (si Maritime). */
  noConteneur?: string;
  /** Port ou aéroport d'entrée. */
  portEntree?: string;
  /** Poids total en kg. */
  poidsTotal?: number;
  notes?: string;
}

/* ------------------------------------------------------------------ */
/* FOURNISSEURS / SOUS-TRAITANTS                                        */
/* ------------------------------------------------------------------ */

export type FournisseurType =
  | "Transporteur"
  | "Manutentionnaire"
  | "Commissionnaire en douane"
  | "Loueur"
  | "Autre";

export type FournisseurStatut = "Actif" | "Inactif";

export interface Fournisseur {
  id: string;
  nom: string;
  type: FournisseurType;
  contact: string;
  telephone: string;
  email: string;
  adresse: string;
  tarifContractuel?: number;
  nbDossiers: number;
  montantTotal: number;
  statut: FournisseurStatut;
}

export interface FournisseurInput {
  nom: string;
  type: FournisseurType;
  contact: string;
  telephone: string;
  email: string;
  adresse: string;
  tarifContractuel?: number;
  statut: FournisseurStatut;
}

export interface DossierFournisseur {
  id: string;
  dossierId: string;
  dossierRef?: string;
  fournisseurId: string;
  fournisseurNom: string;
  type: FournisseurType;
  description: string;
  montantBudgete: number;
  montantReel: number;
  statut: "En attente" | "Payé" | "Litige";
  date: string;
}

export interface DossierFournisseurInput {
  dossierId: string;
  dossierRef?: string;
  fournisseurId: string;
  fournisseurNom: string;
  type: FournisseurType;
  description: string;
  montantBudgete: number;
  montantReel: number;
  statut: "En attente" | "Payé" | "Litige";
  date: string;
}

/** Documents standards d'un dossier de transit. */
export const CHECKLIST_DOCS = [
  { id: "bl",                  label: "Connaissement (BL)",         obligatoire: true  },
  { id: "dau",                 label: "Déclaration en douane (DAU)", obligatoire: true  },
  { id: "bad",                 label: "Bon à délivrer (BAD)",        obligatoire: true  },
  { id: "facture-commerciale", label: "Facture commerciale",         obligatoire: true  },
  { id: "colisage",            label: "Liste de colisage",           obligatoire: true  },
  { id: "certif-origine",      label: "Certificat d'origine",        obligatoire: false },
  { id: "assurance",           label: "Attestation d'assurance",     obligatoire: false },
] as const;

export interface Ecriture {
  id: string;
  date: string;
  datePaiement?: string;
  clientId: string;
  clientNom: string;
  dossierId?: string;
  /** Nullable : une écriture peut rester au niveau transit global (non affectée à une société). */
  societeId?: string;
  societeNom?: string;
  montantInvesti: number;
  montantPaye: number;
  modePaiement: PaiementMode;
  note?: string;
}

export interface StockItem {
  id: string;
  clientId?: string;
  clientNom?: string;
  societeId: string;
  societeNom: string;
  marchandise: string;
  quantite: number;
  unite: string;
  seuil: number;
  depositaire: string;
  commercial: string;
  sommePayee: number;
  resteAPayer: number;
}

export interface Mouvement {
  id: string;
  stockId?: string;
  societeId: string;
  societeNom: string;
  date: string;
  type: "Entrée" | "Sortie";
  marchandise: string;
  quantite: number;
  unite: string;
  responsable: string;
  bonRef?: string;
  motif?: string;
}

export interface BonSortie {
  id: string;
  reference: string;
  date: string;
  clientId: string;
  clientNom: string;
  societeId: string;
  societeNom: string;
  /** Référence vers l'article de stock concerné, pour un décrément fiable (les bons plus anciens peuvent ne pas l'avoir). */
  stockId?: string;
  marchandise: string;
  quantite: number;
  unite: string;
  motif: BonMotif;
  montant: number;
  statut: "Validé" | "Brouillon";
}

/* ------------------------------------------------------------------ */
/* BONS DE SORTIE DE CAISSE (décaissement) — sans rapport avec le stock */
/* ------------------------------------------------------------------ */

export interface SortieCaisseLigne {
  id: string;
  date: string;
  /** "Prénom et Nom" du bénéficiaire du paiement. */
  beneficiaire: string;
  motif: string;
  montant: number;
}

export interface BonSortieCaisse {
  id: string;
  /** Format "N°{n}", séquence indépendante des bons de sortie stock. */
  reference: string;
  date: string;
  lignes: SortieCaisseLigne[];
  montantTotal: number;
  creePar?: string;
  creeLe: string;
}

export interface BonSortieCaisseInput {
  date: string;
  lignes: Array<{ date: string; beneficiaire: string; motif: string; montant: number }>;
}

/* ------------------------------------------------------------------ */
/* SOCIÉTÉS (F1)                                                       */
/* ------------------------------------------------------------------ */

export interface Societe {
  id: string;
  nom: string;
  actif: boolean;
}

/* ------------------------------------------------------------------ */
/* CONTRATS (F3) + DÉPENSES (F4) + PRESTATIONS OPTIONNELLES (F6)       */
/* ------------------------------------------------------------------ */

/**
 * Libellé UI unique pour F6 — le client a parlé d'« intentions facultatives »,
 * mais le terme retenu est "prestations optionnelles" (services facultatifs
 * prévus/réalisés dans le cadre d'un contrat). Renommer ici seulement si le
 * client demande un autre mot — ne pas dupliquer la chaîne ailleurs.
 */
export const PRESTATION_OPTIONNELLE_LABEL = "Prestations optionnelles";

export type ContratStatut = "Actif" | "Clôturé" | "Suspendu";

export interface Contrat {
  id: string;
  reference: string;
  societeId: string;
  societeNom: string;
  clientId: string;
  clientNom: string;
  objet: string;
  dateDebut: string;
  dateFin?: string;
  montant: number;
  statut: ContratStatut;
  notes?: string;
  creePar?: string;
  creeLe: string;
  /** Agrégats calculés côté store (syncContratStats) — pas persistés en DB. */
  nbPrestations: number;
  nbPrestationsRealisees: number;
  totalDepenses: number;
}

export interface ContratInput {
  societeId: string;
  clientId: string;
  clientNom: string;
  objet: string;
  dateDebut: string;
  dateFin?: string;
  montant: number;
  statut: ContratStatut;
  notes?: string;
}

/**
 * Métadonnées de scan — le bucket contrat-fichiers est privé : storagePath
 * seul est persisté, l'URL signée s'obtient à la demande (store.getSignedContratFichierUrl).
 */
export interface ContratFichier {
  id: string;
  contratId: string;
  nom: string;
  taille: number;
  type: string;
  dateUpload: string;
  storagePath: string;
}

export interface Depense {
  id: string;
  contratId: string;
  societeId: string;
  libelle: string;
  montant: number;
  dateDepense: string;
  modePaiement: PaiementMode;
  justificatifPath?: string;
  note?: string;
  creePar?: string;
}

export interface DepenseInput {
  contratId: string;
  libelle: string;
  montant: number;
  dateDepense: string;
  modePaiement: PaiementMode;
  note?: string;
}

export type ContratPrestationStatut = "Prévue" | "Réalisée" | "Annulée";

export interface ContratPrestation {
  id: string;
  contratId: string;
  libelle: string;
  description?: string;
  montant?: number;
  statut: ContratPrestationStatut;
  datePrevue?: string;
  dateRealisation?: string;
  creePar?: string;
}

export interface ContratPrestationInput {
  contratId: string;
  libelle: string;
  description?: string;
  montant?: number;
  statut: ContratPrestationStatut;
  datePrevue?: string;
  dateRealisation?: string;
}

export interface User {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
  permissions: string[];
  actif: boolean;
  derniereConnexion: string;
}

export interface SubDossier {
  id: string;
  dossierId: string;
  nom: string;
  description?: string;
  dateCreation: string;
}

export interface DossierFichier {
  id: string;
  dossierId: string;
  sousDossierId?: string;
  nom: string;
  taille: number;
  type: string;
  dateUpload: string;
  dataUrl: string;
}

export interface DossierComment {
  id: string;
  dossierId: string;
  userName: string;
  texte: string;
  date: string;
}

export type DevisStatut = "Brouillon" | "Envoyé" | "Accepté" | "Refusé" | "Expiré";

export interface Devis {
  id: string;
  reference: string;
  clientId: string;
  clientNom: string;
  nature: string;
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  total: number;
  statut: DevisStatut;
  dateCreation: string;
  dateValidite: string;
  notes?: string;
  /** Renseigné une fois converti — empêche une double conversion et permet de retrouver le dossier issu de ce devis. */
  dossierId?: string | null;
}

export interface DevisInput {
  clientId: string;
  clientNom: string;
  nature: string;
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  dateValidite: string;
  notes?: string;
}

export type TransporteurStatut = "Actif" | "Inactif";
export type TypeVehicule = "Camion" | "Remorque" | "Semi-remorque" | "Benne" | "Fourgon";

export interface Transporteur {
  id: string;
  nom: string;
  contact: string;
  telephone: string;
  email?: string;
  vehicule: TypeVehicule;
  immatriculation: string;
  trajet: string;
  capacite: number;
  statut: TransporteurStatut;
  nbDossiers: number;
  dateCreation: string;
  notes?: string;
}

export interface TransporteurInput {
  nom: string;
  contact: string;
  telephone: string;
  email?: string;
  vehicule: TypeVehicule;
  immatriculation: string;
  trajet: string;
  capacite: number;
  statut: TransporteurStatut;
  notes?: string;
}

/** Calcule l'écart = fraisPrestation - coûts engagés (positif = marge) */
export function calculerEcart(d: {
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  montantInvesti: number;
}): number {
  return d.fraisPrestation - (d.droitDouane + d.fraisCircuit);
}

export function resteAPayer(d: {
  montantInvesti: number;
  montantPaye: number;
}): number {
  return Math.max(0, d.montantInvesti - d.montantPaye);
}
