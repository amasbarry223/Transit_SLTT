/**
 * Rattachement des écritures du journal saisies avec un simple nom de tiers
 * (historique, imports Excel/OCR) à un client existant.
 *
 * Les écritures sont regroupées par nom normalisé ; pour chaque groupe une
 * suggestion est proposée, que l'utilisateur valide ou corrige :
 *   - « exacte »   : même nom une fois normalisé (casse, accents, ponctuation)
 *   - « probable » : un seul client dont le nom contient celui du tiers, ou
 *                    l'inverse (4 caractères minimum) — jamais pré-cochée
 * Pas de suggestion quand plusieurs clients correspondent (homonymes).
 */
import type { Client, OperationComptable } from "@/lib/domain-types";

export type Confiance = "exacte" | "probable";

export interface GroupeRattachement {
  cle: string;
  clientNom: string;
  operations: OperationComptable[];
  total: number;
  suggestion?: { clientId: string; nom: string; confiance: Confiance };
}

export function normaliserNom(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function suggerer(nomNormalise: string, clients: Pick<Client, "id" | "nom">[]) {
  const exacts = clients.filter((c) => normaliserNom(c.nom) === nomNormalise);
  if (exacts.length === 1) return { clientId: exacts[0].id, nom: exacts[0].nom, confiance: "exacte" as const };
  if (exacts.length > 1 || nomNormalise.length < 4) return undefined;
  const proches = clients.filter((c) => {
    const n = normaliserNom(c.nom);
    return n.length >= 4 && (n.includes(nomNormalise) || nomNormalise.includes(n));
  });
  return proches.length === 1
    ? { clientId: proches[0].id, nom: proches[0].nom, confiance: "probable" as const }
    : undefined;
}

/** Écritures sans client, groupées par tiers, les mieux suggérées en premier. */
export function grouperOperationsARattacher(
  operations: OperationComptable[],
  clients: Pick<Client, "id" | "nom">[],
): GroupeRattachement[] {
  const groupes = new Map<string, GroupeRattachement>();
  for (const o of operations) {
    if (o.clientId || !o.clientNom.trim()) continue;
    const cle = normaliserNom(o.clientNom);
    if (!cle) continue;
    const g = groupes.get(cle) ?? { cle, clientNom: o.clientNom.trim(), operations: [], total: 0 };
    g.operations.push(o);
    g.total += o.montant;
    groupes.set(cle, g);
  }
  const rang = (g: GroupeRattachement) => (g.suggestion?.confiance === "exacte" ? 0 : g.suggestion ? 1 : 2);
  return [...groupes.values()]
    .map((g) => ({ ...g, suggestion: suggerer(g.cle, clients) }))
    .sort((a, b) => rang(a) - rang(b) || b.operations.length - a.operations.length);
}
