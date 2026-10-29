"use client";

import { useState } from "react";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { formatDateShort } from "@/lib/format";
import { BRAND } from "@/lib/brand-colors";
import { printHTML, htmlEscape } from "@/lib/export";
import { dossierMontantsHtml } from "@/lib/export/print-modules/dossier-montants";
import { resolveSlttBrand } from "@/lib/societe-brand";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/shared/utils/toast-helpers";
import { usePermission } from "@/shared/hooks/use-permission";

import type { useDossierFormState } from "./use-dossier-form-state";

type DossierFormState = ReturnType<typeof useDossierFormState>;

type UseDossierFormActionsOptions = {
  form: DossierFormState;
  isEdit: boolean;
  selectedId: string | null;
};

export function useDossierFormActions({
  form,
  isEdit,
  selectedId,
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
    // valide sur collision (bumpTrailingSeq) au lieu d'échouer.
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
    // Même garde-fou que dossier-detail-screen.tsx : sans ça, un clic
    // pendant le chargement initial des sociétés déclenchait quand même
    // un toast "PDF généré" juste après l'alerte interne d'échec de
    // printHTML — message contradictoire qui laisse croire que ça a marché.
    const brand = resolveSlttBrand(societes);
    if (!brand) {
      toastWarning(toast, {
        title: "Chargement en cours",
        description: "Les informations de la société ne sont pas encore prêtes — réessayez dans un instant.",
      });
      return;
    }
    const clientNom = clients.find((c) => c.id === form.clientId)?.nom ?? "—";
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
      ${dossierMontantsHtml({
        finances: form.finances,
        depenses: form.depensesSaisies,
        paiements: form.paiementsSaisis,
      })}
      ${form.notes ? `<h2 style="margin-top:24px;font-size:14px;color:${BRAND.navy}">Notes</h2><p style="font-size:13px;color:#45556b;white-space:pre-wrap">${htmlEscape(form.notes)}</p>` : ""}
    `,
      brand,
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
