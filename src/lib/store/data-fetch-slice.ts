import type { StateCreator } from "zustand";
import { logWarn } from "@/shared/logger";
import type { SLTTState } from "@/lib/store";
import { api } from "@/lib/api-client";
import { syncContratStats } from "@/lib/contrat-stats";
import { syncSequencesFromData } from "@/lib/store/sync-sequences";

export interface DataFetchSlice {
  dataLoading: boolean;
  loadError: string | null;
  partialLoadWarning: string | null;
  lastSyncedAt: number | null;
  fetchData: () => Promise<void>;
  clearLoadError: () => void;
  clearPartialLoadWarning: () => void;
  refetchData: () => Promise<void>;
  refetchTables: (tables: string[]) => Promise<void>;
}

export const createDataFetchSlice: StateCreator<SLTTState, [], [], DataFetchSlice> = (set, get) => {
  let inFlightFetch: Promise<void> | null = null;

  const runFetchData = async () => {
    set({ dataLoading: true, loadError: null, partialLoadWarning: null });

    try {
      const [dossiersRes, clients, annexes, facturesRes, devisRes, fournisseurs, contratsRes] = await Promise.all([
        api.dossiers.getAll().catch(() => ({ data: [], meta: {} })),
        api.clients.getAll().catch(() => []),
        api.annexes.getAll().catch(() => []),
        api.factures.getAll().catch(() => ({ data: [], meta: {} })),
        api.devis.getAll().catch(() => []),
        api.fournisseurs.getAll().catch(() => []),
        api.contrats.getAll().catch(() => []),
      ]);

      const currentUser = api.getCurrentUser();
      const users = currentUser
        ? [
            {
              id: currentUser.id,
              nom: currentUser.nom,
              email: currentUser.email,
              role: (currentUser.role === "ADMIN" ? "Administrateur" : currentUser.role) as any,
              permissions: currentUser.permissions || [],
              actif: true,
              derniereConnexion: new Date().toISOString(),
              annexeIds: currentUser.annexeIds || [],
            },
          ]
        : [];

      const rawDossiers = Array.isArray(dossiersRes?.data)
        ? dossiersRes.data
        : Array.isArray(dossiersRes)
        ? dossiersRes
        : [];
      const mappedDossiers = rawDossiers.map((d: any) => ({
        id: d.id,
        reference: d.numero || d.reference || `DOS-${(d.id || "").slice(0, 6)}`,
        annexeId: d.annexeId || d.annexe_id || "",
        annexeNom: d.annexe?.nom || "",
        clientId: d.clientId || d.client_id || "",
        clientNom: d.client?.nom || "—",
        bl: d.numeroBl || d.bl || "",
        camion: d.camion || "",
        nature: d.marchandise || d.nature || "Marchandises diverses",
        droitDouane: Number(d.valeurDouane || d.droitDouane || 0),
        fraisCircuit: Number(d.fraisCircuit || 0),
        fraisPrestation: Number(d.fraisPrestation || 0),
        montantInvesti: Number(d.montantInvesti || 0),
        montantPaye: Number(d.montantPaye || 0),
        statut: (d.statut === "BROUILLON" ? "Brouillon" : d.statut === "CLOTURE" ? "Soldé" : "En cours") as any,
        date: d.createdAt ? new Date(d.createdAt).toISOString().split("T")[0] : (d.date || new Date().toISOString().split("T")[0]),
        notes: d.notes || undefined,
      }));

      const rawFactures = Array.isArray(facturesRes?.data)
        ? facturesRes.data
        : Array.isArray(facturesRes)
        ? facturesRes
        : [];
      const mappedFactures = rawFactures.map((f: any) => ({
        id: f.id,
        numero: f.numero,
        dossierId: f.dossierId || null,
        clientId: f.clientId || "",
        clientNom: f.client?.nom || "—",
        annexeId: f.annexeId || "",
        date: f.dateEmission ? new Date(f.dateEmission).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        dateEcheance: f.dateEcheance ? new Date(f.dateEcheance).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        statut: (f.statut === "PAYEE" ? "Soldée" : f.statut === "PARTIELLEMENT_PAYEE" ? "Partielle" : f.statut === "ANNULEE" ? "Annulée" : "Brouillon") as any,
        lignes: (f.lignes || []).map((l: any) => ({
          id: l.id,
          description: l.description,
          quantite: Number(l.quantite || 1),
          prixUnitaire: Number(l.prixUnitaire || 0),
          montantHT: Number(l.montantHT || 0),
        })),
        tauxTVA: Number(f.tauxTVA || 18),
        montantHT: Number(f.montantHT || 0),
        montantTVA: Number(f.montantTVA || 0),
        montantTTC: Number(f.montantTTC || 0),
        montantPaye: Number(f.montantPaye || 0),
        notes: f.notes || "",
        creePar: f.creeParId || "",
        creeLe: f.createdAt ? new Date(f.createdAt).toISOString() : new Date().toISOString(),
      }));

      const rawContrats = Array.isArray((contratsRes as any)?.data)
        ? (contratsRes as any).data
        : Array.isArray(contratsRes)
        ? contratsRes
        : [];
      const mappedContrats = rawContrats.map((c: any) => ({
        id: c.id,
        reference: c.reference,
        annexeId: c.annexeId || "",
        annexeNom: c.annexe?.nom || (c.annexeId ? (annexes as any[])?.find((a) => a.id === c.annexeId)?.nom : undefined),
        clientId: c.clientId || "",
        clientNom: c.client?.nom || (c.clientId ? (clients as any[])?.find((cl) => cl.id === c.clientId)?.nom : "—"),
        objet: c.objet || "",
        dateDebut: c.dateDebut ? new Date(c.dateDebut).toISOString().split("T")[0] : "",
        dateFin: c.dateFin ? new Date(c.dateFin).toISOString().split("T")[0] : undefined,
        montant: Number(c.montant || 0),
        statut: c.statut || "Actif",
        notes: c.notes || undefined,
        nbPrestations: 0,
        nbPrestationsRealisees: 0,
        totalDepenses: 0,
        creePar: c.creePar || undefined,
        creeLe: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      }));

      set((state) => {
        const nextContrats = syncContratStats(state.depenses, state.contratPrestations, mappedContrats);
        const intermediateState = {
          ...state,
          dossiers: mappedDossiers as any,
          clients: (clients || []) as any,
          annexes: (annexes || []) as any,
          factures: mappedFactures as any,
          fournisseurs: (fournisseurs || []) as any,
          contrats: nextContrats as any,
          users: (users.length > 0 ? users : state.users) as any,
        };
        const updatedSequences = syncSequencesFromData(intermediateState as any);

        return {
          ...intermediateState,
          ...updatedSequences,
          dataLoading: false,
          lastSyncedAt: Date.now(),
        };
      });
    } catch (error) {
      logWarn("[SLTT] Chargement données NestJS", error);
      set({ dataLoading: false, lastSyncedAt: Date.now() });
    }
  };

  const fetchData = () => {
    if (inFlightFetch) return inFlightFetch;
    inFlightFetch = runFetchData().finally(() => {
      inFlightFetch = null;
    });
    return inFlightFetch;
  };

  return {
    dataLoading: false,
    loadError: null,
    partialLoadWarning: null,
    lastSyncedAt: null,

    clearLoadError: () => set({ loadError: null }),
    clearPartialLoadWarning: () => set({ partialLoadWarning: null }),

    fetchData,

    refetchData: async () => {
      set({ loadError: null });
      await get().fetchData();
    },

    refetchTables: async (_tables: string[]) => {
      if (inFlightFetch) {
        await inFlightFetch;
        return;
      }
      await runFetchData();
    },
  };
};
