"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Archive as ArchiveIcon,
  Building2,
  FileStack,
  FileText,
  Plus,
  Eye,
  Receipt,
  Trash2,
  Upload,
  Wallet,
} from "lucide-react";
import { useStore, type TypeDocument } from "@/lib/store";
import { formatDateShort } from "@/lib/format";
import { formatFileSize, getFileIconMeta } from "@/lib/file-utils";
import { matchesQuery } from "@/lib/search-filter";
import { deriveClientIdFromRattachement } from "@/lib/archives-utils";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { usePermission, useHasRole } from "@/hooks/use-permission";
import { PageHeader } from "@/components/sltt/page-header";
import { EmptyState } from "@/components/sltt/empty-state";
import { ListFilters, type FilterChip } from "@/components/sltt/list-filters";
import { ResponsiveDataList, type ResponsiveColumn } from "@/components/sltt/responsive-data-list";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { MetaTabsList, type MetaTabItem } from "@/components/sltt/meta-tabs-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";

const FOLDER_ICON_SRC = "/icons/folder-docs.png";

const TYPE_DOC_BADGE: Record<TypeDocument, string> = {
  BL: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-200",
  DAU: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  Facture:
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-200",
  Reçu: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  Contrat:
    "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200",
  Autre:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200",
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 Mo — aligné sur la limite du bucket `archives`
const TYPES_DOCUMENT: TypeDocument[] = ["BL", "DAU", "Facture", "Reçu", "Contrat", "Autre"];
type RattachementKind = "dossier" | "facture" | "depense" | "libre";
type ArchiveTab = "all" | RattachementKind;

/* ------------------------------------------------------------------ */
/* Agrégation en lecture — archives + dossier_fichiers + contrat_fichiers */
/* ------------------------------------------------------------------ */

type DocSource = "archive" | "dossier" | "contrat";

interface UnifiedDoc {
  key: string;
  sourceId: string;
  source: DocSource;
  category: RattachementKind;
  nom: string;
  typeDocument: TypeDocument;
  taille: number;
  mimeType: string;
  storagePath?: string;
  dataUrl?: string;
  clientNom: string;
  societeId?: string;
  societeNom: string;
  rattachement: string;
  date: string;
  canDelete: boolean;
}

const TAB_META: (MetaTabItem<ArchiveTab> & {
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  accent: string;
})[] = [
  {
    key: "all",
    label: "Tous",
    shortLabel: "Tous",
    description: "Documents scannés — dossiers, factures, dépenses et documents libres.",
    emptyTitle: "Aucun document archivé",
    emptyDescription: "Archivez un scan (upload ou capture caméra) pour le retrouver ici.",
    icon: FileStack,
    accent: "text-slate-700 dark:text-slate-200",
    iconWrap:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
    badge:
      "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
  },
  {
    key: "dossier",
    label: "Dossiers",
    shortLabel: "Dossiers",
    description: "Documents rattachés à un dossier de transit (BL, DAU, pièces jointes).",
    emptyTitle: "Aucun document de dossier",
    emptyDescription: "Les scans liés à un dossier apparaîtront dans cet onglet.",
    icon: ArchiveIcon,
    renderIcon: () => (
      <Image
        src={FOLDER_ICON_SRC}
        alt=""
        width={28}
        height={28}
        className="size-7 object-contain"
        unoptimized
      />
    ),
    accent: "text-blue-700 dark:text-blue-300",
    iconWrap:
      "bg-blue-50 dark:bg-blue-950/40 group-data-[state=inactive]:bg-slate-200/70 dark:group-data-[state=inactive]:bg-slate-700",
    badge:
      "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
  },
  {
    key: "facture",
    label: "Factures",
    shortLabel: "Factures",
    description: "Justificatifs et scans associés à une facture client.",
    emptyTitle: "Aucun document de facture",
    emptyDescription: "Archivez un scan en le rattachant à une facture pour le filtrer ici.",
    icon: Receipt,
    accent: "text-violet-700 dark:text-violet-300",
    iconWrap:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
    badge:
      "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200 group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
  },
  {
    key: "depense",
    label: "Dépenses",
    shortLabel: "Dépenses",
    description: "Reçus et pièces justificatives rattachés à une dépense.",
    emptyTitle: "Aucun document de dépense",
    emptyDescription: "Les reçus liés à une dépense s’affichent dans cet onglet.",
    icon: Wallet,
    accent: "text-amber-700 dark:text-amber-300",
    iconWrap:
      "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
    badge:
      "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
  },
  {
    key: "libre",
    label: "Libres",
    shortLabel: "Libres",
    description: "Documents hors rattachement — libres ou issus d’un contrat.",
    emptyTitle: "Aucun document libre",
    emptyDescription: "Archivez un document sans dossier, facture ni dépense pour le voir ici.",
    icon: FileText,
    accent: "text-emerald-700 dark:text-emerald-300",
    iconWrap:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
  },
];

function useUnifiedDocs(): UnifiedDoc[] {
  const archives = useStore((s) => s.archives);
  const fichiers = useStore((s) => s.fichiers);
  const contratFichiers = useStore((s) => s.contratFichiers);
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const dossiers = useStore((s) => s.dossiers);
  const factures = useStore((s) => s.factures);
  const depenses = useStore((s) => s.depenses);
  const contrats = useStore((s) => s.contrats);

  return useMemo(() => {
    const clientNom = (id?: string) => clients.find((c) => c.id === id)?.nom ?? "";
    const societeNom = (id?: string) => societes.find((s) => s.id === id)?.nom ?? "";

    const fromArchives: UnifiedDoc[] = archives.map((a) => {
      let category: RattachementKind = "libre";
      let rattachement = "Libre";
      let nomClient = clientNom(a.clientId);
      let societeId = a.societeId;
      if (a.dossierId) {
        category = "dossier";
        const d = dossiers.find((x) => x.id === a.dossierId);
        rattachement = d ? `Dossier ${d.reference}` : "Dossier";
        nomClient = d?.clientNom ?? nomClient;
      } else if (a.factureId) {
        category = "facture";
        const f = factures.find((x) => x.id === a.factureId);
        rattachement = f ? `Facture ${f.numero}` : "Facture";
        nomClient = f?.clientNom ?? nomClient;
        societeId = societeId ?? f?.societeId;
      } else if (a.depenseId) {
        category = "depense";
        const dep = depenses.find((x) => x.id === a.depenseId);
        const contrat = dep ? contrats.find((c) => c.id === dep.contratId) : undefined;
        rattachement = dep ? `Dépense — ${dep.libelle}` : "Dépense";
        nomClient = contrat?.clientNom ?? nomClient;
        societeId = societeId ?? dep?.societeId;
      }
      return {
        key: `archive-${a.id}`,
        sourceId: a.id,
        source: "archive",
        category,
        nom: a.nom,
        typeDocument: a.typeDocument,
        taille: a.taille,
        mimeType: a.type,
        storagePath: a.storagePath,
        clientNom: nomClient,
        societeId,
        societeNom: societeNom(societeId),
        rattachement,
        date: a.createdAt,
        canDelete: true,
      };
    });

    const fromDossiers: UnifiedDoc[] = fichiers.map((f) => {
      const d = dossiers.find((x) => x.id === f.dossierId);
      return {
        key: `dossier-${f.id}`,
        sourceId: f.id,
        source: "dossier",
        category: "dossier" as const,
        nom: f.nom,
        typeDocument: "Autre" as TypeDocument,
        taille: f.taille,
        mimeType: f.type,
        dataUrl: f.dataUrl,
        clientNom: d?.clientNom ?? "",
        societeNom: "",
        rattachement: d ? `Dossier ${d.reference}` : "Dossier",
        date: f.dateUpload,
        canDelete: true,
      };
    });

    const fromContrats: UnifiedDoc[] = contratFichiers.map((f) => {
      const c = contrats.find((x) => x.id === f.contratId);
      return {
        key: `contrat-${f.id}`,
        sourceId: f.id,
        source: "contrat",
        category: "libre" as const,
        nom: f.nom,
        typeDocument: "Contrat" as TypeDocument,
        taille: f.taille,
        mimeType: f.type,
        storagePath: f.storagePath,
        clientNom: c?.clientNom ?? "",
        societeId: c?.societeId,
        societeNom: societeNom(c?.societeId),
        rattachement: c ? `Contrat ${c.reference}` : "Contrat",
        date: f.dateUpload,
        canDelete: true,
      };
    });

    return [...fromArchives, ...fromDossiers, ...fromContrats].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [archives, fichiers, contratFichiers, clients, societes, dossiers, factures, depenses, contrats]);
}

/* ------------------------------------------------------------------ */
/* Dialog « + Archiver un document »                                   */
/* ------------------------------------------------------------------ */

function ArchiveUploadDialog({
  open,
  onOpenChange,
  initialKind = "libre",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialKind?: RattachementKind;
}) {
  const { toast } = useToast();
  const addArchive = useStore((s) => s.addArchive);
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const dossiers = useStore((s) => s.dossiers);
  const factures = useStore((s) => s.factures);
  const depenses = useStore((s) => s.depenses);
  const contrats = useStore((s) => s.contrats);

  const inputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [typeDocument, setTypeDocument] = useState<TypeDocument>("Autre");
  const [rattachementKind, setRattachementKind] = useState<RattachementKind>(initialKind);
  const [rattachementId, setRattachementId] = useState("");
  const [clientId, setClientId] = useState("");
  const [societeId, setSocieteId] = useState("");
  const [saving, setSaving] = useState(false);

  function reset(kind: RattachementKind = initialKind) {
    setFile(null);
    setTypeDocument("Autre");
    setRattachementKind(kind);
    setRattachementId("");
    setClientId("");
    setSocieteId("");
  }

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      reset(initialKind);
      // Une seule société active : pas d'ambiguïté, on la présélectionne
      // plutôt que de forcer une sélection manuelle systématique.
      if (societes.length === 1) setSocieteId(societes[0].id);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: "Fichier trop volumineux", description: `${f.name} dépasse 50 Mo.`, variant: "destructive" });
      return;
    }
    setFile(f);
  }

  async function handleSubmit() {
    if (!file) {
      toast({ title: "Sélectionnez un fichier", variant: "destructive" });
      return;
    }
    if (!societeId) {
      toast({ title: "Sélectionnez une société", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
        reader.readAsDataURL(file);
      });

      const derivedClientId = deriveClientIdFromRattachement(
        rattachementKind,
        rattachementId,
        dossiers,
        factures,
      );

      await addArchive({
        nom: file.name,
        typeDocument,
        taille: file.size,
        type: file.type || "application/octet-stream",
        dataUrl,
        dossierId: rattachementKind === "dossier" ? rattachementId || undefined : undefined,
        factureId: rattachementKind === "facture" ? rattachementId || undefined : undefined,
        depenseId: rattachementKind === "depense" ? rattachementId || undefined : undefined,
        clientId: derivedClientId ?? (rattachementKind === "libre" ? clientId || undefined : undefined),
        societeId,
      });

      toast({ title: "Document archivé", description: file.name });
      reset();
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Échec de l'archivage",
        description: e instanceof Error ? e.message : "Erreur inattendue.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const rattachementOptions = (() => {
    if (rattachementKind === "dossier") {
      return dossiers.map((d) => ({ id: d.id, label: `${d.reference} — ${d.clientNom}` }));
    }
    if (rattachementKind === "facture") {
      return factures.map((f) => ({ id: f.id, label: `${f.numero} — ${f.clientNom}` }));
    }
    if (rattachementKind === "depense") {
      return depenses.map((d) => {
        const contrat = contrats.find((c) => c.id === d.contratId);
        return { id: d.id, label: `${d.libelle}${contrat ? ` — ${contrat.reference}` : ""}` };
      });
    }
    return [];
  })();

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archiver un document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Fichier <span className="text-red-500">*</span></Label>
            {/* Deux entrées séparées : combiner accept="image/*,application/pdf"
                avec capture="environment" force l'appareil photo sur certains
                navigateurs mobiles et masque l'accès aux fichiers/PDF existants. */}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
            <input
              ref={captureInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                <Upload className="size-4" />
                Choisir un fichier
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => captureInputRef.current?.click()}>
                <Upload className="size-4" />
                Prendre une photo
              </Button>
            </div>
            {file && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{file.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Type de document</Label>
            <Select value={typeDocument} onValueChange={(v) => setTypeDocument(v as TypeDocument)}>
              <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES_DOCUMENT.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rattacher à</Label>
            <Select
              value={rattachementKind}
              onValueChange={(v) => { setRattachementKind(v as RattachementKind); setRattachementId(""); }}
            >
              <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dossier">Dossier</SelectItem>
                <SelectItem value="facture">Facture</SelectItem>
                <SelectItem value="depense">Dépense</SelectItem>
                <SelectItem value="libre">Libre (aucun rattachement)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {rattachementKind !== "libre" && (
            <div className="space-y-2">
              <Label>{rattachementKind === "dossier" ? "Dossier" : rattachementKind === "facture" ? "Facture" : "Dépense"}</Label>
              <Select
                value={rattachementId}
                onValueChange={(id) => {
                  setRattachementId(id);
                  if (rattachementKind === "facture") {
                    const f = factures.find((x) => x.id === id);
                    if (f?.societeId) setSocieteId(f.societeId);
                  } else if (rattachementKind === "depense") {
                    const dep = depenses.find((x) => x.id === id);
                    if (dep?.societeId) setSocieteId(dep.societeId);
                  }
                }}
              >
                <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                <SelectContent>
                  {rattachementOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Société <span className="text-red-500">*</span></Label>
            <Select value={societeId} onValueChange={setSocieteId}>
              <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
              <SelectContent>
                {societes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {rattachementKind === "libre" && (
            <div className="space-y-2">
              <Label>Client (optionnel)</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="h-10 w-full"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving || !file || !societeId}>
            {saving ? "Archivage…" : "Archiver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Écran principal                                                     */
/* ------------------------------------------------------------------ */

export function ArchivesScreen() {
  const { toast } = useToast();
  const canWrite = usePermission("archives:write");
  const isAdmin = useHasRole("Administrateur");
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const deleteArchive = useStore((s) => s.deleteArchive);
  const deleteFichier = useStore((s) => s.deleteFichier);
  const deleteContratFichier = useStore((s) => s.deleteContratFichier);
  const getSignedArchiveUrl = useStore((s) => s.getSignedArchiveUrl);
  const getSignedContratFichierUrl = useStore((s) => s.getSignedContratFichierUrl);

  const docs = useUnifiedDocs();

  const [activeTab, setActiveTab] = useState<ArchiveTab>("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeDocument | null>(null);
  const [clientFilter, setClientFilter] = useState("");
  const [societeFilter, setSocieteFilter] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UnifiedDoc | null>(null);

  const counts = useMemo(() => {
    const base = { all: docs.length, dossier: 0, facture: 0, depense: 0, libre: 0 };
    for (const d of docs) base[d.category] += 1;
    return base;
  }, [docs]);

  const filtered = useMemo(() => {
    const clientNom = clientFilter
      ? clients.find((c) => c.id === clientFilter)?.nom
      : undefined;
    return docs.filter((d) => {
      if (activeTab !== "all" && d.category !== activeTab) return false;
      if (!matchesQuery(d, ["nom", "rattachement"], search.trim())) return false;
      if (typeFilter && d.typeDocument !== typeFilter) return false;
      if (clientNom && d.clientNom !== clientNom) return false;
      if (societeFilter && d.societeId !== societeFilter) return false;
      if (dateDebut && d.date < dateDebut) return false;
      if (dateFin && d.date > `${dateFin}T23:59:59`) return false;
      return true;
    });
  }, [docs, activeTab, search, typeFilter, clientFilter, societeFilter, clients, dateDebut, dateFin]);

  const chips: FilterChip[] = TYPES_DOCUMENT.map((t) => ({
    id: t,
    label: t,
    active: typeFilter === t,
    onToggle: () => setTypeFilter((cur) => (cur === t ? null : t)),
  }));

  const activeCount = [typeFilter, clientFilter, societeFilter, dateDebut, dateFin].filter(Boolean).length;
  const currentMeta = TAB_META.find((t) => t.key === activeTab) ?? TAB_META[0];
  const uploadKind: RattachementKind = activeTab === "all" ? "libre" : activeTab;

  async function handleOpen(doc: UnifiedDoc) {
    try {
      let url: string;
      if (doc.source === "dossier" && doc.dataUrl) {
        url = doc.dataUrl;
      } else if (doc.source === "contrat" && doc.storagePath) {
        url = await getSignedContratFichierUrl(doc.storagePath);
      } else if (doc.storagePath) {
        url = await getSignedArchiveUrl(doc.storagePath);
      } else {
        throw new Error("Fichier introuvable.");
      }
      window.open(url, "_blank", "noopener");
    } catch {
      toast({ title: "Impossible d'ouvrir le document", variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.source === "dossier") {
        await deleteFichier(deleteTarget.sourceId);
      } else if (deleteTarget.source === "contrat") {
        await deleteContratFichier(deleteTarget.sourceId);
      } else {
        await deleteArchive(deleteTarget.sourceId);
      }
      toast({ title: "Document supprimé" });
    } catch (e) {
      toast({
        title: "Échec de la suppression",
        description: e instanceof Error ? e.message : "Erreur inattendue.",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
    }
  }

  const columns: ResponsiveColumn<UnifiedDoc>[] = [
    {
      key: "nom",
      header: "Document",
      cell: (d) => {
        const { icon: Icon, wrapClass } = getFileIconMeta(d.mimeType);
        const cat = TAB_META.find((t) => t.key === d.category);
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                wrapClass,
              )}
            >
              <Icon className="size-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900 dark:text-slate-100">{d.nom}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                <span className={cn("font-medium", cat?.accent)}>{d.rattachement}</span>
                {d.clientNom ? ` · ${d.clientNom}` : ""}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      cell: (d) => (
        <span
          className={cn(
            "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
            TYPE_DOC_BADGE[d.typeDocument],
          )}
        >
          {d.typeDocument}
        </span>
      ),
    },
    {
      key: "societe",
      header: "Société",
      cell: (d) => d.societeNom || "—",
      hideOnMobile: true,
    },
    {
      key: "date",
      header: "Date",
      cell: (d) => formatDateShort(d.date),
    },
    {
      key: "taille",
      header: "Taille",
      cell: (d) => formatFileSize(d.taille),
      hideOnMobile: true,
    },
  ];

  const showFolderEmpty =
    activeTab === "dossier" || activeTab === "all";

  return (
    <div className="space-y-5">
      <PageHeader title="Archives" description={currentMeta.description}>
        {canWrite && (
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="size-4" />
            Archiver un document
          </Button>
        )}
      </PageHeader>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ArchiveTab)}
        className="space-y-4"
      >
        <MetaTabsList
          items={TAB_META}
          counts={counts}
          gridClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
        />
      </Tabs>

      <ListFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher un fichier, un dossier, une facture…"
        chips={chips}
        activeCount={activeCount}
        onClear={() => {
          setTypeFilter(null);
          setClientFilter("");
          setSocieteFilter("");
          setDateDebut("");
          setDateFin("");
        }}
        advanced={
          <>
            <Select
              value={societeFilter || "all"}
              onValueChange={(v) => setSocieteFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger className="h-10 w-48">
                <Building2 className="mr-1.5 size-3.5 text-slate-400" />
                <SelectValue placeholder="Société" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sociétés</SelectItem>
                {societes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={clientFilter || "all"}
              onValueChange={(v) => setClientFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger className="h-10 w-48"><SelectValue placeholder="Client" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input type="date" className="h-10 w-40" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
              <span className="text-xs text-slate-400">→</span>
              <Input type="date" className="h-10 w-40" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
            </div>
          </>
        }
      />

      <ResponsiveDataList
        items={filtered}
        columns={columns}
        getRowKey={(d) => d.key}
        emptyState={
          <EmptyState
            icon={showFolderEmpty ? undefined : currentMeta.icon}
            illustration={
              showFolderEmpty ? (
                <div className="mb-4 flex flex-col items-center">
                  <Image
                    src={FOLDER_ICON_SRC}
                    alt=""
                    width={88}
                    height={88}
                    className="size-[88px] object-contain drop-shadow-sm"
                    unoptimized
                  />
                </div>
              ) : undefined
            }
            title={currentMeta.emptyTitle}
            description={currentMeta.emptyDescription}
            action={
              canWrite ? (
                <Button size="sm" onClick={() => setUploadOpen(true)}>
                  <Plus className="size-4" />
                  Archiver un document
                </Button>
              ) : undefined
            }
          />
        }
        renderActions={(d) => (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              aria-label={`Voir ${d.nom}`}
              onClick={() => handleOpen(d)}
            >
              <Eye className="size-4" />
            </Button>
            {/*
              ⚠️ Le verrou admin-only n'est un vrai verrou serveur (RLS is_admin())
              que pour source === "archive" (voir 20260717_archives_admin_delete.sql).
              Pour source === "dossier"/"contrat", ce n'est qu'une garde côté
              interface : deleteFichier/deleteContratFichier restent autorisés en
              base à quiconque a la permission dossiers:write/contrats:write, pour
              préserver la suppression déjà existante depuis les écrans Dossier/
              Contrat (RLS ne peut pas distinguer l'écran d'origine de la requête).
              Décision assumée, pas un oubli — ne pas durcir sans revoir cet écran.
            */}
            {d.canDelete && isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-slate-400 hover:text-red-600"
                aria-label={`Supprimer ${d.nom}`}
                onClick={() => setDeleteTarget(d)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </>
        )}
      />

      <ArchiveUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        initialKind={uploadKind}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Supprimer ce document ?"
        description={
          deleteTarget
            ? `« ${deleteTarget.nom} » sera définitivement supprimé et retiré du stockage. Cette action est irréversible.`
            : "Cette action est irréversible."
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}
