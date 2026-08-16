"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UI } from "@/lib/ui-messages";
import { cn } from "@/lib/utils";

function isDirectUrl(url: string): boolean {
  return url.startsWith("data:") || url.startsWith("http");
}

/** Charge une URL non directe (chemin relatif) en blob object URL. */
function FetchedDocumentPreview({
  url,
  mimeType,
  fileName,
  className,
}: {
  url: string;
  mimeType: string;
  fileName?: string;
  className?: string;
}) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; objectUrl: string }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Téléchargement impossible");
        const blob = await res.blob();
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        revoked = objectUrl;
        setState({ status: "ready", objectUrl });
      } catch (e) {
        if (cancelled) return;
        setState({
          status: "error",
          message: e instanceof Error ? e.message : "Erreur d'aperçu",
        });
      }
    })();

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [url]);

  if (state.status === "loading") {
    return (
      <div
        className={cn(
          "flex h-64 items-center justify-center rounded-lg bg-muted",
          className,
        )}
      >
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        className={cn(
          "flex h-64 flex-col items-center justify-center gap-2 rounded-lg text-sm text-slate-500 bg-muted",
          className,
        )}
      >
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <DocumentPreviewBody
      objectUrl={state.objectUrl}
      mimeType={mimeType}
      fileName={fileName}
      className={className}
    />
  );
}

function DocumentPreviewBody({
  objectUrl,
  mimeType,
  fileName,
  className,
}: {
  objectUrl: string;
  mimeType: string;
  fileName?: string;
  className?: string;
}) {
  const isPdf = mimeType.includes("pdf") || fileName?.toLowerCase().endsWith(".pdf");
  const isImage = mimeType.startsWith("image/");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={objectUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            Ouvrir
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={objectUrl} download={fileName || "document"}>
            <Download className="size-4" />
            Télécharger
          </a>
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
        {isPdf ? (
          <iframe
            title={fileName || "PDF"}
            src={objectUrl}
            className="h-[min(70vh,640px)] w-full"
          />
        ) : isImage ? (
          <img
            src={objectUrl}
            alt={fileName || "Document"}
            className="mx-auto max-h-[min(70vh,640px)] w-auto object-contain"
          />
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-slate-500">
            Aperçu non disponible pour ce type de fichier
          </div>
        )}
      </div>
    </div>
  );
}

export function DocumentViewer({
  url,
  mimeType,
  fileName,
  className,
}: {
  url: string | null;
  mimeType: string;
  fileName?: string;
  className?: string;
}) {
  if (!url) {
    return (
      <div
        className={cn(
          "flex h-64 flex-col items-center justify-center gap-1 rounded-lg text-center text-sm text-slate-500 bg-muted",
          className,
        )}
      >
        <p className="font-medium text-foreground/90">{UI.empty.documents.title}</p>
        <p className="max-w-xs text-xs text-muted-foreground">{UI.empty.documents.description}</p>
      </div>
    );
  }

  if (isDirectUrl(url)) {
    return (
      <DocumentPreviewBody
        objectUrl={url}
        mimeType={mimeType}
        fileName={fileName}
        className={className}
      />
    );
  }

  return (
    <FetchedDocumentPreview
      key={url}
      url={url}
      mimeType={mimeType}
      fileName={fileName}
      className={className}
    />
  );
}
