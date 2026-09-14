import { BadRequestException } from '@nestjs/common';
import { StockService } from './stock.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function createFakePrisma(stockItem: { id: string; quantite: number }) {
  const tx = {
    mouvementStock: { create: vi.fn().mockResolvedValue({ id: 'mvt-1' }) },
    stockItem: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  const prisma = {
    $transaction: vi.fn(async (cb: (t: unknown) => unknown) => cb(tx)),
  };
  return { prisma, tx, stockItem };
}

describe('StockService.createItem / updateItem', () => {
  function createFakeItemPrisma(existing?: Record<string, unknown>) {
    const prisma = {
      stockItem: {
        create: vi.fn((args: any) => ({ id: 'new-item', ...args.data })),
        update: vi.fn((args: any) => ({ id: existing?.id, ...args.data })),
        findUnique: vi.fn().mockResolvedValue(existing),
      },
    };
    return { prisma };
  }

  it('rejette une quantité négative à la création mais accepte zéro', async () => {
    const { prisma } = createFakeItemPrisma();
    const service = new StockService(prisma as any);

    await expect(
      service.createItem(admin(), { annexeId: 'annexe-1', marchandise: 'Riz', quantite: -5 }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.createItem(admin(), { annexeId: 'annexe-1', marchandise: 'Riz', quantite: 0 }),
    ).resolves.toMatchObject({ quantite: 0 });
  });

  it("updateItem() n'accepte plus de forcer la quantité à une valeur négative", async () => {
    const existing = { id: 'stock-1', annexeId: 'annexe-1', quantite: 10 };
    const { prisma } = createFakeItemPrisma(existing);
    const service = new StockService(prisma as any);

    await expect(
      service.updateItem('stock-1', admin(), { quantite: -1 }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('StockService.createMouvement', () => {
  it("rejette une sortie qui ferait passer le stock sous zéro — le mouvement n'est PAS créé (transaction annulée)", async () => {
    const { prisma, tx } = createFakePrisma({ id: 'stock-1', quantite: -70 });
    // Après l'increment atomique (sortie de 100 sur un stock de 30), la
    // valeur réelle en base est négative.
    tx.stockItem.findUnique.mockResolvedValue({ id: 'stock-1', quantite: -70 });
    const service = new StockService(prisma as any);

    await expect(
      service.createMouvement(admin(), {
        annexeId: 'annexe-1',
        stockId: 'stock-1',
        type: 'Sortie',
        quantite: 100,
      }),
    ).rejects.toThrow(BadRequestException);

    // La quantité n'est plus silencieusement forcée à 0.
    expect(tx.stockItem.update).not.toHaveBeenCalled();
  });

  it('accepte une sortie qui laisse le stock à 0 ou plus', async () => {
    const { prisma, tx } = createFakePrisma({ id: 'stock-1', quantite: 0 });
    tx.stockItem.findUnique.mockResolvedValue({ id: 'stock-1', quantite: 0 });
    const service = new StockService(prisma as any);

    await expect(
      service.createMouvement(admin(), {
        annexeId: 'annexe-1',
        stockId: 'stock-1',
        type: 'Sortie',
        quantite: 30,
      }),
    ).resolves.toEqual({ id: 'mvt-1' });
  });

  it('rejette une quantité <= 0', async () => {
    const { prisma } = createFakePrisma({ id: 'stock-1', quantite: 10 });
    const service = new StockService(prisma as any);

    await expect(
      service.createMouvement(admin(), {
        annexeId: 'annexe-1',
        stockId: 'stock-1',
        type: 'Entrée',
        quantite: 0,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
