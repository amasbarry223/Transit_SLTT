"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Building2, ImagePlus, Loader2, MapPin, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import type { Annexe, AnnexeInput, Societe, SocieteInput } from "@/lib/domain-types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const LOGO_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const LOGO_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function SocieteCard({
  societe,
  onSave,
  onUploadLogo,
}: {
  societe: Societe;
  onSave: (id: string, input: SocieteInput) => Promise<void>;
  onUploadLogo: (id: string, file: File) => Promise<string>;
}) {
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [values, setValues] = useState<SocieteInput>({
    nom: societe.nom,
    logoUrl: societe.logoUrl ?? "",
    adresse: societe.adresse ?? "",
    telephone: societe.telephone ?? "",
    rccm: societe.rccm ?? "",
    nif: societe.nif ?? "",
    signataireDg: societe.signataireDg ?? "",
    signatairePdg: societe.signatairePdg ?? "",
    afficherNomAvecLogo: societe.afficherNomAvecLogo,
  });
  const [saving, setSaving] = useState(false);
  // Instantané pris à l'ouverture du formulaire — sert à détecter qu'un autre
  // administrateur a modifié cette société pendant que ce formulaire était
  // ouvert, pour ne pas écraser ses changements en silence.
  const [baseline, setBaseline] = useState(societe);
  const hasConflict = JSON.stringify(societe) !== JSON.stringify(baseline);

  function set<K extends keyof SocieteInput>(key: K, value: SocieteInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de resélectionner le même fichier après une erreur
    if (!file) return;
    if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
      toastWarning(toast, { title: "Format non supporté", description: "PNG, JPEG, WebP ou SVG uniquement." });
      return;
    }
    if (file.size > LOGO_MAX_SIZE_BYTES) {
      toastWarning(toast, { title: "Fichier trop volumineux", description: "5 Mo maximum." });
      return;
    }
    setUploadingLogo(true);
    try {
      const url = await onUploadLogo(societe.id, file);
      set("logoUrl", url);
      toastSuccess(toast, { title: "Logo envoyé", description: "Cliquez sur Enregistrer pour appliquer le changement." });
    } catch (err: unknown) {
      toastError(toast, err, { title: "Impossible d'envoyer le logo", fallback: "Impossible d'envoyer le logo." });
    } finally {
      setUploadingLogo(false);
    }
  }

  function reloadFromLatest() {
    setValues({
      nom: societe.nom,
      logoUrl: societe.logoUrl ?? "",
      adresse: societe.adresse ?? "",
      telephone: societe.telephone ?? "",
      rccm: societe.rccm ?? "",
      nif: societe.nif ?? "",
      signataireDg: societe.signataireDg ?? "",
      signatairePdg: societe.signatairePdg ?? "",
      afficherNomAvecLogo: societe.afficherNomAvecLogo,
    });
    setBaseline(societe);
    toastSuccess(toast, { title: "Dernières valeurs chargées", description: "Vos modifications précédentes ont été remplacées." });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hasConflict) {
      toastWarning(toast, { title: "Conflit de modification", description: "Cette société a été modifiée entre-temps. Rechargez les dernières valeurs avant d'enregistrer." });
      return;
    }
    const trimmedNom = values.nom.trim();
    if (!trimmedNom) {
      toastWarning(toast, { title: "Le nom de la société est requis" });
      return;
    }
    setSaving(true);
    try {
      const input = {
        nom: trimmedNom,
        logoUrl: values.logoUrl?.trim() || undefined,
        adresse: values.adresse?.trim() || undefined,
        telephone: values.telephone?.trim() || undefined,
        rccm: values.rccm?.trim() || undefined,
        nif: values.nif?.trim() || undefined,
        signataireDg: values.signataireDg?.trim() || undefined,
        signatairePdg: values.signatairePdg?.trim() || undefined,
        afficherNomAvecLogo: values.afficherNomAvecLogo ?? true,
      };
      await onSave(societe.id, input);
      // Le prochain rendu recevra le `societe` mis à jour depuis le store —
      // on aligne la référence tout de suite pour ne pas déclencher un faux
      // conflit avec notre propre sauvegarde qui vient de réussir.
      setBaseline((b) => ({ ...b, ...input }));
      toastSuccess(toast, { title: "Société mise à jour", description: trimmedNom });
    } catch (err: unknown) {
      toastError(toast, err, { title: "Impossible d'enregistrer la société", fallback: "Impossible d'enregistrer la société." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6 shadow-sm border-border/80">
      <form onSubmit={handleSubmit} className="space-y-5">
        {hasConflict && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            <span className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              Cette société a été modifiée par quelqu&apos;un d&apos;autre depuis l&apos;ouverture de ce formulaire.
            </span>
            <Button type="button" size="sm" variant="outline" onClick={reloadFromLatest}>
              Charger les dernières valeurs
            </Button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{societe.nom}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ces informations apparaissent sur tous les documents imprimés (devis, factures, bons…).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nom</Label>
            <Input value={values.nom} onChange={(e) => set("nom", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Adresse</Label>
            <Input
              value={values.adresse}
              onChange={(e) => set("adresse", e.target.value)}
              placeholder="Ex. Quartier, rue, porte"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Téléphone</Label>
            <Input value={values.telephone} onChange={(e) => set("telephone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Logo</Label>
            <input
              ref={logoInputRef}
              type="file"
              accept={LOGO_ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={handleLogoFile}
            />
            <div className="flex items-center gap-3">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-slate-50 dark:bg-slate-900">
                {uploadingLogo ? (
                  <Loader2 className="size-5 animate-spin text-slate-400" />
                ) : values.logoUrl ? (
                  <img
                    src={values.logoUrl}
                    alt="Aperçu du logo de la société"
                    width={64}
                    height={64}
                    className="size-full object-contain"
                  />
                ) : (
                  <ImagePlus className="size-5 text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <ImagePlus className="size-3.5" />
                    {values.logoUrl ? "Changer le logo" : "Ajouter un logo"}
                  </Button>
                  {values.logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                      disabled={uploadingLogo}
                      onClick={() => set("logoUrl", "")}
                    >
                      <X className="size-3.5" />
                      Retirer
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">PNG, JPEG, WebP ou SVG · 5 Mo max.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5 sm:col-span-2">
            <div>
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Répéter le nom à côté du logo
              </Label>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                À désactiver si le logo contient déjà le nom en toutes lettres — sinon il apparaît en double
                sur les devis, factures, contrats et bons imprimés.
              </p>
            </div>
            <Switch
              checked={values.afficherNomAvecLogo ?? true}
              onCheckedChange={(v) => set("afficherNomAvecLogo", v)}
              aria-label="Répéter le nom à côté du logo"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">RCCM</Label>
            <Input value={values.rccm} onChange={(e) => set("rccm", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">NIF</Label>
            <Input value={values.nif} onChange={(e) => set("nif", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Signataire — Directeur Général
            </Label>
            <Input value={values.signataireDg} onChange={(e) => set("signataireDg", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Signataire — PDG
            </Label>
            <Input value={values.signatairePdg} onChange={(e) => set("signatairePdg", e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function AnnexeCard({
  annexe,
  onSave,
}: {
  annexe: Annexe;
  onSave: (id: string, input: AnnexeInput) => Promise<void>;
}) {
  const { toast } = useToast();
  const [values, setValues] = useState<AnnexeInput>({
    villeSiege: annexe.villeSiege,
    adresse: annexe.adresse ?? "",
    telephone: annexe.telephone ?? "",
    rccm: annexe.rccm ?? "",
    nif: annexe.nif ?? "",
  });
  const [saving, setSaving] = useState(false);
  // Même logique de détection de conflit que SocieteCard — évite qu'un admin
  // écrase en silence la mise à jour d'un autre pendant que ce formulaire est ouvert.
  const [baseline, setBaseline] = useState(annexe);
  const hasConflict = JSON.stringify(annexe) !== JSON.stringify(baseline);

  function set<K extends keyof AnnexeInput>(key: K, value: AnnexeInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function reloadFromLatest() {
    setValues({
      villeSiege: annexe.villeSiege,
      adresse: annexe.adresse ?? "",
      telephone: annexe.telephone ?? "",
      rccm: annexe.rccm ?? "",
      nif: annexe.nif ?? "",
    });
    setBaseline(annexe);
    toastSuccess(toast, { title: "Dernières valeurs chargées", description: "Vos modifications précédentes ont été remplacées." });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hasConflict) {
      toastWarning(toast, { title: "Conflit de modification", description: "Cette annexe a été modifiée entre-temps. Rechargez les dernières valeurs avant d'enregistrer." });
      return;
    }
    const trimmedVille = values.villeSiege?.trim();
    if (!trimmedVille) {
      toastWarning(toast, { title: "La ville de siège est requise" });
      return;
    }
    setSaving(true);
    try {
      const input: AnnexeInput = {
        villeSiege: trimmedVille,
        adresse: values.adresse?.trim() || undefined,
        telephone: values.telephone?.trim() || undefined,
        rccm: values.rccm?.trim() || undefined,
        nif: values.nif?.trim() || undefined,
      };
      await onSave(annexe.id, input);
      setBaseline((b) => ({ ...b, ...input }));
      toastSuccess(toast, { title: "Annexe mise à jour", description: annexe.nom });
    } catch (err: unknown) {
      toastError(toast, err, { title: "Impossible d'enregistrer l'annexe", fallback: "Impossible d'enregistrer l'annexe." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6 shadow-sm border-border/80">
      <form onSubmit={handleSubmit} className="space-y-5">
        {hasConflict && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            <span className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              Cette annexe a été modifiée par quelqu&apos;un d&apos;autre depuis l&apos;ouverture de ce formulaire.
            </span>
            <Button type="button" size="sm" variant="outline" onClick={reloadFromLatest}>
              Charger les dernières valeurs
            </Button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <MapPin className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{annexe.nom}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Identité légale locale — imprimée sur les factures émises depuis cette annexe (le nom du logo/société reste celui de la société liée au dossier).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ville de siège</Label>
            <Input value={values.villeSiege} onChange={(e) => set("villeSiege", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Téléphone</Label>
            <Input value={values.telephone} onChange={(e) => set("telephone", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Adresse</Label>
            <Input
              value={values.adresse}
              onChange={(e) => set("adresse", e.target.value)}
              placeholder="Ex. Quartier, rue, porte"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">RCCM</Label>
            <Input
              value={values.rccm}
              onChange={(e) => set("rccm", e.target.value)}
              placeholder="Ex. CI.ABJ.2026 B.1234"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">NIF</Label>
            <Input value={values.nif} onChange={(e) => set("nif", e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function SocietesTab() {
  const societes = useStore((s) => s.societes);
  const updateSociete = useStore((s) => s.updateSociete);
  const uploadSocieteLogo = useStore((s) => s.uploadSocieteLogo);
  const annexes = useStore((s) => s.annexes);
  const updateAnnexe = useStore((s) => s.updateAnnexe);

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Identité légale de chaque société — utilisée automatiquement sur les devis, factures,
          bons de sortie et autres documents imprimés. Modifier ces champs ne nécessite plus
          d&apos;intervention technique.
        </p>
        {societes.map((societe) => (
          <SocieteCard
            key={societe.id}
            societe={societe}
            onSave={updateSociete}
            onUploadLogo={uploadSocieteLogo}
          />
        ))}
      </div>

      <div className="space-y-5 border-t border-border/60 pt-8">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Annexes</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Coordonnées et identité légale (RCCM/NIF) de chaque implantation physique (Mali,
            Côte d&apos;Ivoire) — indépendante de la société. C&apos;est l&apos;annexe qui
            détermine l&apos;en-tête légal imprimé sur une facture, quelle que soit la société
            du dossier facturé. Le RCCM/NIF peut rester vide en attendant l&apos;immatriculation
            officielle de l&apos;annexe.
          </p>
        </div>
        {annexes.map((annexe) => (
          <AnnexeCard key={annexe.id} annexe={annexe} onSave={updateAnnexe} />
        ))}
      </div>
    </div>
  );
}
