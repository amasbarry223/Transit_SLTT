"use client";

import * as React from "react";
import { useStore, type Facture, type FactureInput, type FactureStatut } from "@/lib/store";
import type { Annexe, Dossier } from "@/lib/domain-types";
import { useNav } from "@/lib/nav-store";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { usePermission } from "@/hooks/use-permission";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import { useUiPrefs } from "@/lib/session/ui-prefs-store";
import { matchesQuery } from "@/lib/search-filter";
import { filterBySociete } from "@/lib/filter-by-societe";
import { filterByAnnexe } from "@/lib/filter-by-annexe";
import { resolveDossierCoutLabels } from "@/lib/societe-brand";
import { PAGE_SIZE } from "./shared";

function buildDossierPrefill(
  dossierId: string,
  dossiers: Dossier[],
  annexes: Annexe[],
): Partial<FactureInput> {
  const d = dossiers.find((x) => x.id === dossierId);
  if (!d) return {};
  const coutLabels = resolveDossierCoutLabels(annexes.find((a) => a.id === d.annexeId)?.code);
  return {
    dossierId: d.id,
    clientId: d.clientId,
    clientNom: d.clientNom,
    // Droits de douane et frais de circuit sont des débours refacturés, pas
    // des prestations — pas de TVA par défaut.
    tauxTVA: 0,
    lignes: [
      { description: `Frais de prestation — ${d.reference} (${d.nature})`, quantite: 1, prixUnitaire: d.fraisPrestation },
      { description: coutLabels.droitDouane, quantite: 1, prixUnitaire: d.droitDouane },
      { description: coutLabels.fraisCircuit, quantite: 1, prixUnitaire: d.fraisCircuit },
    ],
  };
}

export function useFacturesScreen() {
  const canWrite = usePermission("factures:write");
  const factures            = useStore((s) => s.factures);
  const dossiers            = useStore((s) => s.dossiers);
  const annexesAll          = useStore((s) => s.annexes);
  const removeFacture       = useStore((s) => s.removeFacture);
  const updateFactureStatut = useStore((s) => s.updateFactureStatut);
  const go                  = useNav((s) => s.go);
  const { toast }           = useToast();
  const selectedId          = useNav((s) => s.selectedId);
  const pendingFacturePrefill    = useNav((s) => s.pendingFacturePrefill);
  const setPendingFacturePrefill = useNav((s) => s.setPendingFacturePrefill);
  const selectedSocieteId   = useUiPrefs((s) => s.selectedSocieteId);
  const { annexes, selectedAnnexeId } = useActiveAnnexe();

  const [search,     setSearch]     = React.useState("");
  const [activeTab,  setActiveTab]  = React.useState<FactureStatut | "Tous">("Tous");
  const [showForm,   setShowForm]   = React.useState(false);
  const [prefillDossierId, setPrefillDossierId] = React.useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<Facture | null>(null);
  const [envoyeeTarget, setEnvoyeeTarget] = React.useState<Facture | null>(null);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    if (selectedId === "new") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronise avec le routeur
      setPrefillDossierId(undefined);
      setShowForm(true);
      go("factures");
      return;
    }
    if (selectedId?.startsWith("D-")) {
      setPrefillDossierId(selectedId);
      setShowForm(true);
      go("factures");
    }
  }, [selectedId, go]);

  // F6 — pont "Facturer" depuis une prestation optionnelle réalisée
  React.useEffect(() => {
    if (!pendingFacturePrefill) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronise avec le pont nav-store "Facturer" déclenché depuis un autre écran
    setPrefillDossierId(undefined);
    setShowForm(true);
  }, [pendingFacturePrefill]);

  // F1 — Une facture peut être rattachée à une société (entreposage) ou rester
  // au niveau transit global (societeId null) ; le filtre société partagé
  // scope KPIs et table, comme sur Bons de sortie.
  const societeFactures = React.useMemo(
    () => filterByAnnexe(filterBySociete(factures, selectedSocieteId), selectedAnnexeId),
    [factures, selectedSocieteId, selectedAnnexeId],
  );

  const filtered = React.useMemo(() => {
    return societeFactures.filter((f) => {
      const matchTab = activeTab === "Tous" || f.statut === activeTab;
      return matchTab && matchesQuery(f, ["numero", "clientNom"], search);
    });
  }, [societeFactures, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, filtered.length);

  const kpi = React.useMemo(() => {
    const actives  = societeFactures.filter((f) => f.statut !== "Annulée");
    const totalTTC = actives.reduce((s, f) => s + f.montantTTC, 0);
    const totalPaye = actives.reduce((s, f) => s + f.montantPaye, 0);
    const nonSoldees = actives.filter((f) => f.statut !== "Soldée").length;
    const tauxRecouvrement = totalTTC > 0 ? Math.round((totalPaye / totalTTC) * 100) : 0;
    return { total: actives.length, totalTTC, totalPaye, nonSoldees, tauxRecouvrement };
  }, [societeFactures]);

  const tabCounts = React.useMemo(() => {
    const counts = new Map<FactureStatut | "Tous", number>();
    counts.set("Tous", societeFactures.length);
    for (const f of societeFactures) {
      counts.set(f.statut, (counts.get(f.statut) ?? 0) + 1);
    }
    return counts;
  }, [societeFactures]);

  const formPrefill = React.useMemo((): Partial<FactureInput> | undefined => {
    if (prefillDossierId) return buildDossierPrefill(prefillDossierId, dossiers, annexes);
    if (pendingFacturePrefill) {
      return {
        clientId: pendingFacturePrefill.clientId,
        clientNom: pendingFacturePrefill.clientNom,
        societeId: pendingFacturePrefill.societeId,
        lignes: [
          {
            description: pendingFacturePrefill.description,
            quantite: 1,
            prixUnitaire: pendingFacturePrefill.montant,
          },
        ],
      };
    }
    return undefined;
  }, [prefillDossierId, pendingFacturePrefill, dossiers, annexes]);

  function closeForm() {
    setShowForm(false);
    setPrefillDossierId(undefined);
    setPendingFacturePrefill(null);
  }

  function changeTab(tab: FactureStatut | "Tous") {
    setActiveTab(tab);
    setPage(1);
  }

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await removeFacture(deleteTarget.id);
      toastSuccess(toast, { title: "Facture supprimée", description: deleteTarget.numero });
    } catch (err) {
      toastError(toast, err, { title: "Impossible de supprimer la facture", fallback: "Impossible de supprimer la facture" });
    }
  }

  async function handleMarkEnvoyee() {
    if (!envoyeeTarget) return;
    try {
      await updateFactureStatut(envoyeeTarget.id, "Envoyée");
      toastSuccess(toast, { title: "Statut mis à jour", description: `${envoyeeTarget.numero} → Envoyée` });
    } catch (err: unknown) {
      toastError(toast, err, { title: "Transition impossible", fallback: "Cette transition de statut n'est pas autorisée." });
    }
    setEnvoyeeTarget(null);
  }

  return {
    canWrite,
    factures,
    annexesAll,
    go,
    search,
    changeSearch,
    activeTab,
    changeTab,
    tabCounts,
    showForm,
    setShowForm,
    formPrefill,
    formKey: prefillDossierId ?? (pendingFacturePrefill ? "prestation-prefill" : "blank"),
    closeForm,
    deleteTarget,
    setDeleteTarget,
    envoyeeTarget,
    setEnvoyeeTarget,
    page: safePage,
    setPage,
    paged,
    societeFactures,
    filtered,
    totalPages,
    startIdx,
    endIdx,
    kpi,
    handleDelete,
    handleMarkEnvoyee,
  };
}
