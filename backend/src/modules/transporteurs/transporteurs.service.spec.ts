import { BadRequestException } from '@nestjs/common';
import { TransporteursService } from './transporteurs.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function createFakePrisma() {
  const prisma = {
    transporteur: {
      findUnique: vi.fn().mockResolvedValue({ id: 'trp-1', annexeId: null }),
      create: vi.fn((args: any) => ({ id: 'trp-1', ...args.data })),
      update: vi.fn((args: any) => ({ id: 'trp-1', ...args.data })),
    },
  };
  return { prisma };
}

function baseInput(overrides: Record<string, unknown> = {}) {
  return { nom: 'Transport X', telephone: '00000000', vehicule: 'Camion', immatriculation: 'AB-123', ...overrides };
}

describe('TransporteursService', () => {
  it('rejette une capacité négative à la création', async () => {
    const { prisma } = createFakePrisma();
    const service = new TransporteursService(prisma as any);

    await expect(service.create(admin(), baseInput({ capacite: -5 }))).rejects.toThrow(BadRequestException);
  });

  it('accepte une capacité à 0 par défaut', async () => {
    const { prisma } = createFakePrisma();
    const service = new TransporteursService(prisma as any);

    const result = await service.create(admin(), baseInput());
    expect(result).toMatchObject({ capacite: 0 });
  });

  it('rejette une capacité négative à la mise à jour', async () => {
    const { prisma } = createFakePrisma();
    const service = new TransporteursService(prisma as any);

    await expect(service.update('trp-1', admin(), { capacite: -1 })).rejects.toThrow(BadRequestException);
  });
});
