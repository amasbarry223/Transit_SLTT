"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Wallet,
  FileSignature,
  Upload,
  Download,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  Receipt,
  CheckCircle2,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import {
  useStore,
  type ContratInput,
  type ContratStatut,
  type ContratPrestationStatut,
} from "@/lib/store";
import type { PaiementMode } from "@/lib/domain-types";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { usePermission } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";

import { SocieteBadge } from "@/components/sltt/societe-filter-select";
import { ToneBadge } from "@/components/sltt/status-badge";
import { QuickClientButton } from "@/components/sltt/quick-client-dialog";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo (aligné sur la limite du bucket contrat-fichiers)

const CONTRAT_STATUTS: ContratStatut[] = ["Actif", "Clôturé", "Suspendu"];
const CONTRAT_STATUT_TONE: Record<ContratStatut, "emerald" | "slate" | "amber"> = {
  Actif: "emerald",
  Clôturé: "slate",
  Suspendu: "amber",
};

const PRESTATION_STATUTS: ContratPrestationStatut[] = ["Prévue", "Réalisée", "Annulée"];
const PRESTATION_STATUT_TONE: Record<ContratPrestationStatut, "blue" | "emerald" | "red"> = {
  Prévue: "blue",
  Réalisée: "emerald",
  Annulée: "red",
};

const MODES_PAIEMENT: PaiementMode[] = ["Espèces", "Virement", "Mobile Money", "Chèque"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileIconComponent(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return FileSpreadsheet;
  return File;
}

export function ContratDetailScreen() {
  const { toast } = useToast();
  const selectedId = useNav((s) => s.selectedId);
  const go = useNav((s) => s.go);
  const setPendingFacturePrefill = useNav((s) => s.setPendingFacturePrefill);

  const contrats = useStore((s) => s.contrats);
  const societes = useStore((s) => s.societes);
  const clients = useStore((s) => s.clients);
  const depenses = useStore((s) => s.depenses);
  const prestations = useStore((s) => s.contratPrestations);
  const contratFichiers = useStore((s) => s.contratFichiers);

  const updateContrat = useStore((s) => s.updateContrat);
  const updateContratStatut = useStore((s) => s.updateContratStatut);
  const removeContrat = useStore((s) => s.removeContrat);
  const addDepense = useStore((s) => s.addDepense);
  const removeDepense = useStore((s) => s.removeDepense);
  const addContratPrestation = useStore((s) => s.addContratPrestation);
  const updateContratPrestation = useStore((s) => s.updateContratPrestation);
  const removeContratPrestation = useStore((s) => s.removeContratPrestation);
  const addContratFichier = useStore((s) => s.addContratFichier);
  const deleteContratFichier = useStore((s) => s.deleteContratFichier);
  const getSignedContratFichierUrl = useStore((s) => s.getSignedContratFichierUrl);

  const canWrite = usePermission("contrats:write");

  const contrat = contrats.find((c) => c.id === selectedId);
  const contratDepenses = useMemo(
    () => depenses.filter((d) => d.contratId === selectedId),
    [depenses, selectedId],
  );
  const contratPrestations = useMemo(
    () => prestations.filter((p) => p.contratId === selectedId),
    [prestations, selectedId],
  );
  const contratDocuments = useMemo(
    () => contratFichiers.filter((f) => f.contratId === selectedId),
    [contratFichiers, selectedId],
  );

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [depenseOpen, setDepenseOpen] = useState(false);
  const [prestationOpen, setPrestationOpen] = useState(false);

  if (!contrat) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <FileSignature className="size-10 text-slate-300 dark:text-slate-700" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Contrat introuvable</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ce contrat n'existe pas ou a été supprimé.</p>
        <Button className="mt-5" onClick={() => go("contrats")}>
          <ArrowLeft className="size-4" />
          Retour aux contrats
        </Button>
      </div>
    );
  }

  const nonVide = contrat.totalDepenses > 0 || contrat.nbPrestations > 0;

  async function handleDelete() {
    try {
      await removeContrat(contrat!.id);
      toast({ title: "Contrat supprimé", description: contrat!.reference });
      go("contrats");
    } catch (e) {
      toast({
        title: "Suppression impossible",
        description: e instanceof Error ? e.message : "Erreur inattendue.",
        variant: "destructive",
      });
    } finally {
      setDeleteOpen(false);
    }
  }

  function handleFacturer(prestation: (typeof contratPrestations)[number]) {
    if (prestation.montant == null) return;
    setPendingFacturePrefill({
      clientId: contrat!.clientId,
      clientNom: contrat!.clientNom,
      societeId: contrat!.societeId,
      description: `${contrat!.reference} — ${prestation.libelle}`,
      montant: prestation.montant,
    });
    go("factures");
    toast({ title: "Facture préremplie", description: "Complétez et enregistrez la facture." });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="mt-0.5 size-9" onClick={() => go("contrats")} aria-label="Retour">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">{contrat.reference}</h1>
              {canWrite ? (
                <Select
                  value={contrat.societeId}
                  onValueChange={async (v) => {
                    await updateContrat(contrat.id, { ...contratToInput(contrat), societeId: v });
                    const nom = societes.find((s) => s.id === v)?.nom ?? v;
                    toast({ title: "Société mise à jour", description: `${contrat.reference} → ${nom}` });
                  }}
                >
                  <SelectTrigger className="h-7 w-auto gap-1 border-none bg-transparent px-1 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {societes.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <SocieteBadge societeNom={contrat.societeNom} />
              )}
              {canWrite ? (
                <Select
                  value={contrat.statut}
                  onValueChange={async (v) => {
                    await updateContratStatut(contrat.id, v as ContratStatut);
                    toast({ title: "Statut mis à jour", description: `${contrat.reference} → ${v}` });
                  }}
                >
                  <SelectTrigger className="h-7 w-auto gap-1 border-none bg-transparent px-1 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRAT_STATUTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <ToneBadge tone={CONTRAT_STATUT_TONE[contrat.statut]}>{contrat.statut}</ToneBadge>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {contrat.clientNom} · {formatFCFA(contrat.montant)}
            </p>
          </div>
        </div>

        {canWrite && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Modifier
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 dark:text-red-400"
              disabled={nonVide}
              title={nonVide ? "Retirez d'abord les dépenses et prestations liées" : undefined}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Supprimer
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="infos">
        <TabsList className="h-10 flex-wrap">
          <TabsTrigger value="infos">Infos</TabsTrigger>
          <TabsTrigger value="depenses">
            Dépenses
            <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {contratDepenses.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="prestations">
            Prestations optionnelles
            <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {contrat.nbPrestationsRealisees}/{contrat.nbPrestations}
            </span>
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents
            <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {contratDocuments.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="infos" className="space-y-4">
          <Card className="p-5">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label="Client" value={contrat.clientNom} />
              <InfoRow label="Objet" value={contrat.objet} />
              <InfoRow label="Date de début" value={formatDateShort(contrat.dateDebut)} />
              <InfoRow label="Date de fin" value={contrat.dateFin ? formatDateShort(contrat.dateFin) : "—"} />
              <InfoRow label="Montant" value={formatFCFA(contrat.montant)} />
              <InfoRow label="Créé par" value={contrat.creePar ?? "—"} />
            </dl>
            {contrat.notes && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{contrat.notes}</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="depenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Total dépenses : <span className="font-semibold tabular-nums">{formatFCFA(contrat.totalDepenses)}</span>
            </p>
            {canWrite && (
              <Button size="sm" onClick={() => setDepenseOpen(true)}>
                <Plus className="size-4" />
                Ajouter une dépense
              </Button>
            )}
          </div>

          <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
            {contratDepenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <Wallet className="size-8 text-slate-300 dark:text-slate-700" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Aucune dépense enregistrée</p>
              </div>
            ) : (
              <Table aria-label="Dépenses du contrat">
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800">
                    <TableHead className="h-10 px-4 text-xs uppercase text-slate-500 dark:text-slate-400">Libellé</TableHead>
                    <TableHead className="h-10 px-4 text-xs uppercase text-slate-500 dark:text-slate-400">Date</TableHead>
                    <TableHead className="h-10 px-4 text-xs uppercase text-slate-500 dark:text-slate-400">Mode</TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs uppercase text-slate-500 dark:text-slate-400">Montant</TableHead>
                    {canWrite && <TableHead className="h-10 px-4" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratDepenses.map((d) => (
                    <TableRow key={d.id} className="border-b border-border">
                      <TableCell className="px-4 py-3">{d.libelle}</TableCell>
                      <TableCell className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{formatDateShort(d.dateDepense)}</TableCell>
                      <TableCell className="px-4 py-3 text-slate-600 dark:text-slate-300">{d.modePaiement}</TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums font-medium">{formatFCFA(d.montant)}</TableCell>
                      {canWrite && (
                        <TableCell className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 text-slate-400 hover:text-red-600"
                            aria-label={`Supprimer la dépense ${d.libelle}`}
                            onClick={() => removeDepense(d.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="prestations" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {contrat.nbPrestationsRealisees} réalisée{contrat.nbPrestationsRealisees > 1 ? "s" : ""} sur {contrat.nbPrestations}
            </p>
            {canWrite && (
              <Button size="sm" onClick={() => setPrestationOpen(true)}>
                <Plus className="size-4" />
                Ajouter une prestation
              </Button>
            )}
          </div>

          <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
            {contratPrestations.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <CheckCircle2 className="size-8 text-slate-300 dark:text-slate-700" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Aucune prestation optionnelle</p>
              </div>
            ) : (
              <Table aria-label="Prestations optionnelles du contrat">
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800">
                    <TableHead className="h-10 px-4 text-xs uppercase text-slate-500 dark:text-slate-400">Libellé</TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs uppercase text-slate-500 dark:text-slate-400">Montant</TableHead>
                    <TableHead className="h-10 px-4 text-xs uppercase text-slate-500 dark:text-slate-400">Statut</TableHead>
                    {canWrite && <TableHead className="h-10 px-4" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratPrestations.map((p) => (
                    <TableRow key={p.id} className="border-b border-border">
                      <TableCell className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{p.libelle}</p>
                        {p.description && <p className="text-xs text-slate-500 dark:text-slate-400">{p.description}</p>}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">
                        {p.montant != null ? formatFCFA(p.montant) : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {canWrite ? (
                          <Select
                            value={p.statut}
                            onValueChange={(v) => updateContratPrestation(p.id, { statut: v as ContratPrestationStatut })}
                          >
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRESTATION_STATUTS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <ToneBadge tone={PRESTATION_STATUT_TONE[p.statut]}>{p.statut}</ToneBadge>
                        )}
                      </TableCell>
                      {canWrite && (
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {p.statut === "Réalisée" && p.montant != null && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary"
                                onClick={() => handleFacturer(p)}
                              >
                                <Receipt className="size-3.5" />
                                Facturer
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9 text-slate-400 hover:text-red-600"
                              aria-label={`Supprimer la prestation ${p.libelle}`}
                              onClick={() => removeContratPrestation(p.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <ContratFileDropZone
            contratId={contrat.id}
            fichiers={contratDocuments}
            canWrite={canWrite}
            onUpload={addContratFichier}
            onDelete={deleteContratFichier}
            getSignedUrl={getSignedContratFichierUrl}
          />
        </TabsContent>
      </Tabs>

      <ContratFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={contrat}
        onSubmit={async (input) => {
          await updateContrat(contrat.id, input);
          setEditOpen(false);
        }}
      />

      <DepenseFormModal
        open={depenseOpen}
        onOpenChange={setDepenseOpen}
        onSubmit={async (input) => {
          await addDepense({ contratId: contrat.id, ...input });
          setDepenseOpen(false);
        }}
      />

      <PrestationFormModal
        open={prestationOpen}
        onOpenChange={setPrestationOpen}
        onSubmit={async (input) => {
          await addContratPrestation({ contratId: contrat.id, ...input });
          setPrestationOpen(false);
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contrat ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le contrat {contrat.reference} sera définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function contratToInput(contrat: {
  societeId: string;
  clientId: string;
  clientNom: string;
  objet: string;
  dateDebut: string;
  dateFin?: string;
  montant: number;
  statut: ContratStatut;
  notes?: string;
}): ContratInput {
  return {
    societeId: contrat.societeId,
    clientId: contrat.clientId,
    clientNom: contrat.clientNom,
    objet: contrat.objet,
    dateDebut: contrat.dateDebut,
    dateFin: contrat.dateFin,
    montant: contrat.montant,
    statut: contrat.statut,
    notes: contrat.notes,
  };
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}

function ContratFormModal({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: {
    societeId: string;
    clientId: string;
    clientNom: string;
    objet: string;
    dateDebut: string;
    dateFin?: string;
    montant: number;
    statut: ContratStatut;
    notes?: string;
  };
  onSubmit: (input: ContratInput) => void;
}) {
  const societes = useStore((s) => s.societes);
  const clients = useStore((s) => s.clients);

  const [societeId, setSocieteId] = useState(initial.societeId);
  const [clientId, setClientId] = useState(initial.clientId);
  const [objet, setObjet] = useState(initial.objet);
  const [dateDebut, setDateDebut] = useState(initial.dateDebut);
  const [dateFin, setDateFin] = useState(initial.dateFin ?? "");
  const [montant, setMontant] = useState(String(initial.montant));
  const [statut, setStatut] = useState<ContratStatut>(initial.statut);
  const [notes, setNotes] = useState(initial.notes ?? "");

  const selectedClient = clients.find((c) => c.id === clientId);
  const canSubmit = Boolean(societeId && clientId && objet.trim());

  function handleSubmit() {
    if (!selectedClient || !canSubmit) return;
    onSubmit({
      societeId,
      clientId,
      clientNom: selectedClient.nom,
      objet: objet.trim(),
      dateDebut,
      dateFin: dateFin || undefined,
      montant: Number(montant) || 0,
      statut,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Modifier le contrat</DialogTitle>
          <DialogDescription>Mettez à jour les informations du contrat.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Société <span className="text-red-500">*</span></Label>
            <Select value={societeId} onValueChange={setSocieteId}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {societes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Client <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <QuickClientButton onCreated={setClientId} />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Objet <span className="text-red-500">*</span></Label>
            <Textarea value={objet} onChange={(e) => setObjet(e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Date de début</Label>
            <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-2">
            <Label>Date de fin</Label>
            <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="h-10" />
          </div>

          <div className="space-y-2">
            <Label>Montant</Label>
            <Input type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={statut} onValueChange={(v) => setStatut(v as ContratStatut)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRAT_STATUTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DepenseFormModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: {
    libelle: string;
    montant: number;
    dateDepense: string;
    modePaiement: PaiementMode;
    note?: string;
    justificatifDataUrl?: string;
    justificatifNom?: string;
  }) => void;
}) {
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<PaiementMode>("Espèces");
  const [note, setNote] = useState("");
  const [justificatif, setJustificatif] = useState<{ dataUrl: string; nom: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setLibelle("");
    setMontant("");
    setDate(new Date().toISOString().slice(0, 10));
    setMode("Espèces");
    setNote("");
    setJustificatif(null);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setJustificatif({ dataUrl: ev.target?.result as string, nom: file.name });
    reader.readAsDataURL(file);
  }

  const canSubmit = Boolean(libelle.trim() && Number(montant) > 0);

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      libelle: libelle.trim(),
      montant: Number(montant),
      dateDepense: date,
      modePaiement: mode,
      note: note.trim() || undefined,
      justificatifDataUrl: justificatif?.dataUrl,
      justificatifNom: justificatif?.nom,
    });
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une dépense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Libellé <span className="text-red-500">*</span></Label>
            <Input value={libelle} onChange={(e) => setLibelle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant <span className="text-red-500">*</span></Label>
              <Input type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mode de paiement</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as PaiementMode)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES_PAIEMENT.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Justificatif (optionnel)</Label>
            <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <Upload className="size-4" />
              {justificatif ? justificatif.nom : "Joindre un scan"}
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrestationFormModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: {
    libelle: string;
    description?: string;
    montant?: number;
    statut: ContratPrestationStatut;
    datePrevue?: string;
    dateRealisation?: string;
  }) => void;
}) {
  const [libelle, setLibelle] = useState("");
  const [description, setDescription] = useState("");
  const [montant, setMontant] = useState("");
  const [statut, setStatut] = useState<ContratPrestationStatut>("Prévue");
  const [datePrevue, setDatePrevue] = useState("");

  function reset() {
    setLibelle("");
    setDescription("");
    setMontant("");
    setStatut("Prévue");
    setDatePrevue("");
  }

  const canSubmit = Boolean(libelle.trim());

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      libelle: libelle.trim(),
      description: description.trim() || undefined,
      montant: montant ? Number(montant) : undefined,
      statut,
      datePrevue: datePrevue || undefined,
    });
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une prestation optionnelle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Libellé <span className="text-red-500">*</span></Label>
            <Input value={libelle} onChange={(e) => setLibelle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant (optionnel)</Label>
              <Input type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date prévue</Label>
              <Input type="date" value={datePrevue} onChange={(e) => setDatePrevue(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={statut} onValueChange={(v) => setStatut(v as ContratPrestationStatut)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESTATION_STATUTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContratFileDropZone({
  contratId,
  fichiers,
  canWrite,
  onUpload,
  onDelete,
  getSignedUrl,
}: {
  contratId: string;
  fichiers: Array<{ id: string; nom: string; taille: number; type: string; dateUpload: string; storagePath: string }>;
  canWrite: boolean;
  onUpload: (input: { contratId: string; nom: string; taille: number; type: string; dataUrl: string }) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
  getSignedUrl: (storagePath: string) => Promise<string>;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function processFiles(fileList: FileList | null) {
    if (!fileList) return;
    Array.from(fileList).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "Fichier trop volumineux", description: `${file.name} dépasse la limite de 10 Mo.`, variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          await onUpload({
            contratId,
            nom: file.name,
            taille: file.size,
            type: file.type || "application/octet-stream",
            dataUrl: ev.target?.result as string,
          });
          toast({ title: "Document ajouté", description: file.name });
        } catch (e) {
          toast({
            title: "Échec de l'upload",
            description: e instanceof Error ? e.message : "Erreur inattendue.",
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleView(storagePath: string) {
    try {
      const url = await getSignedUrl(storagePath);
      window.open(url, "_blank", "noopener");
    } catch {
      toast({ title: "Impossible d'ouvrir le document", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-3">
      {canWrite && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Cliquer ou déposer des fichiers ici pour les joindre au contrat"
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/60",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            processFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <Upload className={cn("size-7", dragging ? "text-primary" : "text-slate-300 dark:text-slate-700")} />
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Déposer des scans ici</p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">ou cliquer pour sélectionner · Stockage privé · Max 10 Mo</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            onChange={(e) => {
              processFiles(e.target.files);
              if (inputRef.current) inputRef.current.value = "";
            }}
          />
        </div>
      )}

      {fichiers.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Aucun document archivé</p>
      ) : (
        <div className="space-y-1.5">
          {fichiers.map((f) => {
            const Icon = getFileIconComponent(f.type);
            return (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-white dark:bg-slate-900 px-3 py-2.5"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{f.nom}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatFileSize(f.taille)} · {formatDateShort(f.dateUpload)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon" className="size-9" aria-label={`Voir ${f.nom}`} onClick={() => handleView(f.storagePath)}>
                    <Download className="size-4" />
                  </Button>
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 text-slate-400 hover:text-red-600"
                      aria-label={`Supprimer ${f.nom}`}
                      onClick={() => onDelete(f.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
