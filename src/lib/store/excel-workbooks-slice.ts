import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { SLTTState } from "@/lib/store";
import type { ExcelWorkbook, ExcelWorkbookRow } from "@/lib/excel/types";
import { useNav } from "@/lib/nav-store";

const BUCKET = "excel-workbooks";

export function mapExcelWorkbookFromDb(x: ExcelWorkbookRow): ExcelWorkbook {
  return {
    id: x.id,
    clientId: x.client_id,
    societeId: x.societe_id || undefined,
    nom: x.nom,
    storagePath: x.storage_path || undefined,
    snapshotJson: x.snapshot_json,
    version: Number(x.version),
    updatedBy: x.updated_by || undefined,
    createdAt: x.created_at,
    updatedAt: x.updated_at,
  };
}

function currentUserId(): string | null {
  return useNav.getState().currentUserId;
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

    let storagePath = existing?.storagePath ?? null;
    if (input.xlsxBlob) {
      const safe = input.clientNom.replace(/[^\w.\-]+/g, "_").slice(0, 40);
      const path = `${input.clientId}/v${nextVersion}-${Date.now()}-${safe}.xlsx`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, input.xlsxBlob, {
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          upsert: false,
        });
      if (upErr) throw upErr;
      storagePath = path;
    }

    // Limite snapshot JSON ~800 Ko pour éviter de gonfler la ligne PG
    let snapshot = input.snapshotJson;
    try {
      const size = new Blob([JSON.stringify(snapshot)]).size;
      if (size > 800_000) {
        snapshot = { truncated: true, name: snapshot.name, id: snapshot.id };
      }
    } catch {
      // ignore
    }

    if (existing) {
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
        .select()
        .single();
      if (error) throw error;
      const mapped = mapExcelWorkbookFromDb(data as ExcelWorkbookRow);
      set((s) => ({
        excelWorkbooks: s.excelWorkbooks.map((w) =>
          w.id === mapped.id ? mapped : w,
        ),
      }));
      await get().addAuditLog(
        "Comptabilité",
        "Modification",
        `Classeur Excel « ${nom} » enregistré (v${nextVersion})`,
        input.clientId,
      );
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
    await get().addAuditLog(
      "Comptabilité",
      "Création",
      `Classeur Excel « ${nom} » créé`,
      input.clientId,
    );
    return mapped;
  },

  getSignedExcelWorkbookUrl: async (storagePath) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  },
});
