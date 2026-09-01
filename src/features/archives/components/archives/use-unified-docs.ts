"use client";

import { useMemo } from "react";
import { useStore, type TypeDocument } from "@/lib/store";
import type { RattachementKind, UnifiedDoc } from "./shared";

/* ------------------------------------------------------------------ */
/* Agrégation en lecture — archives + dossier_fichiers + contrat_fichiers */
/* ------------------------------------------------------------------ */

export function useUnifiedDocs(): UnifiedDoc[] {
  const archives = useStore((s) => s.archives);
  const fichiers = useStore((s) => s.fichiers);
  const contratFichiers = useStore((s) => s.contratFichiers);
  const clients = useStore((s) => s.clients);
  const dossiers = useStore((s) => s.dossiers);
  const factures = useStore((s) => s.factures);
  const depenses = useStore((s) => s.depenses);
  const contrats = useStore((s) => s.contrats);

  return useMemo(() => {
    const clientNom = (id?: string) => clients.find((c) => c.id === id)?.nom ?? "";

    const fromArchives: UnifiedDoc[] = archives.map((a) => {
      let category: RattachementKind = "libre";
      let rattachement = "Libre";
      let nomClient = clientNom(a.clientId);
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
      } else if (a.depenseId) {
        category = "depense";
        const dep = depenses.find((x) => x.id === a.depenseId);
        const contrat = dep ? contrats.find((c) => c.id === dep.contratId) : undefined;
        rattachement = dep ? `Dépense — ${dep.libelle}` : "Dépense";
        nomClient = contrat?.clientNom ?? nomClient;
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
        annexeId: c?.annexeId,
        rattachement: c ? `Contrat ${c.reference}` : "Contrat",
        date: f.dateUpload,
        canDelete: true,
      };
    });

    return [...fromArchives, ...fromDossiers, ...fromContrats].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [archives, fichiers, contratFichiers, clients, dossiers, factures, depenses, contrats]);
}
