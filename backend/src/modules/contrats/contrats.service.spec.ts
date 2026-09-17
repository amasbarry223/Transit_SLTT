import { BadRequestException } from '@nestjs/common';
import { ContratsService } from './contrats.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function contratRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'contrat-1',
    annexeId: 'annexe-1',
    reference: 'CT-0001',
    statut: 'Actif',
    montant: 100000,
    ...overrides,
  };
}

function createFakePrisma(contrat: ReturnType<typeof contratRow>) {
  return {
    contrat: {
      findUnique: vi.fn().mockResolvedValue(contrat),
      update: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...contrat, ...data })),
    },
  };
}

describe('ContratsService.update — garde-fou de transition de statut', () => {
  it('rejette une transition de statut interdite (ex: Clôturé → Suspendu)', async () => {
    const prisma = createFakePrisma(contratRow({ statut: 'Clôturé' }));
    const service = new ContratsService(prisma as any);

    await expect(
      service.update('contrat-1', admin(), { statut: 'Suspendu' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepte une transition de statut autorisée par la matrice', async () => {
    const prisma = createFakePrisma(contratRow({ statut: 'Actif' }));
    const service = new ContratsService(prisma as any);

    await expect(
      service.update('contrat-1', admin(), { statut: 'Suspendu' }),
    ).resolves.toMatchObject({ statut: 'Suspendu' });
  });

  it("n'exige aucune transition valide quand le statut ne change pas", async () => {
    const prisma = createFakePrisma(contratRow({ statut: 'Actif' }));
    const service = new ContratsService(prisma as any);

    await expect(
      service.update('contrat-1', admin(), { statut: 'Actif', notes: 'mise à jour' }),
    ).resolves.toMatchObject({ statut: 'Actif' });
  });

  it("rejette un statut arbitraire non prévu par la matrice (ex. appel API direct)", async () => {
    const prisma = createFakePrisma(contratRow({ statut: 'Actif' }));
    const service = new ContratsService(prisma as any);

    await expect(
      service.update('contrat-1', admin(), { statut: 'InventeParUnClientMalveillant' }),
    ).rejects.toThrow(BadRequestException);
  });
});
