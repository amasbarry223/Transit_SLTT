"use client";

import { useMemo, useState } from "react";
import type { Annexe, Dossier, DossierStatut, Societe } from "@/lib/domain-types";
import { calculerEcart, resteAPayer } from "@/lib/domain-types";
import { parseAmount } from "@/lib/format";
import { getNextTransition } from "@/components/sltt/dossier-transition-dialog";
import { resolveDossierReferencePrefix, resolveTransitSociete } from "@/lib/societe-brand";
import { computeDossierReference } from "@/lib/store/reference";

export const WIZARD_STEPS = [
  { id: 1, label: "Identité", hint: "Société, annexe, client, BL, camion, nature" },
  { id: 2, label: "Montants", hint: "Droits, frais, marge" },
  { id: 3, label: "Suivi", hint: "Dates, transport, notes" },
] as const;

export type DossierFormErrors = {
  societeId?: string;
  annexeId?: string;
  clientId?: string;
  nature?: string;
  bl?: string;
  camion?: string;
  date?: string;
};

const numStr = (n: number | undefined): string => (n != null ? n.toString() : "");

type UseDossierFormStateOptions = {
  existing?: Dossier;
  isEdit: boolean;
  dossierSeq: number;
  /** Dossiers existants — nécessaire pour prévisualiser la même séquence par annexe que `addDossier`. */
  dossiers: Dossier[];
  societes: Societe[];
  annexes: Annexe[];
  /** Défaut à la création (filtre nav ou société transit). */
  defaultSocieteId?: string;
  /** Défaut à la création — annexe active de l'utilisateur connecté. */
  defaultAnnexeId?: string;
};

export function useDossierFormState({
  existing,
  isEdit,
  dossierSeq,
  dossiers,
  societes,
  annexes,
  defaultSocieteId,
  defaultAnnexeId,
}: UseDossierFormStateOptions) {
  const initialSocieteId =
    existing?.societeId ??
    defaultSocieteId ??
    resolveTransitSociete(societes)?.id ??
    "";
  const initialAnnexeId =
    existing?.annexeId ?? defaultAnnexeId ?? (annexes.length === 1 ? annexes[0].id : "");

  const [societeId, setSocieteId] = useState<string>(initialSocieteId);
  const [annexeId, setAnnexeId] = useState<string>(initialAnnexeId);
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
  const [dateEcheance, setDateEcheance] = useState<string>(existing?.dateEcheance ?? "");
  const [dateDedouanement, setDateDedouanement] = useState<string>(existing?.dateDedouanement ?? "");
  const [modeTransport, setModeTransport] = useState<string>(existing?.modeTransport ?? "");
  const [noConteneur, setNoConteneur] = useState<string>(existing?.noConteneur ?? "");
  const [portEntree, setPortEntree] = useState<string>(existing?.portEntree ?? "");
  const [poidsTotal, setPoidsTotal] = useState<string>(
    existing?.poidsTotal ? String(existing.poidsTotal) : "",
  );
  const [notes, setNotes] = useState<string>(existing?.notes ?? "");
  const [errors, setErrors] = useState<DossierFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const statut = isEdit && existing ? existing.statut : draftStatut;
  const setStatut = setDraftStatut;
  const nextTransition = existing ? getNextTransition(existing.statut) : null;
  const showWizard = !isEdit;
  const showStep = (step: number) => isEdit || !showWizard || wizardStep === step;

  const customsDutyAmount = parseAmount(droitDouane);
  const circuitFeesAmount = parseAmount(fraisCircuit);
  const serviceFeesAmount = parseAmount(fraisPrestation);
  const totalImportAmount = customsDutyAmount + circuitFeesAmount + serviceFeesAmount;
  const montantPaye = existing?.montantPaye ?? 0;

  const ecart = useMemo(
    () =>
      calculerEcart({
        droitDouane: customsDutyAmount,
        fraisCircuit: circuitFeesAmount,
        fraisPrestation: serviceFeesAmount,
        montantInvesti: totalImportAmount,
      }),
    [serviceFeesAmount, customsDutyAmount, circuitFeesAmount, totalImportAmount],
  );
  const reste = useMemo(
    () => resteAPayer({ montantInvesti: totalImportAmount, montantPaye }),
    [totalImportAmount, montantPaye],
  );

  const selectedSociete = societes.find((item) => item.id === societeId);
  const selectedAnnexe = annexes.find((item) => item.id === annexeId);
  const referencePrefix =
    selectedSociete?.nom?.trim() || resolveDossierReferencePrefix(societes);
  const reference =
    existing?.reference ??
    computeDossierReference(
      selectedSociete,
      selectedAnnexe,
      referencePrefix,
      dossiers.map((d) => d.reference),
      dossierSeq,
    ).reference;

  const isDirty = useMemo(() => {
    if (!isEdit) {
      return !!(
        societeId ||
        annexeId ||
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
      societeId !== existing.societeId ||
      annexeId !== existing.annexeId ||
      clientId !== existing.clientId ||
      nature !== existing.nature ||
      bl !== existing.bl ||
      camion !== existing.camion ||
      date !== existing.date ||
      parseAmount(droitDouane) !== existing.droitDouane ||
      parseAmount(fraisCircuit) !== existing.fraisCircuit ||
      parseAmount(fraisPrestation) !== existing.fraisPrestation ||
      statut !== existing.statut ||
      notes !== (existing.notes ?? "") ||
      dateEcheance !== (existing.dateEcheance ?? "") ||
      dateDedouanement !== (existing.dateDedouanement ?? "") ||
      modeTransport !== (existing.modeTransport ?? "") ||
      noConteneur !== (existing.noConteneur ?? "") ||
      portEntree !== (existing.portEntree ?? "") ||
      poidsTotal !== (existing.poidsTotal ? String(existing.poidsTotal) : "")
    );
  }, [
    isEdit,
    existing,
    societeId,
    annexeId,
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
    dateEcheance,
    dateDedouanement,
    modeTransport,
    noConteneur,
    portEntree,
    poidsTotal,
  ]);

  function validateField(field: keyof DossierFormErrors, value: string) {
    const msg: Record<string, string> = {
      societeId: "La société est obligatoire.",
      annexeId: "L'annexe est obligatoire.",
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
    const errs: DossierFormErrors = {};
    if (!societeId) errs.societeId = "La société est obligatoire.";
    if (!annexeId) errs.annexeId = "L'annexe est obligatoire.";
    if (!clientId) errs.clientId = "Le client est obligatoire.";
    if (!bl.trim()) errs.bl = "Le numéro de BL est obligatoire.";
    if (!camion.trim()) errs.camion = "Le numéro de camion est obligatoire.";
    if (!nature.trim()) errs.nature = "La nature de la marchandise est obligatoire.";
    if (!date) errs.date = "La date est obligatoire.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep1(): boolean {
    const next: DossierFormErrors = {};
    if (!societeId) next.societeId = "La société est obligatoire.";
    if (!annexeId) next.annexeId = "L'annexe est obligatoire.";
    if (!clientId) next.clientId = "Le client est obligatoire.";
    if (!nature.trim()) next.nature = "La nature est obligatoire.";
    if (!bl.trim()) next.bl = "Le n° de BL est obligatoire.";
    if (!camion.trim()) next.camion = "Le n° de camion est obligatoire.";
    if (!date) next.date = "La date est obligatoire.";
    setErrors((p) => ({ ...p, ...next }));
    setTouched({
      societeId: true,
      annexeId: true,
      clientId: true,
      nature: true,
      bl: true,
      camion: true,
      date: true,
    });
    return Object.keys(next).length === 0;
  }

  function goNextStep() {
    if (wizardStep === 1 && !validateStep1()) return;
    setWizardStep((s) => Math.min(3, s + 1));
  }

  function goPrevStep() {
    setWizardStep((s) => Math.max(1, s - 1));
  }

  function buildSaveInput(clientNom: string) {
    return {
      societeId,
      annexeId,
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
      droitDouane: customsDutyAmount,
      fraisCircuit: circuitFeesAmount,
      fraisPrestation: serviceFeesAmount,
      montantInvesti: totalImportAmount,
      statut,
      notes,
    };
  }

  return {
    societeId,
    setSocieteId,
    annexeId,
    setAnnexeId,
    clientId,
    setClientId,
    nature,
    setNature,
    bl,
    setBl,
    camion,
    setCamion,
    date,
    setDate,
    droitDouane,
    setDroitDouane,
    fraisCircuit,
    setFraisCircuit,
    fraisPrestation,
    setFraisPrestation,
    statut,
    setStatut,
    transitionOpen,
    setTransitionOpen,
    nextTransition,
    dateEcheance,
    setDateEcheance,
    dateDedouanement,
    setDateDedouanement,
    modeTransport,
    setModeTransport,
    noConteneur,
    setNoConteneur,
    portEntree,
    setPortEntree,
    poidsTotal,
    setPoidsTotal,
    notes,
    setNotes,
    errors,
    touched,
    setTouched,
    confirmLeaveOpen,
    setConfirmLeaveOpen,
    wizardStep,
    showWizard,
    showStep,
    customsDutyAmount,
    circuitFeesAmount,
    serviceFeesAmount,
    totalImportAmount,
    montantPaye,
    ecart,
    reste,
    reference,
    isDirty,
    validateField,
    validate,
    validateStep1,
    goNextStep,
    goPrevStep,
    buildSaveInput,
  };
}
