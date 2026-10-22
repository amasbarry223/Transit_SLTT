import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { BonsLivraisonService } from './bons-livraison.service';
import type { CurrentUserType } from '../../auth/auth.types';

function user(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'u1', email: 'a@x.com', nom: 'Agent', role: 'TRANSITAIRE', permissions: [], annexeIds: ['annexe-ml'], ...overrides };
}

function bonSortie(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bs-1',
    reference: 'BS-2026-0001',
    statut: 'Validé',
    annexeId: 'annexe-ml',
    clientId: 'client-1',
    clientNom: 'Société Diarra',
    marchandise: 'Riz',
    quantite: 100,
    unite: 'sac',
    client: { nom: 'Société Diarra', adresse: 'ACI 2000', ville: 'Bamako' },
    bonLivraison: null,
    ...overrides,
  };
}

function createPrisma(bs: ReturnType<typeof bonSortie> | null) {
  const created: any[] = [];
  const prisma = {
    bonSortie: { findUnique: vi.fn().mockResolvedValue(bs) },
    transporteur: { findUnique: vi.fn() },
    bonLivraison: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn((args: any) => {
        created.push(args.data);
        return { id: 'bl-1', ...args.data };
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  return { prisma, created };
}

describe('BonsLivraisonService.create', () => {
  it('reprend client, annexe et marchandise du bon de sortie et génère LIV-AAAA-0001', async () => {
    const { prisma, created } = createPrisma(bonSortie());
    const service = new BonsLivraisonService(prisma as any);

    await service.create(user(), { bonSortieId: 'bs-1', chauffeurNom: ' Moussa ' });

    expect(created[0]).toMatchObject({
      reference: `LIV-${new Date().getFullYear()}-0001`,
      clientId: 'client-1',
      clientNom: 'Société Diarra',
      annexeId: 'annexe-ml',
      lignes: [{ marchandise: 'Riz', quantite: 100, unite: 'sac' }],
      chauffeurNom: 'Moussa',
      adresseLivraison: 'ACI 2000, Bamako',
      statut: 'En cours',
      creePar: 'Agent',
    });
  });

  it("refuse un bon de sortie non validé", async () => {
    const { prisma } = createPrisma(bonSortie({ statut: 'Brouillon' }));
    const service = new BonsLivraisonService(prisma as any);

    await expect(service.create(user(), { bonSortieId: 'bs-1' })).rejects.toThrow(BadRequestException);
  });

  it('refuse un second bon de livraison pour le même bon de sortie (409)', async () => {
    const { prisma } = createPrisma(bonSortie({ bonLivraison: { reference: 'LIV-2026-0001' } }));
    const service = new BonsLivraisonService(prisma as any);

    await expect(service.create(user(), { bonSortieId: 'bs-1' })).rejects.toThrow(ConflictException);
  });

  it("refuse un bon de sortie hors du périmètre d'annexe", async () => {
    const { prisma } = createPrisma(bonSortie({ annexeId: 'annexe-ci' }));
    const service = new BonsLivraisonService(prisma as any);

    await expect(service.create(user(), { bonSortieId: 'bs-1' })).rejects.toThrow(ForbiddenException);
  });

  it('refuse une quantité livrée supérieure à la quantité sortie', async () => {
    const { prisma } = createPrisma(bonSortie());
    const service = new BonsLivraisonService(prisma as any);

    await expect(
      service.create(user(), { bonSortieId: 'bs-1', lignes: [{ marchandise: 'Riz', quantite: 150 }] }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('BonsLivraisonService.update / remove', () => {
  function withExisting(statut: string) {
    const { prisma } = createPrisma(bonSortie());
    prisma.bonLivraison.findUnique.mockResolvedValue({ id: 'bl-1', annexeId: 'annexe-ml', bonSortieId: 'bs-1', statut });
    return new BonsLivraisonService(prisma as any);
  }

  it('refuse de modifier un bon déjà livré', async () => {
    await expect(withExisting('Livré').update('bl-1', user(), { chauffeurNom: 'X' })).rejects.toThrow(BadRequestException);
  });

  it('refuse de supprimer un bon livré entre lecture et suppression', async () => {
    const { prisma } = createPrisma(bonSortie());
    prisma.bonLivraison.findUnique.mockResolvedValue({ id: 'bl-1', annexeId: 'annexe-ml', statut: 'En cours' });
    prisma.bonLivraison.deleteMany.mockResolvedValue({ count: 0 });
    const service = new BonsLivraisonService(prisma as any);

    await expect(service.remove('bl-1', user())).rejects.toThrow(BadRequestException);
    expect(prisma.bonLivraison.deleteMany.mock.calls[0][0].where).toEqual({ id: 'bl-1', statut: { not: 'Livré' } });
  });
});
