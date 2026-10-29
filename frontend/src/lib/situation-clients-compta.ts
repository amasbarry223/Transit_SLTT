/**
 * Situation financière des clients (onglet « Clients » de la Comptabilité).
 *
 * Source unique des montants : `financesDossier` (dossier-finances.ts), la
 * même que la fiche « Situation du client » et le détail dossier.
 *   - dû        = Σ totalContrat des dossiers + factures libres (sans dossier)
 *   - encaissé  = Σ paiements des dossiers + paiements des factures libres
 *   - reste dû  = dû − encaissé, plancher à 0 ; l'excédent est un trop-perçu
 *                 affiché à part (jamais masqué)
 *   - dépenses  = Σ dépenses des dossiers (coût engagé, pas une dette client)
 *
 * Une facture liée à un dossier n'est pas recomptée : le dossier porte déjà le
 * contrat et ses règlements. Les opérations du journal ne sont PAS mêlées au
 * dû/encaissé (elles ne sont pas encore reliées aux paiements de dossier — cf.
 * plan de refonte) ; elles restent consultables dans la fiche du client.
 */
import type { Annexe, Client, Contrat, Dossier, Facture, OperationComptable } from "@/lib/domain-types";
import { financesDossier } from "@/lib/domain/dossier-finances";

export const TOUTES_ANNEXES = "all";

export interface ClientSituation {
  clientId: string;
  clientNom: string;
  annexeId?: string;
  annexeNom?: string;
  nbDossiers: number;
  nbContrats: number;
  /** Factures libres (non rattachées à un dossier) prises en compte. */
  nbFacturesLibres: number;
  totalDu: number;
  totalDepenses: number;
  avancesPayees: number;
  resteAPayer: number;
  tropPercu: number;
}

interface BuildInput {
  clients: Client[];
  dossiers: Dossier[];
  contrats: Contrat[];
  factures: Facture[];
  annexes: Annexe[];
  annexeFilter: string;
}

const inAnnexe = (filter: string, annexeId?: string | null) => filter === TOUTES_ANNEXES || annexeId === filter;

/** Index par client : évite un parcours complet des listes pour chaque client (O(n²)). */
function grouperParClient<T extends { clientId: string }>(rows: readonly T[], garder: (r: T) => boolean): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const r of rows) {
    if (!garder(r)) continue;
    const list = map.get(r.clientId);
    if (list) list.push(r);
    else map.set(r.clientId, [r]);
  }
  return map;
}

export function buildSituationsClients({
  clients,
  dossiers,
  contrats,
  factures,
  annexes,
  annexeFilter,
}: BuildInput): ClientSituation[] {
  const dossiersParClient = grouperParClient(dossiers, (d) => inAnnexe(annexeFilter, d.annexeId));
  const facturesParClient = grouperParClient(
    factures,
    (f) => !f.dossierId && f.statut !== "Annulée" && f.statut !== "Brouillon" && inAnnexe(annexeFilter, f.annexeId),
  );
  const contratsParClient = grouperParClient(contrats, (c) => inAnnexe(annexeFilter, c.annexeId));
  const nomAnnexe = new Map(annexes.map((a) => [a.id, a.nom]));

  const rows: ClientSituation[] = [];
  for (const client of clients) {
    const clientDossiers = dossiersParClient.get(client.id) ?? [];
    const facturesLibres = facturesParClient.get(client.id) ?? [];
    if (clientDossiers.length === 0 && facturesLibres.length === 0) continue;

    let totalDu = 0;
    let avancesPayees = 0;
    let totalDepenses = 0;
    for (const d of clientDossiers) {
      const f = financesDossier(d);
      totalDu += f.totalContrat;
      avancesPayees += f.montantPaye;
      totalDepenses += f.totalDepenses;
    }
    for (const f of facturesLibres) {
      totalDu += f.montantTTC;
      avancesPayees += f.montantPaye;
    }

    const solde = totalDu - avancesPayees;
    rows.push({
      clientId: client.id,
      clientNom: client.nom,
      annexeId: client.annexeId,
      annexeNom: client.annexeId ? nomAnnexe.get(client.annexeId) : undefined,
      nbDossiers: clientDossiers.length,
      nbContrats: contratsParClient.get(client.id)?.length ?? 0,
      nbFacturesLibres: facturesLibres.length,
      totalDu,
      totalDepenses,
      avancesPayees,
      resteAPayer: Math.max(0, solde),
      tropPercu: Math.max(0, -solde),
    });
  }
  return rows;
}

export type SoldeFilter = "all" | "debiteur" | "solde" | "crediteur";

export function matchesSoldeFilter(s: ClientSituation, filter: SoldeFilter): boolean {
  if (filter === "debiteur") return s.resteAPayer > 0;
  if (filter === "solde") return s.resteAPayer === 0 && s.tropPercu === 0;
  if (filter === "crediteur") return s.tropPercu > 0;
  return true;
}

/**
 * Opérations du journal d'un client : rattachement par `clientId` ou par un de
 * ses dossiers uniquement (plus de rapprochement par nom, qui fusionnait les
 * homonymes), dans l'annexe filtrée.
 */
export function operationsDuClient(
  operations: OperationComptable[],
  clientId: string,
  dossierIds: ReadonlySet<string>,
  annexeFilter: string,
): OperationComptable[] {
  return operations
    .filter(
      (o) =>
        inAnnexe(annexeFilter, o.annexeId) &&
        (o.clientId === clientId || (o.dossierId !== undefined && dossierIds.has(o.dossierId))),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}
