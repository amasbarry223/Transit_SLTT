import { beforeEach, describe, expect, it, vi } from "vitest";

const { calls, remoteState, resetFake } = vi.hoisted(() => {
  const calls: { table: string; op: "delete" | "insert"; payload?: unknown }[] = [];
  const remoteState = { storageRemoveError: null as { message: string } | null };
  return {
    calls,
    remoteState,
    resetFake: () => {
      calls.length = 0;
      remoteState.storageRemoveError = null;
    },
  };
});

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (table: string) => ({
      delete: () => ({
        eq: async () => {
          calls.push({ table, op: "delete" });
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
    storage: {
      from: (bucket: string) => ({
        remove: async (paths: string[]) => {
          calls.push({ table: `storage:${bucket}`, op: "delete", payload: paths });
          return { error: remoteState.storageRemoveError };
        },
      }),
    },
  },
}));

const { useStore } = await import("@/lib/store");
import type {
  Archive,
  Client,
  Dossier,
  DossierFournisseur,
  Ecriture,
  Facture,
  Fournisseur,
  SubDossier,
} from "@/lib/store";

const baseDossier: Dossier = {
  id: "d1",
  reference: "SLTT-TR-2026-0001",
  clientId: "c1",
  clientNom: "Golaine Tech",
  bl: "BL-1",
  camion: "",
  nature: "Marchandise générale",
  droitDouane: 0,
  fraisCircuit: 0,
  fraisPrestation: 0,
  montantInvesti: 1000,
  montantPaye: 0,
  statut: "En cours",
  date: "2026-07-01",
};

const baseClient: Client = {
  id: "c1",
  nom: "Golaine Tech",
  type: "Entreprise",
  telephone: "",
  email: "",
  adresse: "",
  nbDossiers: 1,
  totalDu: 1000,
  totalPaye: 0,
};

beforeEach(() => {
  resetFake();
});

describe("removeDossier", () => {
  function seedState() {
    const ecriture: Ecriture = {
      id: "e1",
      date: "2026-07-01",
      clientId: "c1",
      clientNom: "Golaine Tech",
      dossierId: "d1",
      montantInvesti: 1000,
      montantPaye: 0,
      modePaiement: "Espèces",
    };
    const fichier = { id: "f1", dossierId: "d1", nom: "bl.pdf", taille: 100, type: "application/pdf", dateUpload: "2026-07-01", dataUrl: "data:," };
    const subDossier: SubDossier = { id: "sd1", dossierId: "d1", nom: "Sous-dossier 1", dateCreation: "2026-07-01" };
    const facture: Facture = {
      id: "fa1",
      numero: "FA-0001",
      dossierId: "d1",
      clientId: "c1",
      clientNom: "Golaine Tech",
      date: "2026-07-01",
      dateEcheance: "2026-07-15",
      statut: "Envoyée",
      lignes: [],
      tauxTVA: 0,
      montantHT: 0,
      montantTVA: 0,
      montantTTC: 0,
      montantPaye: 0,
      notes: "",
      creePar: "Test",
      creeLe: "2026-07-01",
    };
    const dossierFournisseur: DossierFournisseur = {
      id: "df1",
      dossierId: "d1",
      fournisseurId: "fr1",
      fournisseurNom: "Transporteur X",
      type: "Transporteur",
      description: "",
      montantBudgete: 100,
      montantReel: 100,
      statut: "Payé",
      date: "2026-07-01",
    };
    const fournisseur: Fournisseur = {
      id: "fr1",
      nom: "Transporteur X",
      type: "Transporteur",
      contact: "",
      telephone: "",
      email: "",
      adresse: "",
      nbDossiers: 1,
      montantTotal: 100,
      statut: "Actif",
    };
    const archive: Archive = {
      id: "ar1",
      nom: "bl-scan.pdf",
      typeDocument: "Autre",
      taille: 100,
      type: "application/pdf",
      storagePath: "2026-07/ar1.pdf",
      dossierId: "d1",
      creePar: "Test",
      createdAt: "2026-07-01",
    };

    useStore.setState({
      dossiers: [baseDossier],
      clients: [baseClient],
      ecritures: [ecriture],
      fichiers: [fichier],
      subDossiers: [subDossier],
      factures: [facture],
      dossierFournisseurs: [dossierFournisseur],
      fournisseurs: [fournisseur],
      devis: [],
      archives: [archive],
      auditLogs: [],
      auditSeq: 1,
      bons: [],
    });
  }

  it("délie les écritures liées au lieu de les supprimer", async () => {
    seedState();
    await useStore.getState().removeDossier("d1");
    const ecriture = useStore.getState().ecritures.find((e) => e.id === "e1");
    expect(ecriture).toBeDefined();
    expect(ecriture?.dossierId).toBeUndefined();
  });

  it("retire les fichiers et sous-dossiers liés", async () => {
    seedState();
    await useStore.getState().removeDossier("d1");
    expect(useStore.getState().fichiers.find((f) => f.dossierId === "d1")).toBeUndefined();
    expect(useStore.getState().subDossiers.find((sd) => sd.dossierId === "d1")).toBeUndefined();
  });

  it("délie les factures et archives liées au lieu de les supprimer", async () => {
    seedState();
    await useStore.getState().removeDossier("d1");
    const facture = useStore.getState().factures.find((f) => f.id === "fa1");
    expect(facture).toBeDefined();
    expect(facture?.dossierId).toBeNull();

    const archive = useStore.getState().archives.find((a) => a.id === "ar1");
    expect(archive).toBeDefined();
    expect(archive?.dossierId).toBeUndefined();
  });

  it("journalise la suppression dans l'audit", async () => {
    seedState();
    await useStore.getState().removeDossier("d1");
    const auditInsert = calls.find((c) => c.table === "audit_logs" && c.op === "insert");
    expect(auditInsert).toBeDefined();
  });
});

describe("deleteArchive", () => {
  function seedArchive() {
    const archive: Archive = {
      id: "ar1",
      nom: "bl-scan.pdf",
      typeDocument: "Autre",
      taille: 100,
      type: "application/pdf",
      storagePath: "2026-07/ar1.pdf",
      creePar: "Test",
      createdAt: "2026-07-01",
    };
    useStore.setState({ archives: [archive], auditLogs: [], auditSeq: 1 });
  }

  it("supprime le fichier du storage puis la ligne en base et l'état local", async () => {
    seedArchive();
    await useStore.getState().deleteArchive("ar1");

    const storageCall = calls.find((c) => c.table === "storage:archives");
    expect(storageCall?.payload).toEqual(["2026-07/ar1.pdf"]);

    const dbDelete = calls.find((c) => c.table === "archives" && c.op === "delete");
    expect(dbDelete).toBeDefined();

    expect(useStore.getState().archives.find((a) => a.id === "ar1")).toBeUndefined();
  });

  it("supprime quand même la ligne en base si la suppression storage échoue", async () => {
    seedArchive();
    remoteState.storageRemoveError = { message: "object not found" };

    await useStore.getState().deleteArchive("ar1");

    const dbDelete = calls.find((c) => c.table === "archives" && c.op === "delete");
    expect(dbDelete).toBeDefined();
    expect(useStore.getState().archives.find((a) => a.id === "ar1")).toBeUndefined();
  });
});
