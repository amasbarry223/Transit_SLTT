import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function user(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'u1', email: 'u@x.com', nom: 'U', role: 'TRANSITAIRE', permissions: [], annexeIds: ['annexe-ml'], ...overrides };
}

function createFakePrisma() {
  return {
    client: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'new-1', ...data })),
      update: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'c1', ...data })),
    },
  };
}

describe('ClientsService.findAll — cloisonnement par annexe', () => {
  it('filtre sur les annexes de l’utilisateur (avec clients sans annexe visibles) pour un non-admin', async () => {
    const prisma = createFakePrisma();
    const service = new ClientsService(prisma as any);

    await service.findAll(user({ annexeIds: ['annexe-ml'] }));

    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ annexeId: null }, { annexeId: { in: ['annexe-ml'] } }],
        }),
      }),
    );
  });

  it('ne filtre pas par annexe pour un ADMIN', async () => {
    const prisma = createFakePrisma();
    const service = new ClientsService(prisma as any);

    await service.findAll(admin());

    const call = prisma.client.findMany.mock.calls[0][0];
    expect(call.where.OR).toBeUndefined();
    expect(call.where.annexeId).toBeUndefined();
  });
});

describe('ClientsService.findOne', () => {
  it('rejette un client introuvable', async () => {
    const prisma = createFakePrisma();
    prisma.client.findUnique.mockResolvedValue(null);
    const service = new ClientsService(prisma as any);

    await expect(service.findOne('inconnu', admin())).rejects.toThrow(NotFoundException);
  });

  it('rejette un non-admin consultant un client d’une autre annexe', async () => {
    const prisma = createFakePrisma();
    prisma.client.findUnique.mockResolvedValue({ id: 'c1', annexeId: 'annexe-ci' });
    const service = new ClientsService(prisma as any);

    await expect(service.findOne('c1', user({ annexeIds: ['annexe-ml'] }))).rejects.toThrow(ForbiddenException);
  });

  it('autorise un non-admin consultant un client de sa propre annexe', async () => {
    const prisma = createFakePrisma();
    prisma.client.findUnique.mockResolvedValue({ id: 'c1', annexeId: 'annexe-ml' });
    const service = new ClientsService(prisma as any);

    await expect(service.findOne('c1', user({ annexeIds: ['annexe-ml'] }))).resolves.toMatchObject({ id: 'c1' });
  });
});

describe('ClientsService.create', () => {
  it('rejette un non-admin créant un client pour une annexe hors de son périmètre', async () => {
    const prisma = createFakePrisma();
    const service = new ClientsService(prisma as any);

    await expect(
      service.create(user({ annexeIds: ['annexe-ml'] }), { nom: 'Client A', annexeId: 'annexe-ci' } as any),
    ).rejects.toThrow(ForbiddenException);
  });

  it('génère un code basé sur l’horodatage quand aucun n’est fourni', async () => {
    const prisma = createFakePrisma();
    prisma.client.findUnique.mockResolvedValue(null);
    const service = new ClientsService(prisma as any);

    const created = await service.create(admin(), { nom: 'Client A' } as any);

    expect(created.code).toMatch(/^CLT-/);
  });

  it('régénère un code aléatoire si le code fourni est déjà pris (pas de doublon silencieux)', async () => {
    const prisma = createFakePrisma();
    prisma.client.findUnique.mockResolvedValue({ id: 'existing' }); // le code demandé existe déjà
    const service = new ClientsService(prisma as any);

    const created = await service.create(admin(), { nom: 'Client A', code: 'CLT-DEJA-PRIS' } as any);

    expect(created.code).not.toBe('CLT-DEJA-PRIS');
    expect(created.code).toMatch(/^CLT-\d{4}$/);
  });

  it('normalise le type client sur l’enum Prisma (ETAT -> GOUVERNEMENT, valeur inconnue -> ENTREPRISE)', async () => {
    const prisma = createFakePrisma();
    prisma.client.findUnique.mockResolvedValue(null);
    const service = new ClientsService(prisma as any);

    const etat = await service.create(admin(), { nom: 'A', type: 'Etat' } as any);
    const inconnu = await service.create(admin(), { nom: 'B', type: 'Autre' } as any);

    expect(etat.type).toBe('GOUVERNEMENT');
    expect(inconnu.type).toBe('ENTREPRISE');
  });
});

describe('ClientsService.update', () => {
  it('rejette un non-admin rattachant le client à une annexe hors de son périmètre', async () => {
    const prisma = createFakePrisma();
    prisma.client.findUnique.mockResolvedValue({ id: 'c1', annexeId: 'annexe-ml' });
    const service = new ClientsService(prisma as any);

    await expect(
      service.update('c1', user({ annexeIds: ['annexe-ml'] }), { annexeId: 'annexe-ci' } as any),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe('ClientsService.remove — suppression douce', () => {
  it('désactive le client au lieu de le supprimer (actif: false)', async () => {
    const prisma = createFakePrisma();
    prisma.client.findUnique.mockResolvedValue({ id: 'c1', annexeId: null });
    const service = new ClientsService(prisma as any);

    await service.remove('c1', admin());

    expect(prisma.client.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { actif: false } });
  });
});
