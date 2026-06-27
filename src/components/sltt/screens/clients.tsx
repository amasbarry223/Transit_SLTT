"use client";

import { useMemo, useState } from "react";
import {
  UserPlus,
  Search,
  Eye,
  Pencil,
  Users,
  Building2,
  User,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  FolderKanban,
  MapPin,
} from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import type { ClientInput } from "@/lib/store";
import type { ClientType } from "@/lib/mock-data";
import { formatFCFA } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { ToneBadge } from "@/components/sltt/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const clientTypes: ClientType[] = ["Entreprise", "Particulier"];

type TypeFilter = "all" | ClientType;
type SortKey = "nom" | "totalDu" | "nbDossiers";

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return "?";
}

function avatarGradient(type: ClientType): string {
  return type === "Entreprise"
    ? "from-blue-600 to-indigo-700"
    : "from-slate-600 to-slate-800";
}

function EmptyState({
  hasQuery,
  onCreate,
}: {
  hasQuery: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Users className="size-7" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        {hasQuery ? "Aucun résultat" : "Aucun client enregistré"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {hasQuery
          ? "Essayez un autre terme de recherche ou modifiez les filtres."
          : "Commencez par ajouter votre premier client à l'annuaire."}
      </p>
      {!hasQuery && (
        <Button className="mt-5" onClick={onCreate}>
          <UserPlus className="size-4" />
          Nouveau client
        </Button>
      )}
    </div>
  );
}

export function ClientsScreen() {
  const { toast } = useToast();
  const openClient = useNav((s) => s.openClient);
  const clients = useStore((s) => s.clients);
  const dossiers = useStore((s) => s.dossiers);
  const addClient = useStore((s) => s.addClient);
  const updateClient = useStore((s) => s.updateClient);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("nom");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNom, setFormNom] = useState("");
  const [formType, setFormType] = useState<ClientType>("Entreprise");
  const [formTelephone, setFormTelephone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAdresse, setFormAdresse] = useState("");

  const isEdit = editingId !== null;

  const clientStats = useMemo(() => {
    const map = new Map<string, { totalDu: number; nbDossiers: number }>();
    for (const d of dossiers) {
      const prev = map.get(d.clientId) ?? { totalDu: 0, nbDossiers: 0 };
      const reste = d.montantInvesti - d.montantPaye;
      map.set(d.clientId, {
        totalDu: prev.totalDu + (reste > 0 ? reste : 0),
        nbDossiers: prev.nbDossiers + 1,
      });
    }
    return map;
  }, [dossiers]);

  const stats = useMemo(() => {
    let entreprises = 0;
    let particuliers = 0;
    let totalDu = 0;
    for (const c of clients) {
      if (c.type === "Entreprise") entreprises++;
      else particuliers++;
      totalDu += clientStats.get(c.id)?.totalDu ?? 0;
    }
    return { total: clients.length, entreprises, particuliers, totalDu };
  }, [clients, clientStats]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = clients;

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
      if (sortBy === "totalDu")
        return (clientStats.get(b.id)?.totalDu ?? 0) - (clientStats.get(a.id)?.totalDu ?? 0);
      return (clientStats.get(b.id)?.nbDossiers ?? 0) - (clientStats.get(a.id)?.nbDossiers ?? 0);
    });
  }, [query, typeFilter, sortBy, clients, clientStats]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(safePage * pageSize, filtered.length);

  const hasActiveFilters = query.trim() !== "" || typeFilter !== "all";

  function resetForm() {
    setFormNom("");
    setFormType("Entreprise");
    setFormTelephone("");
    setFormEmail("");
    setFormAdresse("");
    setEditingId(null);
  }

  function openCreateDialog() {
    resetForm();
    setDialogOpen(true);
  }

  function openEditDialog(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    const c = clients.find((cl) => cl.id === id);
    if (!c) return;
    setEditingId(id);
    setFormNom(c.nom);
    setFormType(c.type);
    setFormTelephone(c.telephone);
    setFormEmail(c.email);
    setFormAdresse(c.adresse);
    setDialogOpen(true);
  }

  function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmedNom = formNom.trim();
    if (!trimmedNom) {
      toast({
        title: "Champ requis",
        description: "Veuillez saisir le nom ou la raison sociale du client.",
        variant: "destructive",
      });
      return;
    }
    const input: ClientInput = {
      nom: trimmedNom,
      type: formType,
      telephone: formTelephone.trim(),
      email: formEmail.trim(),
      adresse: formAdresse.trim(),
    };
    if (isEdit && editingId) {
      updateClient(editingId, input);
      toast({
        title: "Client mis à jour",
        description: `${input.nom} a été modifié.`,
      });
    } else {
      addClient(input);
      toast({
        title: "Client créé avec succès",
        description: `${input.nom} a été ajouté à l'annuaire clients.`,
      });
    }
    setDialogOpen(false);
    resetForm();
  }

  function clearFilters() {
    setQuery("");
    setTypeFilter("all");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Annuaire, fiches et suivi des créances clients"
      >
        <Button onClick={openCreateDialog}>
          <UserPlus className="size-4" />
          Nouveau client
        </Button>
      </PageHeader>

      {/* KPIs */}
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

      {/* Filtres */}
      <Card className="p-4 shadow-sm border-border/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
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

          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as TypeFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Filtrer par type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {clientTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortKey)}
          >
            <SelectTrigger className="h-10 w-full sm:w-48" aria-label="Trier les clients">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nom">Nom (A → Z)</SelectItem>
              <SelectItem value="totalDu">Créance (décroissant)</SelectItem>
              <SelectItem value="nbDossiers">Nb dossiers (décroissant)</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-slate-500"
              onClick={clearFilters}
            >
              Réinitialiser
            </Button>
          )}

          <p className="ml-auto text-xs text-slate-500 tabular-nums">
            {filtered.length} client{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>

      {/* Tableau */}
      <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
        {filtered.length === 0 ? (
          <EmptyState hasQuery={hasActiveFilters} onCreate={openCreateDialog} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 hover:bg-slate-50">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Client
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 md:table-cell">
                      Coordonnées
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 lg:table-cell">
                      Adresse
                    </TableHead>
                    <TableHead className="h-10 px-4 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
                      Dossiers
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      Total dû
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer border-b border-border transition-colors hover:bg-slate-50/80"
                      onClick={() => openClient(c.id)}
                    >
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white",
                              avatarGradient(c.type),
                            )}
                          >
                            {getInitials(c.nom)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">
                              {c.nom}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <ToneBadge tone={c.type === "Entreprise" ? "blue" : "slate"}>
                                {c.type}
                              </ToneBadge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 md:table-cell">
                        <div className="space-y-1 text-sm">
                          {c.telephone ? (
                            <p className="flex items-center gap-1.5 text-slate-600">
                              <Phone className="size-3.5 shrink-0 text-slate-400" />
                              <span className="font-mono text-xs">{c.telephone}</span>
                            </p>
                          ) : (
                            <p className="text-slate-400">—</p>
                          )}
                          {c.email && (
                            <p className="flex items-center gap-1.5 text-slate-500">
                              <Mail className="size-3.5 shrink-0 text-slate-400" />
                              <span className="truncate text-xs">{c.email}</span>
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] px-4 py-3.5 lg:table-cell">
                        {c.adresse ? (
                          <p
                            className="flex items-start gap-1.5 text-sm text-slate-600"
                            title={c.adresse}
                          >
                            <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                            <span className="line-clamp-2">{c.adresse}</span>
                          </p>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-sm font-medium tabular-nums text-slate-700">
                          <FolderKanban className="size-3.5 text-slate-400" />
                          {clientStats.get(c.id)?.nbDossiers ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right tabular-nums">
                        {(clientStats.get(c.id)?.totalDu ?? 0) > 0 ? (
                          <span className="font-semibold text-amber-600">
                            {formatFCFA(clientStats.get(c.id)!.totalDu)}
                          </span>
                        ) : (
                          <span className="text-sm text-emerald-600">Soldé</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-slate-500 hover:text-primary"
                            onClick={() => openClient(c.id)}
                            aria-label={`Voir la fiche de ${c.nom}`}
                            title="Voir la fiche"
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-slate-500 hover:text-primary"
                            onClick={(e) => openEditDialog(c.id, e)}
                            aria-label={`Modifier ${c.nom}`}
                            title="Modifier"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 tabular-nums">
                {startIdx}–{endIdx} sur {filtered.length} client
                {filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-slate-600">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Page suivante"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Création / édition — modale centrée */}
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
            <div className="space-y-2">
              <Label htmlFor="cl-nom" className="text-sm font-medium text-slate-700">
                Nom / Raison sociale <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cl-nom"
                value={formNom}
                onChange={(e) => setFormNom(e.target.value)}
                placeholder="Ex. Société des Établissements Diallo"
                className="h-10"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Type de client</Label>
              <div className="grid grid-cols-2 gap-2">
                {clientTypes.map((t) => {
                  const Icon = t === "Entreprise" ? Building2 : User;
                  const selected = formType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormType(t)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <Icon className="size-5" />
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cl-tel" className="text-sm font-medium text-slate-700">
                  Téléphone
                </Label>
                <Input
                  id="cl-tel"
                  value={formTelephone}
                  onChange={(e) => setFormTelephone(e.target.value)}
                  placeholder="+223 76 00 00 00"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-email" className="text-sm font-medium text-slate-700">
                  E-mail
                </Label>
                <Input
                  id="cl-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="contact@exemple.ml"
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cl-adresse" className="text-sm font-medium text-slate-700">
                Adresse
              </Label>
              <Input
                id="cl-adresse"
                value={formAdresse}
                onChange={(e) => setFormAdresse(e.target.value)}
                placeholder="Quartier, ville"
                className="h-10"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={!formNom.trim()}>
                {isEdit ? "Enregistrer" : "Créer le client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
