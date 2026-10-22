import type { StateCreator } from "zustand";
import type { BonLivraison, BonLivraisonInput, BonLivraisonStatut } from "@/lib/domain-types";
import type { RawBonLivraison } from "@/lib/api-types";
import type { SLTTState } from "@/lib/store";
import { api } from "@/lib/api-client";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

/** Partagé par le chargement initial (data-fetch-slice) et les mutations :
 *  un seul endroit où la forme serveur devient la forme métier. */
export function mapBonLivraison(raw: RawBonLivraison): BonLivraison {
  return {
    id: raw.id,
    reference: raw.reference || "",
    date: raw.date || "",
    bonSortieId: raw.bonSortieId || raw.bonSortie?.id || "",
    bonSortieReference: raw.bonSortie?.reference || undefined,
    clientId: raw.clientId || "",
    clientNom: raw.clientNom || "",
    annexeId: raw.annexeId || "",
    annexeNom: raw.annexe?.nom || undefined,
    lignes: (Array.isArray(raw.lignes) ? raw.lignes : []).map((l) => ({
      marchandise: l.marchandise || "",
      quantite: Number(l.quantite || 0),
      unite: l.unite || "",
    })),
    transporteurId: raw.transporteurId || undefined,
    transporteurNom: raw.transporteurNom || undefined,
    immatriculation: raw.immatriculation || undefined,
    chauffeurNom: raw.chauffeurNom || undefined,
    chauffeurTelephone: raw.chauffeurTelephone || undefined,
    adresseLivraison: raw.adresseLivraison || undefined,
    observations: raw.observations || undefined,
    statut: (raw.statut === "Livré" ? "Livré" : "En cours") as BonLivraisonStatut,
    creePar: raw.creePar || undefined,
    creeLe: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
  };
}

export interface BonsLivraisonSlice {
  bonsLivraison: BonLivraison[];
  addBonLivraison: (bonSortieId: string, input: BonLivraisonInput) => Promise<BonLivraison>;
  updateBonLivraison: (id: string, input: BonLivraisonInput) => Promise<BonLivraison>;
  removeBonLivraison: (id: string) => Promise<void>;
}

export const createBonsLivraisonSlice: StateCreator<SLTTState, [], [], BonsLivraisonSlice> = (set, get) => ({
  bonsLivraison: [],

  // Référence, client, annexe et lignes par défaut sont fixés par le serveur
  // depuis le bon de sortie : le store n'ajoute rien tant qu'il n'a pas répondu.
  addBonLivraison: async (bonSortieId, input) => {
    const created = mapBonLivraison(await api.bonsLivraison.create({ bonSortieId, ...input }));
    set((s) => ({ bonsLivraison: [created, ...s.bonsLivraison] }));
    await get().addAuditLog(
      AUDIT_MODULE.Bons,
      AUDIT_ACTION.Creation,
      `Bon de livraison ${created.reference} créé (bon de sortie ${created.bonSortieReference ?? bonSortieId})`,
    );
    return created;
  },

  updateBonLivraison: async (id, input) => {
    const updated = mapBonLivraison(await api.bonsLivraison.update(id, input));
    set((s) => ({ bonsLivraison: s.bonsLivraison.map((b) => (b.id === id ? updated : b)) }));
    const action = input.statut === "Livré" ? AUDIT_ACTION.Validation : AUDIT_ACTION.Modification;
    const detail = input.statut === "Livré" ? "marqué livré" : "modifié";
    await get().addAuditLog(AUDIT_MODULE.Bons, action, `Bon de livraison ${updated.reference} ${detail}`);
    return updated;
  },

  removeBonLivraison: async (id) => {
    const bon = get().bonsLivraison.find((b) => b.id === id);
    await api.bonsLivraison.remove(id);
    set((s) => ({ bonsLivraison: s.bonsLivraison.filter((b) => b.id !== id) }));
    await get().addAuditLog(AUDIT_MODULE.Bons, AUDIT_ACTION.Suppression, `Bon de livraison ${bon?.reference ?? id} supprimé`);
  },
});
