import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import type { JwtPayload } from '../auth.types';

const OLD_ENV = process.env.JWT_SECRET;

function payload(overrides: Partial<JwtPayload> = {}): JwtPayload {
  return {
    sub: 'user-1',
    email: 'user@x.com',
    nom: 'User',
    role: 'TRANSITAIRE',
    permissions: ['dossiers:read'],
    annexeIds: ['annexe-ml'],
    ...overrides,
  };
}

function createFakePrisma(profile: unknown) {
  return { profile: { findUnique: vi.fn().mockResolvedValue(profile) } };
}

describe('JwtStrategy.validate', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });
  afterAll(() => {
    process.env.JWT_SECRET = OLD_ENV;
  });

  it('rejette un compte introuvable (supprimé après émission du token)', async () => {
    const prisma = createFakePrisma(null);
    const strategy = new JwtStrategy(prisma as any);

    await expect(strategy.validate(payload())).rejects.toThrow(UnauthorizedException);
  });

  it('rejette un compte désactivé, même si le token est encore valide', async () => {
    const prisma = createFakePrisma({ id: 'user-1', actif: false, nom: 'User', email: 'user@x.com', role: 'TRANSITAIRE', permissions: [] });
    const strategy = new JwtStrategy(prisma as any);

    await expect(strategy.validate(payload())).rejects.toThrow(UnauthorizedException);
  });

  it('renvoie le rôle et les permissions ACTUELS de la base, pas ceux du token', async () => {
    const prisma = createFakePrisma({
      id: 'user-1',
      actif: true,
      nom: 'User',
      email: 'user@x.com',
      role: 'ADMIN', // promu ADMIN depuis l'émission du token (qui disait TRANSITAIRE)
      permissions: ['*'],
    });
    const strategy = new JwtStrategy(prisma as any);

    const result = await strategy.validate(payload({ role: 'TRANSITAIRE', permissions: ['dossiers:read'] }));

    expect(result.role).toBe('ADMIN');
    expect(result.permissions).toEqual(['*']);
  });

  it('conserve annexeIds du token (pas rechargé depuis la base, compromis perf documenté)', async () => {
    const prisma = createFakePrisma({ id: 'user-1', actif: true, nom: 'User', email: 'user@x.com', role: 'TRANSITAIRE', permissions: [] });
    const strategy = new JwtStrategy(prisma as any);

    const result = await strategy.validate(payload({ annexeIds: ['annexe-ci', 'annexe-ml'] }));

    expect(result.annexeIds).toEqual(['annexe-ci', 'annexe-ml']);
  });
});
