import { BadRequestException } from '@nestjs/common';
import { DossiersService } from './dossiers.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function dossierRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'dossier-1',
    annexeId: 'annexe-1',
    montantInvesti: 100000,
    montantPaye: 0,
    statut: 'EN_COURS',
    ...overrides,
  };
}

function createFakePrisma(dossier: ReturnType<typeof dossierRow>) {
  const tx = {
    dossier: {
      update: vi.fn().mockResolvedValue(dossier),
      findUnique: vi.fn().mockResolvedValue(dossier),
    },
    trackingPublic: { updateMany: vi.fn().mockResolvedValue(undefined) },
  };
  return {
    dossier: { findUnique: vi.fn().mockResolvedValue(dossier) },
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb(tx)),
  };
}

describe('DossiersService.enregistrerPaiement — garde-fou de trop-perçu', () => {
  it('rejette un règlement qui dépasse le reste dû au lieu de l\'écrêter silencieusement', async () => {
    const dossier = dossierRow({ montantInvesti: 100000, montantPaye: 90000 });
    const prisma = createFakePrisma(dossier);
    const service = new DossiersService(prisma as any);

    await expect(
      service.enregistrerPaiement('dossier-1', admin(), { montant: 20000 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepte un règlement qui couvre exactement le reste dû (tolérance ±0.5)', async () => {
    const dossier = dossierRow({ montantInvesti: 100000, montantPaye: 90000 });
    const prisma = createFakePrisma(dossier);
    const service = new DossiersService(prisma as any);

    await expect(
      service.enregistrerPaiement('dossier-1', admin(), { montant: 10000 }),
    ).resolves.toBeDefined();
  });

  it('rejette un montant nul ou négatif', async () => {
    const dossier = dossierRow();
    const prisma = createFakePrisma(dossier);
    const service = new DossiersService(prisma as any);

    await expect(
      service.enregistrerPaiement('dossier-1', admin(), { montant: 0 }),
    ).rejects.toThrow(BadRequestException);
  });

  it("n'applique aucun plafond quand montantInvesti vaut 0 (dossier sans assiette chiffrée)", async () => {
    const dossier = dossierRow({ montantInvesti: 0, montantPaye: 0 });
    const prisma = createFakePrisma(dossier);
    const service = new DossiersService(prisma as any);

    await expect(
      service.enregistrerPaiement('dossier-1', admin(), { montant: 999999 }),
    ).resolves.toBeDefined();
  });
});
