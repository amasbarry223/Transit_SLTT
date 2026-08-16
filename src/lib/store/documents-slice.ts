import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { toastWarning } from "@/lib/toast-helpers";
import type {
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
import {
  buildDocumentStoragePath,
  dataUrlToBlob,
  getSignedDocumentUrl,
  removeDocumentStoragePaths,
  sha256Hex,
  uploadDocumentBlob,
} from "@/lib/documents/storage";
import {
  currentUserId,
  mapDocumentFromDb,
  mapDocumentVersionFromDb,
  mapOcrFieldFromDb,
  mapOcrJobFromDb,
  resolveDocumentAnnexeId,
} from "./documents";
import type { AddDocumentInput, UpdateDocumentMetaInput } from "./documents";
import type { SLTTState } from "@/lib/store";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";
import { canTransitionOcrJob } from "@/lib/status-flow";

export type { AddDocumentInput, UpdateDocumentMetaInput } from "./documents";
export {
  mapDocumentFromDb,
  mapDocumentVersionFromDb,
  mapOcrFieldFromDb,
  mapOcrJobFromDb,
} from "./documents";

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
      AUDIT_MODULE.Documents,
      AUDIT_ACTION.Creation,
      `Document « ${input.nom} » uploadé (${input.categorie})`,
      input.clientId,
      { sourceType: "document", sourceId: doc.id },
    );

    return doc;
  },

  replaceDocumentVersion: async (documentId, file) => {
    const existing = get().documents.find((doc) => doc.id === documentId);
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
    if (updError) {
      // Le fichier et la ligne document_versions ont déjà été écrits : sans ce
      // rollback, ils restent orphelins alors que documents.current_version
      // pointe toujours sur l'ancienne version (contrairement à addDocument,
      // qui nettoie déjà correctement sur échec).
      await supabase.from("document_versions").delete().eq("id", verRow.id);
      await removeDocumentStoragePaths([path]);
      throw updError;
    }

    const version = mapDocumentVersionFromDb(verRow as DocumentVersionRow);
    set((s) => ({
      documents: s.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              nom: file.nom,
              mimeType: file.mimeType,
              taille: file.taille,
              currentVersion: nextVersion,
              updatedAt: new Date().toISOString(),
            }
          : doc,
      ),
      documentVersions: [version, ...s.documentVersions],
    }));

    await get().addAuditLog(
      AUDIT_MODULE.Documents,
      AUDIT_ACTION.Modification,
      `Document « ${file.nom} » remplacé (v${nextVersion})`,
      existing.clientId,
      { sourceType: "document", sourceId: documentId },
    );

    return version;
  },

  updateDocumentMeta: async (id, input) => {
    const existing = get().documents.find((doc) => doc.id === id);
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
      documents: s.documents.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              nom: input.nom ?? doc.nom,
              categorie: input.categorie ?? doc.categorie,
              dossierId: input.dossierId === null ? undefined : (input.dossierId ?? doc.dossierId),
              factureId: input.factureId === null ? undefined : (input.factureId ?? doc.factureId),
              clientId: input.clientId === null ? undefined : (input.clientId ?? doc.clientId),
              societeId: input.societeId === null ? undefined : (input.societeId ?? doc.societeId),
              entityType:
                input.entityType === null ? undefined : (input.entityType ?? doc.entityType),
              entityId: input.entityId === null ? undefined : (input.entityId ?? doc.entityId),
              updatedAt: new Date().toISOString(),
            }
          : doc,
      ),
    }));

    await get().addAuditLog(
      AUDIT_MODULE.Documents,
      AUDIT_ACTION.Modification,
      `Métadonnées du document « ${input.nom ?? existing?.nom ?? id} » mises à jour`,
      input.clientId === null ? undefined : (input.clientId ?? existing?.clientId),
      { sourceType: "document", sourceId: id },
    );
  },

  deleteDocument: async (id) => {
    const doc = get().documents.find((item) => item.id === id);
    // Toujours recharger les versions depuis la DB pour éviter les orphelins storage.
    const versions = await get().getDocumentVersions(id);
    const paths = versions.map((version) => version.storagePath).filter(Boolean);

    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) throw error;

    const storageOk = await removeDocumentStoragePaths(paths);
    if (!storageOk) {
      // La ligne DB est déjà supprimée (succès affiché) mais le fichier peut
      // rester orphelin en Storage — le signaler au lieu d'avaler l'échec
      // silencieusement, pour qu'un nettoyage manuel reste possible.
      toastWarning(toast, {
        title: "Document supprimé partiellement",
        description: "La fiche a été supprimée mais un fichier associé n'a pas pu être effacé du stockage.",
      });
    }

    set((s) => ({
      documents: s.documents.filter((item) => item.id !== id),
      documentVersions: s.documentVersions.filter((version) => version.documentId !== id),
      ocrJobs: s.ocrJobs.filter((job) => job.documentId !== id),
    }));

    if (doc) {
      await get().addAuditLog(
        AUDIT_MODULE.Documents,
        AUDIT_ACTION.Suppression,
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
    const versions = (data || []).map((row) => mapDocumentVersionFromDb(row as DocumentVersionRow));
    set((s) => ({
      documentVersions: [
        ...versions,
        ...s.documentVersions.filter((version) => version.documentId !== documentId),
      ],
    }));
    return versions;
  },

  createOcrJob: async (documentId, targetForm = "dossier") => {
    const doc = get().documents.find((item) => item.id === documentId);
    if (!doc) throw new Error("Document introuvable");

    let version = get().documentVersions.find(
      (item) => item.documentId === documentId && item.version === doc.currentVersion,
    );
    if (!version) {
      const versions = await get().getDocumentVersions(documentId);
      version = versions.find((item) => item.version === doc.currentVersion);
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
        ocrJobs: s.ocrJobs.map((existingJob) =>
          existingJob.id === jobId ? { ...job, fields: existingJob.fields } : existingJob,
        ),
      }));
      return job;
    }

    const fieldsPayload =
      result.fields?.map((field) => ({
        field_key: field.fieldKey,
        field_value: field.fieldValue ?? null,
        confidence: field.confidence ?? null,
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
              result.fields.map((field) => ({
                ocr_job_id: jobId,
                field_key: field.fieldKey,
                field_value: field.fieldValue ?? null,
                confidence: field.confidence ?? null,
              })),
            )
            .select();
          if (fieldError) throw fieldError;
          fields = (fieldRows || []).map((row) => mapOcrFieldFromDb(row as OcrFieldRow));
        } else {
          fields = [];
        }
      }

      const job = mapOcrJobFromDb(jobData as OcrJobRow, fields);
      set((s) => ({
        ocrJobs: s.ocrJobs.map((existingJob) =>
          existingJob.id === jobId ? { ...job, fields: fields ?? existingJob.fields } : existingJob,
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
      fields = (fieldRows || []).map((row) => mapOcrFieldFromDb(row as OcrFieldRow));
    }

    const job = mapOcrJobFromDb(data as OcrJobRow, fields);
    set((s) => ({
      ocrJobs: s.ocrJobs.map((existingJob) =>
        existingJob.id === jobId ? { ...job, fields: fields ?? existingJob.fields } : existingJob,
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
      ocrJobs: s.ocrJobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: "failed",
              errorMessage: errorMessage.slice(0, 2000),
              completedAt,
            }
          : job,
      ),
    }));
  },

  validateOcrFields: async (jobId, validated) => {
    const existingJob = get().ocrJobs.find((j) => j.id === jobId);
    if (existingJob && !canTransitionOcrJob(existingJob.status, "validated")) {
      throw new Error(`Transition job OCR invalide : ${existingJob.status} → validated`);
    }

    const entries = Object.entries(validated);
    // Chaque entrée cible un field_key distinct pour ce job — indépendantes
    // entre elles, donc parallélisables sans risque d'ordre ni de conflit
    // d'écriture (chaque update-ou-insert garde sa logique inchangée).
    await Promise.all(
      entries.map(async ([fieldKey, value]) => {
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
      }),
    );

    const { error } = await supabase
      .from("ocr_jobs")
      .update({ status: "validated", completed_at: new Date().toISOString() })
      .eq("id", jobId);
    if (error) throw error;

    set((s) => ({
      ocrJobs: s.ocrJobs.map((job) => {
        if (job.id !== jobId) return job;
        const keys = new Set((job.fields || []).map((field) => field.fieldKey));
        const fields = [
          ...(job.fields || []).map((field) => ({
            ...field,
            validatedValue: validated[field.fieldKey] ?? field.validatedValue,
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
          ...job,
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
