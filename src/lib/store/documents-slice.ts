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
import { useSession } from "@/lib/session/session-store";
import { requireActiveAnnexeId } from "@/lib/store/connected-user";
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
  return useSession.getState().currentUserId;
}

/**
 * Annexe d'un document : héritée du dossier/facture lié pour rester cohérente
 * avec la donnée qu'il documente (cas dossier-documents-panel, lien connu dès
 * l'upload), sinon repli sur l'annexe active de l'utilisateur (cas OCR
 * "Nouveau dossier via OCR" : le document précède la création du dossier).
 */
function resolveDocumentAnnexeId(get: () => SLTTState, input: AddDocumentInput): string {
  if (input.dossierId) {
    const fromDossier = get().dossiers.find((d) => d.id === input.dossierId)?.annexeId;
    if (fromDossier) return fromDossier;
  }
  if (input.factureId) {
    const fromFacture = get().factures.find((f) => f.id === input.factureId)?.annexeId;
    if (fromFacture) return fromFacture;
  }
  const userId = currentUserId();
  const userAnnexeIds = get().users.find((u) => u.id === userId)?.annexeIds ?? [];
  return requireActiveAnnexeId(userAnnexeIds);
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
    annexeId: x.annexe_id,
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
  /** Marque un job en échec de façon fiable (update directe, sans RPC). */
  failOcrJob: (jobId: string, errorMessage: string) => Promise<void>;
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
    const annexeId = resolveDocumentAnnexeId(get, input);
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
        annexe_id: annexeId,
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

    const userId = currentUserId();
    const { data: nextVersionRaw, error: verErr } = await supabase.rpc(
      "next_document_version",
      { p_document_id: documentId },
    );
    if (verErr) throw verErr;
    const nextVersion = Number(nextVersionRaw) || existing.currentVersion + 1;

    const blob = await dataUrlToBlob(file.dataUrl);
    const checksum = await sha256Hex(blob);
    const path = buildDocumentStoragePath(documentId, nextVersion, file.nom);

    await uploadDocumentBlob(path, blob, file.mimeType);

    const { data: verRow, error: insertVerError } = await supabase
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
    if (insertVerError) {
      await removeDocumentStoragePaths([path]);
      throw insertVerError;
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
    // Toujours recharger les versions depuis la DB pour éviter les orphelins storage.
    const versions = await get().getDocumentVersions(id);
    const paths = versions.map((v) => v.storagePath).filter(Boolean);

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
    // Statut simple (processing / failed) : update directe — plus fiable que la RPC.
    if (
      (result.status === "processing" || result.status === "failed") &&
      !result.fields
    ) {
      const payload: Record<string, unknown> = {
        status: result.status,
        error_message: result.errorMessage ?? null,
      };
      if (result.rawText !== undefined) payload.raw_text = result.rawText;
      if (result.status === "failed") {
        payload.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("ocr_jobs")
        .update(payload)
        .eq("id", jobId)
        .select()
        .single();
      if (error) throw error;

      const job = mapOcrJobFromDb(data as OcrJobRow);
      set((s) => ({
        ocrJobs: s.ocrJobs.map((j) =>
          j.id === jobId ? { ...job, fields: j.fields } : j,
        ),
      }));
      return job;
    }

    const fieldsPayload =
      result.fields?.map((f) => ({
        field_key: f.fieldKey,
        field_value: f.fieldValue ?? null,
        confidence: f.confidence ?? null,
      })) ?? null;

    const { data, error } = await supabase.rpc("replace_ocr_job_fields", {
      p_job_id: jobId,
      p_status: result.status,
      p_raw_text: result.rawText ?? null,
      p_error_message: result.errorMessage ?? null,
      p_fields: fieldsPayload,
    });

    // Fallback non-atomique si la RPC n'est pas encore déployée.
    if (error) {
      const payload: Record<string, unknown> = {
        status: result.status,
        raw_text: result.rawText ?? null,
        error_message: result.errorMessage ?? null,
      };
      if (
        result.status === "done" ||
        result.status === "failed" ||
        result.status === "validated"
      ) {
        payload.completed_at = new Date().toISOString();
      }

      const { data: jobData, error: updErr } = await supabase
        .from("ocr_jobs")
        .update(payload)
        .eq("id", jobId)
        .select()
        .single();
      if (updErr) throw updErr;

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

      const job = mapOcrJobFromDb(jobData as OcrJobRow, fields);
      set((s) => ({
        ocrJobs: s.ocrJobs.map((j) =>
          j.id === jobId ? { ...job, fields: fields ?? j.fields } : j,
        ),
      }));
      return job;
    }

    let fields: OcrField[] | undefined;
    if (result.fields) {
      const { data: fieldRows } = await supabase
        .from("ocr_fields")
        .select("*")
        .eq("ocr_job_id", jobId);
      fields = (fieldRows || []).map((r) => mapOcrFieldFromDb(r as OcrFieldRow));
    }

    const job = mapOcrJobFromDb(data as OcrJobRow, fields);
    set((s) => ({
      ocrJobs: s.ocrJobs.map((j) =>
        j.id === jobId ? { ...job, fields: fields ?? j.fields } : j,
      ),
    }));
    return job;
  },

  failOcrJob: async (jobId, errorMessage) => {
    const completedAt = new Date().toISOString();
    const { error } = await supabase
      .from("ocr_jobs")
      .update({
        status: "failed",
        error_message: errorMessage.slice(0, 2000),
        completed_at: completedAt,
      })
      .eq("id", jobId);
    if (error) throw error;

    set((s) => ({
      ocrJobs: s.ocrJobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: "failed",
              errorMessage: errorMessage.slice(0, 2000),
              completedAt,
            }
          : j,
      ),
    }));
  },

  validateOcrFields: async (jobId, validated) => {
    const entries = Object.entries(validated);
    for (const [fieldKey, value] of entries) {
      const { data: updated, error } = await supabase
        .from("ocr_fields")
        .update({ validated_value: value })
        .eq("ocr_job_id", jobId)
        .eq("field_key", fieldKey)
        .select("id");
      if (error) throw error;
      if (!updated?.length) {
        const { error: insErr } = await supabase.from("ocr_fields").insert({
          ocr_job_id: jobId,
          field_key: fieldKey,
          field_value: value,
          validated_value: value,
          confidence: null,
        });
        if (insErr) throw insErr;
      }
    }

    const { error } = await supabase
      .from("ocr_jobs")
      .update({ status: "validated", completed_at: new Date().toISOString() })
      .eq("id", jobId);
    if (error) throw error;

    set((s) => ({
      ocrJobs: s.ocrJobs.map((j) => {
        if (j.id !== jobId) return j;
        const keys = new Set((j.fields || []).map((f) => f.fieldKey));
        const fields = [
          ...(j.fields || []).map((f) => ({
            ...f,
            validatedValue: validated[f.fieldKey] ?? f.validatedValue,
          })),
          ...Object.entries(validated)
            .filter(([k]) => !keys.has(k))
            .map(([fieldKey, fieldValue]) => ({
              id: `local-${fieldKey}`,
              ocrJobId: jobId,
              fieldKey,
              fieldValue,
              validatedValue: fieldValue,
            })),
        ];
        return {
          ...j,
          status: "validated" as const,
          completedAt: new Date().toISOString(),
          fields,
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
