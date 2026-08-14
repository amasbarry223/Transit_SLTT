import type { SupabaseClient } from "@supabase/supabase-js";
import { FETCH_ENTITY_SOFT_CAPS } from "@/lib/constants";
import { fetchAllPaged, pagedSelect } from "@/lib/store/fetch-pages";

export type PagedFetchResult<T = unknown> = {
  data: T[];
  truncated: boolean;
  error: Error | null;
};

export async function fetchCoreEntities(
  supabase: SupabaseClient,
): Promise<PagedFetchResult[]> {
  const caps = FETCH_ENTITY_SOFT_CAPS;
  // Colonnes limitées à ce que chaque mapXFromDb (seul consommateur de ces
  // lignes brutes) lit réellement — voir src/lib/store/{clients,dossiers,
  // ecritures,factures,users,societes,annexes}-slice.ts.
  const results = await Promise.all([
    fetchAllPaged(
      () =>
        pagedSelect(
          supabase,
          "clients",
          "id, nom, type, telephone, email, adresse, annexe_id, societe_id, annexes(nom)",
        ),
      { softCap: caps.default },
    ),
    fetchAllPaged(
      () =>
        pagedSelect(
          supabase,
          "dossiers",
          "id, reference, societe_id, annexe_id, client_id, bl, camion, nature, droit_douane, frais_circuit, frais_prestation, montant_investi, montant_paye, statut, date, date_echeance, date_dedouanement, mode_transport, no_conteneur, port_entree, poids_total, notes, clients(nom), societes(nom), annexes(nom)",
        ),
      { softCap: caps.default },
    ),
    fetchAllPaged(
      () =>
        pagedSelect(
          supabase,
          "ecritures",
          "id, date, date_paiement, client_id, dossier_id, societe_id, annexe_id, montant_investi, montant_paye, mode_paiement, note, clients(nom), societes(nom), annexes(nom)",
        ),
      { softCap: caps.default },
    ),
    fetchAllPaged(
      () =>
        pagedSelect(
          supabase,
          "factures",
          "id, numero, dossier_id, client_id, societe_id, annexe_id, date, date_echeance, statut, taux_tva, montant_ht, montant_tva, montant_ttc, montant_paye, notes, cree_par, cree_le, created_at, facture_lignes(id, description, quantite, prix_unitaire, montant_ht, compagnie, bordereau_livraison), clients(nom), societes(nom), annexes(nom)",
        ),
      { softCap: caps.default },
    ),
    fetchAllPaged(
      () =>
        pagedSelect(
          supabase,
          "profiles",
          "id, nom, email, role, permissions, actif, derniere_connexion",
        ),
      { softCap: caps.profiles },
    ),
    fetchAllPaged(
      () =>
        pagedSelect(
          supabase,
          "societes",
          "id, nom, actif, logo_url, adresse, telephone, rccm, nif, afficher_nom_avec_logo, signataire_dg, signataire_pdg, is_transit",
        ),
      { softCap: caps.societes },
    ),
    fetchAllPaged(
      () =>
        pagedSelect(
          supabase,
          "annexes",
          "id, nom, code, ville_siege, adresse, telephone, rccm, nif, devise, actif",
        ),
      { softCap: caps.annexes },
    ),
    fetchAllPaged(() => pagedSelect(supabase, "user_annexes", "user_id, annexe_id"), {
      softCap: caps.userAnnexes,
    }),
  ]);

  const firstError = results.find((result) => result.error)?.error;
  if (firstError) throw firstError;

  return results;
}
