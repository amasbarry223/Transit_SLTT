import type { StateCreator } from "zustand";
import type { SLTTState } from "@/lib/store";
import type { ExcelWorkbook, ExcelWorkbookRow } from "@/lib/excel/types";
import { useSession } from "@/lib/session/session-store";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export function mapExcelWorkbookFromDb(row: ExcelWorkbookRow): ExcelWorkbook {
  return {
    id: row.id,
    clientId: row.client_id,
    nom: row.nom,
    storagePath: row.storage_path || undefined,
    snapshotJson: row.snapshot_json,
    version: Number(row.version ?? 0),
    updatedBy: row.updated_by || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function currentUserId(): string | null {
  return useSession.getState().currentUserId;
}

export interface ExcelWorkbooksSlice {
  excelWorkbooks: ExcelWorkbook[];
  getExcelWorkbookForClient: (clientId: string) => Promise<ExcelWorkbook | null>;
  saveExcelWorkbook: (input: {
    clientId: string;
    clientNom: string;
    snapshotJson: Record<string, unknown>;
    xlsxBlob?: Blob | null;
    /** Si true, pas d'entrée d'audit (autosave). */
    silent?: boolean;
  }) => Promise<ExcelWorkbook>;
  getSignedExcelWorkbookUrl: (storagePath: string) => Promise<string>;
}

export const createExcelWorkbooksSlice: StateCreator<
  SLTTState,
  [],
  [],
  ExcelWorkbooksSlice
> = (set, get) => ({
  excelWorkbooks: [],

  getExcelWorkbookForClient: async (clientId) => {
    const cached = get().excelWorkbooks.find((w) => w.clientId === clientId);
    return cached ?? null;
  },

  saveExcelWorkbook: async (input) => {
    const userId = currentUserId();
    const existing = await get().getExcelWorkbookForClient(input.clientId);
    const nextVersion = existing ? existing.version + 1 : 1;
    const nom = existing?.nom || `Classeur ${input.clientNom}`;

    const now = new Date().toISOString();
    const updated: ExcelWorkbook = {
      id: existing?.id ?? crypto.randomUUID(),
      clientId: input.clientId,
      nom,
      storagePath: existing?.storagePath,
      snapshotJson: input.snapshotJson,
      version: nextVersion,
      updatedBy: userId ?? undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    set((s) => ({
      excelWorkbooks: [
        updated,
        ...s.excelWorkbooks.filter((w) => w.clientId !== input.clientId),
      ],
    }));

    if (!input.silent) {
      await get().addAuditLog(
        AUDIT_MODULE.Comptabilite,
        existing ? AUDIT_ACTION.Modification : AUDIT_ACTION.Creation,
        `Classeur Excel « ${nom} » ${existing ? `enregistré (v${nextVersion})` : "créé"}`,
        input.clientId,
      );
    }
    return updated;
  },

  getSignedExcelWorkbookUrl: async (storagePath) => {
    return storagePath;
  },
});
