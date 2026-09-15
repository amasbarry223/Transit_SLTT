import { BadRequestException } from '@nestjs/common';
import { RecusPaiementService } from './recus-paiement.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function baseRecu(overrides: Record<string, unknown> = {}) {
  return {
    id: 'recu-1',
    annexeId: 'annexe-ml',
    reference: 'RECU-0001',
    somme: 1000,
    montantPaye: 1000,
    reste: 0,
    statut: 'SOLDE',
    creePar: 'Alice Origine',
    ...overrides,
  };
}

function createFakePrisma(recu: ReturnType<typeof baseRecu>) {
  const prisma = {
    recuPaiement: {
      findUnique: vi.fn().mockResolvedValue(recu),
      update: vi.fn((args: any) => ({ ...recu, ...args.data })),
    },
  };
  return { prisma };
}

describe('RecusPaiementService.update', () => {
  it("ignore un `creePar` fourni dans le payload — l'attribution d'origine ne peut pas être réécrite après coup", async () => {
    const recu = baseRecu();
    const { prisma } = createFakePrisma(recu);
    const service = new RecusPaiementService(prisma as any);

    await service.update('recu-1', admin(), {
      creePar: 'Quelqu-un-d-autre',
      motif: 'Correction du motif',
    });

    const updateCall = (prisma.recuPaiement.update as any).mock.calls[0][0];
    expect(updateCall.data.creePar).toBeUndefined();
    expect(updateCall.data.motif).toBe('Correction du motif');
  });

  it('rejette un montant payé négatif à la mise à jour', async () => {
    const recu = baseRecu();
    const { prisma } = createFakePrisma(recu);
    const service = new RecusPaiementService(prisma as any);

    await expect(service.update('recu-1', admin(), { montantPaye: -50 })).rejects.toThrow(BadRequestException);
  });
});

describe('RecusPaiementService.create', () => {
  it('rejette une somme ou un montant payé négatif', async () => {
    const prisma = { recuPaiement: {} };
    const service = new RecusPaiementService(prisma as any);

    await expect(
      service.create(admin(), { annexeId: 'annexe-ml', somme: -100 }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.create(admin(), { annexeId: 'annexe-ml', montantPaye: -1 }),
    ).rejects.toThrow(BadRequestException);
  });
});
