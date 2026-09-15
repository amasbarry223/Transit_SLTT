import { BadRequestException } from '@nestjs/common';
import { ContratsService } from './contrats.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function createFakePrisma() {
  const prisma = {
    contrat: {
      findUnique: vi.fn().mockResolvedValue(null), // référence toujours libre
      create: vi.fn((args: any) => ({ id: 'contrat-1', ...args.data })),
      update: vi.fn((args: any) => ({ id: 'contrat-1', ...args.data })),
    },
  };
  return { prisma };
}

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    reference: 'CT-0001',
    annexeId: 'annexe-ml',
    clientId: 'client-1',
    objet: 'Transit maritime',
    montant: 500000,
    ...overrides,
  };
}

describe('ContratsService.create', () => {
  it('rejette un montant négatif', async () => {
    const { prisma } = createFakePrisma();
    const service = new ContratsService(prisma as any);

    await expect(service.create(admin(), baseInput({ montant: -100 }))).rejects.toThrow(BadRequestException);
  });

  it('accepte un montant à 0 (contrat sans valeur chiffrée)', async () => {
    const { prisma } = createFakePrisma();
    const service = new ContratsService(prisma as any);

    const result = await service.create(admin(), baseInput({ montant: 0 }));
    expect(result).toMatchObject({ montant: 0 });
  });
});

describe('ContratsService.update', () => {
  it('rejette un montant négatif', async () => {
    const { prisma } = createFakePrisma();
    prisma.contrat.findUnique = vi.fn().mockResolvedValue({ id: 'contrat-1', annexeId: 'annexe-ml' });
    const service = new ContratsService(prisma as any);

    await expect(service.update('contrat-1', admin(), { montant: -1 })).rejects.toThrow(BadRequestException);
  });
});
