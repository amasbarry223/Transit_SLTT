import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CaisseService } from './caisse.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function user(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'u1', email: 'u@x.com', nom: 'U', role: 'TRANSITAIRE', permissions: [], annexeIds: ['annexe-ml'], ...overrides };
}

function caisseRow(overrides: Record<string, unknown> = {}) {
  return { id: 'caisse-1', annexeId: 'annexe-ml', statut: 'OUVERTE', soldeActuel: 1000, ...overrides };
}

function createFakePrisma(caisse = caisseRow()) {
  const tx = {
    transactionCaisse: { create: vi.fn().mockResolvedValue({ id: 'tx-1' }) },
    caisse: { update: vi.fn() },
  };
  return {
    caisse: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn().mockResolvedValue(caisse) },
    $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb(tx)),
    _tx: tx,
  };
}

describe('CaisseService.findAll — annexeId demandé n’élargit jamais le périmètre', () => {
  it('rejette un non-admin demandant explicitement une annexe hors de son périmètre', async () => {
    const prisma = createFakePrisma();
    const service = new CaisseService(prisma as any);

    await expect(service.findAll(user({ annexeIds: ['annexe-ml'] }), 'annexe-ci')).rejects.toThrow(ForbiddenException);
  });

  it('autorise un non-admin demandant une annexe de son propre périmètre', async () => {
    const prisma = createFakePrisma();
    const service = new CaisseService(prisma as any);

    await expect(service.findAll(user({ annexeIds: ['annexe-ml'] }), 'annexe-ml')).resolves.toEqual([]);
  });
});

describe('CaisseService.findOne', () => {
  it('rejette une caisse introuvable', async () => {
    const prisma = createFakePrisma();
    prisma.caisse.findUnique.mockResolvedValue(null);
    const service = new CaisseService(prisma as any);

    await expect(service.findOne('inconnue', admin())).rejects.toThrow(NotFoundException);
  });

  it('rejette un non-admin consultant une caisse d’une autre annexe', async () => {
    const prisma = createFakePrisma(caisseRow({ annexeId: 'annexe-ci' }));
    const service = new CaisseService(prisma as any);

    await expect(service.findOne('caisse-1', user({ annexeIds: ['annexe-ml'] }))).rejects.toThrow(ForbiddenException);
  });
});

describe('CaisseService.createTransaction', () => {
  it('rejette une transaction sur une caisse fermée', async () => {
    const prisma = createFakePrisma(caisseRow({ statut: 'FERMEE' }));
    const service = new CaisseService(prisma as any);

    await expect(
      service.createTransaction('caisse-1', admin(), { type: 'ENTREE', montant: 100, motif: 'Test' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejette un montant nul ou négatif', async () => {
    const prisma = createFakePrisma();
    const service = new CaisseService(prisma as any);

    await expect(
      service.createTransaction('caisse-1', admin(), { type: 'SORTIE', montant: 0, motif: 'Test' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.createTransaction('caisse-1', admin(), { type: 'SORTIE', montant: -50, motif: 'Test' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('incrémente le solde pour une ENTREE', async () => {
    const prisma = createFakePrisma();
    (prisma._tx.caisse.update as any).mockResolvedValue({ soldeActuel: 1100 });
    const service = new CaisseService(prisma as any);

    const result = await service.createTransaction('caisse-1', admin(), { type: 'ENTREE', montant: 100, motif: 'Dépôt' });

    expect(prisma._tx.caisse.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { soldeActuel: { increment: 100 } } }),
    );
    expect(result.soldeActuel).toBe(1100);
  });

  it('décrémente le solde pour une SORTIE (increment négatif)', async () => {
    const prisma = createFakePrisma();
    (prisma._tx.caisse.update as any).mockResolvedValue({ soldeActuel: 900 });
    const service = new CaisseService(prisma as any);

    await service.createTransaction('caisse-1', admin(), { type: 'SORTIE', montant: 100, motif: 'Retrait' });

    expect(prisma._tx.caisse.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { soldeActuel: { increment: -100 } } }),
    );
  });

  it('rejette (annule la transaction) si le solde devient négatif après écriture — sorties concurrentes', async () => {
    const prisma = createFakePrisma();
    (prisma._tx.caisse.update as any).mockResolvedValue({ soldeActuel: -50 });
    const service = new CaisseService(prisma as any);

    await expect(
      service.createTransaction('caisse-1', admin(), { type: 'SORTIE', montant: 1050, motif: 'Retrait' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejette un type de transaction invalide', async () => {
    const prisma = createFakePrisma();
    const service = new CaisseService(prisma as any);

    await expect(
      service.createTransaction('caisse-1', admin(), { type: 'AUTRE' as any, montant: 100, motif: 'Test' }),
    ).rejects.toThrow(BadRequestException);
  });
});
