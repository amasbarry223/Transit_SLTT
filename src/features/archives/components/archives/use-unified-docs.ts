"use client";

import { useMemo } from "react";
import { useStore, type TypeDocument } from "@/lib/store";
import { resolveTransitSociete } from "@/lib/societe-brand";
import type { RattachementKind, UnifiedDoc } from "./shared";

/* ------------------------------------------------------------------ */
/* Agrégation en lecture — archives + dossier_fichiers + contrat_fichiers */
/* ------------------------------------------------------------------ */

export function useUnifiedDocs(): UnifiedDoc[] {
  const archives = useStore((s) => s.archives);
  const fichiers = useStore((s) => s.fichiers);
  const contratFichiers = useStore((s) => s.contratFichiers);
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const dossiers = useStore((s) => s.dossiers);
  const factures = useStore((s) => s.factures);
  const depenses = useStore((s) => s.depenses);
  const contrats = useStore((s) => s.contrats);

  return useMemo(() => {
    const clientNom = (id?: string) => clients.find((c) => c.id === id)?.nom ?? "";
    const societeNom = (id?: string) => societes.find((s) => s.id === id)?.nom ?? "";
    // Les dossiers de transit n'ont pas de societeId propre : ils appartiennent
    // toujours à la société marquée is_transit (cf. resolveTransitSociete).
    const transitSociete = resolveTransitSociete(societes);

    const fromArchives: UnifiedDoc[] = archives.map((a) => {
      let category: RattachementKind = "libre";
      let rattachement = "Libre";
      let nomClient = clientNom(a.clientId);
      let societeId = a.societeId;
      if (a.dossierId) {
        category = "dossier";
        const d = dossiers.find((x) => x.id === a.dossierId);
        rattachement = d ? `Dossier ${d.reference}` : "Dossier";
        nomClient = d?.clientNom ?? nomClient;
      } else if (a.factureId) {
        category = "facture";
        const f = factures.find((x) => x.id === a.factureId);
        rattachement = f ? `Facture ${f.numero}` : "Facture";
        nomClient = f?.clientNom ?? nomClient;
        societeId = societeId ?? f?.societeId;
      } else if (a.depenseId) {
        category = "depense";
        const dep = depenses.find((x) => x.id === a.depenseId);
        const contrat = dep ? contrats.find((c) => c.id === dep.contratId) : undefined;
        rattachement = dep ? `Dépense — ${dep.libelle}` : "Dépense";
        nomClient = contrat?.clientNom ?? nomClient;
        societeId = societeId ?? dep?.societeId;
      }
      return {
        key: `archive-${a.id}`,
        sourceId: a.id,
        source: "archive",
        category,
        nom: a.nom,
        typeDocument: a.typeDocument,
        taille: a.taille,
        mimeType: a.type,
        storagePath: a.storagePath,
        clientNom: nomClient,
        societeId,
        societeNom: societeNom(societeId),
        annexeId: a.annexeId,
        rattachement,
        date: a.createdAt,
        canDelete: true,
      };
    });

    const fromDossiers: UnifiedDoc[] = fichiers.map((f) => {
      const d = dossiers.find((x) => x.id === f.dossierId);
      return {
        key: `dossier-${f.id}`,
        sourceId: f.id,
        source: "dossier",
        category: "dossier" as const,
        nom: f.nom,
        typeDocument: "Autre" as TypeDocument,
        taille: f.taille,
        mimeType: f.type,
        dataUrl: f.dataUrl,
        clientNom: d?.clientNom ?? "",
        societeId: transitSociete?.id,
        societeNom: transitSociete?.nom ?? "",
        annexeId: d?.annexeId,
        rattachement: d ? `Dossier ${d.reference}` : "Dossier",
        date: f.dateUpload,
        canDelete: true,
      };
    });

    const fromContrats: UnifiedDoc[] = contratFichiers.map((f) => {
      const c = contrats.find((x) => x.id === f.contratId);
      return {
        key: `contrat-${f.id}`,
        sourceId: f.id,
        source: "contrat",
        category: "libre" as const,
        nom: f.nom,
        typeDocument: "Contrat" as TypeDocument,
        taille: f.taille,
        mimeType: f.type,
        storagePath: f.storagePath,
        clientNom: c?.clientNom ?? "",
        societeId: c?.societeId,
        societeNom: societeNom(c?.societeId),
        annexeId: c?.annexeId,
        rattachement: c ? `Contrat ${c.reference}` : "Contrat",
        date: f.dateUpload,
        canDelete: true,
      };
    });

    return [...fromArchives, ...fromDossiers, ...fromContrats].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [archives, fichiers, contratFichiers, clients, societes, dossiers, factures, depenses, contrats]);
}
