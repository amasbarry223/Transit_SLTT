/**
 * Créances clients du tableau de bord — même règle que le front
 * (frontend/src/lib/client-stats.ts) : le DOSSIER fait foi.
 *
 *   reste à recouvrer = Σ reste des dossiers (total contrat − règlements, ≥ 0)
 *                     + Σ reste des factures libres (sans dossier)
 *
 * Une facture liée à un dossier n'est pas recomptée (son encaissement crée un
 * règlement du dossier) ; elle donne seulement son échéance au dossier pour la
 * balance âgée. Un dossier sans facture n'a pas d'échéance de paiement : il est
 * classé « non échu ».
 */

export interface DossierCreance {
  id: string;
  numero: string;
  totalContrat: number | null;
  montantPaye: number | null;
  client?: { nom?: string | null } | null;
}

export interface FactureCreance {
  id: string;
  numero: string;
  dossierId?: string | null;
  statut: string;
  montantTtc: number | null;
  montantPaye: number | null;
  dateEcheance?: Date | string | null;
  client?: { nom?: string | null } | null;
}

type Tranche = '0-30j' | '31-60j' | '61-90j' | '+90j';

export interface RisqueClient {
  id: string;
  clientNom: string;
  referenceDossierOuFacture: string;
  montant: number;
  echeance: string;
  statut: 'En retard' | 'À risque' | 'Contentieux' | 'En cours';
  joursRetard: number;
}

export interface Creances {
  totalARecouvrer: number;
  montantEchu: number;
  montantNonEchu: number;
  aging: Record<Tranche, { montant: number; count: number }>;
  topRiskClients: RisqueClient[];
}

const facturesActives = (f: FactureCreance) => f.statut !== 'ANNULEE' && f.statut !== 'BROUILLON';
const JOUR_MS = 24 * 60 * 60 * 1000;

export function calculerCreances(dossiers: DossierCreance[], factures: FactureCreance[], now: Date): Creances {
  const aging: Creances['aging'] = {
    '0-30j': { montant: 0, count: 0 },
    '31-60j': { montant: 0, count: 0 },
    '61-90j': { montant: 0, count: 0 },
    '+90j': { montant: 0, count: 0 },
  };

  // Échéance d'un dossier = la plus tardive de ses factures actives.
  const echeanceDossier = new Map<string, Date>();
  for (const f of factures) {
    if (!f.dossierId || !facturesActives(f) || !f.dateEcheance) continue;
    const e = new Date(f.dateEcheance);
    const prev = echeanceDossier.get(f.dossierId);
    if (!prev || e > prev) echeanceDossier.set(f.dossierId, e);
  }

  const items: Array<{ id: string; ref: string; client: string; reste: number; echeance: Date | null }> = [];
  for (const d of dossiers) {
    const reste = Math.max(0, Math.round(Number(d.totalContrat || 0) - Number(d.montantPaye || 0)));
    if (reste > 0) {
      items.push({ id: d.id, ref: d.numero, client: d.client?.nom || 'Client', reste, echeance: echeanceDossier.get(d.id) ?? null });
    }
  }
  for (const f of factures) {
    if (f.dossierId || !facturesActives(f)) continue;
    const reste = Math.max(0, Number(f.montantTtc || 0) - Number(f.montantPaye || 0));
    if (reste > 0) {
      items.push({ id: f.id, ref: f.numero, client: f.client?.nom || 'Client', reste, echeance: f.dateEcheance ? new Date(f.dateEcheance) : null });
    }
  }

  let totalARecouvrer = 0;
  let montantEchu = 0;
  let montantNonEchu = 0;
  const risques: RisqueClient[] = [];
  for (const it of items) {
    totalARecouvrer += it.reste;
    const joursRetard = it.echeance ? Math.floor((now.getTime() - it.echeance.getTime()) / JOUR_MS) : 0;
    if (joursRetard <= 0) {
      montantNonEchu += it.reste;
      aging['0-30j'].montant += it.reste;
      aging['0-30j'].count += 1;
      continue;
    }
    montantEchu += it.reste;
    const tranche: Tranche = joursRetard <= 30 ? '0-30j' : joursRetard <= 60 ? '31-60j' : joursRetard <= 90 ? '61-90j' : '+90j';
    aging[tranche].montant += it.reste;
    aging[tranche].count += 1;
    risques.push({
      id: it.id,
      clientNom: it.client,
      referenceDossierOuFacture: it.ref,
      montant: it.reste,
      echeance: it.echeance!.toLocaleDateString('fr-FR'),
      statut: joursRetard > 60 ? 'Contentieux' : joursRetard > 15 ? 'En retard' : 'À risque',
      joursRetard,
    });
  }

  // Les 5 créances les plus en retard (avant : les 5 premières rencontrées).
  risques.sort((a, b) => b.joursRetard - a.joursRetard);
  return { totalARecouvrer, montantEchu, montantNonEchu, aging, topRiskClients: risques.slice(0, 5) };
}
