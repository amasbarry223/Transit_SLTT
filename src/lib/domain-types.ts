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
export type { ClientType, Client } from "@/features/clients/types";
export type UserRole =
  | "Administrateur"
  | "Agent de transit"
  | "Comptable"
  | "Magasinier";

export interface Dossier {
  id: string;
  reference: string;
  societeId: string;
  societeNom: string;
  annexeId: string;
  annexeNom?: string;
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

export type FactureStatut = "Brouillon" | "Envoyée" | "Partielle" | "Soldée" | "Annulée";

/** Taux de TVA standard au Mali — un seul endroit à changer si le taux légal évolue. */
export const DEFAULT_TVA_RATE = 18;

export interface FactureLigne {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
  /** Compagnie maritime/aérienne — modèle facture annexe CI (conteneurs). */
  compagnie?: string;
  bordereauLivraison?: string;
}

export interface Facture {
  id: string;
  numero: string;
  dossierId: string | null;
  clientId: string;
  clientNom: string;
  societeId?: string;
  societeNom?: string;
  annexeId: string;
  annexeNom?: string;
  date: string;
  dateEcheance: string;
  statut: FactureStatut;
  lignes: FactureLigne[];
  tauxTVA: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  montantPaye: number;
  notes: string;
  creePar: string;
  creeLe: string;
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
  annexeId: string;
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
  annexeId: string;
  annexeNom?: string;
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
  annexeId: string;
  annexeNom?: string;
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
  annexeId: string;
  annexeNom?: string;
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
  annexeId: string;
  annexeNom?: string;
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
  societeId: string;
  societeNom: string;
  annexeId: string;
  annexeNom?: string;
  lignes: SortieCaisseLigne[];
  montantTotal: number;
  creePar?: string;
  creeLe: string;
}

export interface BonSortieCaisseInput {
  date: string;
  societeId: string;
  annexeId: string;
  lignes: Array<{ date: string; beneficiaire: string; motif: string; montant: number }>;
}

/* ------------------------------------------------------------------ */
/* ANNEXES — implantations physiques (Mali / Côte d'Ivoire).           */
/* Axe orthogonal à Societe (entité légale/comptable) : cloisonnement  */
/* de sécurité (RLS) par utilisateur assigné, alors que societeId n'a  */
/* jamais été qu'un filtre UI.                                        */
/* ------------------------------------------------------------------ */

export interface Annexe {
  id: string;
  nom: string;
  /** Code court (ML/CI…), utilisé comme préfixe de numérotation des documents SLTT. */
  code: string;
  villeSiege: string;
  adresse?: string;
  telephone?: string;
  rccm?: string;
  nif?: string;
  devise: string;
  actif: boolean;
}

/** Champs éditables d'une annexe depuis Paramètres — id/actif exclus. */
export interface AnnexeInput {
  villeSiege?: string;
  adresse?: string;
  telephone?: string;
  rccm?: string;
  nif?: string;
}

/* ------------------------------------------------------------------ */
/* SOCIÉTÉS (F1)                                                       */
/* ------------------------------------------------------------------ */

export interface Societe {
  id: string;
  nom: string;
  /** Nom légal complet pour les documents qui reproduisent le papier à en-tête officiel (ex. annuaire clients) — repli sur `nom` si absent. */
  raisonSociale?: string;
  actif: boolean;
  /** true = société porteuse du transit. */
  isTransit?: boolean;
  /** Chemin public du logo affiché sur les documents imprimés de la société (ex. bons de sortie). */
  logoUrl?: string;
  /** Coordonnées légales affichées sur l'en-tête des documents imprimés (bons de sortie). */
  adresse?: string;
  telephone?: string;
  rccm?: string;
  nif?: string;
  /** false si le logo contient déjà le nom en toutes lettres (répéter le nom en texte serait redondant). */
  afficherNomAvecLogo: boolean;
  /** Noms des signataires affichés sur le bon de sortie de caisse (Directeur Général / PDG). */
  signataireDg?: string;
  signatairePdg?: string;
}

/** Champs éditables d'une société depuis Paramètres — id/actif exclus (pas encore gérés côté UI). */
export interface SocieteInput {
  nom: string;
  logoUrl?: string;
  adresse?: string;
  telephone?: string;
  rccm?: string;
  nif?: string;
  signataireDg?: string;
  signatairePdg?: string;
  /** false si le logo contient déjà le nom en toutes lettres (répéter le nom en texte serait redondant). */
  afficherNomAvecLogo?: boolean;
}

/* ------------------------------------------------------------------ */
/* COMPTABILITÉ GÉNÉRALE — 3 entités (Annexe Mali / Annexe CI /        */
/* Société Top Doumani, cf. session F-ANNEXE vs F1 société)            */
/* ------------------------------------------------------------------ */

/** Discrimine sur quel axe existant (annexe ou société) porte une opération/clôture. */
export type EntiteComptableType = "annexe" | "societe";

/** Référence d'affichage unifiée pour les 3 entités comptables — dérivée d'une Annexe ou d'une Societe, jamais persistée telle quelle. */
export interface EntiteComptable {
  type: EntiteComptableType;
  id: string;
  label: string;
}

export type ModePaiement = "Espèces" | "Virement" | "Mobile Money" | "Chèque";
export type OperationComptableType = "Entrée" | "Sortie";
export type OperationComptableSource = "saisie" | "import_excel" | "import_ocr";

export interface OperationComptable {
  id: string;
  reference: string;
  entiteType: EntiteComptableType;
  annexeId?: string;
  societeId?: string;
  date: string;
  clientId?: string;
  dossierId?: string;
  dossierRef?: string;
  /** Tiers en clair (BINA DEMBELE, EDY, Zhu hai…) — pas toujours un Client existant en base. */
  clientNom: string;
  nature: string;
  type: OperationComptableType;
  montant: number;
  modePaiement?: ModePaiement;
  /** Top Doumani uniquement : montant (Sortie) = quantite * prixUnitaire. */
  quantite?: number;
  prixUnitaire?: number;
  source: OperationComptableSource;
  importRef?: string;
  creePar?: string;
}

export interface OperationComptableInput {
  entiteType: EntiteComptableType;
  annexeId?: string;
  societeId?: string;
  date: string;
  clientId?: string;
  dossierId?: string;
  clientNom: string;
  nature: string;
  type: OperationComptableType;
  montant: number;
  modePaiement?: ModePaiement;
  quantite?: number;
  prixUnitaire?: number;
  source?: OperationComptableSource;
  importRef?: string;
}

/** Rapprochement de caisse périodique par entité — remplace les lignes manuscrites "ECART DE : ..." du classeur Excel. */
export interface ClotureCaisse {
  id: string;
  entiteType: EntiteComptableType;
  annexeId?: string;
  societeId?: string;
  periodeDebut: string;
  periodeFin: string;
  soldeTheorique: number;
  soldeConstate: number;
  ecart: number;
  note?: string;
  cloturePar?: string;
  clotureLe: string;
}

/** EN_ATTENTE = rien payé, PARTIEL = paiement partiel, SOLDE = reste à 0. */
export type RecuPaiementStatut = "EN_ATTENTE" | "PARTIEL" | "SOLDE";

/** Reçu de paiement individuel (Nom/Prénom/Somme/Motif/Montant payé) — document autonome imprimable, sans lien avec le journal de caisse ni les Écritures. */
export interface RecuPaiement {
  id: string;
  reference: string;
  annexeId: string;
  annexeNom?: string;
  nom: string;
  prenom: string;
  somme: number;
  motif: string;
  montantPaye: number;
  reste: number;
  statut: RecuPaiementStatut;
  creePar?: string;
  createdAt: string;
}

export interface RecuPaiementInput {
  annexeId: string;
  nom: string;
  prenom: string;
  somme: number;
  motif: string;
  montantPaye: number;
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
  annexeId: string;
  annexeNom?: string;
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
  /** Implantation Mali/CI — requis pour les contrats SLTT (transit). */
  annexeId?: string;
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

export type TypeDocument = "BL" | "DAU" | "Facture" | "Reçu" | "Contrat" | "Autre";

/** Catégories du module Documents (étend TypeDocument + SYDONIA). */
export type DocumentCategorie =
  | "BL"
  | "DAU"
  | "Facture"
  | "Reçu"
  | "SYDONIA"
  | "Contrat"
  | "Autre";

export type DocumentEntityType = "dossier" | "facture" | "ecriture";

export type OcrJobStatus = "pending" | "processing" | "done" | "failed" | "validated";

/** Formulaire cible OCR. Seul « dossier » est branché côté UI/mapper pour l’instant. */
export type OcrTargetForm = "dossier" | "facture" | "paiement" | "operation_comptable";

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  storagePath: string;
  taille: number;
  mimeType: string;
  checksum?: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface SlttDocument {
  id: string;
  nom: string;
  categorie: DocumentCategorie;
  mimeType: string;
  taille: number;
  dossierId?: string;
  factureId?: string;
  clientId?: string;
  societeId?: string;
  entityType?: DocumentEntityType;
  entityId?: string;
  annexeId: string;
  currentVersion: number;
  creePar?: string;
  createdAt: string;
  updatedAt: string;
  /** Versions chargées à la demande (liste légère = vide). */
  versions?: DocumentVersion[];
}

export interface OcrField {
  id: string;
  ocrJobId: string;
  fieldKey: string;
  fieldValue?: string;
  confidence?: number;
  bbox?: unknown;
  validatedValue?: string;
}

export interface OcrJob {
  id: string;
  documentId: string;
  documentVersionId: string;
  status: OcrJobStatus;
  provider: string;
  rawText?: string;
  errorMessage?: string;
  targetForm: OcrTargetForm;
  createdBy?: string;
  createdAt: string;
  completedAt?: string;
  fields?: OcrField[];
}

/**
 * Document archivé (module Archives) — bucket `archives` privé, storagePath
 * seul est persisté, l'URL signée s'obtient à la demande (store.getSignedArchiveUrl).
 * Rattachement optionnel à un dossier, une facture ou une dépense ; sinon "libre"
 * avec client/société directs.
 */
export interface Archive {
  id: string;
  nom: string;
  typeDocument: TypeDocument;
  taille: number;
  type: string;
  storagePath: string;
  dossierId?: string;
  factureId?: string;
  depenseId?: string;
  clientId?: string;
  societeId?: string;
  annexeId: string;
  creePar: string;
  createdAt: string;
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
  /** Annexes assignées à l'utilisateur — détermine son périmètre RLS. Plus d'une = accès au reporting consolidé. */
  annexeIds: string[];
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

export type { DevisStatut, Devis, DevisInput } from "@/features/devis/types";

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
  annexeId: string;
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

/**
 * Marge métier dossier = prestation − (droit de douane + frais de circuit).
 *
 * `montantInvesti` est accepté pour permettre de passer un `Dossier` entier,
 * mais n'entre pas dans la formule : côté formulaire, `montantInvesti` vaut
 * droit+circuit+prestation (assiette à payer), pas le coût engagé.
 */
export { calculerEcart, resteAPayer } from "@/lib/domain/calculations";
