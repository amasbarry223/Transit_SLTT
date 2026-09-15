import { BadRequestException } from '@nestjs/common';
import { DepensesService } from './depenses.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function createFakePrisma(fournisseur: Record<string, unknown> | null = null) {
  const prisma = {
    depense: {
      findUnique: vi.fn().mockResolvedValue(null), // numéro toujours libre
      create: vi.fn((args: any) => ({ id: 'dep-1', ...args.data })),
    },
    fournisseur: {
      findUnique: vi.fn().mockResolvedValue(fournisseur),
    },
  };
  return { prisma };
}

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    numero: 'DEP-0001',
    annexeId: 'annexe-ml',
    montant: 1000,
    ...overrides,
  };
}

describe('DepensesService.create', () => {
  it('rejette un montant nul ou négatif', async () => {
    const { prisma } = createFakePrisma();
    const service = new DepensesService(prisma as any);

    await expect(service.create(admin(), baseInput({ montant: 0 }))).rejects.toThrow(BadRequestException);
    await expect(service.create(admin(), baseInput({ montant: -500 }))).rejects.toThrow(BadRequestException);
  });

  it('rejette un fournisseur désactivé (soft-delete contourné sinon)', async () => {
    const { prisma } = createFakePrisma({ id: 'frn-1', actif: false });
    const service = new DepensesService(prisma as any);

    await expect(
      service.create(admin(), baseInput({ fournisseurId: 'frn-1' })),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejette un fournisseur inexistant', async () => {
    const { prisma } = createFakePrisma(null);
    const service = new DepensesService(prisma as any);

    await expect(
      service.create(admin(), baseInput({ fournisseurId: 'frn-inconnu' })),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepte un montant positif avec un fournisseur actif', async () => {
    const { prisma } = createFakePrisma({ id: 'frn-1', actif: true });
    const service = new DepensesService(prisma as any);

    const result = await service.create(admin(), baseInput({ fournisseurId: 'frn-1' }));
    expect(result).toMatchObject({ montant: 1000, statut: 'EN_ATTENTE' });
  });
});
