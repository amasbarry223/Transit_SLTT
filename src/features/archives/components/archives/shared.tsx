import Image from "next/image";
import { Archive as ArchiveIcon, FileStack, FileText, Receipt, Wallet } from "lucide-react";
import type { TypeDocument } from "@/lib/store";
import type { MetaTabItem } from "@/components/sltt/meta-tabs-list";

export const FOLDER_ICON_SRC = "/icons/folder-docs.png";

export const TYPE_DOC_BADGE: Record<TypeDocument, string> = {
  BL: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-200",
  DAU: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  Facture:
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-200",
  Reçu: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  Contrat:
    "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200",
  Autre:
    "border-slate-200 text-slate-700 dark:border-slate-700 bg-muted/80 dark:text-slate-200",
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 Mo — aligné sur la limite du bucket `archives`
export const TYPES_DOCUMENT: TypeDocument[] = ["BL", "DAU", "Facture", "Reçu", "Contrat", "Autre"];

export type RattachementKind = "dossier" | "facture" | "depense" | "libre";
export type ArchiveTab = "all" | RattachementKind;
export type DocSource = "archive" | "dossier" | "contrat";

export interface UnifiedDoc {
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
  annexeId?: string;
  rattachement: string;
  date: string;
  canDelete: boolean;
}

export const TAB_META: (MetaTabItem<ArchiveTab> & {
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
    accent: "text-foreground/90",
    iconWrap:
      "text-slate-700 bg-muted dark:text-slate-200 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
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
