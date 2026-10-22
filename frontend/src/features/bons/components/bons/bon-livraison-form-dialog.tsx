"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Package, Truck } from "lucide-react";
import type { BonLivraison, BonLivraisonInput, BonLivraisonLigne, BonSortie } from "@/lib/domain-types";
import { useStore } from "@/lib/store";
import { formatDateShort } from "@/lib/format";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess } from "@/shared/utils/toast-helpers";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

/** Valeur sentinelle du Select : Radix interdit une valeur "" sur un item. */
const AUCUN_TRANSPORTEUR = "__aucun__";

type FormLigne = BonLivraisonLigne & { quantiteSaisie: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Création : le bon de sortie validé d'origine. */
  bonSortie?: BonSortie | null;
  /** Modification : le bon de livraison existant (statut "En cours"). */
  editing?: BonLivraison | null;
  onSaved?: (bon: BonLivraison) => void;
};

function lignesFromBonSortie(bon: BonSortie): BonLivraisonLigne[] {
  if (bon.lignes && bon.lignes.length > 0) {
    return bon.lignes.map((l) => ({ marchandise: l.marchandise, quantite: l.quantite, unite: l.unite || bon.unite }));
  }
  return [{ marchandise: bon.marchandise, quantite: bon.quantite, unite: bon.unite }];
}

export function BonLivraisonFormDialog({ open, onOpenChange, bonSortie, editing, onSaved }: Props) {
  const { toast } = useToast();
  const addBonLivraison = useStore((s) => s.addBonLivraison);
  const updateBonLivraison = useStore((s) => s.updateBonLivraison);
  const transporteurs = useStore((s) => s.transporteurs);
  const clients = useStore((s) => s.clients);
  const bons = useStore((s) => s.bons);

  // Bon de sortie de référence (création : fourni ; édition : retrouvé) —
  // sa quantité plafonne le total livrable, comme côté serveur.
  const source = bonSortie ?? (editing ? bons.find((b) => b.id === editing.bonSortieId) : undefined);
  const maxQuantite = source?.quantite ?? Infinity;
  const annexeId = editing?.annexeId ?? source?.annexeId;
  const clientNom = editing?.clientNom ?? source?.clientNom ?? "";

  const [date, setDate] = useState("");
  const [lignes, setLignes] = useState<FormLigne[]>([]);
  const [transporteurId, setTransporteurId] = useState(AUCUN_TRANSPORTEUR);
  const [transporteurNom, setTransporteurNom] = useState("");
  const [immatriculation, setImmatriculation] = useState("");
  const [chauffeurNom, setChauffeurNom] = useState("");
  const [chauffeurTelephone, setChauffeurTelephone] = useState("");
  const [adresseLivraison, setAdresseLivraison] = useState("");
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);

  // Pré-remplissage à l'ouverture (même pattern que BonFormDialog : état
  // dérivé du changement de `open`, sans effet).
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      const base = editing?.lignes ?? (bonSortie ? lignesFromBonSortie(bonSortie) : []);
      setDate(editing?.date || new Date().toISOString().slice(0, 10));
      setLignes(base.map((l) => ({ ...l, quantiteSaisie: String(l.quantite) })));
      setTransporteurId(editing?.transporteurId ?? AUCUN_TRANSPORTEUR);
      setTransporteurNom(editing?.transporteurNom ?? "");
      setImmatriculation(editing?.immatriculation ?? "");
      setChauffeurNom(editing?.chauffeurNom ?? "");
      setChauffeurTelephone(editing?.chauffeurTelephone ?? "");
      const client = bonSortie ? clients.find((c) => c.id === bonSortie.clientId) : undefined;
      setAdresseLivraison(editing?.adresseLivraison ?? client?.adresse ?? "");
      setObservations(editing?.observations ?? "");
      setSaving(false);
    }
  }

  const transporteursAnnexe = useMemo(
    () => transporteurs.filter((t) => !t.annexeId || t.annexeId === annexeId),
    [transporteurs, annexeId],
  );

  const totalSaisi = lignes.reduce((acc, l) => acc + (Number(l.quantiteSaisie) || 0), 0);
  const ligneInvalide = lignes.some((l) => !(Number(l.quantiteSaisie) > 0));
  const depasse = totalSaisi > maxQuantite + 1e-9;
  const erreur = ligneInvalide
    ? "Chaque article doit avoir une quantité supérieure à 0."
    : depasse
      ? `Le total livré (${totalSaisi}) dépasse la quantité du bon de sortie (${maxQuantite}).`
      : null;

  function handleTransporteurChange(id: string) {
    setTransporteurId(id);
    const t = transporteurs.find((x) => x.id === id);
    // Pré-remplit depuis la fiche transporteur ; reste modifiable (camion
    // de remplacement, autre chauffeur).
    setTransporteurNom(t?.nom ?? "");
    setImmatriculation(t?.immatriculation ?? "");
    if (t?.contact && !chauffeurNom) setChauffeurNom(t.contact);
    if (t?.telephone && !chauffeurTelephone) setChauffeurTelephone(t.telephone);
  }

  async function handleSubmit() {
    if (saving || erreur) return;
    const payload: BonLivraisonInput = {
      date,
      lignes: lignes.map(({ marchandise, unite, quantiteSaisie }) => ({ marchandise, unite, quantite: Number(quantiteSaisie) })),
      transporteurId: transporteurId === AUCUN_TRANSPORTEUR ? "" : transporteurId,
      transporteurNom,
      immatriculation,
      chauffeurNom,
      chauffeurTelephone,
      adresseLivraison,
      observations,
    };
    setSaving(true);
    try {
      const saved = editing
        ? await updateBonLivraison(editing.id, payload)
        : await addBonLivraison(bonSortie!.id, payload);
      toastSuccess(toast, {
        title: editing ? "Bon de livraison modifié" : "Bon de livraison créé",
        description: `${saved.reference} — ${saved.clientNom}`,
      });
      onOpenChange(false);
      onSaved?.(saved);
    } catch (err) {
      toastError(toast, err, { title: "Impossible d'enregistrer le bon de livraison", fallback: "Réessayez." });
      setSaving(false);
    }
  }

  const reference = editing?.reference ?? "LIV-…";
  const bonSortieRef = editing?.bonSortieReference ?? source?.reference;

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-3">
            <DialogTitle>{editing ? `Modifier le bon de livraison` : "Nouveau bon de livraison"}</DialogTitle>
            <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
              {reference}
            </Badge>
          </div>
          <DialogDescription>
            {editing
              ? "Complétez ou corrigez le transport tant que la livraison n'est pas confirmée."
              : "Client et articles repris du bon de sortie. Le numéro est attribué à l'enregistrement."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Origine — lecture seule */}
          <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Client</p>
              <p className="truncate text-sm font-semibold text-foreground">{clientNom || "—"}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Bon de sortie</p>
              <p className="truncate font-mono text-sm text-foreground">{bonSortieRef ?? "—"}</p>
            </div>
            <div className="min-w-0">
              <Label htmlFor="bl-date" className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Date de livraison
              </Label>
              <Input id="bl-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-9" disabled={saving} />
            </div>
          </div>

          {/* Articles */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Package className="size-4 text-muted-foreground" aria-hidden /> Articles livrés
            </h3>
            <div className="overflow-hidden rounded-xl border border-border/60">
              {lignes.map((l, i) => (
                <div key={`${l.marchandise}-${i}`} className="flex items-center gap-3 border-b border-border/50 px-3 py-2 last:border-b-0">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{l.marchandise}</span>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={l.quantiteSaisie}
                    onChange={(e) =>
                      setLignes((prev) => prev.map((x, j) => (j === i ? { ...x, quantiteSaisie: e.target.value } : x)))
                    }
                    className="h-8 w-28 text-right font-mono tabular-nums"
                    aria-label={`Quantité livrée — ${l.marchandise}`}
                    disabled={saving}
                  />
                  <span className="w-14 text-xs text-muted-foreground">{l.unite}</span>
                </div>
              ))}
            </div>
            {Number.isFinite(maxQuantite) && (
              <p className="text-[11px] text-muted-foreground">
                Quantité sortie du stock : {maxQuantite} — une livraison partielle est possible.
              </p>
            )}
          </section>

          {/* Transport */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Truck className="size-4 text-muted-foreground" aria-hidden /> Transport
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="bl-transporteur" className="text-xs">Transporteur</Label>
                <Select value={transporteurId} onValueChange={handleTransporteurChange} disabled={saving}>
                  <SelectTrigger id="bl-transporteur" className="h-9 w-full">
                    <SelectValue placeholder="Choisir un transporteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AUCUN_TRANSPORTEUR}>Saisie libre / aucun</SelectItem>
                    {transporteursAnnexe.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nom} — {t.immatriculation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bl-transporteur-nom" className="text-xs">Nom affiché sur le bon</Label>
                <Input id="bl-transporteur-nom" value={transporteurNom} onChange={(e) => setTransporteurNom(e.target.value)} placeholder="Ex : Transports Koné" className="h-9" disabled={saving} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bl-immat" className="text-xs">Immatriculation du camion</Label>
                <Input id="bl-immat" value={immatriculation} onChange={(e) => setImmatriculation(e.target.value)} placeholder="Ex : AB-1234-MD" className="h-9 font-mono" disabled={saving} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bl-chauffeur" className="text-xs">Chauffeur</Label>
                <Input id="bl-chauffeur" value={chauffeurNom} onChange={(e) => setChauffeurNom(e.target.value)} placeholder="Nom du chauffeur" className="h-9" disabled={saving} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bl-tel" className="text-xs">Téléphone du chauffeur</Label>
                <Input id="bl-tel" type="tel" value={chauffeurTelephone} onChange={(e) => setChauffeurTelephone(e.target.value)} placeholder="+223 …" className="h-9" disabled={saving} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bl-adresse" className="text-xs">Adresse de livraison</Label>
                <Input id="bl-adresse" value={adresseLivraison} onChange={(e) => setAdresseLivraison(e.target.value)} placeholder="Quartier, ville" className="h-9" disabled={saving} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bl-obs" className="text-xs">Observations</Label>
              <Textarea id="bl-obs" value={observations} onChange={(e) => setObservations(e.target.value)} rows={2} placeholder="Réserves, consignes de livraison…" disabled={saving} />
            </div>
          </section>

          {erreur && (
            <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" aria-hidden /> {erreur}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <p className="hidden text-[11px] text-muted-foreground sm:block">
            {source ? `Bon de sortie du ${formatDateShort(source.date)}` : ""}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={saving || !!erreur || lignes.length === 0}>
              <Truck className="size-4" />
              {saving ? "Enregistrement…" : editing ? "Enregistrer" : "Créer et imprimer"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
