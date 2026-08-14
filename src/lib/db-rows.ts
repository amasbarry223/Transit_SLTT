/**
 * Types minimalistes des lignes brutes renvoyées par Supabase (snake_case),
 * tels que consommés par les mapXFromDb() de store.ts et des slices.
 * Écrits à la main d'après l'usage réel de chaque mapper (pas de génération
 * automatique `supabase gen types`) — ne couvrent que les champs
 * effectivement lus, y compris les relations embarquées (jointures `select`).
 * Les colonnes numériques Postgres peuvent revenir en `string` selon le
 * driver — d'où `number | string` partout où le mapper applique `Number(...)`.
 */

import type {
  ClientType,
  FournisseurType,
  FournisseurStatut,
  PaiementMode,
  BonMotif,
  ContratStatut,
  ContratPrestationStatut,
  DevisStatut,
  TypeVehicule,
  TransporteurStatut,
  FactureStatut,
  TypeDocument,
  DossierStatut,
  DocumentCategorie,
  DocumentEntityType,
  OcrJobStatus,
  OcrTargetForm,
} from "@/lib/domain-types";

type NamedRelation = { nom: string } | null;
/** Statut d'un rattachement dossier↔fournisseur (littéral, non exporté par domain-types). */
type DossierFournisseurStatut = "En attente" | "Payé" | "Litige";
/** Sens d'un mouvement de stock (littéral, non exporté par domain-types). */
type MouvementType = "Entrée" | "Sortie";
/** Statut d'un bon de sortie stock (littéral, non exporté par domain-types). */
type BonSortieStatut = "Validé" | "Brouillon";
/** Mode de transport d'un dossier (littéral, non exporté par domain-types). */
type ModeTransport = "Maritime" | "Aérien" | "Routier" | "Ferroviaire";

export interface ClientRow {
  id: string;
  nom: string;
  type: ClientType;
  telephone: string;
  email: string;
  adresse: string;
  annexe_id: string;
  annexes?: NamedRelation;
  societe_id: string;
  societes?: NamedRelation;
}

export interface FournisseurRow {
  id: string;
  nom: string;
  type: FournisseurType;
  contact: string;
  telephone: string;
  email: string | null;
  adresse: string | null;
  tarif_contractuel: number | string | null;
  statut: FournisseurStatut;
  annexe_id: string;
}

export interface DossierFournisseurRow {
  id: string;
  dossier_id: string;
  dossiers?: { reference: string } | null;
  fournisseur_id: string;
  fournisseurs?: { nom: string; type: FournisseurType } | null;
  description: string;
  montant_budgete: number | string;
  montant_reel: number | string;
  statut: DossierFournisseurStatut;
  date: string | null;
}

export interface OperationComptableRow {
  id: string;
  reference: string;
  entite_type: "annexe" | "societe";
  annexe_id: string | null;
  annexes?: NamedRelation;
  societe_id: string | null;
  societes?: NamedRelation;
  date: string;
  client_id: string | null;
  clients?: NamedRelation;
  dossier_id?: string | null;
  dossiers?: { id: string; reference: string };
  client_nom: string;
  nature: string;
  type: "Entrée" | "Sortie";
  montant: number | string;
  mode_paiement?: "Espèces" | "Virement" | "Mobile Money" | "Chèque" | null;
  quantite: number | string | null;
  prix_unitaire: number | string | null;
  source: "saisie" | "import_excel" | "import_ocr";
  import_ref: string | null;
  cree_par: string | null;
}

export interface RecuPaiementRow {
  id: string;
  reference: string;
  annexe_id: string;
  annexes?: NamedRelation;
  nom: string;
  prenom: string;
  somme: number | string;
  motif: string;
  montant_paye: number | string;
  reste: number | string;
  statut: "EN_ATTENTE" | "PARTIEL" | "SOLDE";
  cree_par: string | null;
  created_at: string;
}

export interface ClotureCaisseRow {
  id: string;
  entite_type: "annexe" | "societe";
  annexe_id: string | null;
  societe_id: string | null;
  periode_debut: string;
  periode_fin: string;
  solde_theorique: number | string;
  solde_constate: number | string;
  ecart: number | string;
  note: string | null;
  cloture_par: string | null;
  cloture_le: string;
}

export interface EcritureRow {
  id: string;
  date: string;
  date_paiement: string | null;
  client_id: string;
  clients?: NamedRelation;
  dossier_id: string | null;
  societe_id: string | null;
  societes?: NamedRelation;
  annexe_id: string;
  annexes?: NamedRelation;
  montant_investi: number | string | null;
  montant_paye: number | string | null;
  mode_paiement: PaiementMode | null;
  note: string | null;
}

export interface StockItemRow {
  id: string;
  client_id: string | null;
  clients?: NamedRelation;
  societe_id: string;
  societes?: NamedRelation;
  annexe_id: string;
  annexes?: NamedRelation;
  marchandise: string;
  quantite: number | string;
  unite: string;
  seuil: number | string;
  depositaire: string;
  commercial: string;
  somme_payee: number | string;
  reste_a_payer: number | string;
}

export interface MouvementRow {
  id: string;
  stock_id: string | null;
  societe_id: string;
  societes?: NamedRelation;
  annexe_id: string;
  annexes?: NamedRelation;
  date: string;
  type: MouvementType;
  marchandise: string | null;
  quantite: number | string;
  unite: string | null;
  responsable: string | null;
  bon_ref: string | null;
  motif: string | null;
}

export interface BonSortieRow {
  id: string;
  reference: string;
  date: string;
  client_id: string;
  clients?: NamedRelation;
  client_nom?: string | null;
  societe_id: string;
  societes?: NamedRelation;
  annexe_id: string;
  annexes?: NamedRelation;
  stock_id: string | null;
  marchandise: string;
  quantite: number | string;
  unite: string;
  motif: BonMotif;
  montant: number | string;
  statut: BonSortieStatut;
}

export interface BonSortieCaisseLigneRow {
  id: string;
  date: string;
  beneficiaire: string;
  motif: string;
  montant: number | string;
}

export interface BonSortieCaisseRow {
  id: string;
  reference: string;
  date: string;
  societe_id: string;
  societes?: NamedRelation;
  annexe_id: string;
  annexes?: NamedRelation;
  montant_total: number | string;
  cree_par: string | null;
  created_at: string;
  bons_sortie_caisse_lignes?: BonSortieCaisseLigneRow[] | null;
}

export interface SocieteRow {
  id: string;
  nom: string;
  actif: boolean;
  logo_url: string | null;
  adresse: string | null;
  telephone: string | null;
  rccm: string | null;
  nif: string | null;
  afficher_nom_avec_logo: boolean | null;
  signataire_dg: string | null;
  signataire_pdg: string | null;
  is_transit: boolean | null;
}

export interface AnnexeRow {
  id: string;
  nom: string;
  code: string;
  ville_siege: string;
  adresse: string | null;
  telephone: string | null;
  rccm: string | null;
  nif: string | null;
  devise: string;
  actif: boolean;
}

export interface ContratRow {
  id: string;
  reference: string;
  societe_id: string;
  societes?: NamedRelation;
  annexe_id: string;
  annexes?: NamedRelation;
  client_id: string;
  clients?: NamedRelation;
  objet: string;
  date_debut: string;
  date_fin: string | null;
  montant: number | string;
  statut: ContratStatut;
  notes: string | null;
  cree_par: string | null;
  created_at: string;
}

export interface DepenseRow {
  id: string;
  contrat_id: string;
  societe_id: string;
  libelle: string;
  montant: number | string;
  date_depense: string;
  mode_paiement: PaiementMode;
  justificatif_path: string | null;
  note: string | null;
  cree_par: string | null;
}

export interface ContratPrestationRow {
  id: string;
  contrat_id: string;
  libelle: string;
  description: string | null;
  montant: number | string | null;
  statut: ContratPrestationStatut;
  date_prevue: string | null;
  date_realisation: string | null;
  cree_par: string | null;
}

export interface SubDossierRow {
  id: string;
  dossier_id: string;
  nom: string;
  description: string;
  date_creation: string;
}

export interface DossierFichierRow {
  id: string;
  dossier_id: string;
  sous_dossier_id: string;
  nom: string;
  taille: number | string;
  type: string;
  date_upload: string;
  data_url: string;
}

export interface DevisRow {
  id: string;
  reference: string;
  client_id: string;
  clients?: NamedRelation;
  societe_id: string;
  societes?: NamedRelation;
  annexe_id: string;
  annexes?: NamedRelation;
  nature: string;
  droit_douane: number | string;
  frais_circuit: number | string;
  frais_prestation: number | string;
  total: number | string;
  statut: DevisStatut;
  date_creation: string;
  date_validite: string;
  notes: string | null;
  dossier_id?: string | null;
}

export interface TransporteurRow {
  id: string;
  nom: string;
  contact: string | null;
  telephone: string;
  email: string | null;
  vehicule: TypeVehicule;
  immatriculation: string;
  trajet: string | null;
  capacite: number | string | null;
  statut: TransporteurStatut;
  date_creation: string | null;
  notes: string | null;
  annexe_id: string;
}

export interface FactureLigneRow {
  id: string;
  description: string;
  quantite: number | string;
  prix_unitaire: number | string;
  montant_ht: number | string;
  compagnie: string | null;
  bordereau_livraison: string | null;
}

export interface FactureRow {
  id: string;
  numero: string;
  dossier_id: string;
  client_id: string;
  clients?: NamedRelation;
  societe_id: string | null;
  societes?: NamedRelation;
  annexe_id: string;
  annexes?: NamedRelation;
  date: string;
  date_echeance: string;
  statut: FactureStatut;
  taux_tva: number | string;
  montant_ht: number | string;
  montant_tva: number | string;
  montant_ttc: number | string;
  montant_paye: number | string;
  notes: string;
  cree_par: string;
  cree_le?: string | null;
  created_at: string;
  facture_lignes?: FactureLigneRow[] | null;
}

export interface ProfileRow {
  id: string;
  nom: string;
  email: string;
  role: string;
  permissions: string[] | null;
  actif: boolean;
  derniere_connexion: string | null;
}

export interface ProfilePublicRow {
  id: string;
  nom: string;
  role: string;
  actif: boolean;
  derniere_connexion: string | null;
}

export interface DossierRow {
  id: string;
  reference: string;
  societe_id: string;
  societes?: NamedRelation;
  annexe_id: string;
  annexes?: NamedRelation;
  client_id: string;
  clients?: NamedRelation;
  bl: string;
  camion: string;
  nature: string;
  droit_douane: number | string;
  frais_circuit: number | string;
  frais_prestation: number | string;
  montant_investi: number | string;
  montant_paye: number | string;
  statut: DossierStatut;
  date: string;
  date_echeance: string | null;
  date_dedouanement: string | null;
  mode_transport: ModeTransport | null;
  no_conteneur: string | null;
  port_entree: string | null;
  poids_total: number | string | null;
  notes: string | null;
}

export interface ArchiveRow {
  id: string;
  nom: string;
  type_document: TypeDocument;
  taille: number | string;
  mime_type: string;
  storage_path: string;
  dossier_id: string | null;
  facture_id: string | null;
  depense_id: string | null;
  client_id: string | null;
  societe_id: string | null;
  annexe_id: string;
  cree_par: string | null;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  nom: string;
  categorie: DocumentCategorie;
  mime_type: string;
  taille: number | string;
  dossier_id: string | null;
  facture_id: string | null;
  client_id: string | null;
  societe_id: string | null;
  entity_type: DocumentEntityType | null;
  entity_id: string | null;
  current_version: number | string;
  cree_par: string | null;
  created_at: string;
  updated_at: string;
  annexe_id: string;
}

export interface DocumentVersionRow {
  id: string;
  document_id: string;
  version: number | string;
  storage_path: string;
  taille: number | string;
  mime_type: string;
  checksum: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface OcrJobRow {
  id: string;
  document_id: string;
  document_version_id: string;
  status: OcrJobStatus;
  provider: string;
  raw_text: string | null;
  error_message: string | null;
  target_form: OcrTargetForm;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface OcrFieldRow {
  id: string;
  ocr_job_id: string;
  field_key: string;
  field_value: string | null;
  confidence: number | string | null;
  bbox: unknown;
  validated_value: string | null;
}

export interface ContratFichierRow {
  id: string;
  contrat_id: string;
  nom: string;
  taille: number | string;
  type: string;
  date_upload: string;
  created_at: string;
  storage_path: string;
}
