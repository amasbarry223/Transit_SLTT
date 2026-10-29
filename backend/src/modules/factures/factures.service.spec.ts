import { BadRequestException } from '@nestjs/common';
import { FacturesService } from './factures.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function baseFacture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'f1',
    numero: 'FAC-0001',
    annexeId: 'annexe-ml',
    clientId: 'client-1',
    montantHt: 1000,
    tauxTva: 18,
    montantTva: 180,
    montantTtc: 1180,
    montantPaye: 0,
    statut: 'BROUILLON',
    dateEmission: new Date('2026-01-01'),
    dateEcheance: null,
    notes: null,
    lignes: [{ id: 'l1', designation: 'Service X', quantite: 1, prixUnitaire: 1000, montantTotal: 1000 }],
    transactions: [],
    ...overrides,
  };
}

function createFakePrisma(facture: ReturnType<typeof baseFacture>) {
  const tx = {
    ligneFacture: { deleteMany: vi.fn() },
    facture: { update: vi.fn((args: any) => ({ ...facture, ...args.data })) },
  };
  const prisma = {
    facture: {
      findUnique: vi.fn().mockResolvedValue(facture),
      update: tx.facture.update,
    },
    ligneFacture: tx.ligneFacture,
    setting: { findUnique: vi.fn().mockResolvedValue(null) },
    $transaction: vi.fn(async (cb: (t: unknown) => unknown) => cb(tx)),
  };
  return { prisma, tx };
}

describe('FacturesService.update', () => {
  it("ne touche NI les montants NI les lignes existantes quand `lignes` est omis du payload (pas d'effacement silencieux)", async () => {
    const facture = baseFacture();
    const { prisma, tx } = createFakePrisma(facture);
    const service = new FacturesService(prisma as any);

    const result = await service.update('f1', admin(), { notes: 'Mise à jour des notes seulement' });

    expect(tx.ligneFacture.deleteMany).not.toHaveBeenCalled();
    const updateCall = tx.facture.update.mock.calls[0][0];
    expect(updateCall.data.montantHt).toBeUndefined();
    expect(updateCall.data.montantTva).toBeUndefined();
    expect(updateCall.data.montantTtc).toBeUndefined();
    expect(updateCall.data.lignes).toBeUndefined();
    expect(result.montantHt).toBe(1000); // valeur d'origine préservée par le mock spread
  });

  it('recalcule montants et lignes quand `lignes` est fourni', async () => {
    const facture = baseFacture();
    const { prisma, tx } = createFakePrisma(facture);
    const service = new FacturesService(prisma as any);

    await service.update('f1', admin(), {
      lignes: [{ designation: 'Nouvelle ligne', quantite: 2, prixUnitaire: 500 }],
      tauxTva: 18,
    });

    expect(tx.ligneFacture.deleteMany).toHaveBeenCalledWith({ where: { factureId: 'f1' } });
    const updateCall = tx.facture.update.mock.calls[0][0];
    expect(updateCall.data.montantHt).toBe(1000);
    expect(updateCall.data.montantTtc).toBe(1180);
  });

  it('rejette la modification d’une facture déjà encaissée, lignes ou pas', async () => {
    const facture = baseFacture({ montantPaye: 500, statut: 'PARTIELLEMENT_PAYEE' });
    const { prisma } = createFakePrisma(facture);
    const service = new FacturesService(prisma as any);

    await expect(service.update('f1', admin(), { notes: 'x' })).rejects.toThrow(BadRequestException);
  });

  it('rejette une ligne à quantité nulle ou négative (retombait silencieusement à 1 avant ce garde-fou)', async () => {
    const facture = baseFacture();
    const { prisma } = createFakePrisma(facture);
    const service = new FacturesService(prisma as any);

    await expect(
      service.update('f1', admin(), { lignes: [{ designation: 'X', quantite: 0, prixUnitaire: 500 }] }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update('f1', admin(), { lignes: [{ designation: 'X', quantite: -2, prixUnitaire: 500 }] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejette un prix unitaire négatif mais accepte un prix nul (ex. droit de douane à 0)', async () => {
    const facture = baseFacture();
    const { prisma, tx } = createFakePrisma(facture);
    const service = new FacturesService(prisma as any);

    await expect(
      service.update('f1', admin(), { lignes: [{ designation: 'X', quantite: 1, prixUnitaire: -500 }] }),
    ).rejects.toThrow(BadRequestException);

    await service.update('f1', admin(), { lignes: [{ designation: 'X', quantite: 1, prixUnitaire: 0 }] });
    expect(tx.facture.update.mock.calls[0][0].data.montantHt).toBe(0);
  });
});

describe('FacturesService.enregistrerPaiement — le dossier fait foi', () => {
  function setup(facture: ReturnType<typeof baseFacture>) {
    const tx: any = {
      facture: {
        update: vi.fn(async (args: any) =>
          args.data.montantPaye ? { ...facture, montantPaye: facture.montantPaye + args.data.montantPaye.increment } : { ...facture, ...args.data },
        ),
      },
      transactionCaisse: { create: vi.fn().mockResolvedValue({ id: 'tx-1' }) },
      caisse: { update: vi.fn().mockResolvedValue({}) },
      dossierPaiement: { create: vi.fn().mockResolvedValue({}) },
      // syncLignesEtTotaux relit le dossier pour recalculer ses totaux.
      dossier: {
        findUnique: vi.fn().mockResolvedValue({ id: 'd1', totalContrat: 1180, paiements: [{ montant: 500n, date: new Date() }], depensesDossier: [] }),
        update: vi.fn().mockResolvedValue({}),
      },
      journalLien: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn() },
      operationComptable: { findFirst: vi.fn().mockResolvedValue(null), findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: 'op' }) },
      clotureCaisse: { findFirst: vi.fn().mockResolvedValue(null) },
      setting: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn() },
    };
    const prisma = {
      facture: { findUnique: vi.fn().mockResolvedValue(facture) },
      caisse: { findUnique: vi.fn().mockResolvedValue({ id: 'c1', annexeId: 'annexe-ml', statut: 'OUVERTE' }) },
      $transaction: vi.fn(async (cb: (t: unknown) => unknown) => cb(tx)),
    };
    return { tx, service: new FacturesService(prisma as any) };
  }

  it("un encaissement sur une facture liée crée un règlement du dossier, sans écriture « facture » en doublon", async () => {
    const { tx, service } = setup(baseFacture({ statut: 'ENVOYEE', dossierId: 'd1', client: { nom: 'ACME' } }));

    await service.enregistrerPaiement('f1', admin(), { montant: 500, caisseId: 'c1' });

    expect(tx.dossierPaiement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ dossierId: 'd1', montant: 500n, reference: 'Facture FAC-0001' }),
    });
    expect(tx.dossier.update).toHaveBeenCalled(); // cache montantPaye recalculé
    const sources = tx.operationComptable.create.mock.calls.map((c: any) => c[0].data.source);
    expect(sources).not.toContain('auto_facture');
  });

  it("une facture libre (sans dossier) est journalisée comme encaissement de facture", async () => {
    const { tx, service } = setup(baseFacture({ statut: 'ENVOYEE', dossierId: null, client: { nom: 'ACME' } }));

    await service.enregistrerPaiement('f1', admin(), { montant: 500, caisseId: 'c1' });

    expect(tx.dossierPaiement.create).not.toHaveBeenCalled();
    expect(tx.operationComptable.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ source: 'auto_facture', type: 'Entrée', montant: 500 }),
    });
  });
});

describe('FacturesService — cohérence facture / dossier', () => {
  it("refuse de lier une facture au dossier d'un autre client", async () => {
    const prisma: any = {
      facture: { findUnique: vi.fn().mockResolvedValue(null) },
      dossier: { findUnique: vi.fn().mockResolvedValue({ clientId: 'autre-client', annexeId: 'annexe-ml' }) },
      setting: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    const service = new FacturesService(prisma);
    await expect(
      service.create(admin(), {
        numero: 'FAC-9',
        clientId: 'client-1',
        annexeId: 'annexe-ml',
        dossierId: 'd1',
        lignes: [{ designation: 'x', quantite: 1, prixUnitaire: 10 }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("une mise à jour sans dossierId garde le dossier lié (pas d'effacement silencieux)", async () => {
    const facture = baseFacture({ dossierId: 'd1', notes: 'garder' });
    const { prisma, tx } = createFakePrisma(facture);
    (prisma as any).dossier = { findUnique: vi.fn().mockResolvedValue({ clientId: 'client-1', annexeId: 'annexe-ml' }) };
    const service = new FacturesService(prisma as any);

    await service.update('f1', admin(), { dateEmission: '2026-01-02' });

    expect(tx.facture.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ dossierId: 'd1', notes: 'garder' }) }),
    );
  });

  it('refuse d’annuler une facture déjà encaissée', async () => {
    const { prisma } = createFakePrisma(baseFacture({ statut: 'PARTIELLEMENT_PAYEE', montantPaye: 100 }));
    const service = new FacturesService(prisma as any);
    await expect(service.updateStatut('f1', admin(), 'Annulée')).rejects.toThrow(BadRequestException);
  });
});
