"use client";

import { useMemo, useState } from "react";
import { useStore, type TypeDocument } from "@/lib/store";
import { matchesQuery } from "@/lib/search-filter";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { usePermission, useHasRole } from "@/hooks/use-permission";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import { usePagination } from "@/shared/hooks/use-pagination";
import type { FilterChip } from "@/components/sltt/list-filters";
import { useUnifiedDocs } from "./use-unified-docs";
import { TAB_META, TYPES_DOCUMENT, type ArchiveTab, type RattachementKind, type UnifiedDoc } from "./shared";

const PAGE_SIZE = 8;

export function useArchivesScreen() {
  const { toast } = useToast();
  const canWrite = usePermission("archives:write");
  const isAdmin = useHasRole("Administrateur");
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const deleteArchive = useStore((s) => s.deleteArchive);
  const deleteFichier = useStore((s) => s.deleteFichier);
  const deleteContratFichier = useStore((s) => s.deleteContratFichier);
  const getSignedArchiveUrl = useStore((s) => s.getSignedArchiveUrl);
  const getSignedContratFichierUrl = useStore((s) => s.getSignedContratFichierUrl);

  const docs = useUnifiedDocs();
  const { selectedAnnexeId } = useActiveAnnexe();

  const [activeTab, setActiveTab] = useState<ArchiveTab>("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeDocument | null>(null);
  const [clientFilter, setClientFilter] = useState("");
  const [societeFilter, setSocieteFilter] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UnifiedDoc | null>(null);
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const base = { all: docs.length, dossier: 0, facture: 0, depense: 0, libre: 0 };
    for (const d of docs) base[d.category] += 1;
    return base;
  }, [docs]);

  const filtered = useMemo(() => {
    const clientNom = clientFilter
      ? clients.find((c) => c.id === clientFilter)?.nom
      : undefined;
    return docs.filter((d) => {
      if (activeTab !== "all" && d.category !== activeTab) return false;
      if (!matchesQuery(d, ["nom", "rattachement"], search.trim())) return false;
      if (typeFilter && d.typeDocument !== typeFilter) return false;
      if (clientNom && d.clientNom !== clientNom) return false;
      if (societeFilter && d.societeId !== societeFilter) return false;
      if (selectedAnnexeId && d.annexeId !== selectedAnnexeId) return false;
      if (dateDebut && d.date < dateDebut) return false;
      if (dateFin && d.date > `${dateFin}T23:59:59`) return false;
      return true;
    });
  }, [docs, activeTab, search, typeFilter, clientFilter, societeFilter, selectedAnnexeId, clients, dateDebut, dateFin]);

  const { totalPages, safePage, paged, startIdx, endIdx } = usePagination(filtered, page, PAGE_SIZE);

  const chips: FilterChip[] = TYPES_DOCUMENT.map((t) => ({
    id: t,
    label: t,
    active: typeFilter === t,
    onToggle: () => setTypeFilter((cur) => (cur === t ? null : t)),
  }));

  const activeCount = [typeFilter, clientFilter, societeFilter, dateDebut, dateFin].filter(Boolean).length;
  const currentMeta = TAB_META.find((t) => t.key === activeTab) ?? TAB_META[0];
  const uploadKind: RattachementKind = activeTab === "all" ? "libre" : activeTab;
  const showFolderEmpty = activeTab === "dossier" || activeTab === "all";

  function clearFilters() {
    setTypeFilter(null);
    setClientFilter("");
    setSocieteFilter("");
    setDateDebut("");
    setDateFin("");
  }

  async function handleOpen(doc: UnifiedDoc) {
    try {
      let url: string;
      if (doc.source === "dossier" && doc.dataUrl) {
        url = doc.dataUrl;
      } else if (doc.source === "contrat" && doc.storagePath) {
        url = await getSignedContratFichierUrl(doc.storagePath);
      } else if (doc.storagePath) {
        url = await getSignedArchiveUrl(doc.storagePath);
      } else {
        throw new Error("Fichier introuvable.");
      }
      window.open(url, "_blank", "noopener");
    } catch {
      toastWarning(toast, { title: "Impossible d'ouvrir le document" });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.source === "dossier") {
        await deleteFichier(deleteTarget.sourceId);
      } else if (deleteTarget.source === "contrat") {
        await deleteContratFichier(deleteTarget.sourceId);
      } else {
        await deleteArchive(deleteTarget.sourceId);
      }
      toastSuccess(toast, { title: "Document supprimé" });
    } catch (e) {
      toastError(toast, e, { title: "Échec de la suppression", fallback: "Erreur inattendue." });
    } finally {
      setDeleteTarget(null);
    }
  }

  return {
    canWrite,
    isAdmin,
    clients,
    societes,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    societeFilter,
    setSocieteFilter,
    clientFilter,
    setClientFilter,
    dateDebut,
    setDateDebut,
    dateFin,
    setDateFin,
    uploadOpen,
    setUploadOpen,
    deleteTarget,
    setDeleteTarget,
    counts,
    filtered,
    paged,
    page: safePage,
    totalPages,
    startIdx,
    endIdx,
    setPage,
    chips,
    activeCount,
    currentMeta,
    uploadKind,
    showFolderEmpty,
    clearFilters,
    handleOpen,
    handleDelete,
  };
}
