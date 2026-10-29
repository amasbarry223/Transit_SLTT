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

describe('ContratsService — prestations persistées', () => {
  function prismaAvec(prestation: any, nbPrestations = 0) {
    return {
      contrat: { findUnique: vi.fn().mockResolvedValue(contratRow()), delete: vi.fn() },
      contratPrestation: {
        count: vi.fn().mockResolvedValue(nbPrestations),
        findFirst: vi.fn().mockResolvedValue(prestation),
        create: vi.fn().mockImplementation(async ({ data }: any) => ({ id: 'p-new', ...data })),
        delete: vi.fn(),
      },
    } as any;
  }

  it("crée une prestation rattachée au contrat, signée par l'utilisateur", async () => {
    const prisma = prismaAvec(null);
    const res: any = await new ContratsService(prisma).addPrestation('contrat-1', admin(), { libelle: ' Dédouanement ', montant: 5000 });
    expect(res).toMatchObject({ contratId: 'contrat-1', libelle: 'Dédouanement', montant: 5000, statut: 'Prévue', creePar: 'Admin' });
  });

  it('refuse de supprimer une prestation déjà facturée', async () => {
    const prisma = prismaAvec({ id: 'p1', contratId: 'contrat-1', facturee: true });
    await expect(new ContratsService(prisma).removePrestation('contrat-1', 'p1', admin())).rejects.toThrow(BadRequestException);
    expect(prisma.contratPrestation.delete).not.toHaveBeenCalled();
  });

  it('refuse de supprimer un contrat qui a encore des prestations', async () => {
    const prisma = prismaAvec(null, 2);
    await expect(new ContratsService(prisma).delete('contrat-1', admin())).rejects.toThrow(BadRequestException);
    expect(prisma.contrat.delete).not.toHaveBeenCalled();
  });
});
