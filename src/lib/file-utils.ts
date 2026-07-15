import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  type LucideIcon,
} from "lucide-react";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function getFileIconComponent(mimeType: string): LucideIcon {
  return getFileIconMeta(mimeType).icon;
}

/** Icône + teintes MIME pour pastilles document (Archives, etc.). */
export function getFileIconMeta(mimeType: string): {
  icon: LucideIcon;
  wrapClass: string;
  iconClass: string;
} {
  if (mimeType.startsWith("image/")) {
    return {
      icon: ImageIcon,
      wrapClass: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
      iconClass: "text-sky-700 dark:text-sky-300",
    };
  }
  if (mimeType === "application/pdf") {
    return {
      icon: FileText,
      wrapClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
      iconClass: "text-rose-700 dark:text-rose-300",
    };
  }
  if (
    mimeType.includes("word") ||
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return {
      icon: FileText,
      wrapClass: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
      iconClass: "text-indigo-700 dark:text-indigo-300",
    };
  }
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  ) {
    return {
      icon: FileSpreadsheet,
      wrapClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
      iconClass: "text-emerald-700 dark:text-emerald-300",
    };
  }
  return {
    icon: File,
    wrapClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    iconClass: "text-slate-600 dark:text-slate-300",
  };
}
