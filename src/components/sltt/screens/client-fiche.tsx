"use client";

import { useMemo, useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Pencil,
  Plus,
  FolderKanban,
  Wallet,
  Clock,
  ArrowLeft,
  Truck,
  TrendingUp,
  Eye,
  Building2,
  User,
  BellRing,
  Copy,
  MessageCircle,
  Check,
  Receipt,
  Warehouse,
} from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useStore, type ClientInput } from "@/lib/store";
import type { Client } from "@/lib/domain-types";
import {
  resteAPayer,
  type Ecriture,
  type EcritureStatut,
  type BonMotif,
} from "@/lib/domain-types";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { PageHeader } from "@/components/sltt/page-header";
import { InfoCallout } from "@/components/sltt/info-callout";
import { KpiCard } from "@/components/sltt/kpi-card";
import {
  ToneBadge,
  DossierStatutBadge,
  EcritureStatutBadge,
  FactureStatutBadge,
} from "@/components/sltt/status-badge";
import { ClientFormFields, emptyClientForm } from "@/components/sltt/client-form-fields";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, getInitials } from "@/lib/utils";
import { TablePagination } from "@/components/sltt/table-pagination";

const PAGE_SIZE = 6;

type FicheTab = "dossiers" | "paiements" | "factures" | "bons" | "stock";

const tabs: {
  key: FicheTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "dossiers", label: "Dossiers", shortLabel: "Dossiers", icon: FolderKanban },
  { key: "paiements", label: "Paiements", shortLabel: "Paiements", icon: Wallet },
  { key: "factures", label: "Factures", shortLabel: "Factures", icon: Receipt },
  { key: "stock", label: "Stock", shortLabel: "Stock", icon: Warehouse },
  { key: "bons", label: "Bons de sortie", shortLabel: "Bons", icon: Truck },
];

function avatarGradient(type: Client["type"]): string {
  return type === "Entreprise"
    ? "from-blue-600 to-indigo-700"
    : "from-slate-600 to-slate-800";
}

function deriveEcritureStatut(e: Ecriture): EcritureStatut {
  return e.montantPaye >= e.montantInvesti ? "Soldé" : "En attente";
}

const bonMotifTone: Record<BonMotif, "blue" | "emerald" | "indigo"> = {
  Vente: "blue",
  Livraison: "emerald",
  Transfert: "indigo",
};

function bonStatutTone(statut: "Validé" | "Brouillon"): "emerald" | "amber" {
  return statut === "Validé" ? "emerald" : "amber";
}


function EmptyState({
  label,
  action,
}: {
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function ClientProfileCard({
  client,
  totalDu,
  onEdit,
  onNewDossier,
  onRelance,
}: {
  client: Client;
  totalDu: number;
  onEdit?: () => void;
  onNewDossier: () => void;
  onRelance: () => void;
}) {
  const TypeIcon = client.type === "Entreprise" ? Building2 : User;

  return (
    <Card className="overflow-hidden p-0 shadow-sm border-border/80">
      <div className="bg-gradient-to-r from-primary/5 via-blue-50/50 to-transparent px-6 py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-md",
                avatarGradient(client.type),
              )}
            >
              {getInitials(client.nom)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {client.nom}
                </h2>
                <ToneBadge tone={client.type === "Entreprise" ? "blue" : "slate"}>
                  <TypeIcon className="size-3" />
                  {client.type}
                </ToneBadge>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {client.telephone && (
                  <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Phone className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <span className="font-mono text-xs">{client.telephone}</span>
                  </span>
                )}
                {client.email && (
                  <span className="inline-flex items-center gap-2 truncate text-slate-600 dark:text-slate-300">
                    <Mail className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <span className="truncate text-xs">{client.email}</span>
                  </span>
                )}
                {client.adresse && (
                  <span className="inline-flex items-start gap-2 text-slate-600 dark:text-slate-300 sm:col-span-2 lg:col-span-1">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <span className="text-xs leading-relaxed">{client.adresse}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {totalDu > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-amber-200 text-amber-700 hover:bg-amber-50 dark:bg-amber-950/40 hover:text-amber-800"
                onClick={onRelance}
              >
                <BellRing className="size-4" />
                Relancer
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" className="h-9" onClick={onEdit}>
                <Pencil className="size-4" />
                Modifier
              </Button>
            )}
            <Button size="sm" className="h-9" onClick={onNewDossier}>
              <Plus className="size-4" />
              Nouveau dossier
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ClientFicheScreen() {
  const { toast } = useToast();
  const { selectedId, go, openDossier, openDossierDetail, setPendingFacturePrefill } = useNav();
  const canWrite = usePermission("clients:write");
  const clients = useStore((s) => s.clients);
  const allDossiers = useStore((s) => s.dossiers);
  const allEcritures = useStore((s) => s.ecritures);
  const allBons = useStore((s) => s.bons);
  const allFactures = useStore((s) => s.factures);
  const allStock = useStore((s) => s.stock);
  const allMouvements = useStore((s) => s.mouvements);
  const updateClient = useStore((s) => s.updateClient);

  const [activeTab, setActiveTab] = useState<FicheTab>("dossiers");
  const [dossierPage, setDossierPage] = useState(1);
  const [paiementPage, setPaiementPage] = useState(1);
  const [bonPage, setBonPage] = useState(1);

  // Relance dialog state
  const [relanceOpen, setRelanceOpen] = useState(false);
  const [relanceMsg, setRelanceMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editValues, setEditValues] = useState<ClientInput>(emptyClientForm());

  const client = useMemo(
    () => clients.find((c) => c.id === selectedId),
    [clients, selectedId],
  );

  const dossiers = useMemo(
    () =>
      selectedId ? allDossiers.filter((d) => d.clientId === selectedId) : [],
    [allDossiers, selectedId],
  );
  const ecritures = useMemo(
    () =>
      selectedId ? allEcritures.filter((e) => e.clientId === selectedId) : [],
    [allEcritures, selectedId],
  );
  const bons = useMemo(
    () => (selectedId ? allBons.filter((b) => b.clientId === selectedId) : []),
    [allBons, selectedId],
  );
  const factures = useMemo(
    () =>
      selectedId ? allFactures.filter((f) => f.clientId === selectedId) : [],
    [allFactures, selectedId],
  );
  const stockItems = useMemo(
    () => (selectedId ? allStock.filter((s) => s.clientId === selectedId) : []),
    [allStock, selectedId],
  );
  const stockIds = useMemo(() => new Set(stockItems.map((s) => s.id)), [stockItems]);
  const clientMouvements = useMemo(
    () => allMouvements.filter((m) => m.stockId && stockIds.has(m.stockId)),
    [allMouvements, stockIds],
  );

  const payeDossiers = useMemo(
    () => dossiers.reduce((s, d) => s + d.montantPaye, 0),
    [dossiers],
  );
  const payeFactures = useMemo(
    () => factures.reduce((s, f) => s + f.montantPaye, 0),
    [factures],
  );

  // LOGIC-03 (audit) : Écritures (via les dossiers) et Factures sont deux
  // canaux de paiement indépendants — on les additionne pour que "Total payé"
  // reflète tout ce que le client a réellement réglé, pas seulement la moitié.
  const { totalInvesti, totalPaye, totalDu } = useMemo(() => {
    let investi = 0;
    let paye = 0;
    let du = 0;
    for (const d of dossiers) {
      investi += d.montantInvesti;
      paye += d.montantPaye;
      du += Math.max(0, d.montantInvesti - d.montantPaye);
    }
    for (const f of factures) {
      paye += f.montantPaye;
    }
    return { totalInvesti: investi, totalPaye: paye, totalDu: du };
  }, [dossiers, factures]);

  function openRelanceDialog() {
    if (!client) return;
    const unpaid = dossiers.filter((d) => d.montantInvesti - d.montantPaye > 0);
    const lignes = unpaid
      .map((d) => `  • ${d.reference} — ${new Intl.NumberFormat("fr-FR").format(d.montantInvesti - d.montantPaye)} FCFA`)
      .join("\n");
    const total = new Intl.NumberFormat("fr-FR").format(totalDu);
    const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const msg = `Bamako, le ${today}\n\nObjet : Rappel de solde — SLTT\n\nBonjour${client.type === "Entreprise" ? "" : " M./Mme"},\n\nNous vous contactons au sujet du solde restant dû sur vos dossiers de transit :\n\n${lignes}\n\nMontant total dû : ${total} FCFA\n\nNous vous prions de bien vouloir régulariser ce solde dans les meilleurs délais. Pour tout renseignement, n'hésitez pas à nous contacter.\n\nCordialement,\nSLTT — Bamako`;
    setRelanceMsg(msg);
    setCopied(false);
    setRelanceOpen(true);
  }

  function handleCopyRelance() {
    navigator.clipboard.writeText(relanceMsg).then(() => {
      setCopied(true);
      toast({ title: "Message copié" });
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleWhatsApp() {
    const phone = client?.telephone?.replace(/[\s+]/g, "");
    if (!phone) return;
    const encoded = encodeURIComponent(relanceMsg);
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
  }

  function openEditDialog() {
    if (!client) return;
    setEditValues({
      nom: client.nom,
      type: client.type,
      telephone: client.telephone ?? "",
      email: client.email ?? "",
      adresse: client.adresse ?? "",
    });
    setEditOpen(true);
  }

  function handleSaveEdit() {
    if (!client || !editValues.nom.trim()) return;
    const input: ClientInput = {
      nom: editValues.nom.trim(),
      type: editValues.type,
      telephone: editValues.telephone.trim(),
      email: editValues.email.trim(),
      adresse: editValues.adresse.trim(),
    };
    updateClient(client.id, input);
    setEditOpen(false);
    toast({ title: "Client mis à jour", description: input.nom });
  }

  const dossierPages = Math.max(1, Math.ceil(dossiers.length / PAGE_SIZE));
  const dossierSafePage = Math.min(dossierPage, dossierPages);
  const pagedDossiers = dossiers.slice(
    (dossierSafePage - 1) * PAGE_SIZE,
    dossierSafePage * PAGE_SIZE,
  );

  const paiementPages = Math.max(1, Math.ceil(ecritures.length / PAGE_SIZE));
  const paiementSafePage = Math.min(paiementPage, paiementPages);
  const pagedEcritures = ecritures.slice(
    (paiementSafePage - 1) * PAGE_SIZE,
    paiementSafePage * PAGE_SIZE,
  );

  const bonPages = Math.max(1, Math.ceil(bons.length / PAGE_SIZE));
  const bonSafePage = Math.min(bonPage, bonPages);
  const pagedBons = bons.slice(
    (bonSafePage - 1) * PAGE_SIZE,
    bonSafePage * PAGE_SIZE,
  );

  if (!client) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => go("clients")} className="text-slate-600 dark:text-slate-300">
          <ArrowLeft className="size-4" />
          Retour aux clients
        </Button>
        <Card className="border-border/80 p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Client introuvable</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Le client demandé n&apos;existe pas ou a été supprimé.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          onClick={() => go("clients")}
          className="-ml-2 w-fit text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ArrowLeft className="size-4" />
          Retour aux clients
        </Button>
        <PageHeader
          title="Fiche client"
          description="Vue consolidée du client"
        />
      </div>

      <ClientProfileCard
        client={client}
        totalDu={totalDu}
        onEdit={canWrite ? openEditDialog : undefined}
        onNewDossier={() => openDossier(null, "create")}
        onRelance={openRelanceDialog}
      />

      {totalDu > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 px-4 py-3">
          <Clock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Solde impayé : {formatFCFA(totalDu)}
            </p>
            <p className="mt-0.5 text-xs text-amber-800/80">
              {dossiers.filter((d) => Math.max(0, d.montantInvesti - d.montantPaye) > 0).length} dossier
              {dossiers.filter((d) => Math.max(0, d.montantInvesti - d.montantPaye) > 0).length !== 1 ? "s" : ""}{" "}
              en attente de règlement.
            </p>
          </div>
        </div>
      )}

      <InfoCallout>
        <strong>Synthèse financière :</strong> dossiers {formatFCFA(payeDossiers)} payé
        {totalDu > 0 && <> · reste dossiers {formatFCFA(totalDu)}</>}
        {payeFactures > 0 && <> · factures {formatFCFA(payeFactures)} encaissé</>}
        . Les canaux dossiers et factures sont indépendants.
      </InfoCallout>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Dossiers"
          value={String(dossiers.length)}
          icon={FolderKanban}
          tone="blue"
          sublabel="dossiers de transit"
        />
        <KpiCard
          label="Total investi"
          value={formatFCFA(totalInvesti)}
          icon={TrendingUp}
          tone="indigo"
          sublabel="montant engagé"
        />
        <KpiCard
          label="Total payé"
          value={formatFCFA(totalPaye)}
          icon={Wallet}
          tone="emerald"
          sublabel="encaissements"
        />
        <KpiCard
          label="Reste à payer"
          value={formatFCFA(totalDu)}
          icon={Clock}
          tone="amber"
          sublabel={totalDu > 0 ? "solde dû" : "compte soldé"}
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as FicheTab)}
        className="gap-0"
      >
        <div
          className={cn(
            "sticky top-0 z-10 -mx-4 border-b border-border bg-background/95 backdrop-blur sm:-mx-6 lg:-mx-8",
            "supports-[backdrop-filter]:bg-background/80",
          )}
        >
          <TabsList className="flex h-12 w-full items-stretch rounded-none bg-slate-50/80 dark:bg-slate-800/80 p-0">
            {tabs.map((t) => {
              const Icon = t.icon;
              const count =
                t.key === "dossiers"
                  ? dossiers.length
                  : t.key === "paiements"
                    ? ecritures.length
                    : t.key === "factures"
                      ? factures.length
                      : t.key === "stock"
                        ? stockItems.length
                        : bons.length;
              return (
                <TabsTrigger
                  key={t.key}
                  value={t.key}
                  className={cn(
                    "relative flex flex-1 items-center justify-center gap-2 rounded-none",
                    "border-0 border-b-2 border-transparent bg-transparent px-2 py-0",
                    "text-sm font-medium text-slate-500 dark:text-slate-400 shadow-none transition-colors",
                    "hover:bg-white/60 hover:text-slate-900 dark:hover:text-slate-100",
                    "data-[state=active]:border-primary data-[state=active]:bg-white dark:bg-slate-900",
                    "data-[state=active]:text-primary data-[state=active]:shadow-none",
                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                    "[&[data-state=active]_svg]:text-primary",
                    "min-w-0",
                  )}
                >
                  <Icon className="size-4 shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="hidden truncate sm:inline">{t.label}</span>
                  <span className="truncate sm:hidden">{t.shortLabel}</span>
                  <span className="ml-1 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                    {count}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Dossiers */}
        <TabsContent value="dossiers" className="mt-6 focus-visible:outline-none">
          <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
            {dossiers.length === 0 ? (
              <EmptyState
                label="Aucun dossier pour ce client."
                action={
                  <Button size="sm" onClick={() => openDossier(null, "create")}>
                    <Plus className="size-4" />
                    Créer un dossier
                  </Button>
                }
              />
            ) : (
              <>
                <div className="space-y-3 p-4 md:hidden">
                  {pagedDossiers.map((d) => (
                    <Card
                      key={d.id}
                      className="cursor-pointer border-border/80 p-4 shadow-sm active:bg-slate-50 dark:active:bg-slate-800/60"
                      onClick={() => openDossierDetail(d.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{d.reference}</p>
                        <DossierStatutBadge statut={d.statut} />
                      </div>
                      <dl className="mt-3 space-y-1.5 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500">Date</dt>
                          <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatDateShort(d.date)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500">Montant</dt>
                          <dd className="tabular-nums font-medium text-slate-900 dark:text-slate-100">{formatFCFA(d.montantInvesti)}</dd>
                        </div>
                      </dl>
                    </Card>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Référence
                        </TableHead>
                        <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                          Date
                        </TableHead>
                        <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                          N° BL
                        </TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Statut
                        </TableHead>
                        <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Montant
                        </TableHead>
                        <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedDossiers.map((d) => (
                        <TableRow
                          key={d.id}
                          className="cursor-pointer border-b border-border hover:bg-slate-50/80 dark:hover:bg-slate-800/80"
                          onClick={() => openDossierDetail(d.id)}
                        >
                          <TableCell className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                            {d.reference}
                          </TableCell>
                          <TableCell className="hidden px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300 sm:table-cell">
                            {formatDateShort(d.date)}
                          </TableCell>
                          <TableCell className="hidden px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300 md:table-cell">
                            {d.bl}
                          </TableCell>
                          <TableCell className="px-4 py-3.5">
                            <DossierStatutBadge statut={d.statut} />
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100">
                            {formatFCFA(d.montantInvesti)}
                          </TableCell>
                          <TableCell className="px-4 py-3.5">
                            <div
                              className="flex justify-end"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-slate-500 dark:text-slate-400 hover:text-primary"
                                aria-label={`Voir ${d.reference}`}
                                title="Voir le dossier"
                                onClick={() => openDossierDetail(d.id)}
                              >
                                <Eye className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  startIdx={
                    dossiers.length === 0
                      ? 0
                      : (dossierSafePage - 1) * PAGE_SIZE + 1
                  }
                  endIdx={Math.min(dossierSafePage * PAGE_SIZE, dossiers.length)}
                  totalItems={dossiers.length}
                  page={dossierSafePage}
                  totalPages={dossierPages}
                  onPageChange={setDossierPage}
                />
              </>
            )}
          </Card>
        </TabsContent>

        {/* Paiements */}
        <TabsContent value="paiements" className="mt-6 focus-visible:outline-none">
          <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
            {ecritures.length === 0 ? (
              <EmptyState label="Aucune écriture de paiement pour ce client." />
            ) : (
              <>
                <div className="space-y-3 p-4 md:hidden">
                  {pagedEcritures.map((e) => {
                    const reste = resteAPayer(e);
                    return (
                      <Card
                        key={e.id}
                        className={cn(
                          "border-border/80 p-4 shadow-sm",
                          reste > 0 && "bg-amber-50/20 dark:bg-amber-950/20",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="tabular-nums text-sm text-slate-600 dark:text-slate-300">{formatDateShort(e.date)}</p>
                          <EcritureStatutBadge statut={deriveEcritureStatut(e)} />
                        </div>
                        <dl className="mt-3 space-y-1.5 text-sm">
                          <div className="flex justify-between gap-3">
                            <dt className="text-xs text-slate-500">Investi</dt>
                            <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatFCFA(e.montantInvesti)}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-xs text-slate-500">Payé</dt>
                            <dd className="tabular-nums font-medium text-emerald-700 dark:text-emerald-400">{formatFCFA(e.montantPaye)}</dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-xs text-slate-500">Reste dû</dt>
                            <dd className="tabular-nums">
                              {reste > 0 ? (
                                <span className="font-semibold text-amber-600 dark:text-amber-400">{formatFCFA(reste)}</span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">Soldé</span>
                              )}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-xs text-slate-500">Mode</dt>
                            <dd className="text-slate-700 dark:text-slate-300">{e.modePaiement}</dd>
                          </div>
                        </dl>
                      </Card>
                    );
                  })}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Date
                        </TableHead>
                        <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                          Investi
                        </TableHead>
                        <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                          Payé
                        </TableHead>
                        <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Reste dû
                        </TableHead>
                        <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 lg:table-cell">
                          Mode
                        </TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Statut
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedEcritures.map((e) => {
                        const reste = resteAPayer(e);
                        return (
                          <TableRow
                            key={e.id}
                            className={cn(
                              "border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60",
                              reste > 0 && "bg-amber-50/20 dark:bg-amber-950/20",
                            )}
                          >
                            <TableCell className="px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">
                              {formatDateShort(e.date)}
                            </TableCell>
                            <TableCell className="hidden px-4 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300 sm:table-cell">
                              {formatFCFA(e.montantInvesti)}
                            </TableCell>
                            <TableCell className="hidden px-4 py-3.5 text-right tabular-nums font-medium text-emerald-700 md:table-cell">
                              {formatFCFA(e.montantPaye)}
                            </TableCell>
                            <TableCell className="px-4 py-3.5 text-right tabular-nums">
                              {reste > 0 ? (
                                <span className="font-semibold text-amber-600 dark:text-amber-400">
                                  {formatFCFA(reste)}
                                </span>
                              ) : (
                                <span className="text-sm text-emerald-600 dark:text-emerald-400">Soldé</span>
                              )}
                            </TableCell>
                            <TableCell className="hidden px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300 lg:table-cell">
                              {e.modePaiement}
                            </TableCell>
                            <TableCell className="px-4 py-3.5">
                              <EcritureStatutBadge statut={deriveEcritureStatut(e)} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  startIdx={
                    ecritures.length === 0
                      ? 0
                      : (paiementSafePage - 1) * PAGE_SIZE + 1
                  }
                  endIdx={Math.min(paiementSafePage * PAGE_SIZE, ecritures.length)}
                  totalItems={ecritures.length}
                  page={paiementSafePage}
                  totalPages={paiementPages}
                  onPageChange={setPaiementPage}
                />
              </>
            )}
          </Card>
        </TabsContent>

        {/* Factures */}
        <TabsContent value="factures" className="mt-6 space-y-3 focus-visible:outline-none">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                if (!client) return;
                setPendingFacturePrefill({
                  clientId: client.id,
                  clientNom: client.nom,
                  description: "",
                  montant: 0,
                });
                go("factures");
              }}
            >
              <Plus className="size-4" />
              Nouvelle facture
            </Button>
          </div>
          <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
            {factures.length === 0 ? (
              <EmptyState label="Aucune facture pour ce client." />
            ) : (
              <>
              <div className="space-y-3 p-4 md:hidden">
                {factures.map((f) => (
                  <Card
                    key={f.id}
                    className="cursor-pointer border-border/80 p-4 shadow-sm active:bg-slate-50 dark:active:bg-slate-800/60"
                    onClick={() => go("facture-detail", { id: f.id })}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-xs font-semibold text-blue-700">{f.numero}</p>
                      <FactureStatutBadge statut={f.statut} />
                    </div>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Date</dt>
                        <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatDateShort(f.date)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Montant TTC</dt>
                        <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatFCFA(f.montantTTC)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-slate-500">Payé</dt>
                        <dd className="tabular-nums font-medium text-emerald-700 dark:text-emerald-400">{formatFCFA(f.montantPaye)}</dd>
                      </div>
                    </dl>
                  </Card>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Numéro
                      </TableHead>
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Date
                      </TableHead>
                      <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                        Montant TTC
                      </TableHead>
                      <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                        Payé
                      </TableHead>
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Statut
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factures.map((f) => (
                      <TableRow
                        key={f.id}
                        className="cursor-pointer border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                        onClick={() => go("facture-detail", { id: f.id })}
                      >
                        <TableCell className="px-4 py-3.5 font-mono text-xs font-semibold text-blue-700">
                          {f.numero}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">
                          {formatDateShort(f.date)}
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300 sm:table-cell">
                          {formatFCFA(f.montantTTC)}
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 text-right tabular-nums font-medium text-emerald-700 md:table-cell">
                          {formatFCFA(f.montantPaye)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <FactureStatutBadge statut={f.statut} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              </>
            )}
          </Card>
        </TabsContent>

        {/* Stock / entreposage */}
        <TabsContent value="stock" className="mt-6 focus-visible:outline-none">
          <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
            {stockItems.length === 0 ? (
              <EmptyState
                label="Aucun article de stock rattaché à ce client."
                action={
                  <Button size="sm" variant="outline" onClick={() => go("entreposage")}>
                    <Warehouse className="size-4" />
                    Ouvrir l&apos;entreposage
                  </Button>
                }
              />
            ) : (
              <>
                <div className="space-y-3 p-4 md:hidden">
                  {stockItems.map((item) => (
                    <Card key={item.id} className="border-border/80 p-4 shadow-sm">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{item.marchandise}</p>
                      <dl className="mt-3 space-y-1.5 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500">Quantité</dt>
                          <dd className="tabular-nums text-slate-700 dark:text-slate-300">{item.quantite} {item.unite}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500">Dépositaire</dt>
                          <dd className="text-slate-700 dark:text-slate-300">{item.depositaire}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500">Commercial</dt>
                          <dd className="text-slate-700 dark:text-slate-300">{item.commercial}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500">Payé</dt>
                          <dd className="tabular-nums text-emerald-700 dark:text-emerald-400">{formatFCFA(item.sommePayee)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500">Reste</dt>
                          <dd className="tabular-nums text-amber-700 dark:text-amber-400">{formatFCFA(item.resteAPayer)}</dd>
                        </div>
                      </dl>
                    </Card>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">Marchandise</TableHead>
                        <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Qté</TableHead>
                        <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 sm:table-cell">Dépositaire</TableHead>
                        <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 md:table-cell">Commercial</TableHead>
                        <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Payé</TableHead>
                        <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Reste</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockItems.map((item) => (
                        <TableRow key={item.id} className="border-b border-border">
                          <TableCell className="px-4 py-3.5 font-medium">{item.marchandise}</TableCell>
                          <TableCell className="px-4 py-3.5 text-right tabular-nums">{item.quantite} {item.unite}</TableCell>
                          <TableCell className="hidden px-4 py-3.5 sm:table-cell">{item.depositaire}</TableCell>
                          <TableCell className="hidden px-4 py-3.5 md:table-cell">{item.commercial}</TableCell>
                          <TableCell className="px-4 py-3.5 text-right tabular-nums text-emerald-700">{formatFCFA(item.sommePayee)}</TableCell>
                          <TableCell className="px-4 py-3.5 text-right tabular-nums text-amber-700">{formatFCFA(item.resteAPayer)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {clientMouvements.length > 0 && (
                  <div className="border-t border-border px-4 py-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Derniers mouvements</p>
                    <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      {clientMouvements.slice(0, 5).map((m) => (
                        <li key={m.id} className="flex justify-between gap-2">
                          <span>{m.type} — {m.marchandise}</span>
                          <span className="tabular-nums shrink-0">{m.quantite} {m.unite}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </Card>
        </TabsContent>

        {/* Bons */}
        <TabsContent value="bons" className="mt-6 focus-visible:outline-none">
          <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
            {bons.length === 0 ? (
              <EmptyState label="Aucun bon de sortie pour ce client." />
            ) : (
              <>
                <div className="space-y-3 p-4 md:hidden">
                  {pagedBons.map((b) => (
                    <Card key={b.id} className="border-border/80 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">{b.reference}</p>
                        <ToneBadge tone={bonStatutTone(b.statut)}>{b.statut}</ToneBadge>
                      </div>
                      <dl className="mt-3 space-y-1.5 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500">Date</dt>
                          <dd className="tabular-nums text-slate-700 dark:text-slate-300">{formatDateShort(b.date)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500">Marchandise</dt>
                          <dd className="truncate text-right text-slate-700 dark:text-slate-300">{b.marchandise}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500">Quantité</dt>
                          <dd className="tabular-nums text-slate-700 dark:text-slate-300">{b.quantite} {b.unite}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500">Motif</dt>
                          <dd><ToneBadge tone={bonMotifTone[b.motif]}>{b.motif}</ToneBadge></dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500">Montant</dt>
                          <dd className="tabular-nums font-medium text-slate-900 dark:text-slate-100">{formatFCFA(b.montant)}</dd>
                        </div>
                      </dl>
                    </Card>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Référence
                        </TableHead>
                        <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                          Date
                        </TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Marchandise
                        </TableHead>
                        <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Qté
                        </TableHead>
                        <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 md:table-cell">
                          Motif
                        </TableHead>
                        <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                          Montant
                        </TableHead>
                        <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Statut
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedBons.map((b) => (
                        <TableRow
                          key={b.id}
                          className="border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                        >
                          <TableCell className="px-4 py-3.5 font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
                            {b.reference}
                          </TableCell>
                          <TableCell className="hidden px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300 sm:table-cell">
                            {formatDateShort(b.date)}
                          </TableCell>
                          <TableCell className="max-w-[140px] px-4 py-3.5">
                            <span className="line-clamp-1 text-sm text-slate-600 dark:text-slate-300">
                              {b.marchandise}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                            {b.quantite}{" "}
                            <span className="text-xs text-slate-500 dark:text-slate-400">{b.unite}</span>
                          </TableCell>
                          <TableCell className="hidden px-4 py-3.5 md:table-cell">
                            <ToneBadge tone={bonMotifTone[b.motif]}>{b.motif}</ToneBadge>
                          </TableCell>
                          <TableCell className="hidden px-4 py-3.5 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100 sm:table-cell">
                            {formatFCFA(b.montant)}
                          </TableCell>
                          <TableCell className="px-4 py-3.5">
                            <ToneBadge tone={bonStatutTone(b.statut)}>
                              {b.statut}
                            </ToneBadge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  startIdx={bons.length === 0 ? 0 : (bonSafePage - 1) * PAGE_SIZE + 1}
                  endIdx={Math.min(bonSafePage * PAGE_SIZE, bons.length)}
                  totalItems={bons.length}
                  page={bonSafePage}
                  totalPages={bonPages}
                  onPageChange={setBonPage}
                />
              </>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations du client.
            </DialogDescription>
          </DialogHeader>
          <ClientFormFields
            values={editValues}
            onChange={(patch) => setEditValues((v) => ({ ...v, ...patch }))}
            idPrefix="cl-edit"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editValues.nom.trim()}>
              <Pencil className="size-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog relance */}
      <Dialog open={relanceOpen} onOpenChange={setRelanceOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="size-4 text-amber-600 dark:text-amber-400" />
              Relance client
            </DialogTitle>
            <DialogDescription>
              Message pré-rédigé pour {client?.nom}. Modifiez-le avant d&apos;envoyer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={relanceMsg}
              onChange={(e) => setRelanceMsg(e.target.value)}
              rows={12}
              className="font-mono text-xs leading-relaxed"
            />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleCopyRelance}
            >
              {copied ? (
                <><Check className="size-4 text-emerald-600 dark:text-emerald-400" /> Copié !</>
              ) : (
                <><Copy className="size-4" /> Copier le texte</>
              )}
            </Button>
            {client?.telephone && (
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
                onClick={handleWhatsApp}
              >
                <MessageCircle className="size-4" />
                Ouvrir WhatsApp
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
