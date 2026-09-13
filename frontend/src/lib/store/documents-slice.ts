import type { StateCreator } from "zustand";
import type {
  DocumentVersion,
  OcrJob,
  OcrTargetForm,
  SlttDocument,
} from "@/lib/domain-types";
import {
  currentUserId,
  resolveDocumentAnnexeId,
} from "./documents";
import type { AddDocumentInput, UpdateDocumentMetaInput } from "./documents";
import type { SLTTState } from "@/lib/store";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";
import { canTransitionOcrJob } from "@/lib/status-flow";

export type { AddDocumentInput, UpdateDocumentMetaInput } from "./documents";

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

    const docId = crypto.randomUUID();
    const versionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const doc: SlttDocument = {
      id: docId,
      nom: input.nom,
      categorie: input.categorie,
      mimeType: input.mimeType,
      taille: input.taille,
      dossierId: input.dossierId,
      factureId: input.factureId,
      clientId: input.clientId,
      entityType: input.entityType,
      entityId: input.entityId,
      annexeId,
      currentVersion: 1,
      creePar: userId ?? undefined,
      createdAt: now,
      updatedAt: now,
    };
    const version: DocumentVersion = {
      id: versionId,
      documentId: docId,
      version: 1,
      storagePath: input.dataUrl,
      taille: input.taille,
      mimeType: input.mimeType,
      uploadedBy: userId ?? undefined,
      createdAt: now,
    };
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
    const nextVersion = existing.currentVersion + 1;
    const now = new Date().toISOString();
    const version: DocumentVersion = {
      id: crypto.randomUUID(),
      documentId,
      version: nextVersion,
      storagePath: file.dataUrl,
      taille: file.taille,
      mimeType: file.mimeType,
      uploadedBy: userId ?? undefined,
      createdAt: now,
    };
    set((s) => ({
      documents: s.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              nom: file.nom,
              mimeType: file.mimeType,
              taille: file.taille,
              currentVersion: nextVersion,
              updatedAt: now,
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

  getSignedDocumentUrl: async (storagePath) => storagePath,

  getDocumentVersions: async (documentId) => {
    return get().documentVersions.filter((v) => v.documentId === documentId);
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

    const job: OcrJob = {
      id: crypto.randomUUID(),
      documentId,
      documentVersionId: version.id,
      status: "pending",
      provider: "tesseract",
      targetForm,
      createdBy: currentUserId() ?? undefined,
      createdAt: new Date().toISOString(),
      fields: [],
    };
    set((s) => ({ ocrJobs: [job, ...s.ocrJobs] }));
    return job;
  },

  updateOcrJobResult: async (jobId, result) => {
    set((s) => ({
      ocrJobs: s.ocrJobs.map((existingJob) =>
        existingJob.id === jobId
          ? {
              ...existingJob,
              status: result.status,
              rawText: result.rawText ?? existingJob.rawText,
              errorMessage: result.errorMessage ?? existingJob.errorMessage,
              completedAt:
                result.status === "done" || result.status === "failed" || result.status === "validated"
                  ? new Date().toISOString()
                  : existingJob.completedAt,
              fields: result.fields
                ? result.fields.map((f, i) => ({
                    id: `local-field-${i}`,
                    ocrJobId: jobId,
                    fieldKey: f.fieldKey,
                    fieldValue: f.fieldValue,
                    confidence: f.confidence,
                  }))
                : existingJob.fields,
            }
          : existingJob,
      ),
    }));
    return get().ocrJobs.find((j) => j.id === jobId)!;
  },

  failOcrJob: async (jobId, errorMessage) => {
    const completedAt = new Date().toISOString();
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
