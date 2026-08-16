"use client";

import * as React from "react";
import type { Facture, FactureInput } from "@/lib/store";
import { DEFAULT_TVA_RATE } from "@/lib/domain-types";

export function useFactureEditState(facture: Facture | undefined, isEditing: boolean) {
  const [editDate, setEditDate] = React.useState("");
  const [editDateEcheance, setEditDateEcheance] = React.useState("");
  const [editTvaOn, setEditTvaOn] = React.useState(true);
  const [editSocieteId, setEditSocieteId] = React.useState("");
  const [editNotes, setEditNotes] = React.useState("");
  const [editLignes, setEditLignes] = React.useState<
    Array<{ description: string; quantite: string; prixUnitaire: string }>
  >([]);

  // Resynchronisation en mode édition via derived-state-during-render (pas
  // un useEffect) — évite un flash d'une frame avec les données de la
  // précédente facture éditée avant que l'effet ne s'exécute.
  const editKey = isEditing ? (facture?.id ?? null) : null;
  const [prevEditKey, setPrevEditKey] = React.useState(editKey);
  if (editKey !== prevEditKey) {
    setPrevEditKey(editKey);
    if (editKey !== null && facture) {
      setEditDate(facture.date);
      setEditDateEcheance(facture.dateEcheance);
      setEditTvaOn(facture.tauxTVA > 0);
      setEditSocieteId(facture.societeId ?? "");
      setEditNotes(facture.notes);
      setEditLignes(
        facture.lignes.map((l) => ({
          description: l.description,
          quantite: String(l.quantite),
          prixUnitaire: String(l.prixUnitaire),
        })),
      );
    }
  }

  // Seules les lignes avec une description non vide sont réellement
  // persistées (voir buildFactureInput) — le total affiché pendant l'édition
  // doit être calculé sur ce même sous-ensemble, sinon une ligne "orpheline"
  // (quantité/prix renseignés mais description vide) gonfle le total affiché
  // sans jamais être sauvegardée, et le montant change silencieusement après
  // l'enregistrement.
  const editLignesValides = editLignes.filter((l) => l.description.trim());
  const editMontantHT = editLignesValides.reduce(
    (s, l) => s + (parseFloat(l.quantite) || 0) * (parseFloat(l.prixUnitaire) || 0),
    0,
  );
  const editTVA = editTvaOn ? DEFAULT_TVA_RATE : 0;
  const editTTC = editMontantHT + Math.round(editMontantHT * (editTVA / 100));

  function buildFactureInput(): FactureInput | null {
    if (!facture) return null;
    const lignes = editLignesValides.map((l) => ({
      description: l.description,
      quantite: parseFloat(l.quantite) || 1,
      prixUnitaire: parseFloat(l.prixUnitaire) || 0,
    }));
    // Une facture sans aucune ligne facturable n'a pas de sens métier (total
    // à 0 silencieux) — on bloque la sauvegarde plutôt que de laisser
    // l'appelant persister une facture vide.
    if (lignes.length === 0) return null;
    return {
      dossierId: facture.dossierId,
      clientId: facture.clientId,
      clientNom: facture.clientNom,
      societeId: editSocieteId || null,
      annexeId: facture.annexeId,
      date: editDate,
      dateEcheance: editDateEcheance,
      tauxTVA: editTvaOn ? DEFAULT_TVA_RATE : 0,
      notes: editNotes,
      lignes,
    };
  }

  return {
    editDate,
    setEditDate,
    editDateEcheance,
    setEditDateEcheance,
    editTvaOn,
    setEditTvaOn,
    editSocieteId,
    setEditSocieteId,
    editNotes,
    setEditNotes,
    editLignes,
    setEditLignes,
    editMontantHT,
    editTVA,
    editTTC,
    buildFactureInput,
  };
}
