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

});

describe('ComptabiliteService.annulerOperation — contre-passation', () => {
  const original = {
    id: 'o1',
    reference: 'OPC-7',
    annexeId: 'annexe-ml',
    date: '2026-01-15',
    clientId: 'c1',
    dossierId: null,
    clientNom: 'ACME',
    nature: 'Frais de circuit',
    type: 'Sortie',
    montant: 1000,
    modePaiement: 'Espèces',
    source: 'saisie',
  };

  function setup(opts: { existing?: any; dejaAnnulee?: boolean; clotureFin?: string } = {}) {
    const tx = {
      journalLien: {
        findUnique: vi.fn().mockResolvedValue(opts.dejaAnnulee ? { id: 'l' } : null),
        create: vi.fn().mockResolvedValue({}),
      },
      clotureCaisse: { findFirst: vi.fn().mockResolvedValue(opts.clotureFin ? { periodeFin: opts.clotureFin } : null) },
      operationComptable: {
        findFirst: vi.fn().mockResolvedValue({ reference: 'OPC-7' }),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(async ({ data }) => ({ id: 'inv', ...data })),
      },
    };
    const prisma = {
      operationComptable: { findUnique: vi.fn().mockResolvedValue(opts.existing ?? original), delete: vi.fn() },
      $transaction: vi.fn().mockImplementation(async (fn: any) => fn(tx)),
    };
    return { prisma, tx, service: new ComptabiliteService(prisma as any) };
  }

  it("ajoute l'écriture inverse (sens opposé, même montant) sans supprimer l'originale, y compris en période clôturée", async () => {
    const { prisma, tx, service } = setup({ clotureFin: '2999-12-31' });

    const inverse: any = await service.annulerOperation('o1', admin());

    expect(inverse).toMatchObject({ type: 'Entrée', montant: 1000, source: 'contrepassation', reference: 'OPC-8' });
    expect(inverse.nature).toContain('Annulation OPC-7');
    expect(inverse.date).toBe('3000-01-01'); // lendemain de la dernière clôture
    expect(tx.journalLien.create).toHaveBeenCalledWith({
      data: { origineType: 'CONTREPASSATION', origineId: 'o1', operationId: 'inv' },
    });
    expect(prisma.operationComptable.delete).not.toHaveBeenCalled();
  });

  it('refuse une seconde annulation de la même opération', async () => {
    const { service } = setup({ dejaAnnulee: true });
    await expect(service.annulerOperation('o1', admin())).rejects.toThrow(ConflictException);
  });

  it("refuse d'annuler une contre-passation ou une écriture automatique liée", async () => {
    await expect(
      setup({ existing: { ...original, source: 'contrepassation' } }).service.annulerOperation('o1', admin()),
    ).rejects.toThrow(ConflictException);
    await expect(
      setup({ existing: { ...original, source: 'auto_facture' } }).service.annulerOperation('o1', admin()),
    ).rejects.toThrow(ConflictException);
  });

  it("autorise l'annulation d'une écriture de dossier devenue orpheline", async () => {
    const { service } = setup({ existing: { ...original, source: 'auto_dossier', dossierId: null } });
    await expect(service.annulerOperation('o1', admin())).resolves.toMatchObject({ type: 'Entrée' });
  });
});

describe('ComptabiliteService.rattacherOperations', () => {
  function setup() {
    const tx = { operationComptable: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) } };
    const prisma = {
      client: { findMany: vi.fn().mockResolvedValue([{ id: 'c1' }]) },
      operationComptable: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'o1', annexeId: 'annexe-ml' },
          { id: 'o2', annexeId: 'annexe-ci' },
        ]),
      },
      $transaction: vi.fn(async (fn: any) => fn(tx)),
    };
    return { tx, service: new ComptabiliteService(prisma as any) };
  }

  it("ne complète qu'un clientId manquant (jamais d'écrasement)", async () => {
    const { tx, service } = setup();
    const res = await service.rattacherOperations(admin(), [{ operationId: 'o1', clientId: 'c1' }]);

    expect(res).toEqual({ rattachees: 1 });
    expect(tx.operationComptable.updateMany).toHaveBeenCalledWith({
      where: { id: 'o1', clientId: null },
      data: { clientId: 'c1' },
    });
  });

  it("ignore un client inconnu et une écriture d'une annexe non autorisée", async () => {
    const { tx, service } = setup();
    const user = admin({ role: 'AGENT', annexeIds: ['annexe-ml'] } as any);
    await service.rattacherOperations(user, [
      { operationId: 'o1', clientId: 'inconnu' },
      { operationId: 'o2', clientId: 'c1' },
    ]);
    expect(tx.operationComptable.updateMany).not.toHaveBeenCalled();
  });
});
