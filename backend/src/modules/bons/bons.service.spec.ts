import { BadRequestException } from '@nestjs/common';
import { BonsService } from './bons.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function baseBonCaisse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bon-1',
    annexeId: 'annexe-ml',
    date: '2026-01-01',
    montantTotal: 5000,
    lignes: [{ id: 'l1', beneficiaire: 'Fournisseur X', motif: 'Achat', montant: 5000, date: '2026-01-01' }],
    ...overrides,
  };
}

function createFakePrisma(bon: ReturnType<typeof baseBonCaisse>) {
  const tx = {
    ligneBonSortieCaisse: { deleteMany: vi.fn() },
    bonSortieCaisse: { update: vi.fn((args: any) => ({ ...bon, ...args.data })) },
  };
  const prisma = {
    bonSortieCaisse: {
      findUnique: vi.fn().mockResolvedValue(bon),
      update: tx.bonSortieCaisse.update,
    },
    ligneBonSortieCaisse: tx.ligneBonSortieCaisse,
    $transaction: vi.fn(async (cb: (t: unknown) => unknown) => cb(tx)),
  };
  return { prisma, tx };
}

describe('BonsService.updateBonCaisse', () => {
  it("ne touche NI montantTotal NI les lignes existantes quand `lignes` est omis du payload", async () => {
    const bon = baseBonCaisse();
    const { prisma, tx } = createFakePrisma(bon);
    const service = new BonsService(prisma as any);

    const result = await service.updateBonCaisse('bon-1', admin(), { date: '2026-02-01' });

    expect(tx.ligneBonSortieCaisse.deleteMany).not.toHaveBeenCalled();
    const updateCall = tx.bonSortieCaisse.update.mock.calls[0][0];
    expect(updateCall.data.montantTotal).toBeUndefined();
    expect(updateCall.data.lignes).toBeUndefined();
    expect(result.montantTotal).toBe(5000); // valeur d'origine préservée
  });

  it('recalcule montantTotal et remplace les lignes quand `lignes` est fourni', async () => {
    const bon = baseBonCaisse();
    const { prisma, tx } = createFakePrisma(bon);
    const service = new BonsService(prisma as any);

    await service.updateBonCaisse('bon-1', admin(), {
      lignes: [{ beneficiaire: 'Nouveau bénéficiaire', motif: 'Réparation', montant: 1200 }],
    });

    expect(tx.ligneBonSortieCaisse.deleteMany).toHaveBeenCalledWith({ where: { bonSortieCaisseId: 'bon-1' } });
    const updateCall = tx.bonSortieCaisse.update.mock.calls[0][0];
    expect(updateCall.data.montantTotal).toBe(1200);
  });

  it('rejette une ligne à montant négatif ou nul quand des lignes sont fournies', async () => {
    const bon = baseBonCaisse();
    const { prisma } = createFakePrisma(bon);
    const service = new BonsService(prisma as any);

    await expect(
      service.updateBonCaisse('bon-1', admin(), {
        lignes: [{ beneficiaire: 'X', motif: 'Y', montant: -100 }],
      }),
    ).rejects.toThrow();
  });
});

function baseBonSortie(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bon-2',
    annexeId: 'annexe-ml',
    statut: 'En attente',
    stockId: 'stock-1',
    quantite: 100,
    marchandise: 'Riz',
    unite: 'sac',
    reference: 'BS-0001',
    motif: 'Livraison client',
    ...overrides,
  };
}

function createFakeBonSortiePrisma(bon: ReturnType<typeof baseBonSortie>, stockAfterDecrement: number) {
  const tx = {
    bonSortie: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockResolvedValue({ ...bon, statut: 'Validé' }),
    },
    stockItem: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockResolvedValue({ id: bon.stockId, quantite: stockAfterDecrement }),
      update: vi.fn(),
    },
    mouvementStock: { create: vi.fn() },
  };
  const prisma = {
    bonSortie: { findUnique: vi.fn().mockResolvedValue(bon) },
    $transaction: vi.fn(async (cb: (t: unknown) => unknown) => cb(tx)),
  };
  return { prisma, tx };
}

function createFakeCreateBonPrisma(stockAnnexeId = 'annexe-ml') {
  const created: Record<string, unknown>[] = [];
  const prisma = {
    bonSortie: {
      create: vi.fn((args: any) => {
        created.push(args.data);
        return { id: 'new-bon', ...args.data };
      }),
    },
    stockItem: { findUnique: vi.fn().mockResolvedValue({ annexeId: stockAnnexeId }) },
  };
  return { prisma, created };
}

describe('BonsService.createBon', () => {
  it('rejette une quantité négative ou nulle (fabrication de stock via decrement négatif à la validation)', async () => {
    const { prisma } = createFakeCreateBonPrisma();
    const service = new BonsService(prisma as any);

    await expect(
      service.createBon(admin(), { ...baseBonSortie(), quantite: -1000, montant: 100 }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.createBon(admin(), { ...baseBonSortie(), quantite: 0, montant: 100 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejette un montant négatif mais accepte un montant nul (BonSortie.montant est purement informatif, @default(0))', async () => {
    const { prisma, created } = createFakeCreateBonPrisma();
    const service = new BonsService(prisma as any);

    await expect(
      service.createBon(admin(), { ...baseBonSortie(), quantite: 10, montant: -50 }),
    ).rejects.toThrow(BadRequestException);

    await service.createBon(admin(), { ...baseBonSortie(), quantite: 10, montant: 0 });
    expect(created[0]).toMatchObject({ quantite: 10, montant: 0 });
  });

  it("rejette un article de stock d'une autre annexe (décrément du stock hors périmètre à la validation)", async () => {
    const { prisma, created } = createFakeCreateBonPrisma('annexe-ci');
    const service = new BonsService(prisma as any);

    await expect(
      service.createBon(admin(), { ...baseBonSortie(), quantite: 10, montant: 0 }),
    ).rejects.toThrow(BadRequestException);
    expect(created).toHaveLength(0);
  });

  it('ne crée jamais un bon déjà "Validé" (validateBon le court-circuiterait sans décrémenter le stock)', async () => {
    const { prisma, created } = createFakeCreateBonPrisma();
    const service = new BonsService(prisma as any);

    await service.createBon(admin(), { ...baseBonSortie(), quantite: 10, statut: 'Validé' });
    expect(created[0].statut).toBe('En attente');
  });
});

describe('BonsService.updateBon', () => {
  function createFakeUpdateBonPrisma(updatedCount: number) {
    const bon = baseBonSortie();
    const prisma = {
      bonSortie: {
        findUnique: vi.fn().mockResolvedValue(bon),
        updateMany: vi.fn().mockResolvedValue({ count: updatedCount }),
      },
      stockItem: { findUnique: vi.fn().mockResolvedValue({ annexeId: bon.annexeId }) },
    };
    return { prisma };
  }

  it("rejette la modification si le bon a été validé entre la lecture et l'écriture", async () => {
    const { prisma } = createFakeUpdateBonPrisma(0);
    const service = new BonsService(prisma as any);

    await expect(service.updateBon('bon-2', admin(), { quantite: 5 })).rejects.toThrow(BadRequestException);
    expect(prisma.bonSortie.updateMany.mock.calls[0][0].where).toEqual({ id: 'bon-2', statut: { not: 'Validé' } });
  });

  it('enregistre un stockId vide comme null (pas de violation de clé étrangère)', async () => {
    const { prisma } = createFakeUpdateBonPrisma(1);
    const service = new BonsService(prisma as any);

    await service.updateBon('bon-2', admin(), { stockId: '' });
    expect(prisma.bonSortie.updateMany.mock.calls[0][0].data.stockId).toBeNull();
  });
});

describe('BonsService.validateBon', () => {
  it("rejette la validation d'un bon dont la quantité dépasse le stock disponible — pas de mouvement créé, le bon reste NON validé", async () => {
    const bon = baseBonSortie({ quantite: 100 });
    // Stock initial 30 - décrément de 100 (atomique) -> -70 en base.
    const { prisma, tx } = createFakeBonSortiePrisma(bon, -70);
    const service = new BonsService(prisma as any);

    await expect(service.validateBon('bon-2', admin())).rejects.toThrow(BadRequestException);

    expect(tx.mouvementStock.create).not.toHaveBeenCalled();
    // La quantité n'est plus silencieusement forcée à 0 non plus.
    expect(tx.stockItem.update).not.toHaveBeenCalled();
  });

  it('valide normalement un bon dont la quantité disponible suffit', async () => {
    const bon = baseBonSortie({ quantite: 30 });
    const { prisma, tx } = createFakeBonSortiePrisma(bon, 0);
    const service = new BonsService(prisma as any);

    await service.validateBon('bon-2', admin());

    expect(tx.mouvementStock.create).toHaveBeenCalledTimes(1);
  });
});
