import { BadRequestException } from '@nestjs/common';
import { FacturesService } from './factures.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function baseFacture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'f1',
    numero: 'FAC-0001',
    annexeId: 'annexe-ml',
    clientId: 'client-1',
    montantHt: 1000,
    tauxTva: 18,
    montantTva: 180,
    montantTtc: 1180,
    montantPaye: 0,
    statut: 'BROUILLON',
    dateEmission: new Date('2026-01-01'),
    dateEcheance: null,
    notes: null,
    lignes: [{ id: 'l1', designation: 'Service X', quantite: 1, prixUnitaire: 1000, montantTotal: 1000 }],
    transactions: [],
    ...overrides,
  };
}

function createFakePrisma(facture: ReturnType<typeof baseFacture>) {
  const tx = {
    ligneFacture: { deleteMany: vi.fn() },
    facture: { update: vi.fn((args: any) => ({ ...facture, ...args.data })) },
  };
  const prisma = {
    facture: {
      findUnique: vi.fn().mockResolvedValue(facture),
      update: tx.facture.update,
    },
    ligneFacture: tx.ligneFacture,
    setting: { findUnique: vi.fn().mockResolvedValue(null) },
    $transaction: vi.fn(async (cb: (t: unknown) => unknown) => cb(tx)),
  };
  return { prisma, tx };
}

describe('FacturesService.update', () => {
  it("ne touche NI les montants NI les lignes existantes quand `lignes` est omis du payload (pas d'effacement silencieux)", async () => {
    const facture = baseFacture();
    const { prisma, tx } = createFakePrisma(facture);
    const service = new FacturesService(prisma as any);

    const result = await service.update('f1', admin(), { notes: 'Mise à jour des notes seulement' });

    expect(tx.ligneFacture.deleteMany).not.toHaveBeenCalled();
    const updateCall = tx.facture.update.mock.calls[0][0];
    expect(updateCall.data.montantHt).toBeUndefined();
    expect(updateCall.data.montantTva).toBeUndefined();
    expect(updateCall.data.montantTtc).toBeUndefined();
    expect(updateCall.data.lignes).toBeUndefined();
    expect(result.montantHt).toBe(1000); // valeur d'origine préservée par le mock spread
  });

  it('recalcule montants et lignes quand `lignes` est fourni', async () => {
    const facture = baseFacture();
    const { prisma, tx } = createFakePrisma(facture);
    const service = new FacturesService(prisma as any);

    await service.update('f1', admin(), {
      lignes: [{ designation: 'Nouvelle ligne', quantite: 2, prixUnitaire: 500 }],
      tauxTva: 18,
    });

    expect(tx.ligneFacture.deleteMany).toHaveBeenCalledWith({ where: { factureId: 'f1' } });
    const updateCall = tx.facture.update.mock.calls[0][0];
    expect(updateCall.data.montantHt).toBe(1000);
    expect(updateCall.data.montantTtc).toBe(1180);
  });

  it('rejette la modification d’une facture déjà encaissée, lignes ou pas', async () => {
    const facture = baseFacture({ montantPaye: 500, statut: 'PARTIELLEMENT_PAYEE' });
    const { prisma } = createFakePrisma(facture);
    const service = new FacturesService(prisma as any);

    await expect(service.update('f1', admin(), { notes: 'x' })).rejects.toThrow(BadRequestException);
  });
});
