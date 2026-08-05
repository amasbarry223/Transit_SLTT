import { describe, expect, it, vi } from "vitest";

const { rpcCalls, rpcResult, resetFake } = vi.hoisted(() => {
  const state = {
    calls: [] as { fn: string; args: unknown }[],
    result: { data: null as unknown, error: null as { message: string } | null },
  };
  return {
    rpcCalls: state.calls,
    rpcResult: state.result,
    resetFake: () => {
      state.calls.length = 0;
      state.result.data = null;
      state.result.error = null;
    },
  };
});

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    rpc: async (fn: string, args?: unknown) => {
      rpcCalls.push({ fn, args });
      return rpcResult;
    },
  },
}));

const { createBackupSlice } = await import("./backup-slice");

function makeSlice() {
  const addAuditLog = vi.fn().mockResolvedValue(undefined);
  const refetchData = vi.fn().mockResolvedValue(undefined);
  const state = { addAuditLog, refetchData };
  const get = () => state as never;
  const set = () => {};
  const api = {
    setState: set,
    getState: get,
    getInitialState: get,
    subscribe: () => () => {},
  };
  return {
    slice: createBackupSlice(set as never, get as never, api as never),
    addAuditLog,
    refetchData,
  };
}

describe("backup-slice", () => {
  it("exportBackup appelle export_business_data et renvoie le payload", async () => {
    resetFake();
    rpcResult.data = { meta: { exportedAt: "now", tables: ["clients"] }, data: { clients: [] } };
    const { slice } = makeSlice();

    const payload = await slice.exportBackup();

    expect(rpcCalls).toEqual([{ fn: "export_business_data", args: undefined }]);
    expect(payload).toEqual(rpcResult.data);
  });

  it("exportBackup propage l'erreur RPC", async () => {
    resetFake();
    rpcResult.error = { message: "permission denied" };
    const { slice } = makeSlice();

    await expect(slice.exportBackup()).rejects.toEqual(rpcResult.error);
  });

  it("wipeBusinessData journalise le total et resynchronise le store", async () => {
    resetFake();
    rpcResult.data = { clients: 3, dossiers: 5 };
    const { slice, addAuditLog, refetchData } = makeSlice();

    const report = await slice.wipeBusinessData();

    expect(rpcCalls).toEqual([{ fn: "wipe_business_data", args: undefined }]);
    expect(report).toEqual({ clients: 3, dossiers: 5 });
    expect(addAuditLog).toHaveBeenCalledWith(
      "Système",
      "Suppression",
      expect.stringContaining("8 ligne(s) supprimée(s) sur 2 table(s)"),
    );
    expect(refetchData).toHaveBeenCalledTimes(1);
  });

  it("wipeBusinessData ne journalise ni ne resynchronise si le RPC échoue", async () => {
    resetFake();
    rpcResult.error = { message: "boom" };
    const { slice, addAuditLog, refetchData } = makeSlice();

    await expect(slice.wipeBusinessData()).rejects.toEqual(rpcResult.error);
    expect(addAuditLog).not.toHaveBeenCalled();
    expect(refetchData).not.toHaveBeenCalled();
  });

  it("restoreBackup transmet le payload et journalise le total restauré", async () => {
    resetFake();
    rpcResult.data = { clients: 2 };
    const { slice, addAuditLog, refetchData } = makeSlice();
    const backupData = { clients: [{ id: "c1" }, { id: "c2" }] };

    const report = await slice.restoreBackup(backupData);

    expect(rpcCalls).toEqual([
      { fn: "restore_business_data", args: { payload: backupData } },
    ]);
    expect(report).toEqual({ clients: 2 });
    expect(addAuditLog).toHaveBeenCalledWith(
      "Système",
      "Création",
      expect.stringContaining("2 ligne(s) restaurée(s) sur 1 table(s)"),
    );
    expect(refetchData).toHaveBeenCalledTimes(1);
  });

  it("listBackupTables renvoie la liste des tables", async () => {
    resetFake();
    rpcResult.data = ["clients", "dossiers"];
    const { slice } = makeSlice();

    await expect(slice.listBackupTables()).resolves.toEqual(["clients", "dossiers"]);
    expect(rpcCalls).toEqual([{ fn: "list_business_tables", args: undefined }]);
  });
});
