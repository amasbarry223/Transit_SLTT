"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuditEntry } from "@/lib/audit";
import {
  Clock,
  ArrowLeft,
  TrendingUp,
  Wallet,
  FolderKanban,
  Pencil,
  BellRing,
  Copy,
  MessageCircle,
  Check,
} from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useStore, type ClientInput } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { formatFCFA, formatDateShort } from "@/lib/format";
import {
  buildClasseurJournal,
  fetchClasseurMouvements,
  filterClasseurJournal,
  computeClasseurTotals,
  fetchMouvementSuivi,
  classeurEntrySourceType,
  hasClasseurPeriodFilter,
  type ClasseurEntry,
  type ClasseurFilters,
} from "@/lib/classeur";
import { resolveClasseurPrintBrand, resolveTransitSociete } from "@/lib/societe-brand";
import { TOAST_COPY_RESET_MS } from "@/lib/constants";
import { exportToExcel, printClasseur } from "@/lib/export";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { ClientFormFields, emptyClientForm } from "@/components/sltt/client-form-fields";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ClientProfileCard } from "@/components/sltt/client-fiche/client-profile-card";
import { ClasseurTab } from "@/components/sltt/client-fiche/classeur-tab";
import { ClasseurSuiviDialog } from "@/components/sltt/client-fiche/classeur-suivi-dialog";
import { DossiersTab } from "@/components/sltt/client-fiche/dossiers-tab";
import { FacturesTab } from "@/components/sltt/client-fiche/factures-tab";
import { StockTab } from "@/components/sltt/client-fiche/stock-tab";
import { BonsTab } from "@/components/sltt/client-fiche/bons-tab";
import { FICHE_TABS, PAGE_SIZE, type FicheTab } from "@/components/sltt/client-fiche/shared";

export function ClientFicheScreen() {
  const { toast } = useToast();
  const { selectedId, go, openDossier, openDossierDetail, setPendingFacturePrefill } = useNav();
  const canWrite = usePermission("clients:write");
  // Le Classeur expose le grand livre financier (débit/crédit/solde par
  // société, écritures de paiement) — clients:read seul ne suffit pas, un
  // rôle comme Agent de transit qui n'a que clients:read ne doit pas y
  // accéder via la fiche client.
  const canSeeCompta = usePermission("comptabilite:read");
  const canWriteDossiers = usePermission("dossiers:write");
  const canWriteFactures = usePermission("factures:write");
  const clients = useStore((s) => s.clients);
  const allDossiers = useStore((s) => s.dossiers);
  const allEcritures = useStore((s) => s.ecritures);
  const allBons = useStore((s) => s.bons);
  const allFactures = useStore((s) => s.factures);
  const allStock = useStore((s) => s.stock);
  const allMouvements = useStore((s) => s.mouvements);
  const societes = useStore((s) => s.societes);
  const auditLogs = useStore((s) => s.auditLogs);
  const updateClient = useStore((s) => s.updateClient);

  const [activeTab, setActiveTab] = useState<FicheTab>(() => (canSeeCompta ? "classeur" : "dossiers"));
  const visibleFicheTabs = useMemo(
    () => FICHE_TABS.filter((t) => t.key !== "classeur" || canSeeCompta),
    [canSeeCompta],
  );
  const [dossierPage, setDossierPage] = useState(1);
  const [bonPage, setBonPage] = useState(1);
  const [classeurFilters, setClasseurFilters] = useState<ClasseurFilters>({
    societeId: "all",
    type: "all",
  });
  const [relanceOpen, setRelanceOpen] = useState(false);
  const [relanceMsg, setRelanceMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editValues, setEditValues] = useState<ClientInput>(emptyClientForm());
  const [suiviEntry, setSuiviEntry] = useState<ClasseurEntry | null>(null);
  const [suiviLogs, setSuiviLogs] = useState<AuditEntry[]>([]);
  const [suiviLoading, setSuiviLoading] = useState(false);

  const client = useMemo(
    () => clients.find((c) => c.id === selectedId),
    [clients, selectedId],
  );

  const dossiers = useMemo(
    () => (selectedId ? allDossiers.filter((d) => d.clientId === selectedId) : []),
    [allDossiers, selectedId],
  );
  const bons = useMemo(
    () => (selectedId ? allBons.filter((b) => b.clientId === selectedId) : []),
    [allBons, selectedId],
  );
  const factures = useMemo(
    () => (selectedId ? allFactures.filter((f) => f.clientId === selectedId) : []),
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

  const clientSideJournal = useMemo(
    () =>
      selectedId
        ? buildClasseurJournal(selectedId, allDossiers, allEcritures, allFactures, societes)
        : [],
    [selectedId, allDossiers, allEcritures, allFactures, societes],
  );
  const [sqlJournal, setSqlJournal] = useState<{ clientId: string; rows: ClasseurEntry[] } | null>(
    null,
  );
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    fetchClasseurMouvements(selectedId).then((rows) => {
      if (!cancelled && rows) setSqlJournal({ clientId: selectedId, rows });
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const classeurJournal =
    sqlJournal?.clientId === selectedId ? sqlJournal.rows : clientSideJournal;
  const classeurFiltered = useMemo(
    () => filterClasseurJournal(classeurJournal, classeurFilters),
    [classeurJournal, classeurFilters],
  );
  const classeurTotals = useMemo(
    () => computeClasseurTotals(classeurFiltered),
    [classeurFiltered],
  );
  const classeurPeriodFiltered = hasClasseurPeriodFilter(classeurFilters);
  const classeurSocieteOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of classeurJournal) seen.set(e.societeId, e.societeNom);
    return Array.from(seen.entries()).map(([id, nom]) => ({ id, nom }));
  }, [classeurJournal]);

  const clientAuditHistory = useMemo(() => {
    if (!client) return [];
    const needle = client.nom.toLowerCase();
    return auditLogs
      .filter(
        (a) =>
          ["Dossiers", "Comptabilité", "Factures", "Clients"].includes(a.module) &&
          (a.clientId ? a.clientId === client.id : a.detail.toLowerCase().includes(needle)),
      )
      .slice(0, 25);
  }, [auditLogs, client]);

  const { totalInvesti, totalPaye, totalDu } = useMemo(() => {
    let investi = 0;
    let paye = 0;
    let du = 0;
    for (const e of classeurJournal) {
      investi += e.debit;
      paye += e.credit;
      du += Math.max(0, e.debit - e.credit);
    }
    return { totalInvesti: investi, totalPaye: paye, totalDu: du };
  }, [classeurJournal]);

  const pendingCount = useMemo(
    () => classeurJournal.filter((e) => e.debit - e.credit > 0).length,
    [classeurJournal],
  );

  function openRelanceDialog() {
    if (!client) return;
    const unpaid = classeurJournal.filter((e) => e.debit - e.credit > 0);
    const lignes = unpaid
      .map((e) => `  • ${e.reference} — ${formatFCFA(e.debit - e.credit, false)} FCFA`)
      .join("\n");
    const total = formatFCFA(totalDu, false);
    const today = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const transit = resolveTransitSociete(societes);
    const societeNom = transit?.nom ?? "Société transit";
    const ville = transit?.adresse?.split(",")[0]?.trim() || "Bamako";
    const msg = `${ville}, le ${today}\n\nObjet : Rappel de solde — ${societeNom}\n\nBonjour${client.type === "Entreprise" ? "" : " M./Mme"},\n\nNous vous contactons au sujet du solde restant dû sur vos dossiers de transit :\n\n${lignes}\n\nMontant total dû : ${total} FCFA\n\nNous vous prions de bien vouloir régulariser ce solde dans les meilleurs délais. Pour tout renseignement, n'hésitez pas à nous contacter.\n\nCordialement,\n${societeNom}`;
    setRelanceMsg(msg);
    setCopied(false);
    setRelanceOpen(true);
  }

  function handleCopyRelance() {
    navigator.clipboard.writeText(relanceMsg).then(() => {
      setCopied(true);
      toast({ title: "Message copié" });
      setTimeout(() => setCopied(false), TOAST_COPY_RESET_MS);
    });
  }

  function handleWhatsApp() {
    const phone = client?.telephone?.replace(/[\s+]/g, "");
    if (!phone) return;
    const encoded = encodeURIComponent(relanceMsg);
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
  }

  async function handleExportClasseurExcel() {
    if (!client) return;
    if (classeurFiltered.length === 0) {
      toast({
        title: "Rien à exporter",
        description: "Aucune écriture ne correspond aux filtres actuels.",
        variant: "destructive",
      });
      return;
    }
    try {
      await exportToExcel(
        `classeur-${client.nom.replace(/\s+/g, "-").toLowerCase()}`,
        [
          { header: "Date", accessor: (r: (typeof classeurFiltered)[number]) => formatDateShort(r.date) },
          { header: "Société", accessor: (r: (typeof classeurFiltered)[number]) => r.societeNom },
          { header: "Type", accessor: (r: (typeof classeurFiltered)[number]) => r.type },
          { header: "Référence", accessor: (r: (typeof classeurFiltered)[number]) => r.reference },
          { header: "Libellé", accessor: (r: (typeof classeurFiltered)[number]) => r.libelle },
          { header: "Débit", accessor: (r: (typeof classeurFiltered)[number]) => r.debit },
          { header: "Crédit", accessor: (r: (typeof classeurFiltered)[number]) => r.credit },
          { header: "Solde cumulé", accessor: (r: (typeof classeurFiltered)[number]) => r.soldeCumule },
          { header: "Statut", accessor: (r: (typeof classeurFiltered)[number]) => r.statut },
        ],
        classeurFiltered,
        { module: "Clients" },
      );
    } catch {
      return;
    }
    toast({
      title: "Export Excel généré",
      description: `${classeurFiltered.length} écriture${classeurFiltered.length !== 1 ? "s" : ""} exportée${classeurFiltered.length !== 1 ? "s" : ""}.`,
    });
  }

  function handlePrintClasseur() {
    if (!client) return;
    const societeLabel =
      classeurFilters.societeId === "all"
        ? undefined
        : classeurSocieteOptions.find((s) => s.id === classeurFilters.societeId)?.nom;
    printClasseur(
      client.nom,
      classeurFiltered.map((r) => ({
        date: r.date,
        societeNom: r.societeNom,
        type: r.type,
        reference: r.reference,
        libelle: r.libelle,
        debit: r.debit,
        credit: r.credit,
        soldeCumule: r.soldeCumule,
        statut: r.statut,
      })),
      classeurTotals,
      societeLabel,
      resolveClasseurPrintBrand(societes, classeurFilters.societeId),
    );
  }

  async function openClasseurSuivi(entry: ClasseurEntry) {
    setSuiviEntry(entry);
    setSuiviLoading(true);
    setSuiviLogs([]);

    const sourceType = classeurEntrySourceType(entry);
    const remote = await fetchMouvementSuivi(sourceType, entry.sourceId);
    const local = auditLogs.filter(
      (log) => log.sourceType === sourceType && log.sourceId === entry.sourceId,
    );
    const merged = new Map<string, AuditEntry>();
    for (const log of [...remote, ...local]) merged.set(log.id, log);
    setSuiviLogs(
      Array.from(merged.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    );
    setSuiviLoading(false);
  }

  function closeClasseurSuivi() {
    setSuiviEntry(null);
    setSuiviLogs([]);
    setSuiviLoading(false);
  }

  function openClasseurSource(entry: ClasseurEntry) {
    closeClasseurSuivi();
    if (entry.type === "Dossier") {
      openDossierDetail(entry.sourceId);
      return;
    }
    if (entry.type === "Facture") {
      go("facture-detail", { id: entry.sourceId });
      return;
    }
    go("comptabilite");
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

  const bonPages = Math.max(1, Math.ceil(bons.length / PAGE_SIZE));
  const bonSafePage = Math.min(bonPage, bonPages);
  const pagedBons = bons.slice((bonSafePage - 1) * PAGE_SIZE, bonSafePage * PAGE_SIZE);

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
          className="-ml-2 w-fit text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
        >
          <ArrowLeft className="size-4" />
          Retour aux clients
        </Button>
        <PageHeader title="Fiche client" description="Vue consolidée du client" />
      </div>

      <ClientProfileCard
        client={client}
        totalDu={totalDu}
        onEdit={canWrite ? openEditDialog : undefined}
        onNewDossier={canWriteDossiers ? () => openDossier(null, "create") : undefined}
        onRelance={openRelanceDialog}
      />

      {totalDu > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 dark:border-amber-900/60 dark:bg-amber-950/30">
          <Clock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-400">
              Solde impayé : {formatFCFA(totalDu)}
            </p>
            <p className="mt-0.5 text-xs text-amber-800/80">
              {pendingCount} mouvement{pendingCount !== 1 ? "s" : ""} en attente de règlement — voir le
              détail dans le Classeur.
            </p>
          </div>
        </div>
      )}

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
          <TabsList className="flex h-12 w-full items-stretch rounded-none bg-slate-50/80 p-0 dark:bg-slate-800/80">
            {visibleFicheTabs.map((t) => {
              const Icon = t.icon;
              const count =
                t.key === "classeur"
                  ? classeurJournal.length
                  : t.key === "dossiers"
                    ? dossiers.length
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
                    "text-sm font-medium text-slate-500 shadow-none transition-colors dark:text-slate-400",
                    "hover:bg-white/60 hover:text-slate-900 dark:hover:text-slate-100",
                    "data-[state=active]:border-primary data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900",
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

        {canSeeCompta && (
        <ClasseurTab
          classeurFilters={classeurFilters}
          onFiltersChange={setClasseurFilters}
          classeurSocieteOptions={classeurSocieteOptions}
          classeurFiltered={classeurFiltered}
          classeurTotals={classeurTotals}
          classeurPeriodFiltered={classeurPeriodFiltered}
          clientAuditHistory={clientAuditHistory}
          onExportExcel={handleExportClasseurExcel}
          onPrint={handlePrintClasseur}
          onRowClick={openClasseurSuivi}
        />
        )}

        <ClasseurSuiviDialog
          entry={suiviEntry}
          logs={suiviLogs}
          loading={suiviLoading}
          onClose={closeClasseurSuivi}
          onOpenSource={openClasseurSource}
        />

        <DossiersTab
          dossiers={dossiers}
          pagedDossiers={pagedDossiers}
          dossierSafePage={dossierSafePage}
          dossierPages={dossierPages}
          onPageChange={setDossierPage}
          onOpenDossier={openDossierDetail}
          onCreateDossier={() => openDossier(null, "create")}
        />

        <FacturesTab
          factures={factures}
          onNewFacture={() => {
            setPendingFacturePrefill({
              clientId: client.id,
              clientNom: client.nom,
              description: "",
              montant: 0,
            });
            go("factures");
          }}
          onOpenFacture={(id) => go("facture-detail", { id })}
        />

        <StockTab
          stockItems={stockItems}
          clientMouvements={clientMouvements}
          onOpenEntreposage={() => go("entreposage")}
        />

        <BonsTab
          bons={bons}
          pagedBons={pagedBons}
          bonSafePage={bonSafePage}
          bonPages={bonPages}
          onPageChange={setBonPage}
        />
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription>Mettez à jour les informations du client.</DialogDescription>
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

      <Dialog open={relanceOpen} onOpenChange={setRelanceOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="size-4 text-amber-600 dark:text-amber-400" />
              Relance client
            </DialogTitle>
            <DialogDescription>
              Message pré-rédigé pour {client.nom}. Modifiez-le avant d&apos;envoyer.
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
            <Button variant="outline" className="w-full sm:w-auto" onClick={handleCopyRelance}>
              {copied ? (
                <>
                  <Check className="size-4 text-emerald-600 dark:text-emerald-400" /> Copié !
                </>
              ) : (
                <>
                  <Copy className="size-4" /> Copier le texte
                </>
              )}
            </Button>
            {client.telephone && (
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
