import { beforeEach, describe, expect, it, vi } from "vitest";

const { ocrJobsTable, resetFake } = vi.hoisted(() => {
  const state = {
    lastUpdate: null as Record<string, unknown> | null,
    lastEqId: null as string | null,
    shouldFail: false,
  };
  return {
    ocrJobsTable: state,
    resetFake: () => {
      state.lastUpdate = null;
      state.lastEqId = null;
      state.shouldFail = false;
    },
  };
});

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (table: string) => {
      if (table !== "ocr_jobs") {
        return {
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      return {
        update: (payload: Record<string, unknown>) => ({
          eq: (_col: string, id: string) => {
            ocrJobsTable.lastUpdate = payload;
            ocrJobsTable.lastEqId = id;
            const result = {
              select: () => ({
                single: async () => {
                  if (ocrJobsTable.shouldFail) {
                    return { data: null, error: { message: "rls denied" } };
                  }
                  return {
                    data: {
                      id,
                      document_id: "doc-1",
                      document_version_id: "ver-1",
                      status: payload.status,
                      provider: "tesseract",
                      raw_text: payload.raw_text ?? null,
                      error_message: payload.error_message ?? null,
                      target_form: "dossier",
                      created_by: null,
                      created_at: "2026-07-27T00:00:00.000Z",
                      completed_at: payload.completed_at ?? null,
                    },
                    error: null,
                  };
                },
              }),
            };
            // failOcrJob appelle .eq() sans .select() — retourne aussi une Promise-like
            return Object.assign(
              Promise.resolve(
                ocrJobsTable.shouldFail
                  ? { error: { message: "rls denied" } }
                  : { error: null },
              ),
              result,
            );
          },
        }),
      };
    },
    rpc: async () => ({ data: null, error: { message: "rpc unused in this path" } }),
  },
}));

vi.mock("@/lib/nav-store", () => ({
  useNav: {
    getState: () => ({ currentUserId: "user-1" }),
  },
}));

const { createDocumentsSlice } = await import("@/lib/store/documents-slice");

function makeSlice() {
  let state: Record<string, unknown> = {
    ocrJobs: [
      {
        id: "job-1",
        documentId: "doc-1",
        documentVersionId: "ver-1",
        status: "processing",
        provider: "tesseract",
        targetForm: "dossier",
        createdAt: "2026-07-27T00:00:00.000Z",
      },
    ],
  };
  const set = (partial: unknown) => {
    const next =
      typeof partial === "function"
        ? (partial as (s: typeof state) => typeof state)(state)
        : partial;
    state = { ...state, ...(next as object) };
  };
  const get = () => state as never;
  const api = {
    setState: set,
    getState: get,
    getInitialState: get,
    subscribe: () => () => {},
  };
  return {
    slice: createDocumentsSlice(set as never, get as never, api as never),
    getState: () => state,
  };
}

describe("OCR failOcrJob", () => {
  beforeEach(() => {
    resetFake();
  });

  it("marque le job en failed avec error_message et completed_at", async () => {
    const { slice, getState } = makeSlice();
    await slice.failOcrJob("job-1", "Aucun texte détecté");

    expect(ocrJobsTable.lastEqId).toBe("job-1");
    expect(ocrJobsTable.lastUpdate).toMatchObject({
      status: "failed",
      error_message: "Aucun texte détecté",
    });
    expect(ocrJobsTable.lastUpdate?.completed_at).toEqual(expect.any(String));

    const jobs = getState().ocrJobs as Array<{
      id: string;
      status: string;
      errorMessage?: string;
    }>;
    expect(jobs[0]).toMatchObject({
      id: "job-1",
      status: "failed",
      errorMessage: "Aucun texte détecté",
    });
  });

  it("propage l'erreur si l'update SQL échoue", async () => {
    ocrJobsTable.shouldFail = true;
    const { slice } = makeSlice();
    await expect(slice.failOcrJob("job-1", "boom")).rejects.toBeTruthy();
  });

  it("updateOcrJobResult(failed) sans fields passe par l'update directe", async () => {
    const { slice, getState } = makeSlice();
    await slice.updateOcrJobResult("job-1", {
      status: "failed",
      errorMessage: "Téléchargement impossible",
    });

    expect(ocrJobsTable.lastUpdate).toMatchObject({
      status: "failed",
      error_message: "Téléchargement impossible",
    });
    const jobs = getState().ocrJobs as Array<{ status: string; errorMessage?: string }>;
    expect(jobs[0].status).toBe("failed");
    expect(jobs[0].errorMessage).toBe("Téléchargement impossible");
  });
});
