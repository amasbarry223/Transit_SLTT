import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ComptabiliteService } from './comptabilite.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function p2002() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    annexeId: 'annexe-ml',
    periodeDebut: '2026-01-01',
    periodeFin: '2026-01-31',
    soldeTheorique: 1000,
    soldeConstate: 1000,
    ...overrides,
  };
}

describe('ComptabiliteService.createCloture', () => {
  it("rejette en ConflictException métier une collision P2002 sur la contrainte unique (deux clôtures concurrentes sur la même période)", async () => {
    const prisma = {
      clotureCaisse: {
        findFirst: vi.fn().mockResolvedValue(null), // passe le pré-contrôle applicatif...
        create: vi.fn().mockRejectedValue(p2002()), // ...mais perd la course contre une autre requête
      },
    };
    const service = new ComptabiliteService(prisma as any);

    await expect(service.createCloture(admin(), baseInput())).rejects.toThrow(ConflictException);
  });

  it('rejette normalement (sans toucher à P2002) quand le pré-contrôle applicatif détecte déjà le doublon', async () => {
    const prisma = {
      clotureCaisse: {
        findFirst: vi.fn().mockResolvedValue({ id: 'existing' }),
        create: vi.fn(),
      },
    };
    const service = new ComptabiliteService(prisma as any);

    await expect(service.createCloture(admin(), baseInput())).rejects.toThrow(ConflictException);
    expect(prisma.clotureCaisse.create).not.toHaveBeenCalled();
  });

  it('crée normalement quand aucune collision', async () => {
    const prisma = {
      clotureCaisse: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'new-cloture' }),
      },
    };
    const service = new ComptabiliteService(prisma as any);

    await expect(service.createCloture(admin(), baseInput())).resolves.toMatchObject({ id: 'new-cloture' });
  });
});
