import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { SLTTState } from "@/lib/store";
import type { ExcelWorkbook, ExcelWorkbookRow } from "@/lib/excel/types";
import { useSession } from "@/lib/session/session-store";
import { SIGNED_URL_TTL_SEC } from "@/lib/constants";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

const BUCKET = "excel-workbooks";
const SNAPSHOT_MAX_BYTES = 800_000;

export function mapExcelWorkbookFromDb(row: ExcelWorkbookRow): ExcelWorkbook {
  return {
    id: row.id,
    clientId: row.client_id,
    societeId: row.societe_id || undefined,
    nom: row.nom,
    storagePath: row.storage_path || undefined,
    snapshotJson: row.snapshot_json,
    version: Number(row.version),
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
    societeId?: string | null;
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
    const { data, error } = await supabase
      .from("excel_workbooks")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return cached ?? null;
    const mapped = mapExcelWorkbookFromDb(data as ExcelWorkbookRow);
    set((s) => ({
      excelWorkbooks: [
        mapped,
        ...s.excelWorkbooks.filter((w) => w.clientId !== clientId),
      ],
    }));
    return mapped;
  },

  saveExcelWorkbook: async (input) => {
    const userId = currentUserId();
    const existing = await get().getExcelWorkbookForClient(input.clientId);
    const nextVersion = existing ? existing.version + 1 : 1;
    const nom = existing?.nom || `Classeur ${input.clientNom}`;

    // Limite snapshot JSON ~800 Ko — au-delà, exige un xlsx Storage.
    let snapshot = input.snapshotJson;
    let xlsxBlob = input.xlsxBlob ?? null;
    const size = new Blob([JSON.stringify(snapshot)]).size;
    if (size > SNAPSHOT_MAX_BYTES) {
      if (!xlsxBlob) {
        throw new Error(
          "Classeur trop volumineux : fournissez un export .xlsx pour le secours Storage.",
        );
      }
      snapshot = {
        truncated: true,
        name: snapshot.name,
        id: snapshot.id,
      };
    }

    let storagePath = existing?.storagePath ?? null;
    if (xlsxBlob) {
      const safe = input.clientNom.replace(/[^\w.\-]+/g, "_").slice(0, 40);
      const path = `${input.clientId}/v${nextVersion}-${Date.now()}-${safe}.xlsx`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, xlsxBlob, {
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          upsert: false,
        });
      if (upErr) throw upErr;
      storagePath = path;
    }

    // Truncated sans storage = perte de données — refuser.
    if ((snapshot as { truncated?: boolean }).truncated && !storagePath) {
      throw new Error(
        "Impossible d'enregistrer un snapshot tronqué sans fichier Storage.",
      );
    }

    if (existing) {
      const expectedVersion = existing.version;
      const { data, error } = await supabase
        .from("excel_workbooks")
        .update({
          nom,
          societe_id: input.societeId ?? existing.societeId ?? null,
          snapshot_json: snapshot,
          storage_path: storagePath,
          version: nextVersion,
          updated_by: userId,
        })
        .eq("id", existing.id)
        .eq("version", expectedVersion)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        throw new Error(
          "Conflit de version : le classeur a été modifié ailleurs. Rechargez puis réessayez.",
        );
      }
      const mapped = mapExcelWorkbookFromDb(data as ExcelWorkbookRow);
      set((s) => ({
        excelWorkbooks: s.excelWorkbooks.map((w) =>
          w.id === mapped.id ? mapped : w,
        ),
      }));
      // Audit uniquement sur save manuel (pas autosave silencieux) — géré par l'appelant via silent.
      if (!input.silent) {
        await get().addAuditLog(
          AUDIT_MODULE.Comptabilite,
          AUDIT_ACTION.Modification,
          `Classeur Excel « ${nom} » enregistré (v${nextVersion})`,
          input.clientId,
        );
      }
      return mapped;
    }

    const { data, error } = await supabase
      .from("excel_workbooks")
      .insert({
        client_id: input.clientId,
        societe_id: input.societeId ?? null,
        nom,
        snapshot_json: snapshot,
        storage_path: storagePath,
        version: 1,
        updated_by: userId,
      })
      .select()
      .single();
    if (error) throw error;
    const mapped = mapExcelWorkbookFromDb(data as ExcelWorkbookRow);
    set((s) => ({ excelWorkbooks: [mapped, ...s.excelWorkbooks] }));
    if (!input.silent) {
      await get().addAuditLog(
        AUDIT_MODULE.Comptabilite,
        AUDIT_ACTION.Creation,
        `Classeur Excel « ${nom} » créé`,
        input.clientId,
      );
    }
    return mapped;
  },

  getSignedExcelWorkbookUrl: async (storagePath) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SEC);
    if (error) throw error;
    return data.signedUrl;
  },
});
