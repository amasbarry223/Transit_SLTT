import type { StateCreator } from "zustand";
import { getConnectedUserName } from "@/lib/store/connected-user";
import type { RecuPaiement, RecuPaiementInput } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export interface RecusPaiementSlice {
  recusPaiement: RecuPaiement[];
  recuPaiementSeq: number;
  addRecuPaiement: (input: RecuPaiementInput) => Promise<RecuPaiement>;
  updateRecuPaiement: (id: string, input: RecuPaiementInput) => Promise<void>;
  removeRecuPaiement: (id: string) => Promise<void>;
}

import { api } from "@/lib/api-client";

export const createRecusPaiementSlice: StateCreator<
  SLTTState,
  [],
  [],
  RecusPaiementSlice
> = (set, get) => ({
  recusPaiement: [],
  recuPaiementSeq: 1,

  addRecuPaiement: async (input) => {
    const creePar = getConnectedUserName();
    const seq = get().recuPaiementSeq;
    const fallbackRef = `RECU-${String(seq).padStart(4, "0")}`;

    const reference = fallbackRef;
    const reste = Math.max(0, input.somme - input.montantPaye);
    const statut = reste === 0 ? "SOLDE" : input.montantPaye > 0 ? "PARTIEL" : "EN_ATTENTE";

    // Persistance obligatoire : un reçu sans écriture serveur disparaissait
    // silencieusement au rechargement, sans aucune erreur montrée.
    const created = await api.recusPaiement.create({
      reference,
      annexeId: input.annexeId,
      nom: input.nom,
      prenom: input.prenom,
      somme: input.somme,
      motif: input.motif,
      montantPaye: input.montantPaye,
      creePar,
    });

    const newRecu: RecuPaiement = {
      id: created?.id ?? crypto.randomUUID(),
      reference,
      annexeId: input.annexeId,
      annexeNom: get().annexes.find((a) => a.id === input.annexeId)?.nom,
      nom: input.nom,
      prenom: input.prenom,
      somme: input.somme,
      motif: input.motif,
      montantPaye: input.montantPaye,
      reste,
      statut,
      creePar,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      recusPaiement: [newRecu, ...s.recusPaiement],
      recuPaiementSeq: seq + 1,
    }));
    await get().addAuditLog(
      AUDIT_MODULE.RecusPaiement,
      AUDIT_ACTION.Creation,
      `Reçu ${reference} — ${newRecu.nom} ${newRecu.prenom} (${input.montantPaye.toLocaleString("fr-FR")} FCFA payés sur ${input.somme.toLocaleString("fr-FR")})`,
      undefined,
      { sourceType: "recu_paiement", sourceId: newRecu.id },
    );
    return newRecu;
  },

  updateRecuPaiement: async (id, input) => {
    const reste = Math.max(0, input.somme - input.montantPaye);
    const statut = reste === 0 ? "SOLDE" : input.montantPaye > 0 ? "PARTIEL" : "EN_ATTENTE";

    await api.recusPaiement.update(id, input);

    const existing = get().recusPaiement.find((r) => r.id === id);
    set((s) => ({
      recusPaiement: s.recusPaiement.map((r) =>
        r.id === id
          ? {
              ...r,
              annexeId: input.annexeId,
              annexeNom: get().annexes.find((a) => a.id === input.annexeId)?.nom ?? r.annexeNom,
              nom: input.nom,
              prenom: input.prenom,
              somme: input.somme,
              motif: input.motif,
              montantPaye: input.montantPaye,
              reste,
              statut,
            }
          : r,
      ),
    }));
    if (existing) {
      await get().addAuditLog(
        AUDIT_MODULE.RecusPaiement,
        AUDIT_ACTION.Modification,
        `Reçu ${existing.reference} modifié`,
        undefined,
        { sourceType: "recu_paiement", sourceId: id },
      );
    }
  },

  removeRecuPaiement: async (id) => {
    await api.recusPaiement.delete(id);

    const recu = get().recusPaiement.find((r) => r.id === id);
    set((s) => ({ recusPaiement: s.recusPaiement.filter((r) => r.id !== id) }));
    if (recu) {
      await get().addAuditLog(
        AUDIT_MODULE.RecusPaiement,
        AUDIT_ACTION.Suppression,
        `Reçu ${recu.reference} supprimé`,
        undefined,
        { sourceType: "recu_paiement", sourceId: id },
      );
    }
  },
});
