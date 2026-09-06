import type { StateCreator } from "zustand";
import { api } from "@/lib/api-client";
import type { SLTTState } from "@/lib/store";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

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
  restoreBackup: (
    data: Record<string, unknown[]>,
  ) => Promise<{ restored: Record<string, number>; missingTables: string[] }>;
}

export const createBackupSlice: StateCreator<SLTTState, [], [], BackupSlice> = (set, get) => ({
  listBackupTables: async () => {
    try {
      const data = await api.backup.listTables();
      return data ?? [];
    } catch {
      return [];
    }
  },

  exportBackup: async () => {
    return api.backup.export();
  },

  wipeBusinessData: async () => {
    const report = await api.backup.wipe();

    await get().addAuditLog(
      AUDIT_MODULE.Systeme,
      AUDIT_ACTION.Suppression,
      `Purge complète des données métier — ${sumCounts(report)} ligne(s) supprimée(s) sur ${Object.keys(report).length} table(s)`,
    );
    await get().refetchData();
    return report;
  },

  restoreBackup: async (backupData) => {
    const result = await api.backup.restore(backupData);
    const restored = result.restored ?? {};
    const missingTables = result.missingTables ?? [];

    await get().addAuditLog(
      AUDIT_MODULE.Systeme,
      AUDIT_ACTION.Modification,
      `Restauration de sauvegarde — ${sumCounts(restored)} ligne(s) restaurée(s) sur ${Object.keys(restored).length} table(s)`,
    );
    await get().refetchData();
    return { restored, missingTables };
  },
});
