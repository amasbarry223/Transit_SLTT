import type { StateCreator } from "zustand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getConnectedUserName } from "@/lib/store/connected-user";
import type { RecuPaiement, RecuPaiementInput } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import type { RecuPaiementRow } from "@/lib/db-rows";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export function mapRecuPaiementFromDb(row: RecuPaiementRow): RecuPaiement {
  return {
    id: row.id,
    reference: row.reference,
    annexeId: row.annexe_id,
    annexeNom: row.annexes?.nom,
    nom: row.nom,
    prenom: row.prenom,
    somme: Number(row.somme),
    motif: row.motif,
    montantPaye: Number(row.montant_paye),
    reste: Number(row.reste),
    statut: row.statut,
    creePar: row.cree_par || undefined,
    createdAt: row.created_at,
  };
}

export interface RecusPaiementSlice {
  recusPaiement: RecuPaiement[];
  recuPaiementSeq: number;
  addRecuPaiement: (input: RecuPaiementInput) => Promise<RecuPaiement>;
  updateRecuPaiement: (id: string, input: RecuPaiementInput) => Promise<void>;
  removeRecuPaiement: (id: string) => Promise<void>;
}

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

    if (!isSupabaseConfigured) {
      const reference = fallbackRef;
      const reste = Math.max(0, input.somme - input.montantPaye);
      const statut = reste === 0 ? "SOLDE" : input.montantPaye > 0 ? "PARTIEL" : "EN_ATTENTE";
      const newRecu: RecuPaiement = {
        id: crypto.randomUUID(),
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
    }

    const { data: refData, error: refError } = await supabase.rpc("next_recu_reference");
    if (refError) throw refError;
    const reference = String(refData);

    const { data, error } = await supabase
      .from("recus_paiement")
      .insert({
        reference,
        annexe_id: input.annexeId,
        nom: input.nom,
        prenom: input.prenom,
        somme: input.somme,
        motif: input.motif,
        montant_paye: input.montantPaye,
        cree_par: creePar,
      })
      .select("*, annexes(nom)")
      .single();
    if (error) throw error;

    const newRecu = mapRecuPaiementFromDb(data);
    set((s) => ({
      recusPaiement: [newRecu, ...s.recusPaiement],
      recuPaiementSeq: Math.max(
        s.recuPaiementSeq,
        Number.parseInt(reference.replace(/^RECU-/, ""), 10) + 1,
      ),
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
    if (!isSupabaseConfigured) {
      const reste = Math.max(0, input.somme - input.montantPaye);
      const statut = reste === 0 ? "SOLDE" : input.montantPaye > 0 ? "PARTIEL" : "EN_ATTENTE";
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
      return;
    }

    const { data, error } = await supabase
      .from("recus_paiement")
      .update({
        annexe_id: input.annexeId,
        nom: input.nom,
        prenom: input.prenom,
        somme: input.somme,
        motif: input.motif,
        montant_paye: input.montantPaye,
      })
      .eq("id", id)
      .select("*, annexes(nom)")
      .single();
    if (error) throw error;

    const updated = mapRecuPaiementFromDb(data);
    set((s) => ({
      recusPaiement: s.recusPaiement.map((r) => (r.id === id ? updated : r)),
    }));

    await get().addAuditLog(
      AUDIT_MODULE.RecusPaiement,
      AUDIT_ACTION.Modification,
      `Reçu ${updated.reference} modifié`,
      undefined,
      { sourceType: "recu_paiement", sourceId: id },
    );
  },

  removeRecuPaiement: async (id) => {
    const recu = get().recusPaiement.find((r) => r.id === id);

    if (!isSupabaseConfigured) {
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
      return;
    }

    const { error } = await supabase.from("recus_paiement").delete().eq("id", id);
    if (error) throw error;
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
