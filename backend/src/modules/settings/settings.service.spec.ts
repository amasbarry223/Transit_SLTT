import { BadRequestException } from '@nestjs/common';
import { SettingsService } from './settings.service';

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
