"use client";

import { useUiPrefs } from "@/lib/session/ui-prefs-store";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import type { Devis, DevisInput, DevisStatut } from "@/lib/store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { exportToExcel, printDevis, printDevisList } from "@/lib/export";
import { resolveSlttBrand } from "@/lib/classeur";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import { matchesQuery } from "@/lib/search-filter";
import { usePermission } from "@/hooks/use-permission";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import { filterByAnnexe } from "@/lib/filter-by-annexe";
import { PageHeader } from "@/components/sltt/page-header";
import { ConvertDevisDialog } from "@/components/sltt/convert-devis-dialog";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { ConfirmActionDialog } from "@/components/sltt/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import { devisStatutNeedsConfirm } from "@/lib/confirm-transitions";
import { DevisFormDialog } from "@/components/sltt/devis/devis-form-dialog";
import { NEXT_STATUT } from "@/components/sltt/devis/devis-statut-config";
import { DevisListKpis } from "@/components/sltt/devis/devis-list-kpis";
import { DevisListBanner } from "@/components/sltt/devis/devis-list-banner";
import { DevisListFilters, type DevisSortKey } from "@/components/sltt/devis/devis-list-filters";
import { DevisListTable } from "@/components/sltt/devis/devis-list-table";

const PAGE_SIZE = 8;

export function DevisScreen() {
  const { toast } = useToast();
  const canWrite = usePermission("devis:write");
  const openDossierDetail = useNav((s) => s.openDossierDetail);
  const openDevisDetail = useNav((s) => s.openDevisDetail);
  const go = useNav((s) => s.go);
  const selectedId = useNav((s) => s.selectedId);
  const selectedSocieteId = useUiPrefs((s) => s.selectedSocieteId);
  const { selectedAnnexeId } = useActiveAnnexe();
  const devisList = useStore((s) => s.devis);
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const addDevis = useStore((s) => s.addDevis);
  const updateDevis = useStore((s) => s.updateDevis);
  const updateDevisStatut = useStore((s) => s.updateDevisStatut);
  const expireDevisObsoletes = useStore((s) => s.expireDevisObsoletes);
  const removeDevis = useStore((s) => s.removeDevis);

  useEffect(() => { expireDevisObsoletes(); }, [expireDevisObsoletes]);

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState<DevisStatut | "Tous">("Tous");
  const [sortBy, setSortBy] = useState<DevisSortKey>("date-desc");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editDevis, setEditDevis] = useState<Devis | null>(null);
  const { target: deleteTarget, setTarget: setDeleteTarget, confirm: handleDelete } = useDeleteConfirm<Devis>(
    removeDevis, (d) => d.id, (d) => d.reference, "Devis supprimé", "Impossible de supprimer le devis",
  );
  const [convertTarget, setConvertTarget] = useState<Devis | null>(null);
  const [pendingStatut, setPendingStatut] = useState<{ devis: Devis; statut: DevisStatut } | null>(null);
  const [savingDevis, setSavingDevis] = useState(false);

  useEffect(() => {
    if (selectedId === "new") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronise avec le routeur
      setEditDevis(null);
      setFormOpen(true);
      go("devis");
    }
  }, [selectedId, go]);

  const scopedDevis = useMemo(() => {
    const bySociete = selectedSocieteId ? devisList.filter((d) => d.societeId === selectedSocieteId) : devisList;
    return filterByAnnexe(bySociete, selectedAnnexeId);
  }, [devisList, selectedSocieteId, selectedAnnexeId]);
  const { enAttente, acceptes, totalEstime } = useMemo(() => {
    let enAttente = 0, acceptes = 0, totalEstime = 0;
    for (const d of scopedDevis) {
      if (d.statut === "Envoyé") enAttente++;
      if (d.statut === "Accepté") acceptes++;
      if (d.statut !== "Refusé" && d.statut !== "Expiré") totalEstime += d.total;
    }
    return { enAttente, acceptes, totalEstime };
  }, [scopedDevis]);
  const filtered = useMemo(() => {
    const result = scopedDevis.filter((d) =>
      matchesQuery(d, ["reference", "clientNom", "nature", "societeNom"], search) &&
      (clientFilter === "all" || d.clientId === clientFilter) &&
      (statutFilter === "Tous" || d.statut === statutFilter));
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.dateCreation.localeCompare(a.dateCreation);
        case "date-asc": return a.dateCreation.localeCompare(b.dateCreation);
        case "reference": return a.reference.localeCompare(b.reference);
        case "client": return a.clientNom.localeCompare(b.clientNom, "fr");
        case "montant-desc": return b.total - a.total;
        case "montant-asc": return a.total - b.total;
        case "validite-asc": return a.dateValidite.localeCompare(b.dateValidite);
        case "statut": return a.statut.localeCompare(b.statut);
      }
    });
  }, [scopedDevis, search, clientFilter, statutFilter, sortBy]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, filtered.length);
  const activeFiltersCount = [search.trim() !== "", clientFilter !== "all", statutFilter !== "Tous"].filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0;
  const clearFilters = () => {
    setSearch(""); setClientFilter("all"); setStatutFilter("Tous"); setSortBy("date-desc"); setPage(1);
  };

  async function handleSaveForm(input: DevisInput) {
    if (savingDevis) return;
    setSavingDevis(true);
    try {
      if (editDevis) {
        await updateDevis(editDevis.id, input);
        toastSuccess(toast, { title: "Devis modifié", description: editDevis.reference });
      } else {
        const devis = await addDevis(input);
        toastSuccess(toast, { title: "Devis créé", description: devis.reference });
      }
      setFormOpen(false); setEditDevis(null);
    } catch (error) {
      toastError(toast, error, {
        title: "Impossible de sauvegarder le devis",
        fallback: UI.errors.saveFailed,
      });
    } finally {
      setSavingDevis(false);
    }
  }
  async function applyStatut(devis: Devis, statut: DevisStatut) {
    try {
      await updateDevisStatut(devis.id, statut);
      toastSuccess(toast, { title: "Statut mis à jour", description: `${devis.reference} → ${statut}` });
    } catch (error) {
      toastError(toast, error, {
        title: "Impossible de mettre à jour le statut",
        fallback: "Impossible de mettre à jour le statut du devis.",
      });
    }
  }
  async function handleQuickStatut(devis: Devis, statut: DevisStatut) {
    if (devisStatutNeedsConfirm(statut)) {
      setPendingStatut({ devis, statut });
      return;
    }
    await applyStatut(devis, statut);
  }
  function handlePrintDevis(devis: Devis) {
    const client = clients.find((c) => c.id === devis.clientId);
    printDevis({
      reference: devis.reference,
      clientNom: devis.clientNom,
      clientAdresse: client?.adresse,
      clientTelephone: client?.telephone,
      clientEmail: client?.email,
      nature: devis.nature,
      dateCreation: devis.dateCreation,
      dateValidite: devis.dateValidite,
      droitDouane: devis.droitDouane,
      fraisCircuit: devis.fraisCircuit,
      fraisPrestation: devis.fraisPrestation,
      total: devis.total,
      notes: devis.notes,
      statut: devis.statut,
    }, resolveSlttBrand(societes));
  }
  async function handleExportExcel() {
    if (filtered.length === 0) {
      toastWarning(toast, {
        title: "Rien à exporter",
        description: UI.errors.exportEmpty,
      });
      return;
    }
    try {
      await exportToExcel(`devis`, `devis-sltt-${new Date().toISOString().slice(0, 10)}`, [
        { header: "Référence", accessor: (d: Devis) => d.reference },
        { header: "Client", accessor: (d: Devis) => d.clientNom },
        { header: "Société", accessor: (d: Devis) => d.societeNom },
        { header: "Nature", accessor: (d: Devis) => d.nature },
        { header: "Droits douane", accessor: (d: Devis) => d.droitDouane },
        { header: "Frais circuit", accessor: (d: Devis) => d.fraisCircuit },
        { header: "Prestation SLTT", accessor: (d: Devis) => d.fraisPrestation },
        { header: "Total estimé", accessor: (d: Devis) => d.total },
        { header: "Date création", accessor: (d: Devis) => formatDateShort(d.dateCreation) },
        { header: "Date validité", accessor: (d: Devis) => formatDateShort(d.dateValidite) },
        { header: "Statut", accessor: (d: Devis) => d.statut },
      ], filtered, { module: "Devis" });
    } catch { return; }
    toastSuccess(toast, { title: "Export Excel généré", description: `${filtered.length} devis exportés.` });
  }
  function handleExportPDF() {
    if (filtered.length === 0) {
      toastWarning(toast, {
        title: "Rien à exporter",
        description: UI.errors.exportEmpty,
      });
      return;
    }
    const parts: string[] = [];
    if (search.trim()) parts.push(`Recherche : ${search.trim()}`);
    if (clientFilter !== "all") {
      const c = clients.find((item) => item.id === clientFilter);
      if (c) parts.push(`Client : ${c.nom}`);
    }
    if (statutFilter !== "Tous") parts.push(`Statut : ${statutFilter}`);
    printDevisList(
      filtered.map((d) => ({
        reference: d.reference,
        clientNom: d.clientNom,
        nature: d.nature,
        total: d.total,
        dateValidite: d.dateValidite,
        statut: d.statut,
      })),
      parts.length ? `Filtre : ${parts.join(" · ")}` : undefined,
      resolveSlttBrand(societes),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Devis" description="Estimations tarifaires avant ouverture de dossier">
        {canWrite && <Button onClick={() => { setEditDevis(null); setFormOpen(true); }}><Plus className="size-4" />Nouveau devis</Button>}
      </PageHeader>
      <DevisListKpis totalDevis={scopedDevis.length} enAttente={enAttente} acceptes={acceptes} totalEstime={totalEstime} />
      <DevisListBanner enAttente={enAttente} />
      <DevisListFilters
        search={search} setSearch={setSearch} clients={clients} clientFilter={clientFilter}
        setClientFilter={setClientFilter} statutFilter={statutFilter} setStatutFilter={setStatutFilter}
        sortBy={sortBy} setSortBy={setSortBy} setPage={setPage} hasActiveFilters={hasActiveFilters}
        activeFiltersCount={activeFiltersCount} clearFilters={clearFilters} filteredCount={filtered.length}
        handleExportPDF={handleExportPDF} handleExportExcel={handleExportExcel}
      />
      <DevisListTable
        filtered={filtered} paged={paged} hasActiveFilters={hasActiveFilters} canWrite={canWrite}
        setEditDevis={setEditDevis} setFormOpen={setFormOpen}
        handleOpenDevis={(d) => openDevisDetail(d.id, false)}
        handleOpenEdit={(d) => openDevisDetail(d.id, true)}
        handlePrintDevis={handlePrintDevis} handleQuickStatut={handleQuickStatut}
        openDossierDetail={openDossierDetail} setConvertTarget={setConvertTarget}
        setDeleteTarget={setDeleteTarget} startIdx={startIdx} endIdx={endIdx}
        safePage={safePage} totalPages={totalPages} setPage={setPage}
      />
      <DevisFormDialog
        open={formOpen} devis={editDevis} clients={clients} societes={societes}
        defaultSocieteId={selectedSocieteId}
        saving={savingDevis}
        onClose={() => { setFormOpen(false); setEditDevis(null); }} onSave={handleSaveForm}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer ce devis ?"
        description={<>Cette action est irréversible. Le devis {deleteTarget?.reference} sera définitivement supprimé.</>}
        onConfirm={handleDelete}
      />
      <ConfirmActionDialog
        open={!!pendingStatut}
        onOpenChange={(open) => !open && setPendingStatut(null)}
        title={`Passer le devis au statut « ${pendingStatut?.statut} » ?`}
        description={
          pendingStatut ? (
            <>
              Le devis <strong>{pendingStatut.devis.reference}</strong> ({pendingStatut.devis.clientNom}) passera au
              statut <strong>{pendingStatut.statut}</strong>. Cette transition peut limiter les modifications ultérieures.
            </>
          ) : null
        }
        confirmLabel={`Passer à ${pendingStatut?.statut ?? ""}`}
        variant={pendingStatut?.statut === "Refusé" ? "destructive" : "default"}
        onConfirm={async () => {
          if (!pendingStatut) return;
          await applyStatut(pendingStatut.devis, pendingStatut.statut);
          setPendingStatut(null);
        }}
      />
      <ConvertDevisDialog
        key={convertTarget?.id ?? "closed"} devis={convertTarget} onClose={() => setConvertTarget(null)}
        onConverted={openDossierDetail}
      />
    </div>
  );
}
