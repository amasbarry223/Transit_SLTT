import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { SLTTState } from "@/lib/store";

export interface BackupExportPayload {
  meta: { exportedAt: string; tables: string[] };
  data: Record<string, unknown[]>;
}

function sumCounts(report: Record<string, number>): number {
  return Object.values(report).reduce((sum, n) => sum + n, 0);
}

export interface BackupSlice {
  /** Liste des tables métier concernées par sauvegarde/purge (hors profils, sociétés, annexes). */
  listBackupTables: () => Promise<string[]>;
  exportBackup: () => Promise<BackupExportPayload>;
  /** Purge toutes les données métier (irréversible) puis resynchronise le store. */
  wipeBusinessData: () => Promise<Record<string, number>>;
  /** Purge puis restaure depuis payload.data (format produit par exportBackup). */
  restoreBackup: (data: Record<string, unknown[]>) => Promise<Record<string, number>>;
}

export const createBackupSlice: StateCreator<SLTTState, [], [], BackupSlice> = (set, get) => ({
  listBackupTables: async () => {
    const { data, error } = await supabase.rpc("list_business_tables");
    if (error) throw error;
    return (data as string[]) ?? [];
  },

  exportBackup: async () => {
    const { data, error } = await supabase.rpc("export_business_data");
    if (error) throw error;
    return data as BackupExportPayload;
  },

  wipeBusinessData: async () => {
    const { data, error } = await supabase.rpc("wipe_business_data");
    if (error) throw error;
    const report = (data as Record<string, number>) ?? {};

    await get().addAuditLog(
      "Système",
      "Suppression",
      `Purge complète des données métier — ${sumCounts(report)} ligne(s) supprimée(s) sur ${Object.keys(report).length} table(s)`,
    );
    await get().refetchData();
    return report;
  },

  restoreBackup: async (backupData) => {
    const { data, error } = await supabase.rpc("restore_business_data", { payload: backupData });
    if (error) throw error;
    const report = (data as Record<string, number>) ?? {};

    await get().addAuditLog(
      "Système",
      "Création",
      `Restauration d'une sauvegarde — ${sumCounts(report)} ligne(s) restaurée(s) sur ${Object.keys(report).length} table(s)`,
    );
    await get().refetchData();
    return report;
  },
});
