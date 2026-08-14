"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore, type Ecriture, type PaiementMode } from "@/lib/store";
import { resteAPayer } from "@/lib/domain-types";
import { exportToExcel } from "@/lib/export";
import { formatDateShort, formatFCFA } from "@/lib/format";
import { useNav } from "@/lib/nav-store";
import { LEGACY_TRANSIT_SOCIETE_ID, resolveTransitSociete } from "@/lib/societe-brand";
import { useToast } from "@/hooks/use-toast";
import { toastError } from "@/lib/toast-error";
import { usePermission } from "@/hooks/use-permission";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import { filterByAnnexe } from "@/lib/filter-by-annexe";
import { deriveStatut, PAGE_SIZE, type StatutFilter } from "./shared";

const today = () => new Date().toISOString().slice(0, 10);

export function useEcrituresScreen() {
  const { toast } = useToast();
  const canWrite = usePermission("comptabilite:write");
  const go = useNav((state) => state.go);
  const selectedId = useNav((state) => state.selectedId);
  const allEcritures = useStore((state) => state.ecritures);
  const clients = useStore((state) => state.clients);
  const dossiers = useStore((state) => state.dossiers);
  const societes = useStore((state) => state.societes);
  const recordPayment = useStore((state) => state.recordPayment);
  const addEcriture = useStore((state) => state.addEcriture);
  const { selectedAnnexeId } = useActiveAnnexe();

  const transitSocieteId = useMemo(
    () => resolveTransitSociete(societes)?.id ?? LEGACY_TRANSIT_SOCIETE_ID,
    [societes],
  );
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const resolvedTab = activeTab ?? transitSocieteId;
  const sortedSocietes = useMemo(
    () => [...societes].sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    [societes],
  );
  const ecritures = useMemo(() => {
    const bySociete =
      resolvedTab === "all"
        ? allEcritures
        : resolvedTab === transitSocieteId
          ? allEcritures.filter((ecriture) => !ecriture.societeId || ecriture.societeId === transitSocieteId)
          : allEcritures.filter((ecriture) => ecriture.societeId === resolvedTab);
    return filterByAnnexe(bySociete, selectedAnnexeId);
  }, [allEcritures, resolvedTab, transitSocieteId, selectedAnnexeId]);

  const [query, setQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutFilter>("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selected, setSelected] = useState<Ecriture | null>(null);
  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState<PaiementMode>("Virement");
  const [datePaiement, setDatePaiement] = useState(today);
  const [note, setNote] = useState("");

  const [newOpen, setNewOpen] = useState(false);
  const [neClientId, setNeClientId] = useState("");
  const [neDossierId, setNeDossierId] = useState("");
  const [neInvesti, setNeInvesti] = useState("");
  const [nePaye, setNePaye] = useState("");
  const [neMode, setNeMode] = useState<PaiementMode>("Virement");
  const [neDate, setNeDate] = useState(today);
  const [neNote, setNeNote] = useState("");
  const [neSocieteId, setNeSocieteId] = useState("");

  const clientDossiers = useMemo(
    () => neClientId ? dossiers.filter((dossier) => dossier.clientId === neClientId) : [],
    [neClientId, dossiers],
  );
  const totalInvesti = useMemo(() => ecritures.reduce((sum, ecriture) => sum + ecriture.montantInvesti, 0), [ecritures]);
  const totalPaye = useMemo(() => ecritures.reduce((sum, ecriture) => sum + ecriture.montantPaye, 0), [ecritures]);
  const totalDu = totalInvesti - totalPaye;
  const enAttenteCount = useMemo(() => ecritures.filter((ecriture) => deriveStatut(ecriture) === "En attente").length, [ecritures]);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ecritures.filter((ecriture) => {
      if (clientFilter !== "all" && ecriture.clientId !== clientFilter) return false;
      if (statutFilter !== "all" && deriveStatut(ecriture) !== statutFilter) return false;
      const haystack = `${ecriture.clientNom} ${ecriture.id} ${ecriture.modePaiement} ${ecriture.note ?? ""}`.toLowerCase();
      return !normalizedQuery || haystack.includes(normalizedQuery);
    });
  }, [ecritures, query, statutFilter, clientFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, filtered.length);
  const hasActiveFilters = query.trim() !== "" || statutFilter !== "all" || clientFilter !== "all";

  function clearFilters() {
    setQuery("");
    setStatutFilter("all");
    setClientFilter("all");
    setPage(1);
  }

  function resetNewEcriture() {
    setNeClientId("");
    setNeDossierId("");
    setNeInvesti("");
    setNePaye("");
    setNeMode("Virement");
    setNeDate(today());
    setNeNote("");
    setNeSocieteId(resolvedTab !== "all" ? resolvedTab : "");
  }

  function openNewEcriture() {
    resetNewEcriture();
    setNewOpen(true);
  }

  useEffect(() => {
    if (selectedId === "new") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation avec le routeur
      openNewEcriture();
      go("comptabilite");
    }
  }, [selectedId, go]);

  function openPayment(ecriture: Ecriture) {
    setSelected(ecriture);
    setMontant(String(resteAPayer(ecriture)));
    setMode(ecriture.modePaiement);
    setDatePaiement(today());
    setNote(ecriture.note ?? "");
    setPaymentOpen(true);
  }

  function validatePayment() {
    if (!selected) return;
    const montantNum = Number(montant.replace(/\s/g, "")) || 0;
    const reste = resteAPayer(selected);
    if (montantNum <= 0 || montantNum > reste) {
      toast({
        title: "Montant invalide",
        description: montantNum <= 0
          ? "Le montant doit être supérieur à 0."
          : `Le paiement (${formatFCFA(montantNum)}) dépasse le reste à payer (${formatFCFA(reste)}).`,
        variant: "destructive",
      });
      return;
    }
    recordPayment(selected.id, montantNum, mode, datePaiement, note);
    toast({ title: "Paiement enregistré", description: "Le solde du dossier a été mis à jour." });
    setPaymentOpen(false);
    setSelected(null);
  }

  function handleClientChange(id: string) {
    setNeClientId(id);
    setNeDossierId("");
  }

  function handleDossierChange(id: string) {
    setNeDossierId(id);
    const linked = clientDossiers.find((dossier) => dossier.id === id);
    if (linked) setNeInvesti(String(linked.montantInvesti));
  }

  function createEcriture() {
    if (!neClientId) {
      toast({ title: "Client requis", description: "Veuillez sélectionner un client.", variant: "destructive" });
      return;
    }
    const client = clients.find((item) => item.id === neClientId);
    if (!client) return;
    const investi = Number(neInvesti.replace(/\s/g, "")) || 0;
    const paye = Number(nePaye.replace(/\s/g, "")) || 0;
    if (investi <= 0) {
      toast({ title: "Montant invalide", description: "Le montant investi doit être supérieur à 0.", variant: "destructive" });
      return;
    }
    if (paye > investi) {
      toast({
        title: "Montant payé plafonné",
        description: `Le montant payé (${formatFCFA(paye)}) dépasse le montant investi (${formatFCFA(investi)}). Il a été ramené à ${formatFCFA(investi)}.`,
      });
    }
    addEcriture({
      date: neDate,
      clientId: neClientId,
      clientNom: client.nom,
      dossierId: neDossierId || undefined,
      societeId: neSocieteId || undefined,
      annexeId: client.annexeId,
      montantInvesti: investi,
      montantPaye: Math.min(paye, investi),
      modePaiement: neMode,
      note: neNote || undefined,
    });
    toast({ title: "Écriture créée", description: `${client.nom} — ${formatFCFA(investi)} investi.` });
    setNewOpen(false);
    resetNewEcriture();
  }

  async function exportExcel() {
    if (filtered.length === 0) {
      toast({ title: "Rien à exporter", description: "Aucune écriture ne correspond aux filtres actuels.", variant: "destructive" });
      return;
    }
    try {
      await exportToExcel(
        "comptabilite",
        `comptabilite-ecritures-${today()}`,
        [
          { header: "Date", accessor: (ecriture: Ecriture) => formatDateShort(ecriture.date) },
          { header: "Client", accessor: (ecriture: Ecriture) => ecriture.clientNom },
          { header: "Société", accessor: (ecriture: Ecriture) => ecriture.societeNom ?? "" },
          { header: "Investi (FCFA)", accessor: (ecriture: Ecriture) => ecriture.montantInvesti },
          { header: "Payé (FCFA)", accessor: (ecriture: Ecriture) => ecriture.montantPaye },
          { header: "Reste dû (FCFA)", accessor: (ecriture: Ecriture) => resteAPayer(ecriture) },
          { header: "Écart (FCFA)", accessor: (ecriture: Ecriture) => ecriture.montantPaye - ecriture.montantInvesti },
          { header: "Mode de paiement", accessor: (ecriture: Ecriture) => ecriture.modePaiement },
          { header: "Statut", accessor: (ecriture: Ecriture) => deriveStatut(ecriture) },
        ],
        filtered,
        { module: "Comptabilité" },
      );
    } catch (error) {
      toastError(toast, error, "Impossible de générer l'export Excel.");
      return;
    }
    toast({ title: "Export Excel généré", description: `${filtered.length} écriture${filtered.length !== 1 ? "s" : ""} exportée${filtered.length !== 1 ? "s" : ""}.` });
  }

  return {
    canWrite, go, clients, societes, sortedSocietes, resolvedTab, setActiveTab,
    query, statutFilter, clientFilter, setQuery, setStatutFilter, setClientFilter,
    page: safePage, setPage, filtered, paged, totalPages, startIdx, endIdx, hasActiveFilters, clearFilters,
    totalInvesti, totalPaye, totalDu, enAttenteCount,
    paymentOpen, setPaymentOpen, selected, montant, setMontant, mode, setMode,
    datePaiement, setDatePaiement, note, setNote, openPayment, validatePayment,
    newOpen, setNewOpen, neClientId, neDossierId, neInvesti, setNeInvesti,
    nePaye, setNePaye, neMode, setNeMode, neDate, setNeDate, neNote, setNeNote,
    neSocieteId, setNeSocieteId, clientDossiers, handleClientChange, handleDossierChange,
    openNewEcriture, createEcriture, exportExcel,
  };
}
