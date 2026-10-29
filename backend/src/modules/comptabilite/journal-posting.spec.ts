import { ORIGINE, posterEcriture, retirerEcriture, synchroniserJournalDossier } from './journal-posting';

/** tx minimal en mémoire : suffit pour vérifier idempotence, clôture et bascule. */
function fakeTx(opts: { cloturePeriodeFin?: string; bascule?: string; dossier?: any } = {}) {
  const operations: any[] = [];
  const liens: any[] = [];
  let seq = 0;
  const key = (t: string, i: string) => `${t}:${i}`;
  const tx: any = {
    operations,
    liens,
    setting: {
      findUnique: async () => (opts.bascule ? { valeur: opts.bascule } : null),
      create: async () => ({}),
    },
    clotureCaisse: {
      findFirst: async () => (opts.cloturePeriodeFin ? { periodeFin: opts.cloturePeriodeFin } : null),
    },
    operationComptable: {
      findFirst: async () => (operations.length ? { reference: operations[operations.length - 1].reference } : null),
      findUnique: async ({ where }: any) => operations.find((o) => o.reference === where.reference) ?? null,
      create: async ({ data }: any) => {
        const op = { id: `op-${++seq}`, ...data };
        operations.push(op);
        return op;
      },
      update: async ({ where, data }: any) => Object.assign(operations.find((o) => o.id === where.id), data),
      delete: async ({ where }: any) => {
        operations.splice(operations.findIndex((o) => o.id === where.id), 1);
        const i = liens.findIndex((l) => l.operationId === where.id);
        if (i >= 0) liens.splice(i, 1);
      },
    },
    journalLien: {
      findUnique: async ({ where }: any) => {
        const { origineType, origineId } = where.origineType_origineId;
        const l = liens.find((x) => key(x.origineType, x.origineId) === key(origineType, origineId));
        return l ? { ...l, operation: operations.find((o) => o.id === l.operationId) } : null;
      },
      create: async ({ data }: any) => {
        liens.push(data);
        return data;
      },
      findMany: async () => liens.map((l) => ({ ...l })),
    },
    dossier: { findUnique: async () => opts.dossier ?? null },
  };
  return tx;
}

const base = {
  origineType: ORIGINE.DOSSIER_PAIEMENT,
  origineId: 'p1',
  annexeId: 'a1',
  date: '2026-03-10',
  type: 'Entrée' as const,
  montant: 500,
  nature: 'Règlement dossier D-1',
};

describe('posterEcriture', () => {
  it('crée une écriture automatique puis la met à jour au lieu de la dupliquer (idempotent)', async () => {
    const tx = fakeTx();
    await posterEcriture(tx, base);
    await posterEcriture(tx, { ...base, montant: 700 });

    expect(tx.operations).toHaveLength(1);
    expect(tx.operations[0]).toMatchObject({ montant: 700, source: 'auto_dossier', type: 'Entrée', creePar: 'Automatique' });
  });

  it("comptabilise le lendemain de la dernière clôture un événement daté dans une période clôturée", async () => {
    const tx = fakeTx({ cloturePeriodeFin: '2026-03-31' });
    await posterEcriture(tx, base);

    expect(tx.operations[0].date).toBe('2026-04-01');
    expect(tx.operations[0].nature).toContain('(du 2026-03-10)');
  });

  it("ne modifie pas une écriture déjà située dans une période clôturée", async () => {
    const tx = fakeTx();
    await posterEcriture(tx, base); // 2026-03-10
    tx.clotureCaisse.findFirst = async () => ({ periodeFin: '2026-03-31' });
    await posterEcriture(tx, { ...base, montant: 999 });

    expect(tx.operations[0].montant).toBe(500);
  });

  it("n'écrit rien pour un montant nul", async () => {
    const tx = fakeTx();
    await posterEcriture(tx, { ...base, montant: 0 });
    expect(tx.operations).toHaveLength(0);
  });
});

describe('retirerEcriture', () => {
  it("retire l'écriture d'un événement supprimé, sauf en période clôturée", async () => {
    const tx = fakeTx();
    await posterEcriture(tx, base);
    tx.clotureCaisse.findFirst = async () => ({ periodeFin: '2026-03-31' });
    await retirerEcriture(tx, ORIGINE.DOSSIER_PAIEMENT, 'p1');
    expect(tx.operations).toHaveLength(1);

    tx.clotureCaisse.findFirst = async () => null;
    await retirerEcriture(tx, ORIGINE.DOSSIER_PAIEMENT, 'p1');
    expect(tx.operations).toHaveLength(0);
  });
});

describe('synchroniserJournalDossier', () => {
  const dossier = (over: any = {}) => ({
    id: 'd1',
    reference: 'D-1',
    annexeId: 'a1',
    clientId: 'c1',
    client: { id: 'c1', nom: 'ACME' },
    paiements: [
      { id: 'p-old', date: new Date('2026-01-05'), montant: 100n, mode: 'ESPECES', createdAt: new Date('2026-01-05') },
      { id: 'p-new', date: new Date('2026-03-05'), montant: 300n, mode: 'WAVE', createdAt: new Date('2026-03-05') },
    ],
    depensesDossier: [
      { id: 'x-new', date: new Date('2026-03-06'), nature: 'Douane', montant: 200n, createdAt: new Date('2026-03-06') },
    ],
    ...over,
  });

  it("ne journalise que les lignes créées après la date de bascule, avec le bon sens et le bon mode", async () => {
    const tx = fakeTx({ bascule: '2026-02-01T00:00:00.000Z', dossier: dossier() });
    await synchroniserJournalDossier(tx, 'd1');

    expect(tx.operations).toHaveLength(2);
    const entree = tx.operations.find((o: any) => o.type === 'Entrée');
    const sortie = tx.operations.find((o: any) => o.type === 'Sortie');
    expect(entree).toMatchObject({ montant: 300, modePaiement: 'Mobile Money', dossierId: 'd1', clientId: 'c1' });
    expect(sortie).toMatchObject({ montant: 200, nature: 'Douane — dossier D-1' });
  });

  it("est idempotent et retire l'écriture d'un règlement supprimé", async () => {
    const tx = fakeTx({ bascule: '2026-02-01T00:00:00.000Z', dossier: dossier() });
    await synchroniserJournalDossier(tx, 'd1');
    await synchroniserJournalDossier(tx, 'd1');
    expect(tx.operations).toHaveLength(2);

    // le règlement p-new est supprimé : son écriture doit disparaître
    tx.dossier.findUnique = async () => dossier({ paiements: [dossier().paiements[0]] });
    await synchroniserJournalDossier(tx, 'd1');
    expect(tx.operations.map((o: any) => o.type)).toEqual(['Sortie']);
  });
});
