"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import {
  DOC_ACCEPTED_EXTENSIONS,
  DOC_ACCEPTED_MIME_TYPES,
  DOC_MAX_FILE_BYTES,
  DOC_MAX_FILE_MB,
} from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { toastWarning } from "@/lib/toast-helpers";
import { cn } from "@/lib/utils";
import type { DocumentCategorie } from "@/lib/domain-types";

export type DocumentUploadFile = {
  nom: string;
  taille: number;
  mimeType: string;
  dataUrl: string;
  categorie: DocumentCategorie;
};

function guessCategorie(fileName: string): DocumentCategorie {
  const n = fileName.toLowerCase();
  if (/\bbl\b|connaissement|bill.?of.?lading/.test(n)) return "BL";
  if (/\bdau\b|declaration/.test(n)) return "DAU";
  if (/sydonia/.test(n)) return "SYDONIA";
  if (/facture|invoice/.test(n)) return "Facture";
  if (/re[cç]u|receipt/.test(n)) return "Reçu";
  if (/contrat/.test(n)) return "Contrat";
  return "Autre";
}

function isAcceptedMime(mime: string, name: string): boolean {
  if ((DOC_ACCEPTED_MIME_TYPES as readonly string[]).includes(mime)) return true;
  const lower = name.toLowerCase();
  return (
    lower.endsWith(".pdf") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".heic") ||
    lower.endsWith(".heif") ||
    lower.endsWith(".webp")
  );
}

async function maybeConvertHeic(file: File): Promise<File> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name);
  if (!isHeic) return file;
  try {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    if (!blob) {
      throw new Error("Conversion HEIC vide");
    }
    return new File([blob], file.name.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg"), {
      type: "image/jpeg",
    });
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `Conversion HEIC impossible : ${e.message}. Exportez en JPG/PNG.`
        : "Conversion HEIC impossible. Exportez en JPG/PNG.",
    );
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function DocumentUploadZone({
  onUpload,
  canWrite = true,
  multiple = true,
  disabled = false,
  className,
}: {
  onUpload: (files: DocumentUploadFile[]) => void | Promise<void>;
  canWrite?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  async function processFiles(fileList: FileList | null) {
    if (!fileList || !canWrite || disabled) return;
    const accepted: DocumentUploadFile[] = [];

    for (const raw of Array.from(fileList)) {
      if (raw.size > DOC_MAX_FILE_BYTES) {
        toastWarning(toast, {
          title: "Fichier trop volumineux",
          description: `${raw.name} dépasse ${DOC_MAX_FILE_MB} Mo.`,
        });
        continue;
      }
      if (!isAcceptedMime(raw.type, raw.name)) {
        toastWarning(toast, {
          title: "Format non supporté",
          description: `${raw.name} — PDF, JPG, PNG ou HEIC uniquement.`,
        });
        continue;
      }
      try {
        const file = await maybeConvertHeic(raw);
        const dataUrl = await readAsDataUrl(file);
        accepted.push({
          nom: file.name,
          taille: file.size,
          mimeType: file.type || "application/octet-stream",
          dataUrl,
          categorie: guessCategorie(file.name),
        });
      } catch {
        toastWarning(toast, {
          title: "Lecture impossible",
          description: raw.name,
        });
      }
    }

    if (accepted.length === 0) return;
    setBusy(true);
    try {
      await onUpload(accepted);
    } finally {
      setBusy(false);
    }
  }

  if (!canWrite) return null;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-colors",
        dragging
          ? "border-primary bg-primary/5"
          : "border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/40",
        (disabled || busy) && "pointer-events-none opacity-60",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void processFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={DOC_ACCEPTED_EXTENSIONS}
        multiple={multiple}
        onChange={(e) => {
          void processFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {busy ? (
        <Loader2 className="mb-2 size-8 animate-spin text-primary" />
      ) : (
        <Upload className="mb-2 size-8 text-primary" />
      )}
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
        Glissez-déposez vos documents
      </p>
      <p className="mt-1 text-center text-xs text-slate-500">
        PDF, JPG, PNG, HEIC — max {DOC_MAX_FILE_MB} Mo / fichier
      </p>
      <button
        type="button"
        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        onClick={() => inputRef.current?.click()}
      >
        <FileText className="size-4" />
        Sélectionner des fichiers
      </button>
    </div>
  );
}
