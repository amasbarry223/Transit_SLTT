import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

describe('NotificationsService.recipientsForAnnexe', () => {
  it("cible les admins actifs et les comptables de l'annexe, sans l'auteur", async () => {
    const prisma = { profile: { findMany: vi.fn().mockResolvedValue([{ id: 'admin-1' }, { id: 'compta-ml' }]) } };
    const service = new NotificationsService(prisma as any);

    const ids = await service.recipientsForAnnexe('annexe-ml', 'agent-1');

    expect(ids).toEqual(['admin-1', 'compta-ml']);
    expect(prisma.profile.findMany.mock.calls[0][0].where).toEqual({
      actif: true,
      id: { not: 'agent-1' },
      OR: [{ role: 'ADMIN' }, { role: 'COMPTABLE', userAnnexes: { some: { annexeId: 'annexe-ml' } } }],
    });
  });
});

describe('NotificationsService.notifyUsers', () => {
  it('crée une notification par destinataire unique', async () => {
    const prisma = { notification: { createMany: vi.fn().mockResolvedValue({ count: 2 }) } };
    const service = new NotificationsService(prisma as any);

    await service.notifyUsers(['u1', 'u2', 'u1'], { titre: 'T', message: 'M', lien: '/recus' });

    expect(prisma.notification.createMany.mock.calls[0][0].data).toEqual([
      { userId: 'u1', titre: 'T', message: 'M', lien: '/recus' },
      { userId: 'u2', titre: 'T', message: 'M', lien: '/recus' },
    ]);
  });

  it("n'écrit rien sans destinataire", async () => {
    const prisma = { notification: { createMany: vi.fn() } };
    const service = new NotificationsService(prisma as any);

    await expect(service.notifyUsers([], { titre: 'T', message: 'M' })).resolves.toEqual({ count: 0 });
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });
});

describe('NotificationsService.markRead', () => {
  it("refuse (404) la notification d'un autre utilisateur", async () => {
    const prisma = { notification: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) } };
    const service = new NotificationsService(prisma as any);

    await expect(service.markRead('n1', 'intrus')).rejects.toThrow(NotFoundException);
    expect(prisma.notification.updateMany.mock.calls[0][0].where).toEqual({ id: 'n1', userId: 'intrus' });
  });
});
