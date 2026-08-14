import type {
  DocumentVersion,
  OcrField,
  OcrJob,
  SlttDocument,
} from "@/lib/domain-types";
import type {
  DocumentRow,
  DocumentVersionRow,
  OcrFieldRow,
  OcrJobRow,
} from "@/lib/db-rows";

export function mapDocumentVersionFromDb(row: DocumentVersionRow): DocumentVersion {
  return {
    id: row.id,
    documentId: row.document_id,
    version: Number(row.version),
    storagePath: row.storage_path,
    taille: Number(row.taille),
    mimeType: row.mime_type,
    checksum: row.checksum || undefined,
    uploadedBy: row.uploaded_by || undefined,
    createdAt: row.created_at,
  };
}

export function mapDocumentFromDb(row: DocumentRow): SlttDocument {
  return {
    id: row.id,
    nom: row.nom,
    categorie: row.categorie,
    mimeType: row.mime_type,
    taille: Number(row.taille),
    dossierId: row.dossier_id || undefined,
    factureId: row.facture_id || undefined,
    clientId: row.client_id || undefined,
    societeId: row.societe_id || undefined,
    entityType: row.entity_type || undefined,
    entityId: row.entity_id || undefined,
    annexeId: row.annexe_id,
    currentVersion: Number(row.current_version),
    creePar: row.cree_par || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapOcrFieldFromDb(row: OcrFieldRow): OcrField {
  return {
    id: row.id,
    ocrJobId: row.ocr_job_id,
    fieldKey: row.field_key,
    fieldValue: row.field_value ?? undefined,
    confidence: row.confidence != null ? Number(row.confidence) : undefined,
    bbox: row.bbox ?? undefined,
    validatedValue: row.validated_value ?? undefined,
  };
}

export function mapOcrJobFromDb(row: OcrJobRow, fields?: OcrField[]): OcrJob {
  return {
    id: row.id,
    documentId: row.document_id,
    documentVersionId: row.document_version_id,
    status: row.status,
    provider: row.provider,
    rawText: row.raw_text ?? undefined,
    errorMessage: row.error_message ?? undefined,
    targetForm: row.target_form,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    fields,
  };
}
