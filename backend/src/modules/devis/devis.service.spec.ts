import { BadRequestException } from '@nestjs/common';
import { DevisService } from './devis.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function createFakePrisma() {
  const created: Record<string, unknown>[] = [];
  const prisma = {
    devis: {
      findUnique: vi.fn().mockResolvedValue(null), // numéro toujours libre
      create: vi.fn((args: any) => {
        created.push(args.data);
        return { id: 'devis-1', ...args.data };
      }),
    },
  };
  return { prisma, created };
}

function devisRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'devis-1',
    annexeId: null,
    dossierId: null,
    statut: 'BROUILLON',
    lignes: [],
    ...overrides,
  };
}

function createFakePrismaForUpdate(devis: ReturnType<typeof devisRow>) {
  const tx = { ligneDevis: { deleteMany: vi.fn() }, devis: { update: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...devis, ...data })) } };
  return {
    devis: { findUnique: vi.fn().mockResolvedValue(devis) },
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb(tx)),
  };
}

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    numero: 'DEV-0001',
    clientId: 'client-1',
    lignes: [{ designation: 'Droit de douane', quantite: 1, prixUnitaire: 0 }],
    ...overrides,
  };
}

describe('DevisService.create', () => {
  it('rejette une ligne à quantité nulle ou négative', async () => {
    const { prisma } = createFakePrisma();
    const service = new DevisService(prisma as any, {} as any);

    await expect(
      service.create(admin(), baseInput({ lignes: [{ designation: 'X', quantite: 0, prixUnitaire: 500 }] })),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.create(admin(), baseInput({ lignes: [{ designation: 'X', quantite: -1, prixUnitaire: 500 }] })),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejette un prix unitaire négatif mais accepte un prix nul (droit de douane à 0)', async () => {
    const { prisma, created } = createFakePrisma();
    const service = new DevisService(prisma as any, {} as any);

    await expect(
      service.create(admin(), baseInput({ lignes: [{ designation: 'X', quantite: 1, prixUnitaire: -100 }] })),
    ).rejects.toThrow(BadRequestException);

    await service.create(admin(), baseInput());
    expect(created[0]).toMatchObject({ montantHt: 0, montantTva: 0, montantTtc: 0 });
  });
});

describe('DevisService.update — un devis ACCEPTE est terminal', () => {
  it('rejette toute modification (y compris les lignes) une fois le devis accepté', async () => {
    const prisma = createFakePrismaForUpdate(devisRow({ statut: 'ACCEPTE' }));
    const service = new DevisService(prisma as any, {} as any);

    await expect(
      service.update('devis-1', admin(), { notes: 'tentative de modif' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('autorise la modification tant que le devis est en Brouillon', async () => {
    const prisma = createFakePrismaForUpdate(devisRow({ statut: 'BROUILLON' }));
    const service = new DevisService(prisma as any, {} as any);

    await expect(
      service.update('devis-1', admin(), { notes: 'ajustement' }),
    ).resolves.toMatchObject({ notes: 'ajustement' });
  });
});
