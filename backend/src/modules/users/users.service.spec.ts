import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { RoleUtilisateur } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function delegate(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return {
    id: 'delegate-1',
    email: 'delegate@x.com',
    nom: 'Délégué',
    role: 'TRANSITAIRE',
    permissions: ['utilisateurs:manage', 'dossiers:read'],
    annexeIds: ['annexe-ml'],
    ...overrides,
  };
}

function createFakePrisma() {
  const tx = {
    profile: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    userAnnexe: { deleteMany: vi.fn(), createMany: vi.fn() },
  };
  const prisma = {
    profile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: tx.profile.create,
      update: tx.profile.update,
      delete: tx.profile.delete,
    },
    userAnnexe: tx.userAnnexe,
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb(tx)),
  };
  return { prisma, tx };
}

function createFakeAuditLogs() {
  return { log: vi.fn().mockResolvedValue(undefined) };
}

/** Profil cible par défaut : non-admin, actif — passe les gardes qui
 *  bloquent seulement le ciblage d'un compte Administrateur/le dernier admin. */
function targetProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'target-1',
    email: 'target@x.com',
    nom: 'Cible',
    role: RoleUtilisateur.TRANSITAIRE,
    permissions: [],
    actif: true,
    userAnnexes: [],
    ...overrides,
  };
}

describe('UsersService — garde-fous de délégation', () => {
  it('un délégué ne peut pas accorder une permission hors de son propre périmètre', async () => {
    const { prisma } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findUnique.mockResolvedValue(null); // email libre
    const service = new UsersService(prisma as any, auditLogs as any);

    await expect(
      service.create(
        { email: 'a@a.com', password: 'longpass1', nom: 'A', permissions: ['comptabilite:write'] } as any,
        delegate(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it("un délégué ne peut pas assigner une annexe hors de son propre périmètre", async () => {
    const { prisma } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findUnique.mockResolvedValue(null);
    const service = new UsersService(prisma as any, auditLogs as any);

    await expect(
      service.create(
        { email: 'a@a.com', password: 'longpass1', nom: 'A', annexeIds: ['annexe-ci'] } as any,
        delegate(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('un délégué ne peut pas créer/promouvoir un compte Administrateur', async () => {
    const { prisma } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findUnique.mockResolvedValue(null);
    const service = new UsersService(prisma as any, auditLogs as any);

    await expect(
      service.create(
        { email: 'a@a.com', password: 'longpass1', nom: 'A', role: 'Administrateur' } as any,
        delegate(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('un admin peut créer un compte avec permissions/annexes/role arbitraires', async () => {
    const { prisma, tx } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findUnique.mockResolvedValue(null);
    (tx.profile.create as any).mockResolvedValue({
      id: 'new-1', email: 'a@a.com', nom: 'A', role: RoleUtilisateur.ADMIN, permissions: [], actif: true,
    });
    const service = new UsersService(prisma as any, auditLogs as any);

    const created = await service.create(
      { email: 'a@a.com', password: 'longpass1', nom: 'A', role: 'Administrateur', permissions: ['*'] } as any,
      admin(),
    );

    expect(created.role).toBe('Administrateur');
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'Création', entite: 'Utilisateurs' }),
      expect.anything(),
    );
  });

  it('un délégué ne peut pas modifier/supprimer un compte Administrateur', async () => {
    const { prisma } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findUnique.mockResolvedValue(targetProfile({ role: RoleUtilisateur.ADMIN }));
    const service = new UsersService(prisma as any, auditLogs as any);

    await expect(service.update('target-1', { nom: 'X' } as any, delegate())).rejects.toThrow(ForbiddenException);
    await expect(service.delete('target-1', delegate())).rejects.toThrow(ForbiddenException);
  });

  it('personne ne peut se désactiver soi-même', async () => {
    const { prisma } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findUnique.mockResolvedValue(targetProfile({ id: 'admin-1' }));
    const service = new UsersService(prisma as any, auditLogs as any);

    await expect(service.update('admin-1', { actif: false } as any, admin())).rejects.toThrow(BadRequestException);
  });

  it('personne ne peut se supprimer soi-même', async () => {
    const { prisma } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findUnique.mockResolvedValue(targetProfile({ id: 'admin-1' }));
    const service = new UsersService(prisma as any, auditLogs as any);

    await expect(service.delete('admin-1', admin())).rejects.toThrow(BadRequestException);
  });

  it('refuse de retirer les droits du dernier administrateur actif', async () => {
    const { prisma } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findUnique
      .mockResolvedValueOnce(targetProfile({ id: 'last-admin', role: RoleUtilisateur.ADMIN })) // findOne (via update)
      .mockResolvedValueOnce({ id: 'last-admin', role: RoleUtilisateur.ADMIN, actif: true }); // assertNotLastActiveAdmin
    prisma.profile.count.mockResolvedValue(0);
    const service = new UsersService(prisma as any, auditLogs as any);

    await expect(
      service.update('last-admin', { actif: false } as any, admin({ id: 'other-admin' })),
    ).rejects.toThrow(BadRequestException);
  });

  it('audite la mutation dans la même transaction que la modification', async () => {
    const { prisma, tx } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findUnique.mockResolvedValue(targetProfile());
    (tx.profile.update as any).mockResolvedValue({
      id: 'target-1', email: 'target@x.com', nom: 'Cible modifiée', role: RoleUtilisateur.TRANSITAIRE, permissions: [], actif: true,
    });
    const service = new UsersService(prisma as any, auditLogs as any);

    await service.update('target-1', { nom: 'Cible modifiée' } as any, admin());

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(auditLogs.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'Modification' }), tx);
  });
});

describe('UsersService.create — simulation de la création de compte', () => {
  it("rejette un email déjà utilisé (comparaison insensible à la casse/espaces)", async () => {
    const { prisma } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findUnique.mockResolvedValue(targetProfile({ email: 'a@a.com' }));
    const service = new UsersService(prisma as any, auditLogs as any);

    await expect(
      service.create({ email: ' A@A.com ', password: 'longpass1', nom: 'A' } as any, admin()),
    ).rejects.toThrow(ConflictException);
  });

  it('rejette un mot de passe de moins de 8 caractères', async () => {
    const { prisma } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findUnique.mockResolvedValue(null);
    const service = new UsersService(prisma as any, auditLogs as any);

    await expect(
      service.create({ email: 'a@a.com', password: 'short1', nom: 'A' } as any, admin()),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejette une création sans mot de passe (ni "password" ni "motDePasse")', async () => {
    const { prisma } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findUnique.mockResolvedValue(null);
    const service = new UsersService(prisma as any, auditLogs as any);

    await expect(
      service.create({ email: 'a@a.com', nom: 'A' } as any, admin()),
    ).rejects.toThrow(BadRequestException);
  });

  it("un rôle inconnu retombe sur TRANSITAIRE — aucune valeur ne permet une escalade vers ADMIN par ce chemin", async () => {
    const { prisma, tx } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findUnique.mockResolvedValue(null);
    (tx.profile.create as any).mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'new-1', email: data.email, nom: data.nom, role: data.role, permissions: [], actif: true }),
    );
    const service = new UsersService(prisma as any, auditLogs as any);

    const created = await service.create(
      { email: 'a@a.com', password: 'longpass1', nom: 'A', role: 'super-hacker' } as any,
      delegate(),
    );

    expect(created.role).toBe('Agent de transit');
  });

  it('un nom vide est rejeté par le DTO avant même d\'atteindre le service (@IsNotEmpty)', async () => {
    const dto = plainToInstance(CreateUserDto, { email: 'a@a.com', password: 'longpass1', nom: '' });
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'nom')).toBe(true);
  });
});

describe('UsersService — scoping par annexe de findAll/findOne pour un délégué non-ADMIN', () => {
  it('findAll() filtre sur les annexes du délégué (pas de fuite cross-annexe)', async () => {
    const { prisma } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findMany.mockResolvedValue([]);
    const service = new UsersService(prisma as any, auditLogs as any);

    await service.findAll(delegate({ annexeIds: ['annexe-ml'] }));

    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userAnnexes: { some: { annexeId: { in: ['annexe-ml'] } } } },
      }),
    );
  });

  it('findAll() ne filtre pas pour un ADMIN (accès total)', async () => {
    const { prisma } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findMany.mockResolvedValue([]);
    const service = new UsersService(prisma as any, auditLogs as any);

    await service.findAll(admin());

    expect(prisma.profile.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: undefined }));
  });

  it("findOne() refuse un délégué sur un utilisateur d'une autre annexe", async () => {
    const { prisma } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findUnique.mockResolvedValue(
      targetProfile({ userAnnexes: [{ annexeId: 'annexe-autre' }] }),
    );
    const service = new UsersService(prisma as any, auditLogs as any);

    await expect(
      service.findOne('target-1', delegate({ annexeIds: ['annexe-ml'] })),
    ).rejects.toThrow(ForbiddenException);
  });

  it("findOne() autorise un délégué sur un utilisateur de sa propre annexe", async () => {
    const { prisma } = createFakePrisma();
    const auditLogs = createFakeAuditLogs();
    prisma.profile.findUnique.mockResolvedValue(
      targetProfile({ userAnnexes: [{ annexeId: 'annexe-ml' }] }),
    );
    const service = new UsersService(prisma as any, auditLogs as any);

    await expect(
      service.findOne('target-1', delegate({ annexeIds: ['annexe-ml'] })),
    ).resolves.toMatchObject({ id: 'target-1' });
  });
});
