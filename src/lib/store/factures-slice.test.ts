import { beforeEach, describe, expect, it, vi } from "vitest";

const { calls, rpcResponse, resetFake } = vi.hoisted(() => {
  const calls: { table: string; op: string; payload?: unknown; args?: unknown }[] = [];
  const rpcResponse = {
    data: null as unknown,
    error: null as { message: string } | null,
  };
  return {
    calls,
    rpcResponse,
    resetFake: () => {
      calls.length = 0;
      rpcResponse.data = null;
      rpcResponse.error = null;
    },
  };
});

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (table: string) => ({
      insert: (payload: unknown) => ({
        select: () => ({
          single: async () => {
            calls.push({ table, op: "insert", payload });
            return {
              data: { id: "audit-test-1", created_at: new Date().toISOString(), ...(payload as object) },
              error: null,
            };
          },
        }),
      }),
    }),
    rpc: async (fn: string, args: unknown) => {
      calls.push({ table: `rpc:${fn}`, op: "rpc", args });
      return rpcResponse;
    },
  },
}));

const { useStore } = await import("@/lib/store");
import type { Facture } from "@/lib/store";

const baseFacture: Facture = {
  id: "f1",
  numero: "FACT-2026-0001",
  dossierId: null,
  clientId: "c1",
  clientNom: "Golaine Tech",
  annexeId: "33333333-3333-3333-3333-333333333333",
  date: "2026-07-01",
  dateEcheance: "2026-07-15",
  statut: "Envoyée",
  lignes: [],
  tauxTVA: 18,
  montantHT: 1000,
  montantTVA: 180,
  montantTTC: 1180,
  montantPaye: 0,
  notes: "",
  creePar: "Test",
  creeLe: "2026-07-01",
};

beforeEach(() => {
  resetFake();
  useStore.setState({
    factures: [baseFacture],
    dossiers: [],
    ecritures: [],
    clients: [],
    auditLogs: [],
    auditSeq: 1,
  });
});

describe("patchFactureMontantPaye", () => {
  it("passe par le RPC atomique patch_facture_montant_paye", async () => {
    rpcResponse.data = { montant_paye: 500, statut: "Partielle" };

    await useStore.getState().patchFactureMontantPaye("f1", 500);

    const rpcCall = calls.find((c) => c.table === "rpc:patch_facture_montant_paye");
    expect(rpcCall).toBeDefined();
    expect(rpcCall?.args).toEqual({ p_facture_id: "f1", p_montant_paye: 500 });

    const facture = useStore.getState().factures.find((f) => f.id === "f1");
    expect(facture?.montantPaye).toBe(500);
    expect(facture?.statut).toBe("Partielle");
  });

  it("refuse de modifier une facture Soldée sans appeler le RPC", async () => {
    useStore.setState({ factures: [{ ...baseFacture, statut: "Soldée", montantPaye: 1180 }] });

    await expect(useStore.getState().patchFactureMontantPaye("f1", 0)).rejects.toThrow(
      /Impossible de modifier le paiement/,
    );

    const rpcCall = calls.find((c) => c.table === "rpc:patch_facture_montant_paye");
    expect(rpcCall).toBeUndefined();
  });

  it("refuse de modifier une facture Brouillon ou Annulée", async () => {
    useStore.setState({ factures: [{ ...baseFacture, statut: "Brouillon" }] });
    await expect(useStore.getState().patchFactureMontantPaye("f1", 100)).rejects.toThrow();

    useStore.setState({ factures: [{ ...baseFacture, statut: "Annulée" }] });
    await expect(useStore.getState().patchFactureMontantPaye("f1", 100)).rejects.toThrow();

    expect(calls.find((c) => c.table === "rpc:patch_facture_montant_paye")).toBeUndefined();
  });
});
