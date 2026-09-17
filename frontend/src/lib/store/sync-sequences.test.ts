import { describe, expect, it } from "vitest";
import { syncSequencesFromData } from "./sync-sequences";

type SyncSource = Parameters<typeof syncSequencesFromData>[0];

function baseState(overrides: Record<string, unknown> = {}): SyncSource {
  return {
    dossierSeq: 0,
    bonSeq: 0,
    auditSeq: 0,
    ecritureSeq: 0,
    clientSeq: 0,
    stockSeq: 0,
    userSeq: 0,
    mouvementSeq: 0,
    subDossierSeq: 0,
    fichierSeq: 0,
    devisSeq: 0,
    transporteurSeq: 0,
    factureSeq: 0,
    fournisseurSeq: 0,
    dossierFournisseurSeq: 0,
    contratSeq: 0,
    contratFichierSeq: 0,
    depenseSeq: 0,
    contratPrestationSeq: 0,
    bonSortieCaisseSeq: 0,
    operationComptableSeq: 0,
    recuPaiementSeq: 0,
    dossiers: [],
    factures: [],
    bons: [],
    devis: [],
    auditLogs: [],
    ecritures: [],
    clients: [],
    stock: [],
    users: [],
    mouvements: [],
    subDossiers: [],
    fichiers: [],
    transporteurs: [],
    fournisseurs: [],
    dossierFournisseurs: [],
    contrats: [],
    contratFichiers: [],
    depenses: [],
    contratPrestations: [],
    bonsSortieCaisse: [],
    operationsComptables: [],
    recusPaiement: [],
    ...overrides,
  } as unknown as SyncSource;
}

describe("syncSequencesFromData", () => {
  it("garde le compteur actuel quand aucune donnée n’a un numéro plus élevé", () => {
    const state = baseState({ dossierSeq: 5, dossiers: [{ reference: "TR-2026-0002" }] });
    expect(syncSequencesFromData(state).dossierSeq).toBe(5);
  });

  it("relève le compteur au-dessus du plus grand numéro trouvé dans les données (référence à suffixe)", () => {
    const state = baseState({
      dossierSeq: 1,
      dossiers: [{ reference: "TR-2026-0002" }, { reference: "TR-2026-0007" }],
    });
    expect(syncSequencesFromData(state).dossierSeq).toBe(8);
  });

  it("ignore les références sans suffixe numérique exploitable", () => {
    const state = baseState({ dossierSeq: 3, dossiers: [{ reference: "SANS-NUMERO" }, { reference: null }] });
    expect(syncSequencesFromData(state).dossierSeq).toBe(3);
  });

  it("parse le format N°{n} des bons de sortie de caisse (pas de préfixe année)", () => {
    const state = baseState({ bonSortieCaisseSeq: 1, bonsSortieCaisse: [{ reference: "N°12" }] });
    expect(syncSequencesFromData(state).bonSortieCaisseSeq).toBe(13);
  });

  it("parse le format OPC-{n} des opérations comptables", () => {
    const state = baseState({ operationComptableSeq: 1, operationsComptables: [{ reference: "OPC-45" }] });
    expect(syncSequencesFromData(state).operationComptableSeq).toBe(46);
  });

  it("parse le format RECU-{n} des reçus de paiement", () => {
    const state = baseState({ recuPaiementSeq: 1, recusPaiement: [{ reference: "RECU-9" }] });
    expect(syncSequencesFromData(state).recuPaiementSeq).toBe(10);
  });

  it("parse les ids préfixés (ex. \"U-3\" pour les utilisateurs)", () => {
    const state = baseState({ userSeq: 1, users: [{ id: "U-3" }, { id: "U-1" }] });
    expect(syncSequencesFromData(state).userSeq).toBe(4);
  });

  it("gère un jeu de données entièrement vide sans planter (retombe sur les compteurs actuels)", () => {
    const state = baseState({ dossierSeq: 7, factureSeq: 2 });
    const result = syncSequencesFromData(state);
    expect(result.dossierSeq).toBe(7);
    expect(result.factureSeq).toBe(2);
  });
});
