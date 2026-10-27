"use client";

import { useMemo, useState } from "react";
import type { Annexe, Dossier, DossierStatut, Societe } from "@/lib/domain-types";
import {
  calculerFinancesDossier,
  type CategorieDepense,
  type DepenseDossier,
  type ModePaiementDossier,
  type PaiementDossier,
} from "@/lib/domain/dossier-finances";
import { parseAmount } from "@/lib/format";
import { resolveDossierReferencePrefix } from "@/lib/societe-brand";
import { computeDossierReference } from "@/lib/store/reference";

export const WIZARD_STEPS = [
  { id: 1, label: "Identité", hint: "Annexe, client, BL, camion, nature" },
  { id: 2, label: "Montants", hint: "Contrat, paiements, dépenses" },
  { id: 3, label: "Transport", hint: "Mode, conteneur, poids, colis" },
] as const;

export type DossierFormErrors = {
  annexeId?: string;
  clientId?: string;
  nature?: string;
  bl?: string;
  camion?: string;
  date?: string;
};

const numStr = (n: number | undefined): string => (n != null ? n.toString() : "");
const today = () => new Date().toISOString().slice(0, 10);
let rowSeq = 0;
const rowKey = () => `row-${++rowSeq}`;

/** Paiement en cours de saisie (montant en texte, comme les autres champs). */
export type PaiementForm = {
  key: string;
  id?: string;
  date: string;
  montant: string;
  mode: ModePaiementDossier;
  reference: string;
};

/** Dépense en cours de saisie. */
export type DepenseForm = {
  key: string;
  id?: string;
  date: string;
  nature: string;
  categorie: CategorieDepense;
  montant: string;
};

const emptyPaiement = (): PaiementForm => ({
  key: rowKey(),
  date: today(),
  montant: "",
  mode: "ESPECES",
  reference: "",
});

const emptyDepense = (): DepenseForm => ({
  key: rowKey(),
  date: today(),
  nature: "",
  categorie: "TRANSPORT",
  montant: "",
});

function initialPaiements(existing?: Dossier): PaiementForm[] {
  return (existing?.paiements ?? []).map((p) => ({
    ...p,
    key: rowKey(),
    montant: numStr(p.montant),
    reference: p.reference ?? "",
  }));
}

function initialDepenses(existing?: Dossier): DepenseForm[] {
  return (existing?.depenses ?? []).map((d) => ({ ...d, key: rowKey(), montant: numStr(d.montant) }));
}

/** Une ligne vide (ni montant ni texte) n'est pas envoyée. */
const isBlankPaiement = (p: PaiementForm) => parseAmount(p.montant) === 0 && !(p.reference || "").trim();
const isBlankDepense = (d: DepenseForm) => parseAmount(d.montant) === 0 && !(d.nature || "").trim();

function toPaiements(rows: PaiementForm[]): PaiementDossier[] {
  return rows
    .filter((p) => !isBlankPaiement(p))
    .map(({ key: _key, montant, reference, date, ...rest }) => ({
      ...rest,
      date: date || today(),
      montant: Math.max(0, Math.round(parseAmount(montant))),
      reference: (reference || "").trim() || undefined,
    }));
}

function toDepenses(rows: DepenseForm[]): DepenseDossier[] {
  return rows
    .filter((d) => !isBlankDepense(d))
    .map(({ key: _key, montant, nature, date, ...rest }) => ({
      ...rest,
      date: date || today(),
      nature: (nature || "").trim() || "Dépense",
      montant: Math.max(0, Math.round(parseAmount(montant))),
    }));
}

/** Signature stable des lignes pour la détection de modifications. */
const signature = (rows: object[]) => JSON.stringify(rows);

type UseDossierFormStateOptions = {
  existing?: Dossier;
  isEdit: boolean;
  dossierSeq: number;
  /** Dossiers existants — nécessaire pour prévisualiser la même séquence par annexe que `addDossier`. */
  dossiers: Dossier[];
  societes: Societe[];
  annexes: Annexe[];
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
  defaultAnnexeId,
}: UseDossierFormStateOptions) {
  const initialAnnexeId =
    existing?.annexeId ?? defaultAnnexeId ?? (annexes.length === 1 ? annexes[0].id : "");

  const [annexeId, setAnnexeId] = useState<string>(initialAnnexeId);
  const [clientId, setClientId] = useState<string>(existing?.clientId ?? "");
  const [nature, setNature] = useState<string>(existing?.nature ?? "");
  const [bl, setBl] = useState<string>(existing?.bl ?? "");
  const [camion, setCamion] = useState<string>(existing?.camion ?? "");
  const [date, setDate] = useState<string>(existing?.date ?? "");
  const [totalContrat, setTotalContrat] = useState<string>(numStr(existing?.totalContrat));
  const [paiements, setPaiements] = useState<PaiementForm[]>(() => initialPaiements(existing));
  const [depenses, setDepenses] = useState<DepenseForm[]>(() => initialDepenses(existing));
  const [draftStatut, setDraftStatut] = useState<DossierStatut>(existing?.statut ?? "En cours");
  const [dateEcheance, setDateEcheance] = useState<string>(existing?.dateEcheance ?? "");
  const [dateDedouanement, setDateDedouanement] = useState<string>(existing?.dateDedouanement ?? "");
  const [modeTransport, setModeTransport] = useState<string>(existing?.modeTransport ?? "");
  const [noConteneur, setNoConteneur] = useState<string>(existing?.noConteneur ?? "");
  const [portEntree, setPortEntree] = useState<string>(existing?.portEntree ?? "");
  const [poidsTotal, setPoidsTotal] = useState<string>(
    existing?.poidsTotal ? String(existing.poidsTotal) : "",
  );
  const [nombreColis, setNombreColis] = useState<string>(numStr(existing?.nombreColis));
  const [notes, setNotes] = useState<string>(existing?.notes ?? "");
  const [errors, setErrors] = useState<DossierFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const statut = isEdit && existing ? existing.statut : draftStatut;
  const setStatut = setDraftStatut;
  const showWizard = !isEdit;
  const showStep = (step: number) => isEdit || !showWizard || wizardStep === step;

  const totalContratAmount = Math.max(0, Math.round(parseAmount(totalContrat)));
  const paiementsSaisis = useMemo(() => toPaiements(paiements), [paiements]);
  const depensesSaisies = useMemo(() => toDepenses(depenses), [depenses]);

  // Aperçu instantané — le serveur refait ce calcul à l'enregistrement.
  const finances = useMemo(
    () =>
      calculerFinancesDossier({
        totalContrat: totalContratAmount,
        paiements: paiementsSaisis,
        depenses: depensesSaisies,
      }),
    [totalContratAmount, paiementsSaisis, depensesSaisies],
  );

  const updatePaiement = (key: string, patch: Partial<PaiementForm>) =>
    setPaiements((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addPaiement = () => setPaiements((rows) => [...rows, emptyPaiement()]);
  const removePaiement = (key: string) => setPaiements((rows) => rows.filter((r) => r.key !== key));

  const updateDepense = (key: string, patch: Partial<DepenseForm>) =>
    setDepenses((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addDepense = () => setDepenses((rows) => [...rows, emptyDepense()]);
  const removeDepense = (key: string) => setDepenses((rows) => rows.filter((r) => r.key !== key));

  const selectedAnnexe = annexes.find((item) => item.id === annexeId);
  // resolveDossierReferencePrefix() passe par resolveTransitSociete() — un
  // societes[0] brut pouvait renvoyer une société différente de l'identité
  // transit si plusieurs lignes existaient. computeDossierReference()
  // n'utilise de toute façon jamais son 1er paramètre (typé `unknown`).
  const referencePrefix = resolveDossierReferencePrefix(societes);
  const reference =
    existing?.reference ??
    computeDossierReference(
      undefined,
      selectedAnnexe,
      referencePrefix,
      dossiers.map((d) => d.reference),
      dossierSeq,
    ).reference;

  const isDirty = useMemo(() => {
    if (!isEdit) {
      return !!(
        annexeId ||
        clientId ||
        nature.trim() ||
        bl.trim() ||
        camion.trim() ||
        date ||
        totalContrat ||
        paiementsSaisis.length ||
        depensesSaisies.length
      );
    }
    if (!existing) return false;
    return (
      annexeId !== existing.annexeId ||
      clientId !== existing.clientId ||
      nature !== existing.nature ||
      bl !== existing.bl ||
      camion !== existing.camion ||
      date !== existing.date ||
      parseAmount(totalContrat) !== existing.totalContrat ||
      signature(paiementsSaisis) !== signature(toPaiements(initialPaiements(existing))) ||
      signature(depensesSaisies) !== signature(toDepenses(initialDepenses(existing))) ||
      statut !== existing.statut ||
      notes !== (existing.notes ?? "") ||
      dateEcheance !== (existing.dateEcheance ?? "") ||
      dateDedouanement !== (existing.dateDedouanement ?? "") ||
      modeTransport !== (existing.modeTransport ?? "") ||
      noConteneur !== (existing.noConteneur ?? "") ||
      portEntree !== (existing.portEntree ?? "") ||
      poidsTotal !== (existing.poidsTotal ? String(existing.poidsTotal) : "") ||
      nombreColis !== numStr(existing.nombreColis)
    );
  }, [
    isEdit,
    existing,
    annexeId,
    clientId,
    nature,
    bl,
    camion,
    date,
    totalContrat,
    paiementsSaisis,
    depensesSaisies,
    statut,
    notes,
    dateEcheance,
    dateDedouanement,
    modeTransport,
    noConteneur,
    portEntree,
    poidsTotal,
    nombreColis,
  ]);

  function validateField(field: keyof DossierFormErrors, value: string) {
    const msg: Record<string, string> = {
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
    if (!annexeId) next.annexeId = "L'annexe est obligatoire.";
    if (!clientId) next.clientId = "Le client est obligatoire.";
    if (!nature.trim()) next.nature = "La nature est obligatoire.";
    if (!bl.trim()) next.bl = "Le n° de BL est obligatoire.";
    if (!camion.trim()) next.camion = "Le n° de camion est obligatoire.";
    if (!date) next.date = "La date est obligatoire.";
    setErrors((p) => ({ ...p, ...next }));
    setTouched({
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
    const colis = parseInt(nombreColis, 10);
    return {
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
      poidsTotal: poidsTotal ? Math.max(0, parseFloat(poidsTotal) || 0) : undefined,
      nombreColis: Number.isFinite(colis) && colis >= 0 ? colis : undefined,
      // Seules les lignes partent au serveur, qui calcule lui-même payé,
      // reste et bénéfice.
      totalContrat: totalContratAmount,
      paiements: paiementsSaisis,
      depenses: depensesSaisies,
      statut,
      notes,
    };
  }

  return {
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
    totalContrat,
    setTotalContrat,
    paiements,
    updatePaiement,
    addPaiement,
    removePaiement,
    depenses,
    updateDepense,
    addDepense,
    removeDepense,
    statut,
    setStatut,
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
    nombreColis,
    setNombreColis,
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
    finances,
    paiementsSaisis,
    depensesSaisies,
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
