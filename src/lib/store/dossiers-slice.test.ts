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
      update: (payload: unknown) => ({
        eq: async () => {
          calls.push({ table, op: "update", payload });
          return { error: null };
        },
      }),
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
import type { Dossier } from "@/lib/store";

const baseDossier: Dossier = {
  id: "d1",
  reference: "TR-TR-2026-0001",
  societeId: "22222222-2222-2222-2222-222222222222",
  societeNom: "SLTT",
  annexeId: "33333333-3333-3333-3333-333333333333",
  clientId: "c1",
  clientNom: "Golaine Tech",
  bl: "BL-1",
  camion: "",
  nature: "Marchandise générale",
  droitDouane: 0,
  fraisCircuit: 0,
  fraisPrestation: 0,
  montantInvesti: 1000,
  montantPaye: 700,
  statut: "Livré",
  date: "2026-07-01",
};

beforeEach(() => {
  resetFake();
  useStore.setState({
    dossiers: [baseDossier],
    ecritures: [],
    ecritureSeq: 1,
    clients: [],
    factures: [],
    auditLogs: [],
    auditSeq: 1,
  });
});

describe("transitionDossier — solde avec encaissement", () => {
  it("passe par le RPC atomique plutôt que par un .update() direct sur dossiers", async () => {
    rpcResponse.data = [
      {
        dossier_montant_paye: 1000,
        ecriture_id: "e-rpc-1",
        ecriture_montant_paye: 300,
        ecriture_mode_paiement: "Espèces",
        ecriture_date_paiement: "2026-08-02",
        ecriture_note: "Solde dossier TR-TR-2026-0001",
      },
    ];

    await useStore.getState().transitionDossier("d1", "Soldé", 300, "Espèces", undefined, "2026-08-02");

    const rpcCall = calls.find((c) => c.table === "rpc:record_dossier_solde_paiement");
    expect(rpcCall).toBeDefined();
    expect(rpcCall?.args).toEqual({
      p_dossier_id: "d1",
      p_montant: 300,
      p_mode: "Espèces",
      p_date: "2026-08-02",
      p_note: null,
    });

    // Le statut/montant sont fixés côté DB par le RPC : pas de second .update() sur dossiers.
    const directUpdate = calls.find((c) => c.table === "dossiers" && c.op === "update");
    expect(directUpdate).toBeUndefined();

    const dossier = useStore.getState().dossiers.find((d) => d.id === "d1");
    expect(dossier?.statut).toBe("Soldé");
    expect(dossier?.montantPaye).toBe(1000);

    const ecriture = useStore.getState().ecritures.find((e) => e.id === "e-rpc-1");
    expect(ecriture).toBeDefined();
    expect(ecriture?.montantPaye).toBe(300);
    expect(ecriture?.dossierId).toBe("d1");
  });
});

describe("transitionDossier — dédouanement/livraison (sans paiement)", () => {
  it("continue à utiliser un .update() direct et n'appelle pas le RPC de solde", async () => {
    useStore.setState({ dossiers: [{ ...baseDossier, statut: "Dédouané" }] });

    await useStore.getState().transitionDossier("d1", "Livré", undefined, undefined, undefined, "2026-08-02");

    const rpcCall = calls.find((c) => c.table === "rpc:record_dossier_solde_paiement");
    expect(rpcCall).toBeUndefined();

    const directUpdate = calls.find((c) => c.table === "dossiers" && c.op === "update");
    expect(directUpdate).toBeDefined();

    const dossier = useStore.getState().dossiers.find((d) => d.id === "d1");
    expect(dossier?.statut).toBe("Livré");
  });
});

describe("transitionDossier — garde Soldé sans encaissement", () => {
  it("refuse Soldé si reste dû et aucun montantRecu", async () => {
    await expect(
      useStore.getState().transitionDossier("d1", "Soldé"),
    ).rejects.toThrow(/encaissement|montant reçu/i);

    const rpcCall = calls.find((c) => c.table === "rpc:record_dossier_solde_paiement");
    expect(rpcCall).toBeUndefined();
    expect(useStore.getState().dossiers.find((d) => d.id === "d1")?.statut).toBe("Livré");
  });

  it("autorise Soldé sans montantRecu lorsque le dossier est déjà intégralement payé", async () => {
    useStore.setState({
      dossiers: [{ ...baseDossier, montantPaye: 1000, montantInvesti: 1000 }],
    });

    await useStore.getState().transitionDossier("d1", "Soldé");

    const rpcCall = calls.find((c) => c.table === "rpc:record_dossier_solde_paiement");
    expect(rpcCall).toBeUndefined();

    const directUpdate = calls.find((c) => c.table === "dossiers" && c.op === "update");
    expect(directUpdate).toBeDefined();
    expect(useStore.getState().dossiers.find((d) => d.id === "d1")?.statut).toBe("Soldé");
  });
});
