"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Wallet,
  FileSignature,
  Receipt,
  CheckCircle2,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import {
  useStore,
  PRESTATION_OPTIONNELLE_LABEL,
  type ContratStatut,
  type ContratPrestationStatut,
} from "@/lib/store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { usePermission } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";

import { SocieteBadge } from "@/components/sltt/societe-filter-select";
import { ToneBadge, TONE_CLASSES } from "@/components/sltt/status-badge";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import {
  CONTRAT_STATUTS,
  CONTRAT_STATUT_TONE,
  PRESTATION_STATUTS,
  PRESTATION_STATUT_TONE,
  contratToInput,
  InfoRow,
} from "@/components/sltt/contrat-detail/shared";
import { ContratFormModal } from "@/components/sltt/contrat-detail/contrat-form-modal";
import { DepenseFormModal } from "@/components/sltt/contrat-detail/depense-form-modal";
import { PrestationFormModal } from "@/components/sltt/contrat-detail/prestation-form-modal";
import { ContratFileDropZone } from "@/components/sltt/contrat-detail/contrat-file-drop-zone";

export function ContratDetailScreen() {
  const { toast } = useToast();
  const selectedId = useNav((s) => s.selectedId);
  const go = useNav((s) => s.go);
  const setPendingFacturePrefill = useNav((s) => s.setPendingFacturePrefill);

  const contrats = useStore((s) => s.contrats);
  const societes = useStore((s) => s.societes);
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
  // Suppressions de dépense/prestation — jusqu'ici directes en un clic, sans
  // confirmation, contrairement à la suppression du contrat lui-même ci-dessous.
  const [depenseToDelete, setDepenseToDelete] = useState<{ id: string; libelle: string } | null>(null);
  const [prestationToDelete, setPrestationToDelete] = useState<{ id: string; libelle: string } | null>(null);

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

  const nonVide = contrat.totalDepenses > 0 || contrat.nbPrestations > 0 || contratDocuments.length > 0;

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

  async function handleDeleteDepense() {
    if (!depenseToDelete) return;
    try {
      await removeDepense(depenseToDelete.id);
      toast({ title: "Dépense supprimée", description: depenseToDelete.libelle });
    } catch (e) {
      toast({
        title: "Suppression impossible",
        description: e instanceof Error ? e.message : "Erreur inattendue.",
        variant: "destructive",
      });
    } finally {
      setDepenseToDelete(null);
    }
  }

  async function handleDeletePrestation() {
    if (!prestationToDelete) return;
    try {
      await removeContratPrestation(prestationToDelete.id);
      toast({ title: "Prestation supprimée", description: prestationToDelete.libelle });
    } catch (e) {
      toast({
        title: "Suppression impossible",
        description: e instanceof Error ? e.message : "Erreur inattendue.",
        variant: "destructive",
      });
    } finally {
      setPrestationToDelete(null);
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
      <button
        onClick={() => go("contrats")}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Retour aux contrats
      </button>

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <div className="flex">
          <div className="flex-1 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-mono text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                    {contrat.reference}
                  </h1>
                  {canWrite ? (
                    <Select
                      value={contrat.statut}
                      onValueChange={async (v) => {
                        await updateContratStatut(contrat.id, v as ContratStatut);
                        toast({ title: "Statut mis à jour", description: `${contrat.reference} → ${v}` });
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-7 w-auto gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium shadow-none",
                          TONE_CLASSES[CONTRAT_STATUT_TONE[contrat.statut]],
                        )}
                      >
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
                  {canWrite && contratDepenses.length === 0 ? (
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
                    <span title={canWrite && contratDepenses.length > 0 ? "Société verrouillée : des dépenses sont déjà rattachées à ce contrat." : undefined}>
                      <SocieteBadge societeNom={contrat.societeNom} />
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-base font-semibold text-slate-700 dark:text-slate-300">{contrat.clientNom}</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {contrat.objet} &nbsp;·&nbsp; Début {formatDateShort(contrat.dateDebut)}
                  {contrat.dateFin && <> &nbsp;·&nbsp; Fin {formatDateShort(contrat.dateFin)}</>}
                  {contrat.creePar && <> &nbsp;·&nbsp; Créé par {contrat.creePar}</>}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Montant du contrat</p>
                <p className="mt-0.5 text-3xl font-extrabold tabular-nums leading-tight text-blue-700 dark:text-blue-300">
                  {formatFCFA(contrat.montant, false)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">FCFA</p>
              </div>
            </div>

            {canWrite && (
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400"
                  disabled={nonVide}
                  title={nonVide ? "Retirez d'abord les dépenses, prestations et documents liés" : undefined}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

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
            {PRESTATION_OPTIONNELLE_LABEL}
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
              <>
                <div className="space-y-3 p-4 md:hidden">
                  {contratDepenses.map((d) => (
                    <Card key={d.id} className="border-border/80 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate font-medium text-slate-800 dark:text-slate-200">{d.libelle}</p>
                        <p className="shrink-0 tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                          {formatFCFA(d.montant)}
                        </p>
                      </div>
                      <dl className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500 dark:text-slate-400">Date</dt>
                          <dd className="tabular-nums text-slate-600 dark:text-slate-300">{formatDateShort(d.dateDepense)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-xs text-slate-500 dark:text-slate-400">Mode</dt>
                          <dd className="text-slate-600 dark:text-slate-300">{d.modePaiement}</dd>
                        </div>
                      </dl>
                      {canWrite && (
                        <div className="mt-3 flex justify-end border-t border-border pt-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-11 text-slate-400 hover:text-red-600"
                            aria-label={`Supprimer la dépense ${d.libelle}`}
                            onClick={() => setDepenseToDelete({ id: d.id, libelle: d.libelle })}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
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
                              onClick={() => setDepenseToDelete({ id: d.id, libelle: d.libelle })}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </>
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
              <>
                <div className="space-y-3 p-4 md:hidden">
                  {contratPrestations.map((p) => (
                    <Card key={p.id} className="border-border/80 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800 dark:text-slate-200">{p.libelle}</p>
                          {p.description && (
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{p.description}</p>
                          )}
                        </div>
                        <p className="shrink-0 tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                          {p.montant != null ? formatFCFA(p.montant) : "—"}
                        </p>
                      </div>
                      <div className="mt-3">
                        {canWrite ? (
                          <Select
                            value={p.statut}
                            onValueChange={(v) => updateContratPrestation(p.id, { statut: v as ContratPrestationStatut })}
                          >
                            <SelectTrigger className="h-9 w-full">
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
                      </div>
                      {canWrite && (
                        <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
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
                            className="size-11 text-slate-400 hover:text-red-600"
                            aria-label={`Supprimer la prestation ${p.libelle}`}
                            onClick={() => setPrestationToDelete({ id: p.id, libelle: p.libelle })}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
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
                                onClick={() => setPrestationToDelete({ id: p.id, libelle: p.libelle })}
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
                </div>
              </>
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

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer ce contrat ?"
        description={<>Le contrat {contrat.reference} sera définitivement supprimé. Cette action est irréversible.</>}
        onConfirm={handleDelete}
      />

      <ConfirmDeleteDialog
        open={!!depenseToDelete}
        onOpenChange={(v) => !v && setDepenseToDelete(null)}
        title="Supprimer cette dépense ?"
        description={<>La dépense « {depenseToDelete?.libelle} » sera définitivement supprimée. Cette action est irréversible.</>}
        onConfirm={handleDeleteDepense}
      />

      <ConfirmDeleteDialog
        open={!!prestationToDelete}
        onOpenChange={(v) => !v && setPrestationToDelete(null)}
        title="Supprimer cette prestation ?"
        description={<>La prestation « {prestationToDelete?.libelle} » sera définitivement supprimée. Cette action est irréversible.</>}
        onConfirm={handleDeletePrestation}
      />
    </div>
  );
}
