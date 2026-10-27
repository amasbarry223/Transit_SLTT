import { calculerFinancesDossier } from './dossier-finances';

// Mêmes cas que frontend/src/lib/domain/dossier-finances.test.ts — fiche Excel
// "Situation du client" (11/08/2026, conteneur pompes à eau et accessoires).
const depensesExcel = [3_100_000, 250_000, 650_000, 100_000, 6_500_000, 1_100_000].map((montant) => ({ montant }));
const contrat = 12_000_000;

describe('calculerFinancesDossier', () => {
  it('cas Excel : payé 12 000 000, reste 0, dépenses 11 700 000, bénéfice 300 000, soldé', () => {
    const f = calculerFinancesDossier({
      totalContrat: contrat,
      paiements: [{ montant: 10_800_000 }, { montant: 1_200_000 }],
      depenses: depensesExcel,
    });
    expect(f).toEqual({
      totalContrat: 12_000_000,
      montantPaye: 12_000_000,
      resteAPayer: 0,
      totalDepenses: 11_700_000,
      beneficeNet: 300_000,
      statutPaiement: 'SOLDE',
      perte: false,
    });
  });

  it('paiement partiel : reste 1 200 000, partiel, bénéfice inchangé', () => {
    const f = calculerFinancesDossier({ totalContrat: contrat, paiements: [{ montant: 10_800_000 }], depenses: depensesExcel });
    expect(f.resteAPayer).toBe(1_200_000);
    expect(f.statutPaiement).toBe('PARTIEL');
    expect(f.beneficeNet).toBe(300_000);
  });

  it('aucun paiement : impayé', () => {
    const f = calculerFinancesDossier({ totalContrat: contrat, paiements: [], depenses: depensesExcel });
    expect(f.montantPaye).toBe(0);
    expect(f.resteAPayer).toBe(12_000_000);
    expect(f.statutPaiement).toBe('IMPAYE');
  });

  it('dépenses supérieures au contrat : bénéfice négatif, perte', () => {
    const f = calculerFinancesDossier({ totalContrat: 10_000_000, paiements: [], depenses: depensesExcel });
    expect(f.beneficeNet).toBe(-1_700_000);
    expect(f.perte).toBe(true);
  });

  it('trop-perçu : reste négatif', () => {
    const f = calculerFinancesDossier({ totalContrat: contrat, paiements: [{ montant: 12_500_000 }] });
    expect(f.resteAPayer).toBe(-500_000);
    expect(f.statutPaiement).toBe('TROP_PERCU');
  });

  it('migration : douane 6 500 000 + circuit (reprise) 5 200 000 sur contrat 12 000 000 → bénéfice 300 000', () => {
    const f = calculerFinancesDossier({
      totalContrat: 12_000_000,
      depenses: [{ montant: 6_500_000 }, { montant: 5_200_000 }],
    });
    expect(f.totalDepenses).toBe(11_700_000);
    expect(f.beneficeNet).toBe(300_000);
  });

  it('accepte des BigInt et arrondit les Float à l\'entier', () => {
    const f = calculerFinancesDossier({
      totalContrat: 1000.4,
      paiements: [{ montant: BigInt(1000) }],
      depenses: [{ montant: BigInt(300) }],
    });
    expect(f.totalContrat).toBe(1000);
    expect(f.beneficeNet).toBe(700);
    expect(f.statutPaiement).toBe('SOLDE');
  });
});
