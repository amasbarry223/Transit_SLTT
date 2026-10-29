import { calculerCreances } from './creances';

const now = new Date('2026-06-15T12:00:00Z');

describe('calculerCreances — le dossier fait foi', () => {
  it('compte le reste des dossiers et des factures libres, pas celui des factures liées', () => {
    const res = calculerCreances(
      [{ id: 'd1', numero: 'D-1', totalContrat: 1000, montantPaye: 400, client: { nom: 'ACME' } }],
      [
        { id: 'f1', numero: 'F-1', dossierId: 'd1', statut: 'ENVOYEE', montantTtc: 1180, montantPaye: 0 },
        { id: 'f2', numero: 'F-2', dossierId: null, statut: 'ENVOYEE', montantTtc: 300, montantPaye: 100 },
        { id: 'f3', numero: 'F-3', dossierId: null, statut: 'BROUILLON', montantTtc: 999, montantPaye: 0 },
        { id: 'f4', numero: 'F-4', dossierId: null, statut: 'ANNULEE', montantTtc: 999, montantPaye: 0 },
      ],
      now,
    );
    expect(res.totalARecouvrer).toBe(600 + 200);
  });

  it("donne au dossier l'échéance de sa facture pour la balance âgée, et trie les risques par retard", () => {
    const res = calculerCreances(
      [
        { id: 'd1', numero: 'D-1', totalContrat: 1000, montantPaye: 0 },
        { id: 'd2', numero: 'D-2', totalContrat: 500, montantPaye: 0 },
      ],
      [
        { id: 'f1', numero: 'F-1', dossierId: 'd1', statut: 'ENVOYEE', montantTtc: 1000, montantPaye: 0, dateEcheance: '2026-06-05' },
        { id: 'f2', numero: 'F-2', dossierId: 'd2', statut: 'ENVOYEE', montantTtc: 500, montantPaye: 0, dateEcheance: '2026-02-01' },
      ],
      now,
    );
    expect(res.montantEchu).toBe(1500);
    expect(res.aging['0-30j'].montant).toBe(1000);
    expect(res.aging['+90j'].montant).toBe(500);
    expect(res.topRiskClients.map((r) => r.referenceDossierOuFacture)).toEqual(['D-2', 'D-1']);
  });

  it("classe non échu un dossier sans facture (pas d'échéance de paiement)", () => {
    const res = calculerCreances([{ id: 'd1', numero: 'D-1', totalContrat: 100, montantPaye: 0 }], [], now);
    expect(res).toMatchObject({ totalARecouvrer: 100, montantNonEchu: 100, montantEchu: 0 });
  });
});
