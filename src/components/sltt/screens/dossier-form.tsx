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
  Truck,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import { useStore, type DossierStatut } from "@/lib/store";
import { QuickClientButton } from "@/components/sltt/quick-client-dialog";
import { formatFCFA, formatDateShort, parseAmount } from "@/lib/format";
import { printHTML, htmlEscape } from "@/lib/export";
import { DossierStatutBadge } from "@/components/sltt/status-badge";
import { useToast } from "@/hooks/use-toast";
import {
  TransitionDialog,
  getNextTransition,
  TRANSITION_META,
} from "@/components/sltt/dossier-transition-dialog";

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
  const [draftStatut, setDraftStatut] = useState<DossierStatut>(existing?.statut ?? "En cours");
  const [transitionOpen, setTransitionOpen] = useState(false);

  // En édition, le statut ne se change plus qu'en passant par la transition
  // guidée (TransitionDialog) — elle seule crée l'écriture de paiement
  // correspondante — donc on reflète toujours le statut live du store plutôt
  // qu'une copie locale modifiable.
  const statut = isEdit && existing ? existing.statut : draftStatut;
  const setStatut = setDraftStatut;

  const nextTransition = existing ? getNextTransition(existing.statut) : null;
  const [dateEcheance, setDateEcheance] = useState<string>(existing?.dateEcheance ?? "");
  const [dateDedouanement, setDateDedouanement] = useState<string>(existing?.dateDedouanement ?? "");
  const [modeTransport, setModeTransport] = useState<string>(existing?.modeTransport ?? "");
  const [noConteneur, setNoConteneur] = useState<string>(existing?.noConteneur ?? "");
  const [portEntree, setPortEntree] = useState<string>(existing?.portEntree ?? "");
  const [poidsTotal, setPoidsTotal] = useState<string>(existing?.poidsTotal ? String(existing.poidsTotal) : "");
  const [notes, setNotes] = useState<string>(existing?.notes ?? "");

  // Validation errors
  const [errors, setErrors] = useState<{
    clientId?: string;
    nature?: string;
    bl?: string;
    camion?: string;
    date?: string;
  }>({});

  // UX-06: track which fields have been touched for on-change validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Unsaved changes guard
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  const WIZARD_STEPS = [
    { id: 1, label: "Identité", hint: "Client, BL, camion, nature" },
    { id: 2, label: "Montants", hint: "Droits, frais, marge" },
    { id: 3, label: "Suivi", hint: "Dates, transport, notes" },
  ] as const;
  const [wizardStep, setWizardStep] = useState(1);
  const showWizard = !isEdit;
  const showStep = (step: number) => !showWizard || wizardStep === step;

  const validateStep1 = (): boolean => {
    const next: typeof errors = {};
    if (!clientId) next.clientId = "Le client est obligatoire.";
    if (!nature.trim()) next.nature = "La nature est obligatoire.";
    if (!bl.trim()) next.bl = "Le n° de BL est obligatoire.";
    if (!camion.trim()) next.camion = "Le n° de camion est obligatoire.";
    if (!date) next.date = "La date est obligatoire.";
    setErrors((p) => ({ ...p, ...next }));
    setTouched({
      clientId: true,
      nature: true,
      bl: true,
      camion: true,
      date: true,
    });
    return Object.keys(next).length === 0;
  };

  const goNextStep = () => {
    if (wizardStep === 1 && !validateStep1()) return;
    setWizardStep((s) => Math.min(3, s + 1));
  };
  const goPrevStep = () => setWizardStep((s) => Math.max(1, s - 1));

  // Derived values
  const dN = parseAmount(droitDouane);
  const fN = parseAmount(fraisCircuit);
  const pN = parseAmount(fraisPrestation);
  const iN = dN + fN + pN;
  const montantPaye = existing?.montantPaye ?? 0;

  const ecart = useMemo(() => pN - (dN + fN), [pN, dN, fN]);
  const reste = useMemo(() => Math.max(0, iN - montantPaye), [iN, montantPaye]);

  const reference =
    existing?.reference ??
    `SLTT-TR-${new Date().getFullYear()}-${String(dossierSeq).padStart(4, "0")}`;

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
        fraisPrestation
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
    statut,
    notes,
  ]);

  // Dossier not found in edit mode
  if (isEdit && selectedId && !existing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex size-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
          <Info className="size-7" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Dossier introuvable
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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

  function validateField(field: keyof typeof errors, value: string) {
    const msg: Record<string, string> = {
      clientId: "Le client est obligatoire.",
      bl: "Le numéro de BL est obligatoire.",
      camion: "Le numéro de camion est obligatoire.",
      nature: "La nature de la marchandise est obligatoire.",
      date: "La date est obligatoire.",
    };
    setErrors((prev) => ({
      ...prev,
      [field]: value.trim() ? undefined : msg[field],
    }));
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
      dateEcheance: dateEcheance || undefined,
      dateDedouanement: dateDedouanement || undefined,
      modeTransport: (modeTransport as "Maritime" | "Aérien" | "Routier" | "Ferroviaire") || undefined,
      noConteneur: noConteneur || undefined,
      portEntree: portEntree || undefined,
      poidsTotal: poidsTotal ? parseFloat(poidsTotal) : undefined,
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
      <div class="subtitle">Référence : <strong>${htmlEscape(reference)}</strong> · Statut : ${htmlEscape(statut)}</div>
      <table>
        <tbody>
          <tr><th style="width:35%">Client</th><td>${htmlEscape(clientNom)}</td></tr>
          <tr><th>Nature de la marchandise</th><td>${htmlEscape(nature) || "—"}</td></tr>
          <tr><th>N° de BL</th><td>${htmlEscape(bl) || "—"}</td></tr>
          <tr><th>N° du camion</th><td>${htmlEscape(camion) || "—"}</td></tr>
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
            <th>Marge calculée</th>
            <td class="num" style="color:${ecart >= 0 ? "#059669" : "#dc2626"}">
              ${ecart >= 0 ? "+" : ""}${ecart.toLocaleString("fr-FR")}
            </td>
          </tr>
        </tbody>
      </table>
      ${notes ? `<h2 style="margin-top:24px;font-size:14px;color:#1e40af">Notes</h2><p style="font-size:13px;color:#475569;white-space:pre-wrap">${htmlEscape(notes)}</p>` : ""}
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
        className="-ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        onClick={handleBack}
      >
        <ArrowLeft className="size-4" />
        Retour à la liste
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {isEdit ? `Dossier ${reference}` : "Nouveau dossier de transit"}
          </h1>
          <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 font-mono text-xs text-slate-500 dark:text-slate-400">
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
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/40 px-4 py-2.5 text-sm text-amber-800">
          <AlertTriangle className="size-4 shrink-0 text-amber-500" />
          Modifications non enregistrées — pensez à sauvegarder.
        </div>
      )}

      {showWizard && (
        <Card className="border-border/80 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Étape {wizardStep} sur {WIZARD_STEPS.length} —{" "}
              {WIZARD_STEPS[wizardStep - 1]?.label}
            </span>
            <span className="hidden sm:inline">
              {WIZARD_STEPS[wizardStep - 1]?.hint}
            </span>
          </div>
          <div className="flex gap-2">
            {WIZARD_STEPS.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  step.id <= wizardStep ? "bg-primary" : "bg-slate-200 dark:bg-slate-700",
                )}
              />
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left / main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Étape 1 — Informations générales */}
          {showStep(1) && (
          <Card className="border-border/80 p-5 shadow-sm">
            <SectionTitle
              icon={<FolderKanban className="size-4" />}
              tone="blue"
              title="Informations générales"
              description="Client et caractéristiques de la marchandise"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Client" required error={errors.clientId}>
                <div className="flex gap-2">
                  <Select
                    value={clientId}
                    onValueChange={(v) => {
                      setClientId(v);
                      setTouched((p) => ({ ...p, clientId: true }));
                      validateField("clientId", v);
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
                  <QuickClientButton
                    onCreated={(id) => {
                      setClientId(id);
                      setTouched((p) => ({ ...p, clientId: true }));
                      validateField("clientId", id);
                    }}
                  />
                </div>
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
                    if (touched["nature"]) validateField("nature", e.target.value);
                  }}
                  onBlur={() => {
                    setTouched((p) => ({ ...p, nature: true }));
                    validateField("nature", nature);
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
                    if (touched["bl"]) validateField("bl", e.target.value);
                  }}
                  onBlur={() => {
                    setTouched((p) => ({ ...p, bl: true }));
                    validateField("bl", bl);
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
                    if (touched["camion"]) validateField("camion", e.target.value);
                  }}
                  onBlur={() => {
                    setTouched((p) => ({ ...p, camion: true }));
                    validateField("camion", camion);
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
                    if (touched["date"]) validateField("date", e.target.value);
                  }}
                  onBlur={() => {
                    setTouched((p) => ({ ...p, date: true }));
                    validateField("date", date);
                  }}
                />
              </Field>
            </div>
          </Card>
          )}

          {/* Étape 3 — Transport & Logistique */}
          {showStep(3) && (
          <CollapsibleSection
            icon={<Truck className="size-4" />}
            tone="indigo"
            title="Transport & Logistique"
            description="Mode de transport, conteneur et point d'entrée"
            defaultOpen={isEdit}
            badge={isEdit ? undefined : "Optionnel"}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Mode de transport">
                <Select value={modeTransport} onValueChange={setModeTransport}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Sélectionner…" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Maritime", "Aérien", "Routier", "Ferroviaire"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Port / Frontière d'entrée">
                <Input className="h-10" value={portEntree} onChange={(e) => setPortEntree(e.target.value)} placeholder="Ex. Port de Dakar" />
              </Field>
              {modeTransport === "Maritime" && (
                <Field label="N° de conteneur">
                  <Input className="h-10 font-mono" value={noConteneur} onChange={(e) => setNoConteneur(e.target.value)} placeholder="Ex. MSCU4521789" />
                </Field>
              )}
              <Field label="Poids total (kg)">
                <Input type="number" className="h-10" value={poidsTotal} onChange={(e) => setPoidsTotal(e.target.value)} placeholder="0" />
              </Field>
            </div>
          </CollapsibleSection>
          )}

          {/* Étape 2 — Montants */}
          {showStep(2) && (
          <Card className="border-border/80 p-5 shadow-sm">
            <SectionTitle
              icon={<Wallet className="size-4" />}
              tone="emerald"
              title="Montants (FCFA)"
              description="Saisissez les montants — la marge est calculée automatiquement"
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
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Montant investi (calculé)</label>
                <div className="flex h-10 items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 tabular-nums text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {formatFCFA(iN)}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Droit de douane + Frais de circuit + Frais de prestation</p>
              </div>

              <div className="sm:col-span-2">
                <div
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-lg border px-4 py-3",
                    ecart >= 0
                      ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700"
                      : "border-red-200 bg-red-50 dark:bg-red-950/40 text-red-700",
                  )}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
                      Marge calculée automatiquement
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
          )}

          {/* Étape 3 — Suivi */}
          {showStep(3) && (
          <CollapsibleSection
            icon={<ListChecks className="size-4" />}
            tone="indigo"
            title="Suivi"
            description="Statut du dossier et observations internes"
            defaultOpen={isEdit}
            badge={isEdit ? undefined : "Optionnel"}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Statut">
                {isEdit ? (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <DossierStatutBadge statut={statut} />
                    {nextTransition ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setTransitionOpen(true)}
                      >
                        <ArrowRight className="size-3.5" />
                        {TRANSITION_META[nextTransition].actionLabel}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">Statut final — aucune transition possible</span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <DossierStatutBadge statut="En cours" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Tout nouveau dossier démarre à « En cours ». Les transitions se font ensuite depuis la fiche dossier.
                    </span>
                  </div>
                )}
                {isEdit && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Le statut se fait uniquement avancer via une transition guidée, qui enregistre le paiement associé.
                  </p>
                )}
              </Field>

              <Field label="Date d'échéance">
                <Input
                  type="date"
                  className="h-10"
                  value={dateEcheance}
                  onChange={(e) => setDateEcheance(e.target.value)}
                />
              </Field>

              <Field label="Date de dédouanement">
                <Input
                  type="date"
                  className="h-10"
                  value={dateDedouanement}
                  onChange={(e) => setDateDedouanement(e.target.value)}
                />
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
          </CollapsibleSection>
          )}

          {showWizard && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={goPrevStep}
                disabled={wizardStep === 1}
              >
                Précédent
              </Button>
              {wizardStep < 3 ? (
                <Button type="button" onClick={goNextStep}>
                  Suivant
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSave}>
                  <Save className="size-4" />
                  Enregistrer le dossier
                </Button>
              )}
            </div>
          )}
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
                <div className="text-xs text-slate-500 dark:text-slate-400">Marge</div>
                <div
                  className={cn(
                    "mt-1 text-2xl font-bold tabular-nums",
                    ecart >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                  )}
                >
                  {ecart >= 0 ? "+" : ""}
                  {formatFCFA(ecart)}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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

      {/* Transition guidée du statut (édition uniquement) */}
      {isEdit && existing && nextTransition && (
        <TransitionDialog
          dossier={existing}
          transition={nextTransition}
          open={transitionOpen}
          onOpenChange={setTransitionOpen}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

const toneMap: Record<"blue" | "emerald" | "amber" | "indigo", string> = {
  blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
  emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
  indigo: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400",
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
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Section repliable — sert la divulgation progressive : à la création d'un
 * dossier, les sections hors cahier des charges (Transport, Suivi) sont
 * repliées par défaut pour que le formulaire "premier jour" ne montre que les
 * champs essentiels. En édition, tout est déplié.
 */
function CollapsibleSection({
  icon,
  title,
  description,
  tone,
  defaultOpen,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tone: "blue" | "emerald" | "amber" | "indigo";
  defaultOpen: boolean;
  badge?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border-border/80 p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-2.5 text-left"
      >
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", toneMap[tone])}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            {badge && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-slate-400 transition-transform dark:text-slate-500",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </Card>
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
      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Label>
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
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">
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
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}
