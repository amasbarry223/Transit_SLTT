import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function user(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'u1', email: 'u@x.com', nom: 'U', role: 'TRANSITAIRE', permissions: [], annexeIds: ['annexe-ml'], ...overrides };
}

function createFakePrisma() {
  return {
    trackingPublic: {
      findUnique: vi.fn(),
      upsert: vi.fn().mockResolvedValue({ id: 'trk-1' }),
    },
    dossier: {
      findUnique: vi.fn(),
    },
  };
}

describe('TrackingService.getPublicTracking', () => {
  it('rejette un code de suivi introuvable', async () => {
    const prisma = createFakePrisma();
    prisma.trackingPublic.findUnique.mockResolvedValue(null);
    const service = new TrackingService(prisma as any);

    await expect(service.getPublicTracking('INEXISTANT')).rejects.toThrow(NotFoundException);
  });

  it('rejette un suivi désactivé (actif: false) — pas seulement l’absence de ligne', async () => {
    const prisma = createFakePrisma();
    prisma.trackingPublic.findUnique.mockResolvedValue({ codeTracking: 'TRK-1', actif: false });
    const service = new TrackingService(prisma as any);

    await expect(service.getPublicTracking('TRK-1')).rejects.toThrow(NotFoundException);
  });

  it('retire les espaces autour du code avant la recherche', async () => {
    const prisma = createFakePrisma();
    prisma.trackingPublic.findUnique.mockResolvedValue({ codeTracking: 'TRK-1', actif: true });
    const service = new TrackingService(prisma as any);

    await service.getPublicTracking('  TRK-1  ');

    expect(prisma.trackingPublic.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { codeTracking: 'TRK-1' } }),
    );
  });

  it('retourne le suivi actif trouvé', async () => {
    const prisma = createFakePrisma();
    const tracking = { codeTracking: 'TRK-1', actif: true, dossier: { numero: 'D-1' } };
    prisma.trackingPublic.findUnique.mockResolvedValue(tracking);
    const service = new TrackingService(prisma as any);

    await expect(service.getPublicTracking('TRK-1')).resolves.toEqual(tracking);
  });
});

describe('TrackingService.updateTrackingPosition — cloisonnement par annexe', () => {
  it('rejette la mise à jour si le dossier ciblé n’existe pas', async () => {
    const prisma = createFakePrisma();
    prisma.dossier.findUnique.mockResolvedValue(null);
    const service = new TrackingService(prisma as any);

    await expect(
      service.updateTrackingPosition('dossier-inconnu', user(), { statutAffiche: 'En cours' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejette un non-admin ciblant un dossier d’une autre annexe', async () => {
    const prisma = createFakePrisma();
    prisma.dossier.findUnique.mockResolvedValue({ annexeId: 'annexe-ci' });
    const service = new TrackingService(prisma as any);

    await expect(
      service.updateTrackingPosition('dossier-1', user({ annexeIds: ['annexe-ml'] }), { statutAffiche: 'En cours' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('autorise un non-admin ciblant un dossier de sa propre annexe', async () => {
    const prisma = createFakePrisma();
    prisma.dossier.findUnique.mockResolvedValue({ annexeId: 'annexe-ml' });
    const service = new TrackingService(prisma as any);

    await expect(
      service.updateTrackingPosition('dossier-1', user({ annexeIds: ['annexe-ml'] }), { statutAffiche: 'En cours' }),
    ).resolves.toBeDefined();
  });

  it('laisse toujours passer un ADMIN, quelle que soit l’annexe du dossier', async () => {
    const prisma = createFakePrisma();
    prisma.dossier.findUnique.mockResolvedValue({ annexeId: 'annexe-ci' });
    const service = new TrackingService(prisma as any);

    await expect(
      service.updateTrackingPosition('dossier-1', admin(), { statutAffiche: 'Livré' }),
    ).resolves.toBeDefined();
  });

  it('génère un code de suivi dérivé de l’id à la création (upsert.create)', async () => {
    const prisma = createFakePrisma();
    prisma.dossier.findUnique.mockResolvedValue({ annexeId: 'annexe-ml' });
    const service = new TrackingService(prisma as any);

    await service.updateTrackingPosition('dossier-12345678-abcd', user({ annexeIds: ['annexe-ml'] }), {});

    expect(prisma.trackingPublic.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ codeTracking: 'TRK-DOSSIER-' }),
      }),
    );
  });
});
