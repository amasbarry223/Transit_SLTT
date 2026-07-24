import type { DossierFournisseur, Fournisseur } from "@/lib/domain-types";

/** Recalcule nbDossiers/montantTotal de chaque fournisseur à partir des rattachements dossier↔fournisseur actuels. */
export function syncFournisseurStats(
  dossierFournisseurs: DossierFournisseur[],
  fournisseurs: Fournisseur[],
): Fournisseur[] {
  return fournisseurs.map((f) => {
    const related = dossierFournisseurs.filter((df) => df.fournisseurId === f.id);
    return {
      ...f,
      nbDossiers: related.length,
      montantTotal: related.reduce((sum, df) => sum + df.montantReel, 0),
    };
  });
}
