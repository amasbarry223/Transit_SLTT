"use client";

import { Send } from "lucide-react";

export function DevisListBanner({ enAttente }: { enAttente: number }) {
  return (
    <>
      {enAttente > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 px-4 py-3">
          <Send className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              {enAttente} devis{enAttente > 1 ? "s" : ""} en attente de réponse client
            </p>
            <p className="mt-0.5 text-xs text-blue-800/80 dark:text-blue-400/80">
              Relancez vos clients, puis utilisez « Convertir en dossier » une fois le devis accepté.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
