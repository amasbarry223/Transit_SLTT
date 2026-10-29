/**
 * Écritures automatiques du journal comptable.
 *
 * Le journal n'était alimenté que par la saisie manuelle et les imports : un
 * règlement de dossier, un encaissement de facture ou un paiement de dépense
 * n'y apparaissaient jamais. Ces helpers génèrent l'écriture correspondante,
 * dans la MÊME transaction que l'événement métier.
 *
 *  - Idempotent : `journal_liens` (origine_type, origine_id) est unique, rejouer
 *    la synchronisation d'un dossier met à jour au lieu de dupliquer.
 *  - Période clôturée : une écriture n'est jamais ajoutée dans le passé figé.
 *    Un événement daté dans une période clôturée est comptabilisé le lendemain
 *    de la dernière clôture (le motif garde la date d'origine) ; une écriture
 *    déjà présente dans une période clôturée n'est ni modifiée ni supprimée.
 *  - Tolérant : le journal est dérivé, un échec ici ne doit pas bloquer
 *    l'encaissement ou l'enregistrement du dossier (journalisé en warning ; la
 *    synchronisation d'un dossier est rejouée à chaque sauvegarde).
 *  - Date de bascule : seules les lignes de dossier créées APRÈS la première
 *    activation sont journalisées, l'historique existant n'est pas rétro-posté
 *    (cela fausserait les clôtures déjà faites).
 */
import { Logger } from '@nestjs/common';

const logger = new Logger('JournalPosting');

export const ORIGINE = {
  DOSSIER_PAIEMENT: 'DOSSIER_PAIEMENT',
  DOSSIER_DEPENSE: 'DOSSIER_DEPENSE',
  FACTURE_PAIEMENT: 'FACTURE_PAIEMENT',
  DEPENSE_PAYEE: 'DEPENSE_PAYEE',
  /** Écriture inverse annulant une écriture (origineId = id de l'écriture annulée). */
  CONTREPASSATION: 'CONTREPASSATION',
} as const;
export type OrigineType = (typeof ORIGINE)[keyof typeof ORIGINE];

/** Valeur de `source` d'une écriture automatique (la saisie manuelle reste « saisie »). */
export const SOURCE_AUTO: Record<OrigineType, string> = {
  DOSSIER_PAIEMENT: 'auto_dossier',
  DOSSIER_DEPENSE: 'auto_dossier',
  FACTURE_PAIEMENT: 'auto_facture',
  DEPENSE_PAYEE: 'auto_depense',
  CONTREPASSATION: 'contrepassation',
};

const BASCULE_CLE = 'comptabilite.journal_bascule';

const MODE_JOURNAL: Record<string, string> = {
  ESPECES: 'Espèces',
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
  ORANGE_MONEY: 'Mobile Money',
  WAVE: 'Mobile Money',
};

export const modePaiementJournal = (mode?: string | null) => MODE_JOURNAL[mode ?? ''] ?? 'Espèces';

const iso = (d: Date | string) => (typeof d === 'string' ? d : d.toISOString()).slice(0, 10);

export function lendemain(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Date de bascule : posée à la première utilisation, jamais modifiée ensuite. */
export async function getBascule(tx: any): Promise<Date> {
  const existing = await tx.setting.findUnique({ where: { cle: BASCULE_CLE } });
  if (existing) return new Date(existing.valeur);
  const now = new Date();
  await tx.setting.create({
    data: {
      cle: BASCULE_CLE,
      valeur: now.toISOString(),
      groupName: 'comptabilite',
      description: "Date à partir de laquelle les règlements/dépenses de dossier alimentent automatiquement le journal.",
    },
  });
  return now;
}

/** Dernier jour clôturé pour l'annexe (null si aucune clôture). */
export async function derniereClotureFin(tx: any, annexeId: string | null): Promise<string | null> {
  if (!annexeId) return null;
  const c = await tx.clotureCaisse.findFirst({
    where: { annexeId },
    orderBy: { periodeFin: 'desc' },
    select: { periodeFin: true },
  });
  return c ? String(c.periodeFin).slice(0, 10) : null;
}

export async function nextReference(tx: any): Promise<string> {
  const last = await tx.operationComptable.findFirst({
    where: { reference: { startsWith: 'OPC-' } },
    orderBy: { createdAt: 'desc' },
    select: { reference: true },
  });
  const lastNum = Number(String(last?.reference ?? '').replace(/^OPC-/, '')) || 0;
  for (let n = lastNum + 1; n < lastNum + 50; n++) {
    const candidate = `OPC-${n}`;
    if (!(await tx.operationComptable.findUnique({ where: { reference: candidate }, select: { id: true } }))) {
      return candidate;
    }
  }
  return `OPC-${Date.now()}`;
}

export interface EcritureAuto {
  origineType: OrigineType;
  origineId: string;
  annexeId: string | null;
  /** Date de l'événement (AAAA-MM-JJ ou Date). */
  date: Date | string;
  type: 'Entrée' | 'Sortie';
  montant: number;
  nature: string;
  clientId?: string | null;
  dossierId?: string | null;
  clientNom?: string | null;
  modePaiement?: string;
}

/** Crée ou met à jour l'écriture liée à un événement. */
export async function posterEcriture(tx: any, e: EcritureAuto): Promise<void> {
  try {
    if (!(e.montant > 0)) return;
    const lien = await tx.journalLien.findUnique({
      where: { origineType_origineId: { origineType: e.origineType, origineId: e.origineId } },
      include: { operation: true },
    });
    const fin = await derniereClotureFin(tx, e.annexeId);
    const dateEvt = iso(e.date);

    if (lien) {
      // Écriture déjà passée dans une période clôturée : figée.
      if (fin && String(lien.operation.date) <= fin) return;
      const date = fin && dateEvt <= fin ? lendemain(fin) : dateEvt;
      await tx.operationComptable.update({
        where: { id: lien.operationId },
        data: { date, montant: e.montant, nature: e.nature, type: e.type, modePaiement: e.modePaiement ?? 'Espèces' },
      });
      return;
    }

    const date = fin && dateEvt <= fin ? lendemain(fin) : dateEvt;
    const nature = date !== dateEvt ? `${e.nature} (du ${dateEvt})` : e.nature;
    const operation = await tx.operationComptable.create({
      data: {
        reference: await nextReference(tx),
        annexeId: e.annexeId,
        date,
        clientId: e.clientId ?? null,
        dossierId: e.dossierId ?? null,
        clientNom: e.clientNom ?? null,
        nature,
        type: e.type,
        montant: e.montant,
        modePaiement: e.modePaiement ?? 'Espèces',
        source: SOURCE_AUTO[e.origineType],
        creePar: 'Automatique',
      },
    });
    await tx.journalLien.create({
      data: { origineType: e.origineType, origineId: e.origineId, operationId: operation.id },
    });
  } catch (err) {
    logger.warn(`Écriture automatique ignorée (${e.origineType} ${e.origineId}) : ${(err as Error).message}`);
  }
}

/** Supprime l'écriture liée à un événement disparu (sauf période clôturée). */
export async function retirerEcriture(tx: any, origineType: OrigineType, origineId: string): Promise<void> {
  try {
    const lien = await tx.journalLien.findUnique({
      where: { origineType_origineId: { origineType, origineId } },
      include: { operation: true },
    });
    if (!lien) return;
    const fin = await derniereClotureFin(tx, lien.operation.annexeId);
    if (fin && String(lien.operation.date) <= fin) return;
    await tx.operationComptable.delete({ where: { id: lien.operationId } });
  } catch (err) {
    logger.warn(`Retrait d'écriture automatique ignoré (${origineType} ${origineId}) : ${(err as Error).message}`);
  }
}

/**
 * Aligne le journal sur les règlements et dépenses d'un dossier : crée les
 * écritures manquantes, met à jour celles dont la ligne a changé, retire celles
 * dont la ligne a été supprimée. Seules les lignes créées après la bascule sont
 * concernées.
 */
export async function synchroniserJournalDossier(tx: any, dossierId: string): Promise<void> {
  try {
    const bascule = await getBascule(tx);
    const dossier = await tx.dossier.findUnique({
      where: { id: dossierId },
      include: { client: { select: { id: true, nom: true } }, paiements: true, depensesDossier: true },
    });
    if (!dossier) return;
    const base = {
      annexeId: dossier.annexeId ?? null,
      clientId: dossier.client?.id ?? dossier.clientId ?? null,
      clientNom: dossier.client?.nom ?? null,
      dossierId,
    };
    const num = (v: unknown) => Math.round(Number(v)) || 0;

    const idsPaiements = new Set<string>();
    for (const p of dossier.paiements) {
      if (new Date(p.createdAt) < bascule) continue;
      idsPaiements.add(p.id);
      await posterEcriture(tx, {
        ...base,
        origineType: ORIGINE.DOSSIER_PAIEMENT,
        origineId: p.id,
        date: p.date,
        type: 'Entrée',
        montant: num(p.montant),
        nature: `Règlement dossier ${dossier.reference}`,
        modePaiement: modePaiementJournal(p.mode),
      });
    }
    const idsDepenses = new Set<string>();
    for (const d of dossier.depensesDossier) {
      if (new Date(d.createdAt) < bascule) continue;
      idsDepenses.add(d.id);
      await posterEcriture(tx, {
        ...base,
        origineType: ORIGINE.DOSSIER_DEPENSE,
        origineId: d.id,
        date: d.date,
        type: 'Sortie',
        montant: num(d.montant),
        nature: `${d.nature} — dossier ${dossier.reference}`,
      });
    }

    // Lignes supprimées depuis : on retire leur écriture.
    const liens = await tx.journalLien.findMany({
      where: {
        origineType: { in: [ORIGINE.DOSSIER_PAIEMENT, ORIGINE.DOSSIER_DEPENSE] },
        operation: { dossierId },
      },
      select: { origineType: true, origineId: true },
    });
    for (const l of liens) {
      const vivants = l.origineType === ORIGINE.DOSSIER_PAIEMENT ? idsPaiements : idsDepenses;
      if (!vivants.has(l.origineId)) await retirerEcriture(tx, l.origineType, l.origineId);
    }
  } catch (err) {
    logger.warn(`Synchronisation du journal ignorée (dossier ${dossierId}) : ${(err as Error).message}`);
  }
}
