"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Save,
  FileText,
  Info,
  Wallet,
  FolderKanban,
  ListChecks,
  AlertTriangle,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import { useStore, type DossierStatut } from "@/lib/store";
import { formatFCFA, formatDateShort, parseAmount } from "@/lib/format";
import { printHTML } from "@/lib/export";
import { DossierStatutBadge } from "@/components/sltt/status-badge";
import { useToast } from "@/hooks/use-toast";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const STATUTS: DossierStatut[] = ["En cours", "Dédouané", "Livré", "Soldé"];

const numStr = (n: number | undefined): string =>
  n != null ? n.toString() : "";

export function DossierFormScreen() {
  const { selectedId, dossierFormMode } = useNav();
  return (
    <DossierFormInner
      key={`${dossierFormMode}-${selectedId ?? "new"}`}
    />
  );
}

function DossierFormInner() {
  const { selectedId, dossierFormMode, go } = useNav();
  const { toast } = useToast();

  const clients = useStore((s) => s.clients);
  const dossiers = useStore((s) => s.dossiers);
  const addDossier = useStore((s) => s.addDossier);
  const updateDossier = useStore((s) => s.updateDossier);
  const dossierSeq = useStore((s) => s.dossierSeq);

  const isEdit = dossierFormMode === "edit";
  const existing =
    isEdit && selectedId
      ? dossiers.find((d) => d.id === selectedId)
      : undefined;

  // Form state
  const [clientId, setClientId] = useState<string>(existing?.clientId ?? "");
  const [nature, setNature] = useState<string>(existing?.nature ?? "");
  const [bl, setBl] = useState<string>(existing?.bl ?? "");
  const [camion, setCamion] = useState<string>(existing?.camion ?? "");
  const [date, setDate] = useState<string>(existing?.date ?? "");
  const [droitDouane, setDroitDouane] = useState<string>(numStr(existing?.droitDouane));
  const [fraisCircuit, setFraisCircuit] = useState<string>(numStr(existing?.fraisCircuit));
  const [fraisPrestation, setFraisPrestation] = useState<string>(numStr(existing?.fraisPrestation));
  const [montantInvesti, setMontantInvesti] = useState<string>(numStr(existing?.montantInvesti));
  const [statut, setStatut] = useState<DossierStatut>(existing?.statut ?? "En cours");
  const [notes, setNotes] = useState<string>(existing?.notes ?? "");

  // Validation errors
  const [errors, setErrors] = useState<{
    clientId?: string;
    nature?: string;
    bl?: string;
    camion?: string;
    date?: string;
  }>({});

  // Unsaved changes guard
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  // Derived values
  const dN = parseAmount(droitDouane);
  const fN = parseAmount(fraisCircuit);
  const pN = parseAmount(fraisPrestation);
  const iN = parseAmount(montantInvesti);
  const montantPaye = existing?.montantPaye ?? 0;

  const ecart = useMemo(() => pN - (dN + fN), [pN, dN, fN]);
  const reste = useMemo(() => Math.max(0, iN - montantPaye), [iN, montantPaye]);

  const reference =
    existing?.reference ??
    `SLTT-TR-2026-${String(dossierSeq).padStart(4, "0")}`;

  // Detect unsaved changes
  const isDirty = useMemo(() => {
    if (!isEdit) {
      return !!(
        clientId ||
        nature.trim() ||
        bl.trim() ||
        camion.trim() ||
        date ||
        droitDouane ||
        fraisCircuit ||
        fraisPrestation ||
        montantInvesti
      );
    }
    if (!existing) return false;
    return (
      clientId !== existing.clientId ||
      nature !== existing.nature ||
      bl !== existing.bl ||
      camion !== existing.camion ||
      date !== existing.date ||
      parseAmount(droitDouane) !== existing.droitDouane ||
      parseAmount(fraisCircuit) !== existing.fraisCircuit ||
      parseAmount(fraisPrestation) !== existing.fraisPrestation ||
      parseAmount(montantInvesti) !== existing.montantInvesti ||
      statut !== existing.statut ||
      notes !== (existing.notes ?? "")
    );
  }, [
    isEdit,
    existing,
    clientId,
    nature,
    bl,
    camion,
    date,
    droitDouane,
    fraisCircuit,
    fraisPrestation,
    montantInvesti,
    statut,
    notes,
  ]);

  // Dossier not found in edit mode
  if (isEdit && selectedId && !existing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Info className="size-7" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Dossier introuvable
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Le dossier demandé n&apos;existe pas ou a été supprimé.
          </p>
        </div>
        <Button variant="outline" onClick={() => go("dossiers")}>
          <ArrowLeft className="size-4" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!clientId) errs.clientId = "Le client est obligatoire.";
    if (!bl.trim()) errs.bl = "Le numéro de BL est obligatoire.";
    if (!camion.trim()) errs.camion = "Le numéro de camion est obligatoire.";
    if (!nature.trim()) errs.nature = "La nature de la marchandise est obligatoire.";
    if (!date) errs.date = "La date est obligatoire.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleBack() {
    if (isDirty) {
      setConfirmLeaveOpen(true);
    } else {
      go("dossiers");
    }
  }

  function handleSave() {
    if (!validate()) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }
    const clientNom = clients.find((c) => c.id === clientId)?.nom ?? "";
    const input = {
      clientId,
      clientNom,
      nature,
      bl,
      camion,
      date,
      droitDouane: dN,
      fraisCircuit: fN,
      fraisPrestation: pN,
      montantInvesti: iN,
      statut,
      notes,
    };
    if (isEdit && selectedId) {
      updateDossier(selectedId, input);
      toast({ title: "Succès", description: "Dossier mis à jour." });
    } else {
      addDossier(input);
      toast({ title: "Succès", description: "Dossier créé avec succès." });
    }
    go("dossiers");
  }

  function handlePdf() {
    const clientNom = clients.find((c) => c.id === clientId)?.nom ?? "—";
    printHTML(
      `Dossier ${reference}`,
      `
      <h1>Dossier de transit</h1>
      <div class="subtitle">Référence : <strong>${reference}</strong> · Statut : ${statut}</div>
      <table>
        <tbody>
          <tr><th style="width:35%">Client</th><td>${clientNom}</td></tr>
          <tr><th>Nature de la marchandise</th><td>${nature || "—"}</td></tr>
          <tr><th>N° de BL</th><td>${bl || "—"}</td></tr>
          <tr><th>N° du camion</th><td>${camion || "—"}</td></tr>
          <tr><th>Date</th><td>${date ? formatDateShort(date) : "—"}</td></tr>
        </tbody>
      </table>
      <h2 style="margin-top:24px;font-size:14px;color:#1e40af">Montants (FCFA)</h2>
      <table>
        <tbody>
          <tr><th style="width:35%">Droit de douane</th><td class="num">${formatFCFA(dN, false)}</td></tr>
          <tr><th>Frais de circuit global</th><td class="num">${formatFCFA(fN, false)}</td></tr>
          <tr><th>Frais de prestation</th><td class="num">${formatFCFA(pN, false)}</td></tr>
          <tr><th>Montant investi</th><td class="num">${formatFCFA(iN, false)}</td></tr>
          <tr><th>Montant payé</th><td class="num">${formatFCFA(montantPaye, false)}</td></tr>
          <tr><th>Reste à payer</th><td class="num">${formatFCFA(reste, false)}</td></tr>
          <tr class="total-row">
            <th>Écart calculé</th>
            <td class="num" style="color:${ecart >= 0 ? "#059669" : "#dc2626"}">
              ${ecart >= 0 ? "+" : ""}${ecart.toLocaleString("fr-FR")}
            </td>
          </tr>
        </tbody>
      </table>
      ${notes ? `<h2 style="margin-top:24px;font-size:14px;color:#1e40af">Notes</h2><p style="font-size:13px;color:#475569;white-space:pre-wrap">${notes}</p>` : ""}
    `,
    );
    toast({
      title: "PDF généré",
      description: "Le document s'est ouvert dans une nouvelle fenêtre.",
    });
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        className="-ml-2 text-slate-500 hover:text-slate-900"
        onClick={handleBack}
      >
        <ArrowLeft className="size-4" />
        Retour à la liste
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isEdit ? `Dossier ${reference}` : "Nouveau dossier de transit"}
          </h1>
          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-500">
            {reference}
          </span>
          <DossierStatutBadge statut={statut} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBack}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <Save className="size-4" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Dirty warning banner */}
      {isDirty && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <AlertTriangle className="size-4 shrink-0 text-amber-500" />
          Modifications non enregistrées — pensez à sauvegarder.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left / main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Informations générales */}
          <Card className="border-border/80 p-5 shadow-sm">
            <SectionTitle
              icon={<FolderKanban className="size-4" />}
              tone="blue"
              title="Informations générales"
              description="Client et caractéristiques de la marchandise"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Client" required error={errors.clientId}>
                <Select
                  value={clientId}
                  onValueChange={(v) => {
                    setClientId(v);
                    setErrors((p) => ({ ...p, clientId: undefined }));
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      "h-10 w-full",
                      errors.clientId && "border-red-400",
                    )}
                    aria-label="Sélectionner un client"
                  >
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Nature de la marchandise"
                required
                error={errors.nature}
              >
                <Input
                  className={cn("h-10", errors.nature && "border-red-400")}
                  value={nature}
                  onChange={(e) => {
                    setNature(e.target.value);
                    setErrors((p) => ({ ...p, nature: undefined }));
                  }}
                  placeholder="Ex. Matériel électronique"
                />
              </Field>

              <Field label="N° de BL" required error={errors.bl}>
                <Input
                  className={cn("h-10", errors.bl && "border-red-400")}
                  value={bl}
                  onChange={(e) => {
                    setBl(e.target.value);
                    setErrors((p) => ({ ...p, bl: undefined }));
                  }}
                  placeholder="BL-0000"
                />
              </Field>

              <Field label="N° du camion" required error={errors.camion}>
                <Input
                  className={cn("h-10", errors.camion && "border-red-400")}
                  value={camion}
                  onChange={(e) => {
                    setCamion(e.target.value);
                    setErrors((p) => ({ ...p, camion: undefined }));
                  }}
                  placeholder="Ex. RJ 4521 KM"
                />
              </Field>

              <Field label="Date" required error={errors.date}>
                <Input
                  type="date"
                  className={cn("h-10", errors.date && "border-red-400")}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setErrors((p) => ({ ...p, date: undefined }));
                  }}
                />
              </Field>
            </div>
          </Card>

          {/* Montants */}
          <Card className="border-border/80 p-5 shadow-sm">
            <SectionTitle
              icon={<Wallet className="size-4" />}
              tone="emerald"
              title="Montants (FCFA)"
              description="Saisissez les montants — l'écart est calculé automatiquement"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AmountField
                label="Droit de douane"
                value={droitDouane}
                onChange={setDroitDouane}
              />
              <AmountField
                label="Frais de circuit global"
                value={fraisCircuit}
                onChange={setFraisCircuit}
              />
              <AmountField
                label="Frais de prestation"
                value={fraisPrestation}
                onChange={setFraisPrestation}
              />
              <AmountField
                label="Montant investi"
                value={montantInvesti}
                onChange={setMontantInvesti}
              />

              <div className="sm:col-span-2">
                <div
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-lg border px-4 py-3",
                    ecart >= 0
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700",
                  )}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
                      Écart calculé automatiquement
                    </div>
                    <div className="mt-0.5 text-xs opacity-70">
                      Prestation − (Droit de douane + Frais de circuit)
                    </div>
                  </div>
                  <div className="text-xl font-bold tabular-nums whitespace-nowrap">
                    {ecart >= 0 ? "+" : ""}
                    {formatFCFA(ecart)}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Suivi */}
          <Card className="border-border/80 p-5 shadow-sm">
            <SectionTitle
              icon={<ListChecks className="size-4" />}
              tone="indigo"
              title="Suivi"
              description="Statut du dossier et observations internes"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Statut">
                <Select
                  value={statut}
                  onValueChange={(v) => setStatut(v as DossierStatut)}
                >
                  <SelectTrigger
                    className="h-10 w-full"
                    aria-label="Sélectionner un statut"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Notes">
                  <Textarea
                    className="min-h-24"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observations, particularités du dossier…"
                  />
                </Field>
              </div>
            </div>
          </Card>
        </div>

        {/* Right summary column */}
        <div className="lg:col-span-1">
          <div className="space-y-4 lg:sticky lg:top-24">
            <Card className="border-border/80 p-5 shadow-sm">
              <SectionTitle
                icon={<Info className="size-4" />}
                tone="amber"
                title="Récapitulatif"
                description="Synthèse des montants saisis"
              />

              <div className="divide-y divide-border">
                <SummaryRow label="Frais prestation" value={formatFCFA(pN)} />
                <SummaryRow label="Montant investi" value={formatFCFA(iN)} />
                <SummaryRow
                  label="Reste à payer"
                  value={formatFCFA(reste)}
                  tone="amber"
                />
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <div className="text-xs text-slate-500">Écart</div>
                <div
                  className={cn(
                    "mt-1 text-2xl font-bold tabular-nums",
                    ecart >= 0 ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {ecart >= 0 ? "+" : ""}
                  {formatFCFA(ecart)}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {ecart >= 0
                    ? "Marge positive sur ce dossier."
                    : "Marge négative — à surveiller."}
                </p>
              </div>

              <Separator className="my-4" />

              <div className="flex flex-col gap-2">
                <Button className="w-full" onClick={handleSave}>
                  <Save className="size-4" />
                  Enregistrer le dossier
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handlePdf}
                >
                  <FileText className="size-4" />
                  Générer le PDF
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirm leave dialog */}
      <AlertDialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter sans sauvegarder ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non enregistrées. Si vous quittez
              maintenant, ces modifications seront perdues définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Rester sur le formulaire</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => go("dossiers")}
            >
              Quitter sans sauvegarder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

const toneMap: Record<"blue" | "emerald" | "amber" | "indigo", string> = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  indigo: "bg-indigo-50 text-indigo-600",
};

function SectionTitle({
  icon,
  title,
  description,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tone: "blue" | "emerald" | "amber" | "indigo";
}) {
  return (
    <div className="mb-4 flex items-start gap-2.5">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md",
          toneMap[tone],
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function AmountField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          className="h-10 pr-14 text-right tabular-nums"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          FCFA
        </span>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "amber";
}) {
  if (tone === "amber") {
    return (
      <div className="flex items-center justify-between py-3 first:pt-0">
        <span className="text-sm font-medium text-amber-700">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-amber-700">
          {value}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between py-3 first:pt-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-slate-900">
        {value}
      </span>
    </div>
  );
}
