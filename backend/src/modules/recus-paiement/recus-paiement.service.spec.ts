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

function fakeNotifications() {
  return {
    recipientsForAnnexe: vi.fn().mockResolvedValue(['admin-2', 'compta-ml']),
    notifyUsers: vi.fn().mockResolvedValue({ count: 2 }),
  };
}

function createFakeCreatePrisma() {
  return {
    recuPaiement: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn((args: any) => ({ id: 'recu-new', ...args.data, annexe: { nom: 'Bamako' } })),
    },
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
    const service = new RecusPaiementService(prisma as any, fakeNotifications() as any);

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
    const service = new RecusPaiementService(prisma as any, fakeNotifications() as any);

    await expect(service.update('recu-1', admin(), { montantPaye: -50 })).rejects.toThrow(BadRequestException);
  });

  it('rejette un montant payé supérieur à la somme due — sans ce garde-fou reste=max(0,...) écrasait le trop-perçu et le reçu passait à SOLDE', async () => {
    const recu = baseRecu({ somme: 1000, montantPaye: 1000 });
    const { prisma } = createFakePrisma(recu);
    const service = new RecusPaiementService(prisma as any, fakeNotifications() as any);

    await expect(service.update('recu-1', admin(), { montantPaye: 5000 })).rejects.toThrow(BadRequestException);
  });
});

describe('RecusPaiementService.create', () => {
  it('rejette une somme ou un montant payé négatif', async () => {
    const prisma = { recuPaiement: {} };
    const service = new RecusPaiementService(prisma as any, fakeNotifications() as any);

    await expect(
      service.create(admin(), { annexeId: 'annexe-ml', somme: -100 }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.create(admin(), { annexeId: 'annexe-ml', montantPaye: -1 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejette un montant payé supérieur à la somme due', async () => {
    const prisma = { recuPaiement: {} };
    const service = new RecusPaiementService(prisma as any, fakeNotifications() as any);

    await expect(
      service.create(admin(), { annexeId: 'annexe-ml', somme: 1000, montantPaye: 5000 }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('RecusPaiementService.create — notification', () => {
  it("notifie admins + comptables de l'annexe (sans l'auteur) pour un reçu saisi", async () => {
    const notifications = fakeNotifications();
    const service = new RecusPaiementService(createFakeCreatePrisma() as any, notifications as any);

    await service.create(admin(), { annexeId: 'annexe-ml', nom: 'Diarra', prenom: 'Awa', somme: 50000, montantPaye: 20000 });

    expect(notifications.recipientsForAnnexe).toHaveBeenCalledWith('annexe-ml', 'admin-1');
    const [ids, content] = notifications.notifyUsers.mock.calls[0];
    expect(ids).toEqual(['admin-2', 'compta-ml']);
    expect(content.titre).toBe('Nouveau reçu RECU-0001');
    expect(content.message).toBe('Awa Diarra — 20 000 FCFA payés sur 50 000 FCFA (partiel) · Bamako · par Admin');
    expect(content.lien).toBe('/recus/nouveau');
  });

  it('ne notifie pas un reçu vierge (carnet)', async () => {
    const notifications = fakeNotifications();
    const service = new RecusPaiementService(createFakeCreatePrisma() as any, notifications as any);

    await service.create(admin(), { annexeId: 'annexe-ml' });

    expect(notifications.recipientsForAnnexe).not.toHaveBeenCalled();
    expect(notifications.notifyUsers).not.toHaveBeenCalled();
  });

  it("enregistre le reçu même si la notification échoue", async () => {
    const notifications = fakeNotifications();
    notifications.notifyUsers.mockRejectedValue(new Error('table notifications absente'));
    const service = new RecusPaiementService(createFakeCreatePrisma() as any, notifications as any);

    const recu = await service.create(admin(), { annexeId: 'annexe-ml', nom: 'Diarra', somme: 1000, montantPaye: 1000 });

    expect(recu.reference).toBe('RECU-0001');
  });
});

describe('RecusPaiementService.delete', () => {
  function svc(recu: any) {
    const prisma: any = { recuPaiement: { findUnique: vi.fn().mockResolvedValue(recu), delete: vi.fn().mockResolvedValue(recu) } };
    return { prisma, service: new RecusPaiementService(prisma, {} as any) };
  }
  const admin = { id: 'a', email: 'a@x', nom: 'A', role: 'ADMIN', permissions: ['*'], annexeIds: [] } as any;

  it('refuse de supprimer un reçu qui atteste un paiement', async () => {
    const { prisma, service } = svc({ id: 'r1', reference: 'RECU-0001', annexeId: 'a1', montantPaye: 5000 });
    await expect(service.delete('r1', admin)).rejects.toThrow(/ne peut pas être supprimé/);
    expect(prisma.recuPaiement.delete).not.toHaveBeenCalled();
  });

  it('autorise la suppression d’un reçu vierge', async () => {
    const { prisma, service } = svc({ id: 'r1', reference: 'RECU-0002', annexeId: 'a1', montantPaye: 0 });
    await service.delete('r1', admin);
    expect(prisma.recuPaiement.delete).toHaveBeenCalled();
  });
});
