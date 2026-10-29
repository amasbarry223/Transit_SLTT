import { BadRequestException, ConflictException } from '@nestjs/common';
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
      operationComptable: { groupBy: vi.fn().mockResolvedValue([]) },
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
      operationComptable: { groupBy: vi.fn().mockResolvedValue([]) },
    };
    const service = new ComptabiliteService(prisma as any);

    await expect(service.createCloture(admin(), baseInput())).resolves.toMatchObject({ id: 'new-cloture' });
  });
});

describe('ComptabiliteService.createCloture — solde théorique recalculé côté serveur', () => {
  it("ignore le soldeTheorique du client : report de la clôture précédente + entrées − sorties, écart = constaté − théorique", async () => {
    const prisma = {
      clotureCaisse: {
        // 1er appel : contrôle de chevauchement (aucun) ; 2e : clôture précédente
        findFirst: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ soldeConstate: 500 }),
        create: vi.fn().mockImplementation(async ({ data }) => ({ id: 'c', ...data })),
      },
      operationComptable: {
        groupBy: vi.fn().mockResolvedValue([
          { type: 'Entrée', _sum: { montant: 1000 } },
          { type: 'Sortie', _sum: { montant: 300 } },
        ]),
      },
    };
    const service = new ComptabiliteService(prisma as any);

    const result: any = await service.createCloture(admin(), baseInput({ soldeTheorique: 99999, soldeConstate: 1250 }));

    expect(result.soldeTheorique).toBe(1200); // 500 + 1000 − 300
    expect(result.ecart).toBe(50); // 1250 − 1200
  });

  it('rejette une clôture sans solde constaté', async () => {
    const prisma = { clotureCaisse: { findFirst: vi.fn(), create: vi.fn() }, operationComptable: { groupBy: vi.fn() } };
    const service = new ComptabiliteService(prisma as any);
    await expect(service.createCloture(admin(), baseInput({ soldeConstate: undefined }))).rejects.toThrow(BadRequestException);
  });
});

describe('ComptabiliteService — verrou de période clôturée', () => {
  it("refuse de créer une opération datée dans une période déjà clôturée", async () => {
    const prisma = {
      clotureCaisse: { findFirst: vi.fn().mockResolvedValue({ periodeFin: '2026-01-31' }) },
      operationComptable: { create: vi.fn() },
    };
    const service = new ComptabiliteService(prisma as any);

    await expect(
      service.createOperation(admin(), { annexeId: 'annexe-ml', date: '2026-01-15', nature: 'x', type: 'Sortie', montant: 10 }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.operationComptable.create).not.toHaveBeenCalled();
  });

  it("refuse de supprimer une opération d'une période clôturée", async () => {
    const prisma = {
      clotureCaisse: { findFirst: vi.fn().mockResolvedValue({ periodeFin: '2026-01-31' }) },
      operationComptable: {
        findUnique: vi.fn().mockResolvedValue({ id: 'o1', annexeId: 'annexe-ml', date: '2026-01-15' }),
        delete: vi.fn(),
      },
    };
    const service = new ComptabiliteService(prisma as any);

    await expect(service.deleteOperation('o1', admin())).rejects.toThrow(ConflictException);
    expect(prisma.operationComptable.delete).not.toHaveBeenCalled();
  });
});
