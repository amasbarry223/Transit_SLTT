import type { SLTTState } from "@/lib/store";

export type SequenceCounters = Pick<
  SLTTState,
  | "dossierSeq"
  | "bonSeq"
  | "auditSeq"
  | "ecritureSeq"
  | "clientSeq"
  | "stockSeq"
  | "userSeq"
  | "mouvementSeq"
  | "subDossierSeq"
  | "fichierSeq"
  | "devisSeq"
  | "transporteurSeq"
  | "factureSeq"
  | "fournisseurSeq"
  | "dossierFournisseurSeq"
  | "contratSeq"
  | "contratFichierSeq"
  | "depenseSeq"
  | "contratPrestationSeq"
  | "bonSortieCaisseSeq"
  | "operationComptableSeq"
  | "recuPaiementSeq"
>;

function parseTrailingSeq(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/-(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : null;
}

/** Parse la référence "N°{n}" des bons de sortie de caisse (pas de préfixe année). */
function parseNumeroSeq(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/N°(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

/** Parse la référence "OPC-{n}" des opérations de comptabilité générale. */
function parseOpcSeq(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/OPC-(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

/** Parse la référence "RECU-{n}" des reçus de paiement. */
function parseRecuSeq(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/RECU-(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function parseIdSeq(id: string | null | undefined, prefix: string): number | null {
  if (!id) return null;
  const match = id.match(new RegExp(`^${prefix}-(\\d+)$`));
  return match ? Number.parseInt(match[1], 10) : null;
}

function nextSeqFromValues(values: Array<number | null>, current: number): number {
  const max = values.filter((v): v is number => v !== null).reduce((acc, v) => Math.max(acc, v), 0);
  return Math.max(current, max + 1);
}

type SyncSource = Pick<
  SLTTState,
  | keyof SequenceCounters
  | "dossiers"
  | "factures"
  | "bons"
  | "devis"
  | "auditLogs"
  | "ecritures"
  | "clients"
  | "stock"
  | "users"
  | "mouvements"
  | "subDossiers"
  | "fichiers"
  | "transporteurs"
  | "fournisseurs"
  | "dossierFournisseurs"
  | "contrats"
  | "contratFichiers"
  | "depenses"
  | "contratPrestations"
  | "bonsSortieCaisse"
  | "operationsComptables"
  | "recusPaiement"
>;

export function syncSequencesFromData(state: SyncSource): SequenceCounters {
  return {
    dossierSeq: nextSeqFromValues(state.dossiers.map((d) => parseTrailingSeq(d.reference)), state.dossierSeq),
    bonSeq: nextSeqFromValues(state.bons.map((b) => parseTrailingSeq(b.reference)), state.bonSeq),
    auditSeq: nextSeqFromValues(state.auditLogs.map((a) => parseIdSeq(a.id, "A")), state.auditSeq),
    ecritureSeq: nextSeqFromValues(state.ecritures.map((e) => parseIdSeq(e.id, "E")), state.ecritureSeq),
    clientSeq: nextSeqFromValues(state.clients.map((c) => parseIdSeq(c.id, "C")), state.clientSeq),
    stockSeq: nextSeqFromValues(state.stock.map((s) => parseIdSeq(s.id, "S")), state.stockSeq),
    userSeq: nextSeqFromValues(state.users.map((u) => parseIdSeq(u.id, "U")), state.userSeq),
    mouvementSeq: nextSeqFromValues(state.mouvements.map((m) => parseIdSeq(m.id, "M")), state.mouvementSeq),
    subDossierSeq: nextSeqFromValues(state.subDossiers.map((sd) => parseIdSeq(sd.id, "SD")), state.subDossierSeq),
    fichierSeq: nextSeqFromValues(state.fichiers.map((f) => parseIdSeq(f.id, "F")), state.fichierSeq),
    devisSeq: nextSeqFromValues(state.devis.map((d) => parseTrailingSeq(d.reference)), state.devisSeq),
    transporteurSeq: nextSeqFromValues(state.transporteurs.map((t) => parseIdSeq(t.id, "T")), state.transporteurSeq),
    factureSeq: nextSeqFromValues(state.factures.map((f) => parseTrailingSeq(f.numero)), state.factureSeq),
    fournisseurSeq: nextSeqFromValues(state.fournisseurs.map((f) => parseIdSeq(f.id, "F")), state.fournisseurSeq),
    dossierFournisseurSeq: nextSeqFromValues(state.dossierFournisseurs.map((df) => parseIdSeq(df.id, "DF")), state.dossierFournisseurSeq),
    contratSeq: nextSeqFromValues(state.contrats.map((c) => parseTrailingSeq(c.reference)), state.contratSeq),
    contratFichierSeq: nextSeqFromValues(state.contratFichiers.map((f) => parseIdSeq(f.id, "CF")), state.contratFichierSeq),
    depenseSeq: nextSeqFromValues(state.depenses.map((d) => parseIdSeq(d.id, "DEP")), state.depenseSeq),
    contratPrestationSeq: nextSeqFromValues(state.contratPrestations.map((p) => parseIdSeq(p.id, "PRES")), state.contratPrestationSeq),
    bonSortieCaisseSeq: nextSeqFromValues(state.bonsSortieCaisse.map((b) => parseNumeroSeq(b.reference)), state.bonSortieCaisseSeq),
    operationComptableSeq: nextSeqFromValues(state.operationsComptables.map((o) => parseOpcSeq(o.reference)), state.operationComptableSeq),
    recuPaiementSeq: nextSeqFromValues(state.recusPaiement.map((r) => parseRecuSeq(r.reference)), state.recuPaiementSeq),
  };
}
