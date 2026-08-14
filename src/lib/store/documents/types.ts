import type { DocumentCategorie, DocumentEntityType } from "@/lib/domain-types";

export interface AddDocumentInput {
  nom: string;
  categorie: DocumentCategorie;
  taille: number;
  mimeType: string;
  /** data: URL ou blob déjà résolu. */
  dataUrl: string;
  dossierId?: string;
  factureId?: string;
  clientId?: string;
  societeId?: string;
  entityType?: DocumentEntityType;
  entityId?: string;
}

export interface UpdateDocumentMetaInput {
  nom?: string;
  categorie?: DocumentCategorie;
  dossierId?: string | null;
  factureId?: string | null;
  clientId?: string | null;
  societeId?: string | null;
  entityType?: DocumentEntityType | null;
  entityId?: string | null;
}
