import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type {
  DocumentCategorie,
  DocumentEntityType,
  DocumentVersion,
  OcrField,
  OcrJob,
  OcrTargetForm,
  SlttDocument,
} from "@/lib/domain-types";
import type {
  DocumentRow,
  DocumentVersionRow,
  OcrFieldRow,
  OcrJobRow,
} from "@/lib/db-rows";
import type { SLTTState } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import {
  buildDocumentStoragePath,
  dataUrlToBlob,
  getSignedDocumentUrl,
  removeDocumentStoragePaths,
  sha256Hex,
  uploadDocumentBlob,
} from "@/lib/documents/storage";

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

function currentUserId(): string | null {
  return useNav.getState().currentUserId;
}

export function mapDocumentVersionFromDb(x: DocumentVersionRow): DocumentVersion {
  return {
    id: x.id,
    documentId: x.document_id,
    version: Number(x.version),
    storagePath: x.storage_path,
    taille: Number(x.taille),
    mimeType: x.mime_type,
    checksum: x.checksum || undefined,
    uploadedBy: x.uploaded_by || undefined,
    createdAt: x.created_at,
  };
}

export function mapDocumentFromDb(x: DocumentRow): SlttDocument {
  return {
    id: x.id,
    nom: x.nom,
    categorie: x.categorie,
    mimeType: x.mime_type,
    taille: Number(x.taille),
    dossierId: x.dossier_id || undefined,
    factureId: x.facture_id || undefined,
    clientId: x.client_id || undefined,
    societeId: x.societe_id || undefined,
    entityType: x.entity_type || undefined,
    entityId: x.entity_id || undefined,
    currentVersion: Number(x.current_version),
    creePar: x.cree_par || undefined,
    createdAt: x.created_at,
    updatedAt: x.updated_at,
  };
}

export function mapOcrFieldFromDb(x: OcrFieldRow): OcrField {
  return {
    id: x.id,
    ocrJobId: x.ocr_job_id,
    fieldKey: x.field_key,
    fieldValue: x.field_value ?? undefined,
    confidence: x.confidence != null ? Number(x.confidence) : undefined,
    bbox: x.bbox ?? undefined,
    validatedValue: x.validated_value ?? undefined,
  };
}

export function mapOcrJobFromDb(x: OcrJobRow, fields?: OcrField[]): OcrJob {
  return {
    id: x.id,
    documentId: x.document_id,
    documentVersionId: x.document_version_id,
    status: x.status,
    provider: x.provider,
    rawText: x.raw_text ?? undefined,
    errorMessage: x.error_message ?? undefined,
    targetForm: x.target_form,
    createdBy: x.created_by || undefined,
    createdAt: x.created_at,
    completedAt: x.completed_at ?? undefined,
    fields,
  };
}

export interface DocumentsSlice {
  documents: SlttDocument[];
  documentVersions: DocumentVersion[];
  ocrJobs: OcrJob[];
  addDocument: (input: AddDocumentInput) => Promise<SlttDocument>;
  replaceDocumentVersion: (documentId: string, file: { nom: string; taille: number; mimeType: string; dataUrl: string }) => Promise<DocumentVersion>;
  updateDocumentMeta: (id: string, input: UpdateDocumentMetaInput) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  getSignedDocumentUrl: (storagePath: string) => Promise<string>;
  getDocumentVersions: (documentId: string) => Promise<DocumentVersion[]>;
  createOcrJob: (documentId: string, targetForm?: OcrTargetForm) => Promise<OcrJob>;
  updateOcrJobResult: (
    jobId: string,
    result: {
      status: OcrJob["status"];
      rawText?: string;
      errorMessage?: string;
      fields?: Array<{ fieldKey: string; fieldValue?: string; confidence?: number }>;
    },
  ) => Promise<OcrJob>;
  validateOcrFields: (
    jobId: string,
    validated: Record<string, string>,
  ) => Promise<void>;
  linkDocumentToDossier: (documentId: string, dossierId: string) => Promise<void>;
}

export const createDocumentsSlice: StateCreator<SLTTState, [], [], DocumentsSlice> = (set, get) => ({
  documents: [],
  documentVersions: [],
  ocrJobs: [],

  addDocument: async (input) => {
    const userId = currentUserId();
    const blob = await dataUrlToBlob(input.dataUrl);
    const checksum = await sha256Hex(blob);

    const { data: docRow, error: docError } = await supabase
      .from("documents")
      .insert({
        nom: input.nom,
        categorie: input.categorie,
        mime_type: input.mimeType,
        taille: input.taille,
        dossier_id: input.dossierId || null,
        facture_id: input.factureId || null,
        client_id: input.clientId || null,
        societe_id: input.societeId || null,
        entity_type: input.entityType || null,
        entity_id: input.entityId || null,
        current_version: 1,
        cree_par: userId,
      })
      .select()
      .single();
    if (docError) throw docError;

    const doc = mapDocumentFromDb(docRow as DocumentRow);
    const path = buildDocumentStoragePath(doc.id, 1, input.nom);

    try {
      await uploadDocumentBlob(path, blob, input.mimeType);
    } catch (e) {
      await supabase.from("documents").delete().eq("id", doc.id);
      throw e;
    }

    const { data: verRow, error: verError } = await supabase
      .from("document_versions")
      .insert({
        document_id: doc.id,
        version: 1,
        storage_path: path,
        taille: input.taille,
        mime_type: input.mimeType,
        checksum: checksum ?? null,
        uploaded_by: userId,
      })
      .select()
      .single();
    if (verError) {
      await removeDocumentStoragePaths([path]);
      await supabase.from("documents").delete().eq("id", doc.id);
      throw verError;
    }

    const version = mapDocumentVersionFromDb(verRow as DocumentVersionRow);
    set((s) => ({
      documents: [doc, ...s.documents],
      documentVersions: [version, ...s.documentVersions],
    }));

    await get().addAuditLog(
      "Documents",
      "Création",
      `Document « ${input.nom} » uploadé (${input.categorie})`,
      input.clientId,
      { sourceType: "document", sourceId: doc.id },
    );

    return doc;
  },

  replaceDocumentVersion: async (documentId, file) => {
    const existing = get().documents.find((d) => d.id === documentId);
    if (!existing) throw new Error("Document introuvable");

    const nextVersion = existing.currentVersion + 1;
    const userId = currentUserId();
    const blob = await dataUrlToBlob(file.dataUrl);
    const checksum = await sha256Hex(blob);
    const path = buildDocumentStoragePath(documentId, nextVersion, file.nom);

    await uploadDocumentBlob(path, blob, file.mimeType);

    const { data: verRow, error: verError } = await supabase
      .from("document_versions")
      .insert({
        document_id: documentId,
        version: nextVersion,
        storage_path: path,
        taille: file.taille,
        mime_type: file.mimeType,
        checksum: checksum ?? null,
        uploaded_by: userId,
      })
      .select()
      .single();
    if (verError) {
      await removeDocumentStoragePaths([path]);
      throw verError;
    }

    const { error: updError } = await supabase
      .from("documents")
      .update({
        nom: file.nom,
        mime_type: file.mimeType,
        taille: file.taille,
        current_version: nextVersion,
      })
      .eq("id", documentId);
    if (updError) throw updError;

    const version = mapDocumentVersionFromDb(verRow as DocumentVersionRow);
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === documentId
          ? {
              ...d,
              nom: file.nom,
              mimeType: file.mimeType,
              taille: file.taille,
              currentVersion: nextVersion,
              updatedAt: new Date().toISOString(),
            }
          : d,
      ),
      documentVersions: [version, ...s.documentVersions],
    }));

    await get().addAuditLog(
      "Documents",
      "Modification",
      `Document « ${file.nom} » remplacé (v${nextVersion})`,
      existing.clientId,
      { sourceType: "document", sourceId: documentId },
    );

    return version;
  },

  updateDocumentMeta: async (id, input) => {
    const existing = get().documents.find((d) => d.id === id);
    const payload: Record<string, unknown> = {};
    if (input.nom !== undefined) payload.nom = input.nom;
    if (input.categorie !== undefined) payload.categorie = input.categorie;
    if (input.dossierId !== undefined) payload.dossier_id = input.dossierId;
    if (input.factureId !== undefined) payload.facture_id = input.factureId;
    if (input.clientId !== undefined) payload.client_id = input.clientId;
    if (input.societeId !== undefined) payload.societe_id = input.societeId;
    if (input.entityType !== undefined) payload.entity_type = input.entityType;
    if (input.entityId !== undefined) payload.entity_id = input.entityId;

    const { error } = await supabase.from("documents").update(payload).eq("id", id);
    if (error) throw error;

    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === id
          ? {
              ...d,
              nom: input.nom ?? d.nom,
              categorie: input.categorie ?? d.categorie,
              dossierId: input.dossierId === null ? undefined : (input.dossierId ?? d.dossierId),
              factureId: input.factureId === null ? undefined : (input.factureId ?? d.factureId),
              clientId: input.clientId === null ? undefined : (input.clientId ?? d.clientId),
              societeId: input.societeId === null ? undefined : (input.societeId ?? d.societeId),
              entityType:
                input.entityType === null ? undefined : (input.entityType ?? d.entityType),
              entityId: input.entityId === null ? undefined : (input.entityId ?? d.entityId),
              updatedAt: new Date().toISOString(),
            }
          : d,
      ),
    }));

    await get().addAuditLog(
      "Documents",
      "Modification",
      `Métadonnées du document « ${input.nom ?? existing?.nom ?? id} » mises à jour`,
      input.clientId === null ? undefined : (input.clientId ?? existing?.clientId),
      { sourceType: "document", sourceId: id },
    );
  },

  deleteDocument: async (id) => {
    const doc = get().documents.find((d) => d.id === id);
    const versions = get().documentVersions.filter((v) => v.documentId === id);
    const paths = versions.map((v) => v.storagePath);

    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) throw error;

    await removeDocumentStoragePaths(paths);

    set((s) => ({
      documents: s.documents.filter((d) => d.id !== id),
      documentVersions: s.documentVersions.filter((v) => v.documentId !== id),
      ocrJobs: s.ocrJobs.filter((j) => j.documentId !== id),
    }));

    if (doc) {
      await get().addAuditLog(
        "Documents",
        "Suppression",
        `Document « ${doc.nom} » supprimé`,
        doc.clientId,
        { sourceType: "document", sourceId: id },
      );
    }
  },

  getSignedDocumentUrl: async (storagePath) => getSignedDocumentUrl(storagePath),

  getDocumentVersions: async (documentId) => {
    const { data, error } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("version", { ascending: false });
    if (error) throw error;
    const versions = (data || []).map((r) => mapDocumentVersionFromDb(r as DocumentVersionRow));
    set((s) => ({
      documentVersions: [
        ...versions,
        ...s.documentVersions.filter((v) => v.documentId !== documentId),
      ],
    }));
    return versions;
  },

  createOcrJob: async (documentId, targetForm = "dossier") => {
    const doc = get().documents.find((d) => d.id === documentId);
    if (!doc) throw new Error("Document introuvable");

    let version = get().documentVersions.find(
      (v) => v.documentId === documentId && v.version === doc.currentVersion,
    );
    if (!version) {
      const versions = await get().getDocumentVersions(documentId);
      version = versions.find((v) => v.version === doc.currentVersion);
    }
    if (!version) throw new Error("Version courante introuvable");

    const { data, error } = await supabase
      .from("ocr_jobs")
      .insert({
        document_id: documentId,
        document_version_id: version.id,
        status: "pending",
        provider: "tesseract",
        target_form: targetForm,
        created_by: currentUserId(),
      })
      .select()
      .single();
    if (error) throw error;

    const job = mapOcrJobFromDb(data as OcrJobRow, []);
    set((s) => ({ ocrJobs: [job, ...s.ocrJobs] }));
    return job;
  },

  updateOcrJobResult: async (jobId, result) => {
    const payload: Record<string, unknown> = {
      status: result.status,
      raw_text: result.rawText ?? null,
      error_message: result.errorMessage ?? null,
    };
    if (result.status === "done" || result.status === "failed" || result.status === "validated") {
      payload.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("ocr_jobs")
      .update(payload)
      .eq("id", jobId)
      .select()
      .single();
    if (error) throw error;

    let fields: OcrField[] | undefined;
    if (result.fields) {
      await supabase.from("ocr_fields").delete().eq("ocr_job_id", jobId);
      if (result.fields.length > 0) {
        const { data: fieldRows, error: fieldError } = await supabase
          .from("ocr_fields")
          .insert(
            result.fields.map((f) => ({
              ocr_job_id: jobId,
              field_key: f.fieldKey,
              field_value: f.fieldValue ?? null,
              confidence: f.confidence ?? null,
            })),
          )
          .select();
        if (fieldError) throw fieldError;
        fields = (fieldRows || []).map((r) => mapOcrFieldFromDb(r as OcrFieldRow));
      } else {
        fields = [];
      }
    }

    const job = mapOcrJobFromDb(data as OcrJobRow, fields);
    set((s) => ({
      ocrJobs: s.ocrJobs.map((j) => (j.id === jobId ? { ...job, fields: fields ?? j.fields } : j)),
    }));
    return job;
  },

  validateOcrFields: async (jobId, validated) => {
    const entries = Object.entries(validated);
    for (const [fieldKey, value] of entries) {
      const { error } = await supabase
        .from("ocr_fields")
        .update({ validated_value: value })
        .eq("ocr_job_id", jobId)
        .eq("field_key", fieldKey);
      if (error) throw error;
    }

    const { error } = await supabase
      .from("ocr_jobs")
      .update({ status: "validated", completed_at: new Date().toISOString() })
      .eq("id", jobId);
    if (error) throw error;

    set((s) => ({
      ocrJobs: s.ocrJobs.map((j) => {
        if (j.id !== jobId) return j;
        return {
          ...j,
          status: "validated",
          completedAt: new Date().toISOString(),
          fields: (j.fields || []).map((f) => ({
            ...f,
            validatedValue: validated[f.fieldKey] ?? f.validatedValue,
          })),
        };
      }),
    }));
  },

  linkDocumentToDossier: async (documentId, dossierId) => {
    await get().updateDocumentMeta(documentId, {
      dossierId,
      entityType: "dossier",
      entityId: dossierId,
    });
  },
});
