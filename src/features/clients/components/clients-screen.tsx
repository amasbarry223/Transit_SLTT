"use client";

import { useCallback, useMemo, useState } from "react";
import { useUiPrefs } from "@/lib/session/ui-prefs-store";
import { usePagination } from "@/shared/hooks/use-pagination";
import {
  UserPlus,
  Search,
  Users,
  Building2,
  User,
  Wallet,
  Printer,
} from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import type { ClientInput } from "@/features/clients/types";
import { formatFCFA } from "@/lib/format";
import { printClients } from "@/features/clients/services/client-print";
import { resolveSlttBrand } from "@/lib/classeur";
import { resolveTransitSociete } from "@/lib/societe-brand";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastWarning, toastSuccess } from "@/shared/utils/toast-helpers";
import { usePermission } from "@/shared/hooks/use-permission";
import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import { filterByAnnexe } from "@/lib/filter-by-annexe";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import {
  ClientsTable,
  CLIENT_TYPES,
  SORT_OPTIONS,
  type ClientSortKey,
  type ClientTypeFilter,
} from "@/features/clients/components";
import { SocieteFilterSelect } from "@/components/sltt/societe-filter-select";
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

export function ClientsScreen() {
  const { toast } = useToast();
  const canWrite = usePermission("clients:write");
  const openClient = useNav((s) => s.openClient);
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const addClient = useStore((s) => s.addClient);
  const updateClient = useStore((s) => s.updateClient);
  const { annexes, activeAnnexeId, selectedAnnexeId } = useActiveAnnexe();
  const selectedSocieteId = useUiPrefs((s) => s.selectedSocieteId);
  const scopedClients = useMemo(() => {
    const bySociete = selectedSocieteId
      ? clients.filter((c) => c.societeId === selectedSocieteId)
      : clients;
    return filterByAnnexe(bySociete, selectedAnnexeId);
  }, [clients, selectedSocieteId, selectedAnnexeId]);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ClientTypeFilter>("all");
  const [sortBy, setSortBy] = useState<ClientSortKey>("nom");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const defaultSocieteId = selectedSocieteId ?? resolveTransitSociete(societes)?.id ?? "";
  const [formValues, setFormValues] = useState<ClientInput>(
    emptyClientForm(activeAnnexeId ?? "", defaultSocieteId),
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
    setFormValues(emptyClientForm(activeAnnexeId ?? "", defaultSocieteId));
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
        societeId: c.societeId,
      });
      setDialogOpen(true);
    },
    [clients],
  );

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
    if (!formValues.societeId) {
      toastWarning(toast, { title: "Champ requis", description: "Veuillez sélectionner la société rattachée au client." });
      return;
    }
    const input: ClientInput = {
      nom: trimmedNom,
      type: formValues.type,
      telephone: formValues.telephone.trim(),
      email: formValues.email.trim(),
      adresse: formValues.adresse.trim(),
      annexeId: formValues.annexeId,
      societeId: formValues.societeId,
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
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Annuaire, fiches et suivi des créances clients"
      >
        <Button variant="outline" onClick={handlePrint} disabled={filtered.length === 0}>
          <Printer className="size-4" />
          Imprimer la liste
        </Button>
        <Button
          onClick={openCreateDialog}
          disabled={!canWrite}
          title={!canWrite ? "Vous n'avez pas la permission de créer un client." : undefined}
        >
          <UserPlus className="size-4" />
          Nouveau client
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total clients"
          value={String(stats.total)}
          icon={Users}
          tone="blue"
          sublabel="dans l'annuaire"
        />
        <KpiCard
          label="Entreprises"
          value={String(stats.entreprises)}
          icon={Building2}
          tone="indigo"
          sublabel="clients professionnels"
        />
        <KpiCard
          label="Particuliers"
          value={String(stats.particuliers)}
          icon={User}
          tone="emerald"
          sublabel="clients individuels"
        />
        <KpiCard
          label="Créances totales"
          value={formatFCFA(stats.totalDu)}
          icon={Wallet}
          tone="amber"
          sublabel="reste à encaisser"
        />
      </div>

      <Card className="border-border/80 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher par nom, téléphone, e-mail…"
              className="h-10 pl-9"
              aria-label="Rechercher un client"
            />
          </div>

          <SocieteFilterSelect className="h-10 w-full sm:w-52" />

          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as ClientTypeFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Filtrer par type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {CLIENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(v) => handleSortChange(v as ClientSortKey)}
          >
            <SelectTrigger className="h-10 w-full sm:w-48" aria-label="Trier les clients">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-muted-foreground"
              onClick={clearFilters}
            >
              Réinitialiser
            </Button>
          )}

          <p className="ml-auto text-xs tabular-nums text-muted-foreground">
            {filtered.length} client{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>

      <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
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
          onCreateClient={openCreateDialog}
        />
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Modifier le client" : "Nouveau client"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Mettez à jour les informations du client."
                : "Ajoutez un client à l'annuaire avec ses coordonnées."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <ClientFormFields
              values={formValues}
              onChange={(patch) => setFormValues((v) => ({ ...v, ...patch }))}
              annexes={annexes}
              societes={societes}
              autoFocusNom
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={!formValues.nom.trim() || !formValues.societeId || savingClient}>
                {isEdit ? "Enregistrer" : "Créer le client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
