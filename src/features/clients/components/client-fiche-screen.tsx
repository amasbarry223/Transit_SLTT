"use client";

import { useMemo, useState } from "react";
import type { AuditEntry } from "@/lib/audit";
import {
  ArrowLeft,
  Pencil,
  BellRing,
  Copy,
  MessageCircle,
  Check,
} from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import type { ClientInput } from "@/features/clients/types";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastInfo, toastSuccess, toastWarning } from "@/shared/utils/toast-helpers";
import { UI } from "@/shared/utils/ui-messages";
import { usePermission } from "@/shared/hooks/use-permission";
import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import { formatFCFA, formatDateShort } from "@/lib/format";
import {
  buildClasseurJournal,
  filterClasseurJournal,
  computeClasseurTotals,
  classeurEntrySourceType,
  hasClasseurPeriodFilter,
  type ClasseurEntry,
  type ClasseurFilters,
} from "@/lib/classeur";
import { resolveSlttBrand, resolveTransitSociete } from "@/lib/societe-brand";
import { TOAST_COPY_RESET_MS } from "@/lib/constants";
import { exportToExcel, printClasseur } from "@/lib/export";
import { ClientFormFields, emptyClientForm } from "@/features/clients/components/client-form-fields";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/utils/cn";
import { ClientProfileCard } from "@/features/clients/components/client-fiche/client-profile-card";
import { FinancialSummary } from "@/features/clients/components/client-fiche/financial-summary";
import { ClasseurTab } from "@/features/clients/components/client-fiche/classeur-tab";
import { ClasseurSuiviDialog } from "@/features/clients/components/client-fiche/classeur-suivi-dialog";
import { DossiersTab } from "@/features/clients/components/client-fiche/dossiers-tab";
import { FacturesTab } from "@/features/clients/components/client-fiche/factures-tab";
import { LogistiqueTab } from "@/features/clients/components/client-fiche/logistique-tab";
import { FICHE_TABS, PAGE_SIZE, type FicheTab } from "@/features/clients/components/client-fiche/shared";

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
  const { annexes } = useActiveAnnexe();

  const [activeTab, setActiveTab] = useState<FicheTab>(() => (canSeeCompta ? "classeur" : "dossiers"));
  const visibleFicheTabs = useMemo(
    () => FICHE_TABS.filter((t) => t.key !== "classeur" || canSeeCompta),
    [canSeeCompta],
  );
  const [dossierPage, setDossierPage] = useState(1);
  const [bonPage, setBonPage] = useState(1);
  const [classeurFilters, setClasseurFilters] = useState<ClasseurFilters>({
    type: "all",
  });
  const [relanceOpen, setRelanceOpen] = useState(false);
  const [relanceMsg, setRelanceMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
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

  // Classeur : vue calculée en lecture seule du grand livre client
  // (dossiers + écritures + factures du store). Pas de source SQL dédiée.
  const classeurJournal = useMemo(
    () =>
      selectedId
        ? buildClasseurJournal(selectedId, allDossiers, allEcritures, allFactures)
        : [],
    [selectedId, allDossiers, allEcritures, allFactures],
  );
  const classeurFiltered = useMemo(
    () => filterClasseurJournal(classeurJournal, classeurFilters),
    [classeurJournal, classeurFilters],
  );
  const classeurTotals = useMemo(
    () => computeClasseurTotals(classeurFiltered),
    [classeurFiltered],
  );
  const classeurPeriodFiltered = hasClasseurPeriodFilter(classeurFilters);
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

  // Source unique : client.totalDu/totalPaye/totalInvesti (syncClientStats),
  // déjà utilisés par la liste clients, le tri et l'export PDF des créances.
  // Un ancien recalcul local ici compensait investi/payé sur l'ensemble du
  // classeur (solde NET, comme l'onglet Classeur) — pour un client avec un
  // dossier en avance et un autre dossier dû, ce bandeau affichait un solde
  // inférieur à celui de la liste clients et de l'export, pour la même
  // dette. L'onglet Classeur (computeClasseurTotals) garde sa propre
  // compensation nette : c'est un grand livre, où elle est la sémantique
  // comptable correcte — seul ce bandeau de synthèse en tête de fiche
  // devait s'aligner sur le reste de l'application.
  const totalInvesti = client?.totalInvesti ?? 0;
  const totalPaye = client?.totalPaye ?? 0;
  const totalDu = client?.totalDu ?? 0;

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
    const ville = transit?.adresse?.split(",")[0]?.trim() || "";
    const dateLine = ville ? `${ville}, le ${today}` : `Le ${today}`;
    const msg = `${dateLine}\n\nObjet : Rappel de solde — ${societeNom}\n\nBonjour${client.type === "Entreprise" ? "" : " M./Mme"},\n\nNous vous contactons au sujet du solde restant dû sur vos dossiers de transit :\n\n${lignes}\n\nMontant total dû : ${total} FCFA\n\nNous vous prions de bien vouloir régulariser ce solde dans les meilleurs délais. Pour tout renseignement, n'hésitez pas à nous contacter.\n\nCordialement,\n${societeNom}`;
    setRelanceMsg(msg);
    setCopied(false);
    setRelanceOpen(true);
  }

  function handleCopyRelance() {
    navigator.clipboard
      .writeText(relanceMsg)
      .then(() => {
        setCopied(true);
        toastInfo(toast, { title: "Message copié" });
        setTimeout(() => setCopied(false), TOAST_COPY_RESET_MS);
      })
      .catch(() => {
        toastWarning(toast, {
          title: "Copie impossible",
          description: "Le presse-papiers est inaccessible — sélectionnez et copiez le texte manuellement.",
        });
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
      toastWarning(toast, {
        title: "Rien à exporter",
        description: UI.errors.exportEmpty,
      });
      return;
    }
    try {
      await exportToExcel(
        "clients",
        `classeur-${client.nom.replace(/\s+/g, "-").toLowerCase()}`,
        [
          { header: "Date", accessor: (r: (typeof classeurFiltered)[number]) => formatDateShort(r.date) },
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
    } catch (error) {
      toastError(toast, error, {
        title: "Impossible de générer l'export Excel",
        fallback: UI.errors.exportFailed,
      });
      return;
    }
    toastSuccess(toast, {
      title: "Export Excel généré",
      description: `${classeurFiltered.length} écriture${classeurFiltered.length !== 1 ? "s" : ""} exportée${classeurFiltered.length !== 1 ? "s" : ""}.`,
    });
  }

  function handlePrintClasseur() {
    if (!client) return;
    printClasseur(
      client.nom,
      classeurFiltered.map((r) => ({
        date: r.date,
        type: r.type,
        reference: r.reference,
        libelle: r.libelle,
        debit: r.debit,
        credit: r.credit,
        soldeCumule: r.soldeCumule,
        statut: r.statut,
      })),
      classeurTotals,
      undefined,
      resolveSlttBrand(societes),
    );
  }

  function openClasseurSuivi(entry: ClasseurEntry) {
    setSuiviEntry(entry);
    setSuiviLoading(false);

    const sourceType = classeurEntrySourceType(entry);
    setSuiviLogs(
      auditLogs
        .filter(
          (log) => log.sourceType === sourceType && log.sourceId === entry.sourceId,
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    );
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
      annexeId: client.annexeId,
    });
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (savingEdit) return;
    if (!client || !editValues.nom.trim()) return;
    const input: ClientInput = {
      nom: editValues.nom.trim(),
      type: editValues.type,
      telephone: editValues.telephone.trim(),
      email: editValues.email.trim(),
      adresse: editValues.adresse.trim(),
      annexeId: editValues.annexeId,
    };
    setSavingEdit(true);
    try {
      await updateClient(client.id, input);
      setEditOpen(false);
      toastSuccess(toast, { title: "Client mis à jour", description: input.nom });
    } catch (error) {
      toastError(toast, error, { title: "Impossible d'enregistrer les modifications" });
    } finally {
      setSavingEdit(false);
    }
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
        <Button variant="ghost" onClick={() => go("clients")} className="text-muted-foreground">
          <ArrowLeft className="size-4" />
          Retour aux clients
        </Button>
        <Card className="border-border/80 p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-foreground">Client introuvable</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Le client demandé n&apos;existe pas ou a été supprimé.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Button
        variant="ghost"
        onClick={() => go("clients")}
        className="-ml-2 h-8 w-fit text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Clients
      </Button>

      <ClientProfileCard
        client={client}
        onEdit={canWrite ? openEditDialog : undefined}
        onNewDossier={canWriteDossiers ? () => openDossier(null, "create") : undefined}
      />

      <FinancialSummary
        totalDu={totalDu}
        totalPaye={totalPaye}
        totalInvesti={totalInvesti}
        pendingCount={pendingCount}
        onSeeClasseur={canSeeCompta ? () => setActiveTab("classeur") : undefined}
        onRelance={openRelanceDialog}
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as FicheTab)}
        className="gap-0"
      >
        <div className="sticky top-16 z-10 -mx-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <TabsList className="flex h-12 w-full items-stretch gap-1 rounded-none bg-transparent p-0">
            {visibleFicheTabs.map((t) => {
              const Icon = t.icon;
              const count =
                t.key === "classeur"
                  ? classeurJournal.length
                  : t.key === "dossiers"
                    ? dossiers.length
                    : t.key === "factures"
                      ? factures.length
                      : stockItems.length + bons.length;
              return (
                <TabsTrigger
                  key={t.key}
                  value={t.key}
                  className={cn(
                    "relative flex flex-1 items-center justify-center gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-2 py-0 min-w-0",
                    "text-sm font-medium text-muted-foreground shadow-none transition-colors",
                    "hover:text-foreground",
                    "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none",
                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                    "[&[data-state=active]_svg]:text-primary",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="hidden truncate sm:inline">{t.label}</span>
                  <span className="truncate sm:hidden">{t.shortLabel}</span>
                  {count > 0 && (
                    <span className="ml-0.5 rounded-full bg-muted px-1.5 text-[10px] font-semibold tabular-nums text-muted-foreground data-[state=active]:bg-primary/10">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {canSeeCompta && (
        <ClasseurTab
          classeurFilters={classeurFilters}
          onFiltersChange={setClasseurFilters}
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

        <LogistiqueTab
          stockItems={stockItems}
          clientMouvements={clientMouvements}
          bons={bons}
          pagedBons={pagedBons}
          bonSafePage={bonSafePage}
          bonPages={bonPages}
          onBonPageChange={setBonPage}
          onOpenEntreposage={() => go("entreposage")}
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
            annexes={annexes}
            idPrefix="cl-edit"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void handleSaveEdit()} disabled={!editValues.nom.trim() || savingEdit}>
              <Pencil className="size-4" />
              {savingEdit ? "Enregistrement…" : "Enregistrer"}
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
