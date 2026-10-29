import type { StateCreator } from "zustand";
import { getConnectedUserName, requireActiveAnnexeId } from "@/lib/store/connected-user";
import { useSession } from "@/lib/session/session-store";
import { syncContratStats } from "@/lib/contrat-stats";
import { api } from "@/lib/api-client";
import type {
  Contrat,
  ContratInput,
  ContratStatut,
  ContratPrestation,
  ContratPrestationInput,
  ContratPrestationStatut,
} from "@/lib/domain-types";
import type { RawContratPrestation } from "@/lib/api-types";
import type { SLTTState } from "@/lib/store";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";
import { nextYearlyReference } from "@/lib/store/reference";

export interface ContratsSlice {
  contrats: Contrat[];
  contratPrestations: ContratPrestation[];
  addContrat: (input: ContratInput) => Promise<Contrat>;
  updateContrat: (id: string, input: ContratInput) => Promise<void>;
  updateContratStatut: (id: string, statut: ContratStatut) => Promise<void>;
  removeContrat: (id: string) => Promise<void>;
  getContrat: (id: string) => Contrat | undefined;
  addContratPrestation: (input: ContratPrestationInput) => Promise<ContratPrestation>;
  updateContratPrestation: (id: string, input: Partial<ContratPrestationInput>) => Promise<void>;
  removeContratPrestation: (id: string) => Promise<void>;
}

export const createContratsSlice: StateCreator<SLTTState, [], [], ContratsSlice> = (set, get) => ({
  contrats: [],
  contratPrestations: [],

  addContrat: async (input) => {
    const seq = get().contratSeq;
    const reference = nextYearlyReference("CTR", seq);
    const creePar = getConnectedUserName();
    const userId = useSession.getState().currentUserId;
    const client = get().clients.find((c) => c.id === input.clientId);
    const annexeId =
      input.annexeId ??
      client?.annexeId ??
      requireActiveAnnexeId(get().users.find((u) => u.id === userId)?.annexeIds ?? [], get().annexes);
    // Persistance obligatoire : un contrat sans écriture serveur disparaissait
    // silencieusement au rechargement, sans aucune erreur montrée.
    const created = await api.contrats.create({
      reference,
      annexeId,
      clientId: input.clientId,
      objet: input.objet,
      dateDebut: input.dateDebut,
      dateFin: input.dateFin,
      montant: input.montant,
      statut: input.statut,
      notes: input.notes,
      creePar,
    });

    const newContrat: Contrat = {
      id: created?.id ?? crypto.randomUUID(),
      reference,
      annexeId,
      annexeNom: annexeId ? get().annexes.find((a) => a.id === annexeId)?.nom : undefined,
      clientId: input.clientId,
      clientNom: input.clientNom || client?.nom || "—",
      objet: input.objet,
      dateDebut: input.dateDebut,
      dateFin: input.dateFin || undefined,
      montant: input.montant,
      statut: input.statut,
      notes: input.notes || undefined,
      nbPrestations: 0,
      nbPrestationsRealisees: 0,
      creePar,
      creeLe: new Date().toISOString(),
    };

    set((s) => ({
      contrats: syncContratStats(s.contratPrestations, [newContrat, ...s.contrats]),
      contratSeq: seq + 1,
    }));
    await get().addAuditLog(AUDIT_MODULE.Contrats, AUDIT_ACTION.Creation, `Contrat ${reference} créé — ${input.clientNom}`);
    return newContrat;
  },

  updateContrat: async (id, input) => {
    const existingForStatut = get().contrats.find((c) => c.id === id);
    if (existingForStatut && existingForStatut.statut !== input.statut) {
      const { canTransitionContrat } = await import("@/lib/status-flow");
      if (!canTransitionContrat(existingForStatut.statut, input.statut)) {
        throw new Error(`Transition contrat invalide : ${existingForStatut.statut} → ${input.statut}`);
      }
    }

    await api.contrats.update(id, input);

    const existing = get().contrats.find((c) => c.id === id);
    set((s) => ({
      contrats: s.contrats.map((contrat) =>
        contrat.id === id
          ? {
              ...contrat,
              ...input,
              clientNom: input.clientNom,
              annexeId: input.annexeId ?? contrat.annexeId,
              annexeNom: input.annexeId
                ? s.annexes.find((a) => a.id === input.annexeId)?.nom ?? contrat.annexeNom
                : contrat.annexeNom,
            }
          : contrat,
      ),
    }));
    if (existing) {
      await get().addAuditLog(
        AUDIT_MODULE.Contrats,
        AUDIT_ACTION.Modification,
        `Contrat ${existing.reference} modifié`,
      );
    }
  },

  updateContratStatut: async (id, statut) => {
    const existing = get().contrats.find((c) => c.id === id);
    if (!existing) return;
    const { canTransitionContrat } = await import("@/lib/status-flow");
    if (!canTransitionContrat(existing.statut, statut)) {
      throw new Error(`Transition contrat invalide : ${existing.statut} → ${statut}`);
    }

    await api.contrats.update(id, { statut });

    set((s) => ({ contrats: s.contrats.map((c) => (c.id === id ? { ...c, statut } : c)) }));
    await get().addAuditLog(AUDIT_MODULE.Contrats, AUDIT_ACTION.Modification, `Contrat ${existing.reference} → ${statut}`);
  },

  removeContrat: async (id) => {
    const contrat = get().contrats.find((c) => c.id === id);
    if (!contrat) return;

    const prestationsLiees = get().contratPrestations.filter((p) => p.contratId === id).length;
    if (prestationsLiees > 0) {
      throw new Error(
        `Impossible de supprimer ce contrat : il comporte ${prestationsLiees} prestation(s). Supprimez-les d'abord.`,
      );
    }

    await api.contrats.delete(id);

    set((s) => ({
      contrats: s.contrats.filter((c) => c.id !== id),
      contratFichiers: s.contratFichiers.filter((f) => f.contratId !== id),
    }));
    await get().addAuditLog(AUDIT_MODULE.Contrats, AUDIT_ACTION.Suppression, `Contrat ${contrat.reference} supprimé`);
  },

  getContrat: (id) => get().contrats.find((c) => c.id === id),

  // ---- Prestations (persistées : POST/PATCH/DELETE /contrats/:id/prestations) ----
  addContratPrestation: async (input) => {
    const raw = await api.contrats.addPrestation(input.contratId, {
      libelle: input.libelle,
      description: input.description || undefined,
      montant: input.montant ?? undefined,
      statut: input.statut,
      datePrevue: input.datePrevue || undefined,
      dateRealisation: input.dateRealisation || undefined,
    });
    const newPrestation = mapContratPrestation(raw);
    set((s) => {
      const updated = [newPrestation, ...s.contratPrestations];
      return { contratPrestations: updated, contrats: syncContratStats(updated, s.contrats) };
    });
    await get().addAuditLog(AUDIT_MODULE.Contrats, AUDIT_ACTION.Creation, `Prestation "${newPrestation.libelle}" ajoutée`);
    return newPrestation;
  },

  updateContratPrestation: async (id, input) => {
    const existing = get().contratPrestations.find((p) => p.id === id);
    if (!existing) return;
    const { contratId: _contratId, ...patch } = input;
    const raw = await api.contrats.updatePrestation(existing.contratId, id, patch);
    const saved = raw?.id ? mapContratPrestation(raw) : { ...existing, ...patch };
    set((s) => {
      const updated = s.contratPrestations.map((p) => (p.id === id ? saved : p));
      return { contratPrestations: updated, contrats: syncContratStats(updated, s.contrats) };
    });
    await get().addAuditLog(AUDIT_MODULE.Contrats, AUDIT_ACTION.Modification, `Prestation "${saved.libelle}" modifiée`);
  },

  removeContratPrestation: async (id) => {
    const prestation = get().contratPrestations.find((p) => p.id === id);
    if (!prestation) return;
    await api.contrats.removePrestation(prestation.contratId, id);
    set((s) => {
      const updated = s.contratPrestations.filter((p) => p.id !== id);
      return { contratPrestations: updated, contrats: syncContratStats(updated, s.contrats) };
    });
    await get().addAuditLog(AUDIT_MODULE.Contrats, AUDIT_ACTION.Suppression, `Prestation "${prestation.libelle}" supprimée`);
  },
});

export function mapContratPrestation(p: RawContratPrestation): ContratPrestation {
  return {
    id: p.id,
    contratId: p.contratId,
    libelle: p.libelle || "",
    description: p.description || undefined,
    montant: p.montant ?? undefined,
    statut: (p.statut || "Prévue") as ContratPrestationStatut,
    datePrevue: p.datePrevue || undefined,
    dateRealisation: p.dateRealisation || undefined,
    creePar: p.creePar || undefined,
    facturee: Boolean(p.facturee),
  };
}
