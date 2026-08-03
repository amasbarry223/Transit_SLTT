import type { StateCreator } from "zustand";
import { getConnectedUserName } from "@/lib/store/connected-user";
import {
  insertAuditLog,
  type AuditAction,
  type AuditEntry,
  type AuditModule,
  type AuditSourceRef,
} from "@/lib/audit";
import type { SLTTState } from "@/lib/store";

export interface AuditSlice {
  auditLogs: AuditEntry[];
  addAuditLog: (
    module: AuditModule,
    action: AuditAction,
    detail: string,
    clientId?: string,
    source?: AuditSourceRef,
  ) => Promise<void>;
}

export const createAuditSlice: StateCreator<SLTTState, [], [], AuditSlice> = (set, get) => ({
  auditLogs: [],

  addAuditLog: async (module, action, detail, clientId, source) => {
    const seq = get().auditSeq;
    const userStr = getConnectedUserName();
    const newLog = await insertAuditLog({
      module,
      action,
      detail,
      userName: userStr,
      clientId,
      source,
    });
    if (!newLog) return;
    set((s) => ({
      auditLogs: [newLog, ...s.auditLogs],
      auditSeq: seq + 1,
    }));
  },
});
