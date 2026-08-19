"use client";

import { useState } from "react";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { BRAND } from "@/lib/brand-colors";
import { printHTML, htmlEscape } from "@/lib/export";
import { resolveSlttBrand, resolveDossierCoutLabels } from "@/lib/societe-brand";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { usePermission } from "@/hooks/use-permission";

import type { useDossierFormState } from "./use-dossier-form-state";

type DossierFormState = ReturnType<typeof useDossierFormState>;

type UseDossierFormActionsOptions = {
  form: DossierFormState;
  isEdit: boolean;
  selectedId: string | null;
  annexeCode: string | undefined;
};

export function useDossierFormActions({
  form,
  isEdit,
  selectedId,
  annexeCode,
}: UseDossierFormActionsOptions) {
  const { go } = useNav();
  const { toast } = useToast();
  const canWrite = usePermission("dossiers:write");
  const [saving, setSaving] = useState(false);

  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const addDossier = useStore((s) => s.addDossier);
  const updateDossier = useStore((s) => s.updateDossier);

  function handleFieldBlur(field: keyof typeof form.errors) {
    form.setTouched((p) => ({ ...p, [field]: true }));
    const values: Record<keyof typeof form.errors, string> = {
      societeId: form.societeId,
      annexeId: form.annexeId,
      clientId: form.clientId,
      nature: form.nature,
      bl: form.bl,
      camion: form.camion,
      date: form.date,
    };
    form.validateField(field, values[field]);
  }

  function handleBack() {
    if (form.isDirty) {
      form.setConfirmLeaveOpen(true);
    } else {
      go("dossiers");
    }
  }

  async function handleSave() {
    // Un double-clic (ou un réseau lent) avant la résolution du premier appel
    // créerait deux dossiers distincts — addDossier régénère une référence
    // valide sur collision (insertWithReferenceRetry) au lieu d'échouer.
    if (saving) return;
    if (!canWrite) {
      toastWarning(toast, { title: "Action non autorisée", description: "Vous n'avez pas la permission d'enregistrer un dossier." });
      return;
    }
    if (!form.validate()) {
      toastWarning(toast, { title: "Champs manquants", description: "Veuillez remplir tous les champs obligatoires." });
      return;
    }
    const clientNom = clients.find((c) => c.id === form.clientId)?.nom ?? "";
    const input = form.buildSaveInput(clientNom);
    setSaving(true);
    try {
      if (isEdit && selectedId) {
        await updateDossier(selectedId, input);
        toastSuccess(toast, { title: "Succès", description: "Dossier mis à jour." });
      } else {
        await addDossier(input);
        toastSuccess(toast, { title: "Succès", description: "Dossier créé avec succès." });
      }
      go("dossiers");
    } catch (err: unknown) {
      toastError(toast, err, { title: "Impossible d'enregistrer le dossier", fallback: "Impossible d'enregistrer le dossier." });
    } finally {
      setSaving(false);
    }
  }

  function handlePdf() {
    const clientNom = clients.find((c) => c.id === form.clientId)?.nom ?? "—";
    const coutLabels = resolveDossierCoutLabels(annexeCode);
    printHTML(
      `Dossier ${form.reference}`,
      `
      <h1>Dossier de transit</h1>
      <div class="subtitle">Référence : <strong>${htmlEscape(form.reference)}</strong> · Statut : ${htmlEscape(form.statut)}</div>
      <table>
        <tbody>
          <tr><th style="width:35%">Client</th><td>${htmlEscape(clientNom)}</td></tr>
          <tr><th>Nature de la marchandise</th><td>${htmlEscape(form.nature) || "—"}</td></tr>
          <tr><th>N° de BL</th><td>${htmlEscape(form.bl) || "—"}</td></tr>
          <tr><th>N° du camion</th><td>${htmlEscape(form.camion) || "—"}</td></tr>
          <tr><th>Date</th><td>${form.date ? formatDateShort(form.date) : "—"}</td></tr>
        </tbody>
      </table>
      <h2 style="margin-top:24px;font-size:14px;color:${BRAND.navy}">Montants (FCFA)</h2>
      <table>
        <tbody>
          <tr><th style="width:35%">${htmlEscape(coutLabels.droitDouane)}</th><td class="num">${formatFCFA(form.customsDutyAmount, false)}</td></tr>
          <tr><th>${htmlEscape(coutLabels.fraisCircuit)}</th><td class="num">${formatFCFA(form.circuitFeesAmount, false)}</td></tr>
          <tr><th>${htmlEscape(coutLabels.fraisPrestation)}</th><td class="num">${formatFCFA(form.serviceFeesAmount, false)}</td></tr>
          <tr><th>Montant investi</th><td class="num">${formatFCFA(form.totalImportAmount, false)}</td></tr>
          <tr><th>Montant payé</th><td class="num">${formatFCFA(form.montantPaye, false)}</td></tr>
          <tr><th>Reste à payer</th><td class="num">${formatFCFA(form.reste, false)}</td></tr>
          <tr class="total-row">
            <th>Marge calculée</th>
            <td class="num" style="color:${form.ecart >= 0 ? "#16853f" : "#dc2626"}">
              ${form.ecart >= 0 ? "+" : ""}${form.ecart.toLocaleString("fr-FR")}
            </td>
          </tr>
        </tbody>
      </table>
      ${form.notes ? `<h2 style="margin-top:24px;font-size:14px;color:${BRAND.navy}">Notes</h2><p style="font-size:13px;color:#45556b;white-space:pre-wrap">${htmlEscape(form.notes)}</p>` : ""}
    `,
      resolveSlttBrand(societes),
    );
    toastSuccess(toast, { title: "PDF généré", description: "Le document s'est ouvert dans une nouvelle fenêtre.", });
  }

  return {
    canWrite,
    saving,
    handleFieldBlur,
    handleBack,
    handleSave,
    handlePdf,
  };
}
