"use client";

import { useCallback, useMemo, useState } from "react";
import { usePagination } from "@/shared/hooks/use-pagination";
import {
  Plus,
  Search,
  Users,
  Building2,
  User,
  Wallet,
  Printer,
  RotateCcw,
} from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import type { ClientInput } from "@/features/clients/types";
import { formatFCFA } from "@/lib/format";
import { printClients } from "@/features/clients/services/client-print";
import { resolveSlttBrand } from "@/lib/classeur";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastWarning, toastSuccess } from "@/shared/utils/toast-helpers";
import { usePermission } from "@/shared/hooks/use-permission";
import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import { filterByAnnexe } from "@/lib/filter-by-annexe";
import { DashboardKpiCard } from "@/components/sltt/dashboard/dashboard-kpi-card";
import {
  ClientsTable,
  CLIENT_TYPES,
  SORT_OPTIONS,
  type ClientSortKey,
  type ClientTypeFilter,
} from "@/features/clients/components";
import { ClientFormFields, emptyClientForm } from "@/features/clients/components/client-form-fields";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";

export function ClientsScreen() {
  const { toast } = useToast();
  const canWrite = usePermission("clients:write");
  const openClient = useNav((s) => s.openClient);
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const addClient = useStore((s) => s.addClient);
  const updateClient = useStore((s) => s.updateClient);
  const deleteClient = useStore((s) => s.deleteClient);
  const { annexes, activeAnnexeId, selectedAnnexeId } = useActiveAnnexe();
  const scopedClients = useMemo(
    () => filterByAnnexe(clients, selectedAnnexeId),
    [clients, selectedAnnexeId],
  );

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ClientTypeFilter>("all");
  const [sortBy, setSortBy] = useState<ClientSortKey>("nom");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ClientInput>(
    emptyClientForm(activeAnnexeId ?? ""),
  );

  const isEdit = editingId !== null;

  const stats = useMemo(() => {
    let entreprises = 0;
    let particuliers = 0;
    let totalDu = 0;
    for (const c of scopedClients) {
      if (c.type === "Entreprise") entreprises++;
      else particuliers++;
      totalDu += c.totalDu;
    }
    return { total: scopedClients.length, entreprises, particuliers, totalDu };
  }, [scopedClients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = scopedClients;

    if (typeFilter !== "all") {
      list = list.filter((c) => c.type === typeFilter);
    }

    if (q) {
      list = list.filter((c) =>
        [c.nom, c.telephone, c.email, c.adresse]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === "nom") return a.nom.localeCompare(b.nom, "fr");
      if (sortBy === "totalDu") return b.totalDu - a.totalDu;
      return b.nbDossiers - a.nbDossiers;
    });
  }, [query, typeFilter, sortBy, scopedClients]);

  const { totalPages, safePage, paged, startIdx, endIdx } = usePagination(filtered, page, pageSize);

  const hasActiveFilters = query.trim() !== "" || typeFilter !== "all";

  function resetForm() {
    setFormValues(emptyClientForm(activeAnnexeId ?? ""));
    setEditingId(null);
  }

  function openCreateDialog() {
    resetForm();
    setDialogOpen(true);
  }

  const openEditDialog = useCallback(
    (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const c = clients.find((cl) => cl.id === id);
      if (!c) return;
      setEditingId(id);
      setFormValues({
        nom: c.nom,
        type: c.type,
        telephone: c.telephone,
        email: c.email,
        adresse: c.adresse,
        annexeId: c.annexeId,
      });
      setDialogOpen(true);
    },
    [clients],
  );

  const openDeleteDialog = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeletingId(id);
  }, []);

  const clientToDelete = useMemo(
    () => clients.find((c) => c.id === deletingId) ?? null,
    [clients, deletingId],
  );

  async function handleDelete() {
    if (!deletingId) return;
    const nom = clientToDelete?.nom ?? "Le client";
    try {
      await deleteClient(deletingId);
      toastSuccess(toast, { title: "Client supprimé", description: `${nom} a été retiré de l'annuaire.` });
    } catch (err: unknown) {
      toastError(toast, err, { title: "Impossible de supprimer le client", fallback: "Impossible de supprimer le client." });
    }
  }

  function handleSortChange(key: ClientSortKey) {
    setSortBy(key);
    setPage(1);
  }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (savingClient) return;
    const trimmedNom = formValues.nom.trim();
    if (!trimmedNom) {
      toastWarning(toast, { title: "Champ requis", description: "Veuillez saisir le nom ou la raison sociale du client." });
      return;
    }
    const input: ClientInput = {
      nom: trimmedNom,
      type: formValues.type,
      telephone: formValues.telephone.trim(),
      email: formValues.email.trim(),
      adresse: formValues.adresse.trim(),
      annexeId: formValues.annexeId,
    };
    setSavingClient(true);
    try {
      if (isEdit && editingId) {
        await updateClient(editingId, input);
        toastSuccess(toast, { title: "Client mis à jour", description: `${input.nom} a été modifié.` });
      } else {
        await addClient(input);
        toastSuccess(toast, { title: "Client créé avec succès", description: `${input.nom} a été ajouté à l'annuaire clients.` });
      }
      setDialogOpen(false);
      resetForm();
    } catch (err: unknown) {
      toastError(toast, err, { title: "Impossible d'enregistrer le client", fallback: "Impossible d'enregistrer le client." });
    } finally {
      setSavingClient(false);
    }
  }

  function clearFilters() {
    setQuery("");
    setTypeFilter("all");
    setPage(1);
  }

  function handlePrint() {
    const rows = filtered.map((c) => ({
      nom: c.nom,
      type: c.type,
      telephone: c.telephone || undefined,
      email: c.email || undefined,
      adresse: c.adresse || undefined,
      nbDossiers: c.nbDossiers,
      totalDu: c.totalDu,
    }));
    const parts: string[] = [];
    if (typeFilter !== "all") parts.push(typeFilter);
    if (query.trim()) parts.push(`"${query.trim()}"`);
    printClients(rows, parts.length ? `Filtre : ${parts.join(" · ")}` : undefined, resolveSlttBrand(societes));
  }

  return (
    <div className="space-y-6 pb-6">
      {/* 1. En-tête de page moderne aux couleurs TRAORE DE LOGISTIQUE */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Annuaire Clients
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
            Portefeuille commercial, suivi des dossiers et des créances clients.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={filtered.length === 0}
            className="rounded-xl h-10 text-xs sm:text-sm font-semibold border-border/80 hover:bg-slate-50 dark:hover:bg-muted gap-2"
          >
            <Printer className="size-4 text-slate-500" />
            <span>Imprimer la liste</span>
          </Button>

          <Button
            onClick={openCreateDialog}
            disabled={!canWrite}
            title={!canWrite ? "Vous n'avez pas la permission de créer un client." : undefined}
            className="bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold px-5 h-10 rounded-xl shadow-lg shadow-red-600/25 border border-red-500/40 gap-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="size-4 shrink-0 stroke-[3]" />
            <span>Nouveau client</span>
          </Button>
        </div>
      </div>

      {/* 2. 4 Grandes Cartes KPI Pleines et Colorées (Format Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total clients — Bleu Royal */}
        <DashboardKpiCard
          label="Total clients"
          value={stats.total}
          icon={Users}
          variant="royal"
          sublabel="dans l'annuaire actif"
        />

        {/* KPI 2: Entreprises — Bleu */}
        <DashboardKpiCard
          label="Entreprises"
          value={stats.entreprises}
          icon={Building2}
          variant="blue"
          sublabel={stats.total > 0 ? `${Math.round((stats.entreprises / stats.total) * 100)}% du portefeuille commercial` : "clients professionnels"}
        />

        {/* KPI 3: Particuliers — Bleu Marine */}
        <DashboardKpiCard
          label="Particuliers"
          value={stats.particuliers}
          icon={User}
          variant="navy"
          sublabel={stats.total > 0 ? `${Math.round((stats.particuliers / stats.total) * 100)}% du portefeuille commercial` : "clients individuels"}
        />

        {/* KPI 4: Créances totales — Rouge */}
        <DashboardKpiCard
          label="Créances totales"
          value={formatFCFA(stats.totalDu)}
          icon={Wallet}
          variant="red"
          sublabel="reste à recouvrer"
        />
      </div>

      {/* 3. Barre de Recherche et Filtres */}
      <Card className="rounded-2xl border border-border/70 p-4 shadow-xs bg-card">
        <div className="flex flex-wrap items-center gap-3">
          {/* Champ recherche */}
          <div className="relative flex-1 min-w-[260px] sm:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher par nom, téléphone, e-mail, adresse…"
              className="h-10 pl-10 rounded-xl border border-slate-200/80 bg-[#F1F5F9] dark:bg-muted/40 text-xs sm:text-sm text-foreground focus-visible:ring-primary/40 shadow-none"
              aria-label="Rechercher un client"
            />
          </div>

          {/* Filtre par type */}
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as ClientTypeFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-44 rounded-xl border border-slate-200/80 bg-[#F1F5F9] dark:bg-muted/40 text-xs sm:text-sm" aria-label="Filtrer par type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous les types</SelectItem>
              {CLIENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tri */}
          <Select
            value={sortBy}
            onValueChange={(v) => handleSortChange(v as ClientSortKey)}
          >
            <SelectTrigger className="h-10 w-full sm:w-48 rounded-xl border border-slate-200/80 bg-[#F1F5F9] dark:bg-muted/40 text-xs sm:text-sm" aria-label="Trier les clients">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Réinitialiser */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 rounded-xl text-muted-foreground hover:text-foreground gap-1.5"
              onClick={clearFilters}
            >
              <RotateCcw className="size-3.5" />
              <span>Réinitialiser</span>
            </Button>
          )}

          {/* Compteur */}
          <div className="ml-auto inline-flex items-center rounded-full bg-slate-100 dark:bg-muted px-3 py-1 text-xs font-bold text-foreground tabular-nums">
            {filtered.length} client{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      </Card>

      {/* 4. Tableau des Clients */}
      <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-xs bg-card p-0">
        <ClientsTable
          paged={paged}
          filteredCount={filtered.length}
          startIdx={startIdx}
          endIdx={endIdx}
          safePage={safePage}
          totalPages={totalPages}
          hasActiveFilters={hasActiveFilters}
          canWrite={canWrite}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          onPageChange={setPage}
          onOpenClient={openClient}
          onEditClient={openEditDialog}
          onDeleteClient={openDeleteDialog}
          onCreateClient={openCreateDialog}
        />
      </Card>

      {/* 5. Modal Dialog Nouveau / Modifier Client */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              {isEdit ? "Modifier le client" : "Nouveau client"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isEdit
                ? "Mettez à jour les informations et coordonnées du client."
                : "Ajoutez un nouveau client à l'annuaire commercial de Traoré de Logistique."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <ClientFormFields
              values={formValues}
              onChange={(patch) => setFormValues((v) => ({ ...v, ...patch }))}
              annexes={annexes}
              autoFocusNom
            />

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl h-10 font-semibold"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!formValues.nom.trim() || savingClient}
                className="bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold h-10 px-5 rounded-xl shadow-md shadow-red-600/20"
              >
                {isEdit ? "Enregistrer les modifications" : "Créer le client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Confirmation de suppression d'un client */}
      <ConfirmDeleteDialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
        title="Supprimer ce client ?"
        description={
          clientToDelete ? (
            <>
              <span className="font-semibold text-foreground">{clientToDelete.nom}</span> sera retiré de
              l&apos;annuaire commercial. Cette action est irréversible.
            </>
          ) : (
            "Cette action est irréversible."
          )
        }
        consequences={
          clientToDelete && clientToDelete.nbDossiers > 0
            ? [
                `${clientToDelete.nbDossiers} dossier(s) rattaché(s) — leur historique reste conservé mais n'est plus lié à ce client`,
              ]
            : undefined
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}
