import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

function createFakePrisma(currentPasswordHash: string) {
  return {
    profile: {
      findUnique: vi.fn().mockResolvedValue({ id: 'user-1', passwordHash: currentPasswordHash }),
      update: vi.fn().mockResolvedValue({}),
    },
    refreshToken: {
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

describe('AuthService.changePassword', () => {
  it('rejette un nouveau mot de passe sans majuscule/chiffre (même règle que UsersService)', async () => {
    const hash = await bcrypt.hash('OldPass1', 12);
    const prisma = createFakePrisma(hash);
    const service = new AuthService(prisma as any, {} as any);

    await expect(
      service.changePassword('user-1', 'OldPass1', 'nouveaumdp'),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
  });

  it('rejette si le mot de passe actuel est incorrect', async () => {
    const hash = await bcrypt.hash('OldPass1', 12);
    const prisma = createFakePrisma(hash);
    const service = new AuthService(prisma as any, {} as any);

    await expect(
      service.changePassword('user-1', 'MauvaisMdp1', 'NouveauMdp1'),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
  });

  it('révoque toutes les sessions existantes (refresh tokens) après un changement réussi', async () => {
    const hash = await bcrypt.hash('OldPass1', 12);
    const prisma = createFakePrisma(hash);
    const service = new AuthService(prisma as any, {} as any);

    await service.changePassword('user-1', 'OldPass1', 'NouveauMdp1');

    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } }),
    );
  });
});
