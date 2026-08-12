import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import { syncClientStats } from "@/lib/client-stats";
import { syncFournisseurStats } from "@/lib/fournisseur-stats";
import { syncContratStats } from "@/lib/contrat-stats";
import {
  FETCH_SOFT_CAPS,
  fetchAllPaged,
  pagedSelect,
} from "@/lib/store/fetch-pages";
import { syncSequencesFromData } from "@/lib/store/sync-sequences";
import type { ProfilePublicRow } from "@/lib/db-rows";
import type { UserRole } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import { mapClientFromDb } from "@/lib/store/clients-slice";
import { mapDossierFromDb } from "@/lib/store/dossiers-slice";
import { mapFactureFromDb } from "@/lib/store/factures-slice";
import { mapEcritureFromDb } from "@/lib/store/ecritures-slice";
import { mapProfileFromDb } from "@/lib/store/users-slice";
import { mapSocieteFromDb } from "@/lib/store/societes-slice";
import { mapAnnexeFromDb } from "@/lib/store/annexes-slice";
import { mapStockItemFromDb, mapMouvementFromDb } from "@/lib/store/stock-slice";
import { mapBonFromDb, mapBonSortieCaisseFromDb } from "@/lib/store/bons-slice";
import {
  mapOperationComptableFromDb,
  mapClotureCaisseFromDb,
} from "@/lib/store/comptabilite-generale-slice";
import { mapRecuPaiementFromDb } from "@/lib/store/recus-paiement-slice";
import { mapSubDossierFromDb, mapFichierFromDb } from "@/lib/store/fichiers-slice";
import { mapDevisFromDb } from "@/lib/store/devis-slice";
import { mapTransporteurFromDb } from "@/lib/store/transporteurs-slice";
import {
  mapFournisseurFromDb,
  mapDossierFournisseurFromDb,
} from "@/lib/store/fournisseurs-slice";
import {
  mapContratFromDb,
  mapDepenseFromDb,
  mapContratPrestationFromDb,
} from "@/lib/store/contrats-slice";
import { mapContratFichierFromDb } from "@/lib/store/contrat-fichiers-slice";
import { mapAuditLogFromDb } from "@/lib/audit";
import { mapArchiveFromDb } from "@/lib/store/archives-slice";
import {
  mapDocumentFromDb,
  mapDocumentVersionFromDb,
  mapOcrFieldFromDb,
  mapOcrJobFromDb,
} from "@/lib/store/documents-slice";

export interface DataFetchSlice {
  dataLoading: boolean;
  loadError: string | null;
  /** Échec non bloquant d'une des requêtes secondaires. */
  partialLoadWarning: string | null;
  lastSyncedAt: number | null;
  fetchData: () => Promise<void>;
  clearLoadError: () => void;
  clearPartialLoadWarning: () => void;
  refetchData: () => Promise<void>;
}

export const createDataFetchSlice: StateCreator<SLTTState, [], [], DataFetchSlice> = (set, get) => ({
  dataLoading: false,
  loadError: null,
  partialLoadWarning: null,
  lastSyncedAt: null,

  clearLoadError: () => set({ loadError: null }),
  clearPartialLoadWarning: () => set({ partialLoadWarning: null }),

  fetchData: async () => {
    set({ dataLoading: true, loadError: null, partialLoadWarning: null });
    try {
      // Sans JWT, le RLS renvoie [] (HTTP 200) — pas d'erreur visible.
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) {
        throw new Error(
          "Session Supabase absente. Reconnectez-vous pour charger les données.",
        );
      }

      const coreResults = await Promise.all([
        fetchAllPaged(() => pagedSelect(supabase, "clients", "*, annexes(nom)"), { softCap: 2_000 }),
        fetchAllPaged(
          () => pagedSelect(supabase, "dossiers", "*, clients(nom), societes(nom), annexes(nom)"),
          { softCap: 2_000 },
        ),
        fetchAllPaged(
          () => pagedSelect(supabase, "ecritures", "*, clients(nom), societes(nom), annexes(nom)"),
          { softCap: 2_000 },
        ),
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "factures",
              "*, facture_lignes(*), clients(nom), societes(nom), annexes(nom)",
            ),
          { softCap: 2_000 },
        ),
        fetchAllPaged(() => pagedSelect(supabase, "profiles", "*"), { softCap: 500 }),
        fetchAllPaged(() => pagedSelect(supabase, "societes", "*"), { softCap: 100 }),
        fetchAllPaged(() => pagedSelect(supabase, "annexes", "*"), { softCap: 100 }),
        fetchAllPaged(() => pagedSelect(supabase, "user_annexes", "*"), { softCap: 5_000 }),
      ]);

      const coreError = coreResults.find((r) => r.error)?.error;
      if (coreError) throw coreError;

      const [
        { data: clients, truncated: truncClients },
        { data: dossiers, truncated: truncDossiers },
        { data: ecritures, truncated: truncEcritures },
        { data: factures, truncated: truncFactures },
        { data: profiles },
        { data: societes },
        { data: annexes },
        { data: userAnnexes },
      ] = coreResults;

      const coreTruncated =
        truncClients || truncDossiers || truncEcritures || truncFactures;

      // Vue optionnelle (migration 20260722) — tant qu'elle n'est pas encore
      // appliquée en base, on dégrade sur users (ou liste vide) plutôt que
      // de faire échouer tout le chargement des données.
      let profilesPublic: ProfilePublicRow[] | null = null;
      try {
        const { data, error } = await supabase.from("profiles_public").select("*");
        if (error) throw error;
        profilesPublic = data;
      } catch {
        profilesPublic = null;
      }

      const mappedClients = (clients as any[]).map(mapClientFromDb);
      const mappedDossiers = (dossiers as any[]).map(mapDossierFromDb);
      const mappedFactures = (factures as any[]).map(mapFactureFromDb);
      const mappedEcritures = (ecritures as any[]).map(mapEcritureFromDb);

      // Regroupe user_annexes par utilisateur pour hydrater User.annexeIds
      // (détermine le périmètre RLS de chacun côté app — sélecteur,
      // valeur par défaut des formulaires, accès au reporting consolidé).
      const annexeIdsByUser = new Map<string, string[]>();
      for (const row of (userAnnexes as { user_id: string; annexe_id: string }[]) ?? []) {
        const list = annexeIdsByUser.get(row.user_id) ?? [];
        list.push(row.annexe_id);
        annexeIdsByUser.set(row.user_id, list);
      }

      set((s) => {
        const nextState = {
          ...s,
          clients: syncClientStats(mappedDossiers, mappedFactures, mappedEcritures, mappedClients),
          dossiers: mappedDossiers,
          ecritures: mappedEcritures,
          factures: mappedFactures,
          users: (profiles as any[]).map((p) => ({
            ...mapProfileFromDb(p),
            annexeIds: annexeIdsByUser.get(p.id) ?? [],
          })),
          usersPublic: (
            profilesPublic ?? (profiles as any[])
          ).map((row: ProfilePublicRow) => ({
            id: row.id,
            nom: row.nom,
            role: row.role as UserRole,
            actif: row.actif,
            derniereConnexion: row.derniere_connexion || "",
          })),
          societes: (societes as any[]).map(mapSocieteFromDb),
          annexes: (annexes as any[]).map(mapAnnexeFromDb),
          loadError: null,
          dataLoading: false,
        };
        return {
          ...nextState,
          ...syncSequencesFromData(nextState),
        };
      });

      const secondarySpecs = [
        {
          key: "stock",
          q: () =>
            fetchAllPaged(
              () => pagedSelect(supabase, "stock_items", "*, clients(nom), societes(nom), annexes(nom)"),
              { softCap: 2_000 },
            ),
        },
        {
          key: "mouvements",
          q: () =>
            fetchAllPaged(
              () =>
                pagedSelect(supabase, "mouvements", "*, societes(nom), annexes(nom)", {
                  column: "date",
                  ascending: false,
                }),
              { softCap: FETCH_SOFT_CAPS.mouvements },
            ),
        },
        {
          key: "bons",
          q: () =>
            fetchAllPaged(
              () => pagedSelect(supabase, "bons_sortie", "*, clients(nom), societes(nom), annexes(nom)"),
              { softCap: 2_000 },
            ),
        },
        {
          key: "subDossiers",
          q: () =>
            fetchAllPaged(() => pagedSelect(supabase, "sub_dossiers", "*"), { softCap: 2_000 }),
        },
        {
          key: "fichiers",
          q: () =>
            fetchAllPaged(() => pagedSelect(supabase, "dossier_fichiers", "*"), {
              softCap: 2_000,
            }),
        },
        {
          key: "devis",
          q: () =>
            fetchAllPaged(
              () => pagedSelect(supabase, "devis", "*, clients(nom), societes(nom), annexes(nom)"),
              { softCap: 2_000 },
            ),
        },
        {
          key: "transporteurs",
          q: () =>
            fetchAllPaged(() => pagedSelect(supabase, "transporteurs", "*"), { softCap: 1_000 }),
        },
        {
          key: "fournisseurs",
          q: () =>
            fetchAllPaged(() => pagedSelect(supabase, "fournisseurs", "*"), { softCap: 2_000 }),
        },
        {
          key: "dossierFournisseurs",
          q: () =>
            fetchAllPaged(
              () =>
                pagedSelect(
                  supabase,
                  "dossier_fournisseurs",
                  "*, fournisseurs(nom, type), dossiers(reference)",
                ),
              { softCap: 2_000 },
            ),
        },
        {
          key: "contrats",
          q: () =>
            fetchAllPaged(
              () => pagedSelect(supabase, "contrats", "*, clients(nom), societes(nom), annexes(nom)"),
              { softCap: 2_000 },
            ),
        },
        {
          key: "contratFichiers",
          q: () =>
            fetchAllPaged(() => pagedSelect(supabase, "contrat_fichiers", "*"), {
              softCap: 2_000,
            }),
        },
        {
          key: "depenses",
          q: () =>
            fetchAllPaged(() => pagedSelect(supabase, "depenses", "*"), { softCap: 2_000 }),
        },
        {
          key: "contratPrestations",
          q: () =>
            fetchAllPaged(() => pagedSelect(supabase, "contrat_prestations", "*"), {
              softCap: 2_000,
            }),
        },
        {
          key: "bonsSortieCaisse",
          q: () =>
            fetchAllPaged(
              () =>
                pagedSelect(
                  supabase,
                  "bons_sortie_caisse",
                  "*, bons_sortie_caisse_lignes(*), societes(nom), annexes(nom)",
                ),
              { softCap: 2_000 },
            ),
        },
        {
          key: "operationsComptables",
          q: () =>
            fetchAllPaged(
              () =>
                pagedSelect(
                  supabase,
                  "operations_comptables",
                  "*, clients(nom), societes(nom), annexes(nom), dossiers(reference)",
                ),
              { softCap: 5_000 },
            ),
        },
        {
          key: "cloturesCaisse",
          q: () =>
            fetchAllPaged(() => pagedSelect(supabase, "clotures_caisse", "*"), {
              softCap: 500,
            }),
        },
        {
          key: "recusPaiement",
          q: () =>
            fetchAllPaged(
              () => pagedSelect(supabase, "recus_paiement", "*, annexes(nom)"),
              { softCap: 5_000 },
            ),
        },
        {
          key: "auditLogs",
          q: () =>
            fetchAllPaged(
              () =>
                pagedSelect(supabase, "audit_logs", "*", {
                  column: "date",
                  ascending: false,
                }),
              { softCap: FETCH_SOFT_CAPS.audit_logs },
            ),
        },
        {
          key: "archives",
          q: () =>
            fetchAllPaged(() => pagedSelect(supabase, "archives", "*"), { softCap: 1_000 }),
        },
        {
          key: "documents",
          q: () =>
            fetchAllPaged(
              () =>
                pagedSelect(supabase, "documents", "*", {
                  column: "created_at",
                  ascending: false,
                }),
              { softCap: FETCH_SOFT_CAPS.documents },
            ),
        },
        {
          key: "documentVersions",
          q: () =>
            fetchAllPaged(
              () =>
                pagedSelect(supabase, "document_versions", "*", {
                  column: "created_at",
                  ascending: false,
                }),
              { softCap: FETCH_SOFT_CAPS.document_versions },
            ),
        },
        {
          key: "ocrJobs",
          q: () =>
            fetchAllPaged(
              () =>
                pagedSelect(supabase, "ocr_jobs", "*", {
                  column: "created_at",
                  ascending: false,
                }),
              { softCap: FETCH_SOFT_CAPS.ocr_jobs },
            ),
        },
        {
          key: "ocrFields",
          q: () =>
            fetchAllPaged(() => pagedSelect(supabase, "ocr_fields", "*"), {
              softCap: FETCH_SOFT_CAPS.ocr_fields,
            }),
        },
      ] as const;

      const secondaryResults = await Promise.all(
        secondarySpecs.map(async (spec) => {
          try {
            const res = await spec.q();
            return {
              key: spec.key,
              data: res.data,
              error: res.error,
              truncated: res.truncated,
            };
          } catch (e) {
            return {
              key: spec.key,
              data: null,
              error: e instanceof Error ? e : { message: String(e) },
              truncated: false,
            };
          }
        }),
      );

      const failed = secondaryResults.filter((r) => r.error);
      const anyTruncated =
        coreTruncated || secondaryResults.some((r) => r.truncated && !r.error);
      if (failed.length > 0) {
        console.warn(
          "[SLTT] Chargement secondaire partiel:",
          failed.map((f) => `${f.key}: ${f.error?.message || f.error}`),
        );
        set({
          partialLoadWarning:
            "Certaines données n'ont pas pu être rechargées ; l'affichage conserve le cache précédent pour ces modules.",
        });
      } else if (anyTruncated) {
        set({
          partialLoadWarning:
            "Volume important : certaines listes sont plafonnées côté client. Affinez les filtres ou archivez les anciens enregistrements.",
        });
      } else {
        set({ partialLoadWarning: null });
      }

      const byKey = Object.fromEntries(
        secondaryResults.map((r) => [r.key, r]),
      ) as unknown as Record<
        (typeof secondarySpecs)[number]["key"],
        { key: string; data: unknown[] | null; error: unknown }
      >;

      const ok = <T,>(key: (typeof secondarySpecs)[number]["key"], map: (rows: any[]) => T, fallback: T): T => {
        const r = byKey[key];
        if (r?.error || r?.data == null) return fallback;
        return map(r.data);
      };

      set((s) => {
        const mappedFournisseurs = ok(
          "fournisseurs",
          (rows) => rows.map(mapFournisseurFromDb),
          s.fournisseurs,
        );
        const mappedDossierFournisseurs = ok(
          "dossierFournisseurs",
          (rows) => rows.map(mapDossierFournisseurFromDb),
          s.dossierFournisseurs,
        );
        const mappedDepenses = ok("depenses", (rows) => rows.map(mapDepenseFromDb), s.depenses);
        const mappedPrestations = ok(
          "contratPrestations",
          (rows) => rows.map(mapContratPrestationFromDb),
          s.contratPrestations,
        );
        const mappedContratsRaw = ok("contrats", (rows) => rows.map(mapContratFromDb), s.contrats);

        const ocrFieldsRows = ok("ocrFields", (rows) => rows, null as unknown[] | null);
        const ocrJobsRows = ok("ocrJobs", (rows) => rows, null as unknown[] | null);

        let nextOcrJobs = s.ocrJobs;
        if (ocrJobsRows && ocrFieldsRows) {
          const fieldsByJob = new Map<string, ReturnType<typeof mapOcrFieldFromDb>[]>();
          for (const raw of ocrFieldsRows) {
            const f = mapOcrFieldFromDb(raw);
            const list = fieldsByJob.get(f.ocrJobId) || [];
            list.push(f);
            fieldsByJob.set(f.ocrJobId, list);
          }
          nextOcrJobs = ocrJobsRows.map((j) =>
            mapOcrJobFromDb(j, fieldsByJob.get((j as { id: string }).id) || []),
          );
        }

        const nextState = {
          ...s,
          stock: ok("stock", (rows) => rows.map(mapStockItemFromDb), s.stock),
          mouvements: ok("mouvements", (rows) => rows.map(mapMouvementFromDb), s.mouvements),
          bons: ok("bons", (rows) => rows.map(mapBonFromDb), s.bons),
          subDossiers: ok("subDossiers", (rows) => rows.map(mapSubDossierFromDb), s.subDossiers),
          fichiers: ok("fichiers", (rows) => rows.map(mapFichierFromDb), s.fichiers),
          devis: ok("devis", (rows) => rows.map(mapDevisFromDb), s.devis),
          transporteurs: ok("transporteurs", (rows) => rows.map(mapTransporteurFromDb), s.transporteurs),
          fournisseurs: byKey.fournisseurs?.error
            ? s.fournisseurs
            : syncFournisseurStats(mappedDossierFournisseurs, mappedFournisseurs),
          dossierFournisseurs: mappedDossierFournisseurs,
          contrats: byKey.contrats?.error
            ? s.contrats
            : syncContratStats(mappedDepenses, mappedPrestations, mappedContratsRaw),
          contratFichiers: ok("contratFichiers", (rows) => rows.map(mapContratFichierFromDb), s.contratFichiers),
          depenses: mappedDepenses,
          contratPrestations: mappedPrestations,
          bonsSortieCaisse: ok(
            "bonsSortieCaisse",
            (rows) => rows.map(mapBonSortieCaisseFromDb),
            s.bonsSortieCaisse,
          ),
          operationsComptables: ok(
            "operationsComptables",
            (rows) => rows.map(mapOperationComptableFromDb),
            s.operationsComptables,
          ),
          cloturesCaisse: ok(
            "cloturesCaisse",
            (rows) => rows.map(mapClotureCaisseFromDb),
            s.cloturesCaisse,
          ),
          recusPaiement: ok(
            "recusPaiement",
            (rows) => rows.map(mapRecuPaiementFromDb),
            s.recusPaiement,
          ),
          auditLogs: ok("auditLogs", (rows) => rows.map(mapAuditLogFromDb), s.auditLogs),
          archives: ok("archives", (rows) => rows.map(mapArchiveFromDb), s.archives),
          documents: ok("documents", (rows) => rows.map(mapDocumentFromDb), s.documents),
          documentVersions: ok(
            "documentVersions",
            (rows) => rows.map(mapDocumentVersionFromDb),
            s.documentVersions,
          ),
          ocrJobs: nextOcrJobs,
          clients: syncClientStats(s.dossiers, s.factures, s.ecritures, s.clients),
          lastSyncedAt: Date.now(),
        };
        return {
          ...nextState,
          ...syncSequencesFromData(nextState),
        };
      });
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Impossible de charger les données.";
      const message = /failed to fetch|networkerror|load failed/i.test(raw)
        ? "Connexion à Supabase interrompue. Vérifiez le réseau, désactivez les bloqueurs, puis réessayez."
        : raw;
      console.error("[SLTT] Erreur de chargement Supabase:", e);
      set({ loadError: message, dataLoading: false });
    }
  },


  refetchData: async () => {
    set({ loadError: null });
    await get().fetchData();
  },
});
