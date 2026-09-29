import { BadRequestException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import type { CurrentUserType } from '../../auth/auth.types';

function createFakePrisma() {
  const upsertCalls: unknown[] = [];
  return {
    setting: {
      upsert: vi.fn((args: any) => {
        upsertCalls.push(args);
        return Promise.resolve({ cle: args.where.cle, ...args.create });
      }),
    },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    _upsertCalls: upsertCalls,
  };
}

function transitaire(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'u1', email: 'u@x.com', nom: 'Agent', role: 'TRANSITAIRE', permissions: [], annexeIds: ['a1'], ...overrides };
}

function admin(): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [] };
}

describe('SettingsService.getAll / getByKey — filtre par permission', () => {
  it("un utilisateur sans accès Paramètres ne reçoit pas les réglages sensibles (commission_rate...) — même si isPublic est resté false par défaut sur un réglage de branding jamais explicitement marqué public (societe_logo_url...), celui-ci reste visible", async () => {
    const settings = [
      { cle: 'app_title', valeur: 'Transit SLTT', type: 'string', isPublic: true, groupName: 'application' },
      // Jamais seedé, créé via societes-slice.ts::updateSociete() (upsert
      // plain-string) : isPublic reste au défaut Prisma `false`, mais doit
      // rester visible partout (logo affiché à tout utilisateur).
      { cle: 'societe_logo_url', valeur: 'https://x/logo.png', type: 'string', isPublic: false, groupName: 'general' },
      { cle: 'commission_rate', valeur: '0.05', type: 'number', isPublic: false, groupName: 'facturation' },
    ];
    const prisma = { setting: { findMany: vi.fn().mockResolvedValue(settings) } };
    const service = new SettingsService(prisma as any);

    const result = await service.getAll(transitaire());
    expect(result.map.commission_rate).toBeUndefined();
    expect(result.map.app_title).toBe('Transit SLTT');
    expect(result.map.societe_logo_url).toBe('https://x/logo.png');
  });

  it('un ADMIN ou un titulaire de parametres:read voit tous les réglages, y compris les sensibles', async () => {
    const settings = [
      { cle: 'app_title', valeur: 'Transit SLTT', type: 'string', isPublic: true, groupName: 'application' },
      { cle: 'commission_rate', valeur: '0.05', type: 'number', isPublic: false, groupName: 'facturation' },
    ];
    const prisma = { setting: { findMany: vi.fn().mockResolvedValue(settings) } };
    const service = new SettingsService(prisma as any);

    const result = await service.getAll(admin());
    expect(result.map.commission_rate).toBe('0.05');
  });

  it('getByKey renvoie null (pas 403) pour une clé sensible demandée par un utilisateur sans accès Paramètres', async () => {
    const setting = { cle: 'commission_rate', valeur: '0.05', type: 'number', isPublic: false };
    const prisma = { setting: { findUnique: vi.fn().mockResolvedValue(setting) } };
    const service = new SettingsService(prisma as any);

    await expect(service.getByKey('commission_rate', transitaire())).resolves.toBeNull();
  });

  it('getByKey renvoie la valeur pour une clé non-sensible, quel que soit le rôle', async () => {
    const setting = { cle: 'societe_logo_url', valeur: 'https://x/logo.png', type: 'string', isPublic: false };
    const prisma = { setting: { findUnique: vi.fn().mockResolvedValue(setting) } };
    const service = new SettingsService(prisma as any);

    await expect(service.getByKey('societe_logo_url', transitaire())).resolves.toMatchObject({ cle: 'societe_logo_url' });
  });
});

describe('SettingsService — validation des valeurs (setKey/setMany)', () => {
  it('rejette une valeur ni string, ni number, ni boolean', async () => {
    const prisma = createFakePrisma();
    const service = new SettingsService(prisma as any);

    await expect(
      service.setKey('societe_logo_url', { evil: true } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejette une valeur dépassant la taille maximale autorisée', async () => {
    const prisma = createFakePrisma();
    const service = new SettingsService(prisma as any);

    await expect(service.setKey('notes', 'x'.repeat(10_001))).rejects.toThrow(BadRequestException);
  });

  it('rejette un type de paramètre inconnu', async () => {
    const prisma = createFakePrisma();
    const service = new SettingsService(prisma as any);

    await expect(service.setKey('taux_tva', '18', undefined, 'not-a-real-type')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('accepte une valeur string valide', async () => {
    const prisma = createFakePrisma();
    const service = new SettingsService(prisma as any);

    await expect(service.setKey('societe_logo_url', 'https://example.com/logo.png')).resolves.toBeDefined();
  });

  it('setMany rejette dès qu’une des valeurs du lot est invalide', async () => {
    const prisma = createFakePrisma();
    const service = new SettingsService(prisma as any);

    await expect(
      service.setMany({
        app_title: 'OK',
        societe_logo_url: { valeur: 'x'.repeat(10_001) },
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
