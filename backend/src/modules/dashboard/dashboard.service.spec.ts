import { DashboardService } from './dashboard.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function createEmptyPrisma() {
  return {
    dossier: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
    client: { count: vi.fn().mockResolvedValue(0) },
    facture: { findMany: vi.fn().mockResolvedValue([]) },
    depense: { aggregate: vi.fn().mockResolvedValue({ _sum: { montant: null } }) },
    caisse: { aggregate: vi.fn().mockResolvedValue({ _sum: { soldeActuel: null } }) },
    transactionCaisse: { findMany: vi.fn().mockResolvedValue([]) },
    stockItem: { findMany: vi.fn().mockResolvedValue([]) },
  };
}

describe('DashboardService.getDashboardAnalytics', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("n'affiche aucune donnée fabriquée quand il n'y a aucune activité réelle — tout redescend à 0, jamais un nombre inventé", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

    const prisma = createEmptyPrisma();
    const service = new DashboardService(prisma as any);
    const result = await service.getDashboardAnalytics(admin());

    // Avant correctif : ces champs retombaient sur des constantes inventées
    // (15000000 + m*1200000, 12000000*2, 5.4, 12.5…) dès que la vraie donnée
    // valait 0 — reproduisant exactement le scénario "aucune activité ce mois".
    for (const point of result.cashFlowStats.monthlyHistory) {
      expect(point.entrees).toBe(0);
      expect(point.sorties).toBe(0);
      expect(point.soldeNet).toBe(0);
    }
    for (const point of result.invoiceStats.monthlyHistory) {
      expect(point.prestationsHT).toBe(0);
      expect(point.tvaCollectee).toBe(0);
      expect(point.totalFactureTTC).toBe(0);
      expect(point.deboursRefactures).toBe(0);
    }
    expect(result.cashFlowStats.variationMois).toBe(0);
    expect(result.invoiceStats.summary.variationPrestations).toBe(0);
    expect(result.cashFlowStats.bonsEnAttente).toBe(0);

    for (const day of result.transitStats.period7Days) {
      expect(day.maritime).toBe(0);
      expect(day.terrestre).toBe(0);
      expect(day.aerien).toBe(0);
      expect(day.total).toBe(0);
    }
  });

  it('calcule une variation réelle (positive) entre le dernier mois et le précédent à partir des factures réellement émises', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

    const prisma = createEmptyPrisma();
    prisma.facture.findMany.mockResolvedValue([
      // Mai 2026 (mois précédent) : 1 000 000 HT
      { id: 'f-may', numero: 'FAC-1', statut: 'PAYEE', montantHt: 1000000, montantTva: 180000, montantTtc: 1180000, montantPaye: 1180000, dateEmission: new Date('2026-05-10'), dateEcheance: null, client: { id: 'c1', nom: 'Client A' } },
      // Juin 2026 (dernier mois) : 1 500 000 HT
      { id: 'f-june', numero: 'FAC-2', statut: 'ENVOYEE', montantHt: 1500000, montantTva: 270000, montantTtc: 1770000, montantPaye: 0, dateEmission: new Date('2026-06-05'), dateEcheance: null, client: { id: 'c1', nom: 'Client A' } },
    ]);
    const service = new DashboardService(prisma as any);
    const result = await service.getDashboardAnalytics(admin());

    // (1 500 000 - 1 000 000) / 1 000 000 = +50%
    expect(result.invoiceStats.summary.variationPrestations).toBe(50);
    expect(result.invoiceStats.summary.prestationsHT).toBe(2500000);
  });
});
