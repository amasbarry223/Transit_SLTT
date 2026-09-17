import { BackupService } from './backup.service';

function makeDeleteMany(callOrder: string[], table: string) {
  return vi.fn().mockImplementation(() => {
    callOrder.push(table);
    return Promise.resolve({ count: 1 });
  });
}

function createFakePrismaForWipe() {
  const callOrder: string[] = [];
  const tx = {
    transactionCaisse: { deleteMany: makeDeleteMany(callOrder, 'transactions_caisse') },
    ligneFacture: { deleteMany: makeDeleteMany(callOrder, 'lignes_facture') },
    facture: { deleteMany: makeDeleteMany(callOrder, 'factures') },
    ligneDevis: { deleteMany: makeDeleteMany(callOrder, 'lignes_devis') },
    devis: { deleteMany: makeDeleteMany(callOrder, 'devis') },
    ligneCotation: { deleteMany: makeDeleteMany(callOrder, 'lignes_cotation') },
    cotation: { deleteMany: makeDeleteMany(callOrder, 'cotations') },
    ligneBonSortieCaisse: { deleteMany: makeDeleteMany(callOrder, 'lignes_bon_sortie_caisse') },
    bonSortieCaisse: { deleteMany: makeDeleteMany(callOrder, 'bons_sortie_caisse') },
    bonSortie: { deleteMany: makeDeleteMany(callOrder, 'bons_sortie') },
    mouvementStock: { deleteMany: makeDeleteMany(callOrder, 'mouvements_stock') },
    stockItem: { deleteMany: makeDeleteMany(callOrder, 'stock_items') },
    contrat: { deleteMany: makeDeleteMany(callOrder, 'contrats') },
    caisse: { deleteMany: makeDeleteMany(callOrder, 'caisses') },
    depense: { deleteMany: makeDeleteMany(callOrder, 'depenses') },
    document: { deleteMany: makeDeleteMany(callOrder, 'documents') },
    etapeDossier: { deleteMany: makeDeleteMany(callOrder, 'etapes_dossier') },
    conteneur: { deleteMany: makeDeleteMany(callOrder, 'conteneurs') },
    trackingPublic: { deleteMany: makeDeleteMany(callOrder, 'tracking_public') },
    dossier: { deleteMany: makeDeleteMany(callOrder, 'dossiers') },
    recuPaiement: { deleteMany: makeDeleteMany(callOrder, 'recus_paiement') },
    operationComptable: { deleteMany: makeDeleteMany(callOrder, 'operations_comptables') },
    clotureCaisse: { deleteMany: makeDeleteMany(callOrder, 'clotures_caisse') },
    fournisseur: { deleteMany: makeDeleteMany(callOrder, 'fournisseurs') },
    client: { deleteMany: makeDeleteMany(callOrder, 'clients') },
  };
  const prisma = { $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb(tx)) };
  return { prisma, callOrder };
}

describe('BackupService.wipeData — ordre de suppression contraint par les FK', () => {
  it('supprime transactions_caisse avant factures ET avant depenses (FK TransactionCaisse -> Facture/Depense)', async () => {
    const { prisma, callOrder } = createFakePrismaForWipe();
    const service = new BackupService(prisma as any);

    await service.wipeData();

    expect(callOrder.indexOf('transactions_caisse')).toBeLessThan(callOrder.indexOf('factures'));
    expect(callOrder.indexOf('transactions_caisse')).toBeLessThan(callOrder.indexOf('depenses'));
  });

  it('supprime lignes_facture avant factures (enfant avant parent)', async () => {
    const { prisma, callOrder } = createFakePrismaForWipe();
    const service = new BackupService(prisma as any);

    await service.wipeData();

    expect(callOrder.indexOf('lignes_facture')).toBeLessThan(callOrder.indexOf('factures'));
  });

  it('supprime mouvements_stock et bons_sortie avant stock_items (référencent stock_items)', async () => {
    const { prisma, callOrder } = createFakePrismaForWipe();
    const service = new BackupService(prisma as any);

    await service.wipeData();

    expect(callOrder.indexOf('mouvements_stock')).toBeLessThan(callOrder.indexOf('stock_items'));
    expect(callOrder.indexOf('bons_sortie')).toBeLessThan(callOrder.indexOf('stock_items'));
  });

  it('renvoie un compte par table pour les 25 tables métier', async () => {
    const { prisma } = createFakePrismaForWipe();
    const service = new BackupService(prisma as any);

    const report = await service.wipeData();

    expect(Object.keys(report)).toHaveLength(25);
    expect(report['clients']).toBe(1);
  });
});

describe('BackupService.restoreData', () => {
  function createFakePrismaForRestore() {
    const created: Record<string, unknown[]> = {};
    const models = [
      'client', 'fournisseur', 'dossier', 'conteneur', 'etapeDossier', 'trackingPublic',
      'devis', 'ligneDevis', 'cotation', 'ligneCotation', 'facture', 'ligneFacture',
      'caisse', 'depense', 'transactionCaisse', 'document', 'stockItem', 'mouvementStock',
      'bonSortie', 'bonSortieCaisse', 'ligneBonSortieCaisse', 'contrat', 'recuPaiement',
      'operationComptable', 'clotureCaisse',
    ];
    const prisma: Record<string, unknown> = {};
    for (const model of models) {
      prisma[model] = {
        createMany: vi.fn().mockImplementation(({ data }: { data: unknown[] }) => {
          created[model] = data;
          return Promise.resolve({ count: data.length });
        }),
      };
    }
    return { prisma, created };
  }

  it('détecte les tables absentes du payload sans faire planter la restauration', async () => {
    const { prisma } = createFakePrismaForRestore();
    const service = new BackupService(prisma as any);

    const result = await service.restoreData({ clients: [{ id: '1' }] });

    expect(result.missingTables).toContain('factures');
    expect(result.missingTables).toContain('dossiers');
    expect(result.restored['clients']).toBe(1);
  });

  it('ignore une table présente mais vide (ne l’insère pas, ne plante pas)', async () => {
    const { prisma } = createFakePrismaForRestore();
    const service = new BackupService(prisma as any);

    const result = await service.restoreData({ clients: [] });

    expect(result.restored['clients']).toBeUndefined();
    expect(result.missingTables).not.toContain('clients');
  });

  it('restaure toutes les tables fournies avec des données', async () => {
    const { prisma } = createFakePrismaForRestore();
    const service = new BackupService(prisma as any);

    const result = await service.restoreData({
      clients: [{ id: 'c1' }],
      dossiers: [{ id: 'd1' }, { id: 'd2' }],
    });

    expect(result.restored['clients']).toBe(1);
    expect(result.restored['dossiers']).toBe(2);
  });
});
