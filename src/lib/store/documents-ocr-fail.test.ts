import { beforeEach, describe, expect, it, vi } from "vitest";

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
  it("marque le job en failed avec error_message et completed_at", async () => {
    const { slice, getState } = makeSlice();
    await slice.failOcrJob("job-1", "Aucun texte détecté");

    const jobs = getState().ocrJobs as Array<{
      id: string;
      status: string;
      errorMessage?: string;
      completedAt?: string;
    }>;
    expect(jobs[0]).toMatchObject({
      id: "job-1",
      status: "failed",
      errorMessage: "Aucun texte détecté",
    });
    expect(jobs[0].completedAt).toEqual(expect.any(String));
  });

  it("gère les jobs inexistants sans crasher", async () => {
    const { slice, getState } = makeSlice();
    await slice.failOcrJob("job-inexistant", "boom");
    const jobs = getState().ocrJobs as Array<{ id: string; status: string }>;
    expect(jobs.find((j) => j.id === "job-inexistant")).toBeUndefined();
  });

  it("updateOcrJobResult(failed) sans fields met à jour l'état local", async () => {
    const { slice, getState } = makeSlice();
    await slice.updateOcrJobResult("job-1", {
      status: "failed",
      errorMessage: "Téléchargement impossible",
    });

    const jobs = getState().ocrJobs as Array<{ status: string; errorMessage?: string }>;
    expect(jobs[0].status).toBe("failed");
    expect(jobs[0].errorMessage).toBe("Téléchargement impossible");
  });
});
