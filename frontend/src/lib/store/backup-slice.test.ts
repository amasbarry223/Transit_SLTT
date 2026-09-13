import { describe, expect, it, vi } from "vitest";

const mockApi = {
  backup: {
    listTables: vi.fn(),
    export: vi.fn(),
    wipe: vi.fn(),
    restore: vi.fn(),
  },
};

vi.mock("@/lib/api-client", () => ({
  api: mockApi,
}));

const { createBackupSlice } = await import("./backup-slice");

function makeSlice() {
  const addAuditLog = vi.fn().mockResolvedValue(undefined);
  const refetchData = vi.fn().mockResolvedValue(undefined);
  const state = { addAuditLog, refetchData };
  const get = () => state as never;
  const set = () => {};
  const apiObj = {
    setState: set,
    getState: get,
    getInitialState: get,
    subscribe: () => () => {},
  };
  return {
    slice: createBackupSlice(set as never, get as never, apiObj as never),
    addAuditLog,
    refetchData,
  };
}

describe("backup-slice (NestJS API)", () => {
  it("exportBackup appelle api.backup.export et renvoie le payload", async () => {
    const fakeData = { meta: { exportedAt: "now", tables: ["clients"] }, data: { clients: [] } };
    mockApi.backup.export.mockResolvedValueOnce(fakeData);
    const { slice } = makeSlice();

    const payload = await slice.exportBackup();

    expect(mockApi.backup.export).toHaveBeenCalledTimes(1);
    expect(payload).toEqual(fakeData);
  });

  it("exportBackup propage l'erreur de l'API", async () => {
    const error = new Error("Network error");
    mockApi.backup.export.mockRejectedValueOnce(error);
    const { slice } = makeSlice();

    await expect(slice.exportBackup()).rejects.toThrow("Network error");
  });

  it("wipeBusinessData journalise le total et resynchronise le store", async () => {
    mockApi.backup.wipe.mockResolvedValueOnce({ clients: 3, dossiers: 5 });
    const { slice, addAuditLog, refetchData } = makeSlice();

    const report = await slice.wipeBusinessData();

    expect(mockApi.backup.wipe).toHaveBeenCalledTimes(1);
    expect(report).toEqual({ clients: 3, dossiers: 5 });
    expect(addAuditLog).toHaveBeenCalledWith(
      "Système",
      "Suppression",
      expect.stringContaining("8 ligne(s) supprimée(s) sur 2 table(s)"),
    );
    expect(refetchData).toHaveBeenCalledTimes(1);
  });

  it("wipeBusinessData ne journalise ni ne resynchronise si l'API échoue", async () => {
    mockApi.backup.wipe.mockRejectedValueOnce(new Error("boom"));
    const { slice, addAuditLog, refetchData } = makeSlice();

    await expect(slice.wipeBusinessData()).rejects.toThrow("boom");
    expect(addAuditLog).not.toHaveBeenCalled();
    expect(refetchData).not.toHaveBeenCalled();
  });

  it("restoreBackup transmet le payload et journalise le total restauré", async () => {
    mockApi.backup.restore.mockResolvedValueOnce({ restored: { clients: 2 }, missingTables: [] });
    const { slice, addAuditLog, refetchData } = makeSlice();
    const backupData = { clients: [{ id: "c1" }, { id: "c2" }] };

    const result = await slice.restoreBackup(backupData);

    expect(mockApi.backup.restore).toHaveBeenCalledWith(backupData);
    expect(result).toEqual({ restored: { clients: 2 }, missingTables: [] });
    expect(addAuditLog).toHaveBeenCalledWith(
      "Système",
      "Modification",
      expect.stringContaining("2 ligne(s) restaurée(s) sur 1 table(s)"),
    );
    expect(refetchData).toHaveBeenCalledTimes(1);
  });

  it("listBackupTables renvoie la liste des tables", async () => {
    mockApi.backup.listTables.mockResolvedValueOnce(["clients", "dossiers"]);
    const { slice } = makeSlice();

    await expect(slice.listBackupTables()).resolves.toEqual(["clients", "dossiers"]);
    expect(mockApi.backup.listTables).toHaveBeenCalledTimes(1);
  });
});
