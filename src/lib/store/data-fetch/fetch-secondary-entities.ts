import type { SupabaseClient } from "@supabase/supabase-js";
import { FETCH_ENTITY_SOFT_CAPS } from "@/lib/constants";
import { FETCH_SOFT_CAPS, fetchAllPaged, pagedSelect } from "@/lib/store/fetch-pages";

export const SECONDARY_FETCH_KEYS = [
  "stock",
  "mouvements",
  "bons",
  "subDossiers",
  "fichiers",
  "devis",
  "transporteurs",
  "fournisseurs",
  "dossierFournisseurs",
  "contrats",
  "contratFichiers",
  "depenses",
  "contratPrestations",
  "bonsSortieCaisse",
  "operationsComptables",
  "cloturesCaisse",
  "recusPaiement",
  "auditLogs",
  "archives",
  "documents",
  "documentVersions",
  "ocrJobs",
  "ocrFields",
] as const;

export type SecondaryFetchKey = (typeof SECONDARY_FETCH_KEYS)[number];

export type SecondaryFetchSpec = {
  key: SecondaryFetchKey;
  q: () => ReturnType<typeof fetchAllPaged>;
};

// Colonnes limitées à ce que chaque mapXFromDb (seul consommateur de ces
// lignes brutes) lit réellement — voir les fichiers slice correspondants
// (stock, bons, fichiers, devis, transporteurs, fournisseurs, contrats,
// comptabilite-generale, recus-paiement, archives, documents, audit).
export function buildSecondaryFetchSpecs(supabase: SupabaseClient): SecondaryFetchSpec[] {
  const caps = FETCH_ENTITY_SOFT_CAPS;
  return [
    {
      key: "stock",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "stock_items",
              "id, client_id, societe_id, annexe_id, marchandise, quantite, unite, seuil, depositaire, commercial, somme_payee, reste_a_payer, clients(nom), societes(nom), annexes(nom)",
            ),
          { softCap: caps.default },
        ),
    },
    {
      key: "mouvements",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "mouvements",
              "id, stock_id, societe_id, annexe_id, date, type, marchandise, quantite, unite, responsable, bon_ref, motif, societes(nom), annexes(nom)",
              { column: "date", ascending: false },
            ),
          { softCap: FETCH_SOFT_CAPS.mouvements },
        ),
    },
    {
      key: "bons",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "bons_sortie",
              // client_nom : pas une colonne réelle (fallback mort dans mapBonFromDb,
              // seul clients(nom) alimente clientNom en pratique) — non sélectionné.
              "id, reference, date, client_id, societe_id, annexe_id, stock_id, marchandise, quantite, unite, motif, montant, statut, clients(nom), societes(nom), annexes(nom)",
            ),
          { softCap: caps.default },
        ),
    },
    {
      key: "subDossiers",
      q: () =>
        fetchAllPaged(
          () => pagedSelect(supabase, "sub_dossiers", "id, dossier_id, nom, description, date_creation"),
          { softCap: caps.default },
        ),
    },
    {
      key: "fichiers",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "dossier_fichiers",
              "id, dossier_id, sous_dossier_id, nom, taille, type, date_upload, data_url",
            ),
          { softCap: caps.default },
        ),
    },
    {
      key: "devis",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "devis",
              // dossier_id n'est pas une colonne de la table devis (déjà le cas avec
              // select("*")) : Devis.dossierId est toujours undefined au chargement,
              // seule la mise à jour locale post-conversion le renseigne en session.
              "id, reference, client_id, societe_id, annexe_id, nature, droit_douane, frais_circuit, frais_prestation, total, statut, date_creation, date_validite, notes, clients(nom), societes(nom), annexes(nom)",
            ),
          { softCap: caps.default },
        ),
    },
    {
      key: "transporteurs",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "transporteurs",
              "id, nom, contact, telephone, email, vehicule, immatriculation, trajet, capacite, statut, date_creation, notes, annexe_id",
            ),
          { softCap: caps.transporteurs },
        ),
    },
    {
      key: "fournisseurs",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "fournisseurs",
              "id, nom, type, contact, telephone, email, adresse, tarif_contractuel, statut, annexe_id",
            ),
          { softCap: caps.default },
        ),
    },
    {
      key: "dossierFournisseurs",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "dossier_fournisseurs",
              "id, dossier_id, fournisseur_id, description, montant_budgete, montant_reel, statut, date, fournisseurs(nom, type), dossiers(reference)",
            ),
          { softCap: caps.default },
        ),
    },
    {
      key: "contrats",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "contrats",
              "id, reference, societe_id, annexe_id, client_id, objet, date_debut, date_fin, montant, statut, notes, cree_par, created_at, clients(nom), societes(nom), annexes(nom)",
            ),
          { softCap: caps.default },
        ),
    },
    {
      key: "contratFichiers",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "contrat_fichiers",
              "id, contrat_id, nom, taille, type, date_upload, created_at, storage_path",
            ),
          { softCap: caps.default },
        ),
    },
    {
      key: "depenses",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "depenses",
              "id, contrat_id, societe_id, libelle, montant, date_depense, mode_paiement, justificatif_path, note, cree_par",
            ),
          { softCap: caps.default },
        ),
    },
    {
      key: "contratPrestations",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "contrat_prestations",
              "id, contrat_id, libelle, description, montant, statut, date_prevue, date_realisation, cree_par",
            ),
          { softCap: caps.default },
        ),
    },
    {
      key: "bonsSortieCaisse",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "bons_sortie_caisse",
              "id, reference, date, societe_id, annexe_id, montant_total, cree_par, created_at, bons_sortie_caisse_lignes(id, date, beneficiaire, motif, montant), societes(nom), annexes(nom)",
            ),
          { softCap: caps.default },
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
              // clients/societes/annexes ne sont pas embarqués : le mapper lit le
              // libellé dénormalisé row.client_nom, pas une relation.
              "id, reference, entite_type, annexe_id, societe_id, date, client_id, client_nom, nature, type, montant, quantite, prix_unitaire, source, import_ref, cree_par",
            ),
          { softCap: caps.operationsComptables },
        ),
    },
    {
      key: "cloturesCaisse",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "clotures_caisse",
              "id, entite_type, annexe_id, societe_id, periode_debut, periode_fin, solde_theorique, solde_constate, ecart, note, cloture_par, cloture_le",
            ),
          { softCap: caps.cloturesCaisse },
        ),
    },
    {
      key: "recusPaiement",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "recus_paiement",
              "id, reference, annexe_id, nom, prenom, somme, motif, montant_paye, reste, statut, cree_par, created_at, annexes(nom)",
            ),
          { softCap: caps.recusPaiement },
        ),
    },
    {
      key: "auditLogs",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "audit_logs",
              // created_at / user_nom : pas des colonnes réelles (fallbacks morts dans
              // mapAuditLogFromDb — date et user_name sont les colonnes effectives).
              "id, date, user_name, module, action, detail, ip, client_id, source_type, source_id, annexe_id",
              { column: "date", ascending: false },
            ),
          { softCap: FETCH_SOFT_CAPS.audit_logs },
        ),
    },
    {
      key: "archives",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "archives",
              "id, nom, type_document, taille, mime_type, storage_path, dossier_id, facture_id, depense_id, client_id, societe_id, annexe_id, cree_par, created_at",
            ),
          { softCap: caps.archives },
        ),
    },
    {
      key: "documents",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "documents",
              "id, nom, categorie, mime_type, taille, dossier_id, facture_id, client_id, societe_id, entity_type, entity_id, annexe_id, current_version, cree_par, created_at, updated_at",
              { column: "created_at", ascending: false },
            ),
          { softCap: FETCH_SOFT_CAPS.documents },
        ),
    },
    {
      key: "documentVersions",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "document_versions",
              "id, document_id, version, storage_path, taille, mime_type, checksum, uploaded_by, created_at",
              { column: "created_at", ascending: false },
            ),
          { softCap: FETCH_SOFT_CAPS.document_versions },
        ),
    },
    {
      key: "ocrJobs",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "ocr_jobs",
              "id, document_id, document_version_id, status, provider, raw_text, error_message, target_form, created_by, created_at, completed_at",
              { column: "created_at", ascending: false },
            ),
          { softCap: FETCH_SOFT_CAPS.ocr_jobs },
        ),
    },
    {
      key: "ocrFields",
      q: () =>
        fetchAllPaged(
          () =>
            pagedSelect(
              supabase,
              "ocr_fields",
              "id, ocr_job_id, field_key, field_value, confidence, bbox, validated_value",
            ),
          { softCap: FETCH_SOFT_CAPS.ocr_fields },
        ),
    },
  ];
}

export type SecondaryFetchResult = {
  key: SecondaryFetchKey;
  data: unknown[] | null;
  error: unknown;
  truncated: boolean;
};

export async function fetchSecondaryEntities(
  specs: SecondaryFetchSpec[],
): Promise<SecondaryFetchResult[]> {
  return Promise.all(
    specs.map(async (spec) => {
      try {
        const result = await spec.q();
        return {
          key: spec.key,
          data: result.data,
          error: result.error,
          truncated: result.truncated,
        };
      } catch (error) {
        return {
          key: spec.key,
          data: null,
          error: error instanceof Error ? error : { message: String(error) },
          truncated: false,
        };
      }
    }),
  );
}
