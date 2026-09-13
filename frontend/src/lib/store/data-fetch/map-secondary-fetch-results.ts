import { syncClientStats } from "@/lib/client-stats";
import { syncFournisseurStats } from "@/lib/fournisseur-stats";
import { syncContratStats } from "@/lib/contrat-stats";
import { mapAuditLogFromDb } from "@/lib/audit";
import type { SLTTState } from "@/lib/store";
import { syncSequencesFromData } from "@/lib/store/sync-sequences";
import { mapArchiveFromDb } from "@/lib/store/archives-slice";
import { mapBonFromDb, mapBonSortieCaisseFromDb } from "@/lib/store/bons-slice";
import {
  mapClotureCaisseFromDb,
  mapOperationComptableFromDb,
} from "@/lib/store/comptabilite-generale-slice";
import { mapContratFichierFromDb } from "@/lib/store/contrat-fichiers-slice";
import {
  mapContratFromDb,
  mapContratPrestationFromDb,
  mapDepenseFromDb,
} from "@/lib/store/contrats-slice";
import { mapDevisFromDb } from "@/lib/store/devis-slice";
import {
  mapDocumentFromDb,
  mapDocumentVersionFromDb,
  mapOcrFieldFromDb,
  mapOcrJobFromDb,
} from "@/lib/store/documents";
import { mapSubDossierFromDb, mapFichierFromDb } from "@/lib/store/fichiers-slice";
import {
  mapDossierFournisseurFromDb,
  mapFournisseurFromDb,
} from "@/lib/store/fournisseurs-slice";
import { mapRecuPaiementFromDb } from "@/lib/store/recus-paiement-slice";
import { mapStockItemFromDb, mapMouvementFromDb } from "@/lib/store/stock-slice";
import { mapTransporteurFromDb } from "@/lib/store/transporteurs-slice";
import type { SecondaryFetchKey, SecondaryFetchResult } from "./fetch-secondary-entities";

type SecondaryResultMap = Record<
  SecondaryFetchKey,
  { key: string; data: unknown[] | null; error: unknown }
>;

export function mapSecondaryFetchResults(
  secondaryResults: SecondaryFetchResult[],
  state: SLTTState,
): Partial<SLTTState> {
  const byKey = Object.fromEntries(
    secondaryResults.map((result) => [result.key, result]),
  ) as unknown as SecondaryResultMap;

  const mapDbRows = <T,>(rows: unknown[], mapper: (row: never) => T): T[] =>
    rows.map((row) => mapper(row as never));

  const pick = <T,>(
    key: SecondaryFetchKey,
    mapRows: (rows: unknown[]) => T,
    fallback: T,
  ): T => {
    const result = byKey[key];
    if (result?.error || result?.data == null) return fallback;
    return mapRows(result.data);
  };

  const mappedFournisseurs = pick(
    "fournisseurs",
    (rows) => mapDbRows(rows, mapFournisseurFromDb),
    state.fournisseurs,
  );
  const mappedDossierFournisseurs = pick(
    "dossierFournisseurs",
    (rows) => mapDbRows(rows, mapDossierFournisseurFromDb),
    state.dossierFournisseurs,
  );
  const mappedDepenses = pick("depenses", (rows) => mapDbRows(rows, mapDepenseFromDb), state.depenses);
  const mappedPrestations = pick(
    "contratPrestations",
    (rows) => mapDbRows(rows, mapContratPrestationFromDb),
    state.contratPrestations,
  );
  const mappedContratsRaw = pick("contrats", (rows) => mapDbRows(rows, mapContratFromDb), state.contrats);

  const ocrFieldsRows = pick("ocrFields", (rows) => rows, null as unknown[] | null);
  const ocrJobsRows = pick("ocrJobs", (rows) => rows, null as unknown[] | null);

  let nextOcrJobs = state.ocrJobs;
  if (ocrJobsRows && ocrFieldsRows) {
    const fieldsByJob = new Map<string, ReturnType<typeof mapOcrFieldFromDb>[]>();
    for (const raw of ocrFieldsRows) {
      const field = mapOcrFieldFromDb(raw as never);
      const list = fieldsByJob.get(field.ocrJobId) || [];
      list.push(field);
      fieldsByJob.set(field.ocrJobId, list);
    }
    nextOcrJobs = ocrJobsRows.map((jobRow) =>
      mapOcrJobFromDb(jobRow as never, fieldsByJob.get((jobRow as { id: string }).id) || []),
    );
  }

  const nextState = {
    ...state,
    stock: pick("stock", (rows) => mapDbRows(rows, mapStockItemFromDb), state.stock),
    mouvements: pick("mouvements", (rows) => mapDbRows(rows, mapMouvementFromDb), state.mouvements),
    bons: pick("bons", (rows) => mapDbRows(rows, mapBonFromDb), state.bons),
    subDossiers: pick("subDossiers", (rows) => mapDbRows(rows, mapSubDossierFromDb), state.subDossiers),
    fichiers: pick("fichiers", (rows) => mapDbRows(rows, mapFichierFromDb), state.fichiers),
    devis: pick("devis", (rows) => mapDbRows(rows, mapDevisFromDb), state.devis),
    transporteurs: pick("transporteurs", (rows) => mapDbRows(rows, mapTransporteurFromDb), state.transporteurs),
    fournisseurs: byKey.fournisseurs?.error
      ? state.fournisseurs
      : syncFournisseurStats(mappedDossierFournisseurs, mappedFournisseurs),
    dossierFournisseurs: mappedDossierFournisseurs,
    contrats: byKey.contrats?.error
      ? state.contrats
      : syncContratStats(mappedDepenses, mappedPrestations, mappedContratsRaw),
    contratFichiers: pick(
      "contratFichiers",
      (rows) => mapDbRows(rows, mapContratFichierFromDb),
      state.contratFichiers,
    ),
    depenses: mappedDepenses,
    contratPrestations: mappedPrestations,
    bonsSortieCaisse: pick(
      "bonsSortieCaisse",
      (rows) => mapDbRows(rows, mapBonSortieCaisseFromDb),
      state.bonsSortieCaisse,
    ),
    operationsComptables: pick(
      "operationsComptables",
      (rows) => mapDbRows(rows, mapOperationComptableFromDb),
      state.operationsComptables,
    ),
    cloturesCaisse: pick(
      "cloturesCaisse",
      (rows) => mapDbRows(rows, mapClotureCaisseFromDb),
      state.cloturesCaisse,
    ),
    recusPaiement: pick(
      "recusPaiement",
      (rows) => mapDbRows(rows, mapRecuPaiementFromDb),
      state.recusPaiement,
    ),
    auditLogs: pick("auditLogs", (rows) => mapDbRows(rows, mapAuditLogFromDb), state.auditLogs),
    archives: pick("archives", (rows) => mapDbRows(rows, mapArchiveFromDb), state.archives),
    documents: pick("documents", (rows) => mapDbRows(rows, mapDocumentFromDb), state.documents),
    documentVersions: pick(
      "documentVersions",
      (rows) => mapDbRows(rows, mapDocumentVersionFromDb),
      state.documentVersions,
    ),
    ocrJobs: nextOcrJobs,
    clients: syncClientStats(state.dossiers, state.factures, state.ecritures, state.clients),
    lastSyncedAt: Date.now(),
  };

  return {
    ...nextState,
    ...syncSequencesFromData(nextState),
  };
}
