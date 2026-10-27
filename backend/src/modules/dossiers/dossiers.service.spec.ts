import { BadRequestException } from '@nestjs/common';
import { DossiersService } from './dossiers.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

/**
 * Prisma en mémoire, limité à ce que touche DossiersService : un dossier,
 * ses dépenses et ses paiements. Les montants des lignes sont des BigInt
 * comme en base.
 */
function createFakeDb(dossierOverrides: Record<string, unknown> = {}) {
  const state = {
    dossier: {
      id: 'dossier-1',
      numero: 'DOS-1',
      annexeId: 'annexe-1',
      statut: 'EN_COURS',
      totalContrat: 0,
      montantPaye: 0,
      dateSolde: null as Date | null,
      conteneurs: [],
      ...dossierOverrides,
    } as Record<string, any>,
    depenses: [] as any[],
    paiements: [] as any[],
  };
  let seq = 0;

  const lignesDelegate = (key: 'depenses' | 'paiements') => ({
    findMany: vi.fn(async () => state[key].map((l) => ({ id: l.id }))),
    count: vi.fn(async () => state[key].length),
    deleteMany: vi.fn(async ({ where }: any) => {
      state[key] = state[key].filter((l) => where.id.notIn.includes(l.id));
    }),
    updateMany: vi.fn(async ({ where, data }: any) => {
      state[key] = state[key].map((l) => (l.id === where.id && l.dossierId === where.dossierId ? { ...l, ...data } : l));
    }),
    create: vi.fn(async ({ data }: any) => {
      const row = { id: `${key}-${++seq}`, createdAt: new Date(), ...data };
      state[key].push(row);
      return row;
    }),
  });

  const db: any = {
    dossier: {
      findUnique: vi.fn(async () => ({
        ...state.dossier,
        depensesDossier: [...state.depenses],
        paiements: [...state.paiements],
      })),
      create: vi.fn(async ({ data }: any) => {
        const { conteneurs: _c, ...rest } = data;
        Object.assign(state.dossier, rest);
        return { ...state.dossier };
      }),
      update: vi.fn(async ({ data }: any) => {
        Object.assign(state.dossier, data);
        return { ...state.dossier };
      }),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    dossierDepense: lignesDelegate('depenses'),
    dossierPaiement: lignesDelegate('paiements'),
    trackingPublic: { create: vi.fn(), updateMany: vi.fn(async () => undefined) },
    etapeDossier: { createMany: vi.fn() },
    conteneur: { create: vi.fn() },
  };
  db.$transaction = vi.fn(async (cb: (tx: unknown) => unknown) => cb(db));
  return { db, state };
}

// Fiche Excel "Situation du client" : 6 dépenses dont le droit de douane.
const depensesExcel = [
  { nature: 'Frais', categorie: 'TRANSPORT', montant: 3_100_000 },
  { nature: 'Frais', categorie: 'MANUTENTION', montant: 250_000 },
  { nature: 'Avance', categorie: 'AVANCE', montant: 650_000 },
  { nature: 'Frais', categorie: 'DIVERS', montant: 100_000 },
  { nature: 'Droit de douane', categorie: 'DOUANE', montant: 6_500_000 },
  { nature: 'Divers', categorie: 'DIVERS', montant: 1_100_000 },
];

describe('DossiersService — totaux calculés côté serveur', () => {
  it('création : finances calculées depuis les lignes, totaux envoyés par le front ignorés', async () => {
    const { db, state } = createFakeDb();
    const service = new DossiersService(db);

    const res: any = await service.create(admin(), {
      annexeId: 'annexe-1',
      clientId: 'client-1',
      totalContrat: 12_000_000,
      montantInvesti: 99_999_999, // ancien champ : ignoré
      montantPaye: 1, // ignoré quand des paiements détaillés sont fournis
      depensesDossier: depensesExcel,
      paiements: [
        { montant: 10_800_000, mode: 'VIREMENT' },
        { montant: 1_200_000, mode: 'WAVE' },
      ],
    });

    expect(state.dossier.totalContrat).toBe(12_000_000);
    expect(state.dossier.montantPaye).toBe(12_000_000);
    expect(res.finances).toEqual({
      totalContrat: 12_000_000,
      montantPaye: 12_000_000,
      resteAPayer: 0,
      totalDepenses: 11_700_000,
      beneficeNet: 300_000,
      statutPaiement: 'SOLDE',
      perte: false,
    });
    expect(typeof res.paiements[0].montant).toBe('number');
    expect(typeof res.depensesDossier[0].montant).toBe('number');
  });

  it('ancien format (front en cache) : prestation → total contrat, douane + circuit → 2 dépenses de reprise', async () => {
    const { db, state } = createFakeDb();
    const service = new DossiersService(db);

    const res: any = await service.create(admin(), {
      annexeId: 'annexe-1',
      clientId: 'client-1',
      fraisPrestation: 12_000_000,
      droitDouane: 6_500_000,
      fraisCircuit: 5_200_000,
      montantPaye: 200_000,
    });

    expect(state.dossier.totalContrat).toBe(12_000_000);
    expect(state.depenses.map((d) => [d.nature, d.categorie, Number(d.montant)])).toEqual([
      ['Droit de douane', 'DOUANE', 6_500_000],
      ['Frais de circuit (reprise)', 'DIVERS', 5_200_000],
    ]);
    expect(state.paiements[0].reference).toBe('Paiement (reprise)');
    expect(res.finances.beneficeNet).toBe(300_000);
  });

  it('modification : remplace les dépenses (mise à jour, ajout, suppression)', async () => {
    const { db, state } = createFakeDb({ totalContrat: 1_000_000 });
    state.depenses.push(
      { id: 'd1', dossierId: 'dossier-1', montant: BigInt(100), nature: 'A', categorie: 'DIVERS' },
      { id: 'd2', dossierId: 'dossier-1', montant: BigInt(200), nature: 'B', categorie: 'DIVERS' },
    );
    const service = new DossiersService(db);

    const res: any = await service.update('dossier-1', admin(), {
      depensesDossier: [
        { id: 'd1', nature: 'Transport', categorie: 'TRANSPORT', montant: 300_000 },
        { nature: 'Avance client', categorie: 'AVANCE', montant: 50_000 },
      ],
    });

    expect(state.depenses.map((l) => l.id)).not.toContain('d2');
    expect(state.depenses).toHaveLength(2);
    expect(res.finances.totalDepenses).toBe(350_000);
    expect(res.finances.beneficeNet).toBe(650_000);
  });
});

describe('DossiersService.enregistrerPaiement', () => {
  it('crée une ligne de paiement et recalcule montantPaye', async () => {
    const { db, state } = createFakeDb({ totalContrat: 100_000 });
    const service = new DossiersService(db);

    const res: any = await service.enregistrerPaiement('dossier-1', admin(), { montant: 40_000, mode: 'ORANGE_MONEY' });

    expect(state.paiements).toHaveLength(1);
    expect(state.paiements[0].mode).toBe('ORANGE_MONEY');
    expect(state.dossier.montantPaye).toBe(40_000);
    expect(res.finances.statutPaiement).toBe('PARTIEL');
  });

  it('accepte un trop-perçu et le signale par le statut', async () => {
    const { db, state } = createFakeDb({ totalContrat: 100_000 });
    const service = new DossiersService(db);

    const res: any = await service.enregistrerPaiement('dossier-1', admin(), { montant: 120_000 });

    expect(state.dossier.montantPaye).toBe(120_000);
    expect(res.finances.resteAPayer).toBe(-20_000);
    expect(res.finances.statutPaiement).toBe('TROP_PERCU');
  });

  it('rejette un montant nul ou négatif', async () => {
    const { db } = createFakeDb();
    const service = new DossiersService(db);

    await expect(service.enregistrerPaiement('dossier-1', admin(), { montant: 0 })).rejects.toThrow(BadRequestException);
  });
});
