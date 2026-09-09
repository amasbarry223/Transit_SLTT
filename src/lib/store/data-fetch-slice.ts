import type { StateCreator } from "zustand";
import { logWarn } from "@/shared/logger";
import type { SLTTState } from "@/lib/store";
import { api } from "@/lib/api-client";
import { syncContratStats } from "@/lib/contrat-stats";
import { syncSequencesFromData } from "@/lib/store/sync-sequences";
import { mapAuditLogFromDb } from "@/lib/audit";

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
      const [
        dossiersRes,
        clients,
        annexes,
        facturesRes,
        devisRes,
        fournisseursRes,
        contratsRes,
        transporteursRes,
        stockItemsRes,
        mouvementsRes,
        bonsSortieRes,
        bonsCaisseRes,
        recusPaiementRes,
        operationsRes,
        cloturesRes,
        settingsRes,
        usersRes,
        auditLogsRes,
      ] = await Promise.all([
        api.dossiers.getAll().catch(() => ({ data: [], meta: {} })),
        api.clients.getAll().catch(() => []),
        api.annexes.getAll().catch(() => []),
        api.factures.getAll().catch(() => ({ data: [], meta: {} })),
        api.devis.getAll().catch(() => []),
        api.fournisseurs.getAll().catch(() => []),
        api.contrats.getAll().catch(() => []),
        api.transporteurs.getAll().catch(() => []),
        api.stock.getItems().catch(() => []),
        api.stock.getMouvements().catch(() => []),
        api.bons.getBonsSortie().catch(() => []),
        api.bons.getBonsCaisse().catch(() => []),
        api.recusPaiement.getAll().catch(() => []),
        api.comptabilite.getOperations().catch(() => []),
        api.comptabilite.getClotures().catch(() => []),
        api.settings.getAll().catch(() => ({ list: [], map: {} })),
        api.users.getAll().catch(() => []),
        api.auditLogs.getAll({ limit: 100 }).catch(() => []),
      ]);

      const currentUser = api.getCurrentUser();
      const fetchedUsers = Array.isArray(usersRes) ? usersRes : [];
      const users = fetchedUsers.length > 0
        ? fetchedUsers.map((u: any) => ({
            id: u.id,
            nom: u.nom,
            email: u.email,
            role: (u.role === "ADMIN" ? "Administrateur" : u.role) as any,
            permissions: u.permissions || [],
            actif: u.actif ?? true,
            derniereConnexion: u.derniereConnexion ? new Date(u.derniereConnexion).toISOString() : "",
            annexeIds: (u.userAnnexes || []).map((ua: any) => ua.annexe?.id || ua.annexeId),
          }))
        : currentUser
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
      const mappedDossiers = rawDossiers.map((d: any) => {
        let modeTransport: "Maritime" | "Aérien" | "Routier" | "Ferroviaire" = "Maritime";
        const vt = String(d.voieTransport || "").toUpperCase();
        if (vt.includes("AER")) modeTransport = "Aérien";
        else if (vt.includes("ROUT") || vt.includes("TERR")) modeTransport = "Routier";
        else if (vt.includes("FERR")) modeTransport = "Ferroviaire";

        let statut: "Brouillon" | "En cours" | "Dédouané" | "Livré" | "Soldé" = "En cours";
        const st = String(d.statut || "").toUpperCase();
        if (st.includes("BROUILLON")) statut = "Brouillon";
        else if (st.includes("DEDOUAN")) statut = "Dédouané";
        else if (st.includes("LIVR")) statut = "Livré";
        else if (st.includes("CLOTUR") || st.includes("SOLDE")) statut = "Soldé";
        else statut = "En cours";

        const conteneurNumero = d.conteneurs?.[0]?.numero || d.noConteneur || undefined;
        const poids = d.poids != null ? Number(d.poids) : (d.poidsTotal != null ? Number(d.poidsTotal) : undefined);

        return {
          id: d.id,
          reference: d.numero || d.reference || `DOS-${(d.id || "").slice(0, 6)}`,
          annexeId: d.annexeId || d.annexe_id || "",
          annexeNom: d.annexe?.nom || "",
          clientId: d.clientId || d.client_id || "",
          clientNom: d.client?.nom || "—",
          bl: d.numeroBl || d.bl || "",
          camion: d.navireVol || d.camion || "",
          nature: d.marchandise || d.nature || "Marchandises diverses",
          droitDouane: Number(d.valeurDouane || d.droitDouane || 0),
          fraisCircuit: Number(d.fraisCircuit || 0),
          fraisPrestation: Number(d.fraisPrestation || 0),
          montantInvesti: Number(d.montantInvesti || 0),
          montantPaye: Number(d.montantPaye || 0),
          statut: statut as any,
          date: d.dateDepart
            ? new Date(d.dateDepart).toISOString().split("T")[0]
            : (d.date ? String(d.date).split("T")[0] : (d.createdAt ? new Date(d.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0])),
          dateEcheance: d.dateArriveePrevue ? new Date(d.dateArriveePrevue).toISOString().split("T")[0] : (d.dateEcheance || undefined),
          dateDedouanement: d.dateArriveeEffective ? new Date(d.dateArriveeEffective).toISOString().split("T")[0] : (d.dateDedouanement || undefined),
          modeTransport,
          noConteneur: conteneurNumero,
          portEntree: d.portDestination || d.portEntree || undefined,
          poidsTotal: poids,
          notes: d.notes || undefined,
        };
      });

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

      const rawDevis = Array.isArray((devisRes as any)?.data)
        ? (devisRes as any).data
        : Array.isArray(devisRes)
        ? devisRes
        : [];
      const mappedDevis = rawDevis.map((d: any) => {
        let droitDouane = 0;
        let fraisCircuit = 0;
        let fraisPrestation = 0;
        (d.lignes || []).forEach((l: any) => {
          if (l.designation?.includes("douane")) droitDouane = Number(l.prixUnitaire || 0);
          else if (l.designation?.includes("circuit")) fraisCircuit = Number(l.prixUnitaire || 0);
          else if (l.designation?.includes("prestation")) fraisPrestation = Number(l.prixUnitaire || 0);
        });
        return {
          id: d.id,
          reference: d.numero,
          clientId: d.clientId || "",
          clientNom: d.client?.nom || "—",
          annexeId: d.annexeId || "",
          annexeNom: d.annexe?.nom || "",
          nature: d.nature || "",
          droitDouane: droitDouane || Number(d.montantHt || 0),
          fraisCircuit,
          fraisPrestation,
          total: Number(d.montantTtc || d.montantHt || 0),
          statut: (d.statut === "ACCEPTE" ? "Accepté" : d.statut === "REFUSE" ? "Refusé" : d.statut === "EXPIRE" ? "Expiré" : "Brouillon") as any,
          dateCreation: d.createdAt ? new Date(d.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          dateValidite: d.dateValidite ? new Date(d.dateValidite).toISOString().slice(0, 10) : "",
          notes: d.notes || "",
        };
      });

      const rawFournisseurs = Array.isArray(fournisseursRes) ? fournisseursRes : [];
      const mappedFournisseurs = rawFournisseurs.map((f: any) => ({
        id: f.id,
        nom: f.nom,
        type: (f.type || "Autre") as any,
        contact: f.contact || "",
        telephone: f.telephone || "",
        email: f.email || "",
        adresse: f.adresse || "",
        tarifContractuel: f.tarifContractuel ? Number(f.tarifContractuel) : undefined,
        nbDossiers: f._count?.depenses || 0,
        montantTotal: 0,
        statut: (f.actif === false || f.statut === "Inactif" ? "Inactif" : "Actif") as any,
        annexeId: f.annexeId || "",
      }));

      const rawTransporteurs = Array.isArray(transporteursRes) ? transporteursRes : [];
      const mappedTransporteurs = rawTransporteurs.map((t: any) => ({
        id: t.id,
        nom: t.nom,
        contact: t.contact || "",
        telephone: t.telephone,
        email: t.email || undefined,
        vehicule: t.vehicule,
        immatriculation: t.immatriculation,
        trajet: t.trajet || "",
        capacite: Number(t.capacite || 0),
        statut: t.statut,
        nbDossiers: 0,
        dateCreation: t.dateCreation || (t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : ""),
        notes: t.notes || undefined,
        annexeId: t.annexeId || "",
      }));

      const rawStock = Array.isArray(stockItemsRes) ? stockItemsRes : [];
      const mappedStock = rawStock.map((s: any) => ({
        id: s.id,
        clientId: s.clientId || undefined,
        clientNom: s.client?.nom || undefined,
        annexeId: s.annexeId,
        annexeNom: s.annexe?.nom || undefined,
        marchandise: s.marchandise,
        quantite: Number(s.quantite || 0),
        unite: s.unite || "kg",
        seuil: Number(s.seuil || 0),
        depositaire: s.depositaire || undefined,
        commercial: s.commercial || undefined,
        sommePayee: Number(s.sommePayee || 0),
        resteAPayer: Number(s.resteAPayer || 0),
        date: s.date || "",
      }));

      const rawMouvements = Array.isArray(mouvementsRes) ? mouvementsRes : [];
      const mappedMouvements = rawMouvements.map((m: any) => ({
        id: m.id,
        stockId: m.stockId || undefined,
        annexeId: m.annexeId,
        annexeNom: m.annexe?.nom || undefined,
        date: m.date || (m.createdAt ? new Date(m.createdAt).toISOString() : ""),
        type: m.type,
        marchandise: m.marchandise || m.stock?.marchandise || "",
        quantite: Number(m.quantite || 0),
        unite: m.unite || "",
        responsable: m.responsable || "",
        bonRef: m.bonRef || undefined,
        motif: m.motif || undefined,
      }));

      const rawBons = Array.isArray(bonsSortieRes) ? bonsSortieRes : [];
      const mappedBons = rawBons.map((b: any) => ({
        id: b.id,
        reference: b.reference,
        date: b.date,
        clientId: b.clientId,
        clientNom: b.client?.nom || b.clientNom || "",
        annexeId: b.annexeId,
        annexeNom: b.annexe?.nom || undefined,
        stockId: b.stockId || undefined,
        marchandise: b.marchandise,
        quantite: Number(b.quantite || 0),
        unite: b.unite,
        motif: b.motif,
        montant: Number(b.montant || 0),
        statut: b.statut,
      }));

      const rawBonsCaisse = Array.isArray(bonsCaisseRes) ? bonsCaisseRes : [];
      const mappedBonsCaisse = rawBonsCaisse.map((bc: any) => ({
        id: bc.id,
        reference: bc.reference,
        date: bc.date,
        annexeId: bc.annexeId,
        annexeNom: bc.annexe?.nom || undefined,
        montantTotal: Number(bc.montantTotal || 0),
        creePar: bc.creePar || undefined,
        creeLe: bc.createdAt ? new Date(bc.createdAt).toISOString() : new Date().toISOString(),
        lignes: (bc.lignes || []).map((l: any) => ({
          id: l.id,
          date: l.date,
          beneficiaire: l.beneficiaire,
          motif: l.motif,
          montant: Number(l.montant || 0),
        })),
      }));

      const rawRecus = Array.isArray(recusPaiementRes) ? recusPaiementRes : [];
      const mappedRecus = rawRecus.map((r: any) => ({
        id: r.id,
        reference: r.reference,
        annexeId: r.annexeId,
        annexeNom: r.annexe?.nom || undefined,
        nom: r.nom,
        prenom: r.prenom,
        somme: Number(r.somme || 0),
        motif: r.motif,
        montantPaye: Number(r.montantPaye || 0),
        reste: Number(r.reste || 0),
        statut: r.statut,
        creePar: r.creePar || undefined,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      }));

      const rawOps = Array.isArray(operationsRes) ? operationsRes : [];
      const mappedOps = rawOps.map((o: any) => ({
        id: o.id,
        reference: o.reference,
        entiteType: "annexe" as const,
        annexeId: o.annexeId || undefined,
        date: o.date,
        clientId: o.clientId || undefined,
        dossierId: o.dossierId || undefined,
        clientNom: o.clientNom || undefined,
        nature: o.nature,
        type: o.type,
        montant: Number(o.montant || 0),
        modePaiement: o.modePaiement || "Espèces",
        source: o.source || "saisie",
        importRef: o.importRef || undefined,
        creePar: o.creePar || undefined,
      }));

      const rawClotures = Array.isArray(cloturesRes) ? cloturesRes : [];
      const mappedClotures = rawClotures.map((c: any) => ({
        id: c.id,
        entiteType: "annexe" as const,
        annexeId: c.annexeId || undefined,
        periodeDebut: c.periodeDebut,
        periodeFin: c.periodeFin,
        soldeTheorique: Number(c.soldeTheorique || 0),
        soldeConstate: Number(c.soldeConstate || 0),
        ecart: Number(c.ecart || 0),
        note: c.note || undefined,
        cloturePar: c.cloturePar || undefined,
        clotureLe: c.clotureLe || "",
      }));

      const rawAuditLogs = Array.isArray(auditLogsRes) ? auditLogsRes : [];
      const mappedAuditLogs = rawAuditLogs.map((log: any) => mapAuditLogFromDb(log));

      const settingsMap = (settingsRes as any)?.map || {};

      set((state) => {
        const nextContrats = syncContratStats(state.depenses, state.contratPrestations, mappedContrats);

        const nomSoc = settingsMap.societe_nom || settingsMap.nom_societe || "Transit SLTT";
        const raisonSoc = settingsMap.societe_raison_sociale || nomSoc;
        const mappedSocietes = [
          {
            id: (state.societes && state.societes[0]?.id) || "22222222-2222-2222-2222-222222222222",
            nom: nomSoc,
            raisonSociale: raisonSoc,
            actif: true,
            logoUrl: settingsMap.societe_logo_url || "/logoV.png",
            adresse: settingsMap.societe_adresse || "Niaréla - Rue 516 porte C/63, Bamako, Mali",
            telephone: settingsMap.societe_telephone || "+223 76 96 47 06 / 92 92 46 48",
            rccm: settingsMap.societe_rccm || "Ma.Bko.2025 B.5897",
            nif: settingsMap.societe_nif || "084151062H",
            afficherNomAvecLogo: settingsMap.societe_afficher_nom_avec_logo !== "false",
            signataireDg: settingsMap.societe_signataire_dg || undefined,
            signatairePdg: settingsMap.societe_signataire_pdg || undefined,
          },
        ];

        const intermediateState = {
          ...state,
          dossiers: mappedDossiers as any,
          clients: (clients || []) as any,
          annexes: (annexes || []) as any,
          factures: mappedFactures as any,
          fournisseurs: mappedFournisseurs as any,
          contrats: nextContrats as any,
          devis: mappedDevis as any,
          transporteurs: mappedTransporteurs as any,
          stock: mappedStock as any,
          mouvements: mappedMouvements as any,
          bons: mappedBons as any,
          bonsSortieCaisse: mappedBonsCaisse as any,
          recusPaiement: mappedRecus as any,
          operationsComptables: mappedOps as any,
          cloturesCaisse: mappedClotures as any,
          societes: mappedSocietes,
          users: (users.length > 0 ? users : state.users) as any,
          auditLogs: (mappedAuditLogs.length > 0 ? mappedAuditLogs : state.auditLogs) as any,
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
