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
