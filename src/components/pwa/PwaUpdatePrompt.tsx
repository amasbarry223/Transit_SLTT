"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useSerwist } from "@serwist/next/react";
import { Button } from "@/components/ui/button";

export function PwaUpdatePrompt() {
  const { serwist } = useSerwist();
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!serwist) return;

    function onWaiting() {
      setWaiting(true);
    }

    serwist.addEventListener("waiting", onWaiting);
    return () => {
      serwist.removeEventListener("waiting", onWaiting);
    };
  }, [serwist]);

  if (!waiting) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg sm:left-auto">
      <p className="text-sm text-slate-700 dark:text-slate-200">Une mise à jour est disponible.</p>
      <Button
        size="sm"
        onClick={() => {
          void serwist?.messageSkipWaiting();
          window.location.reload();
        }}
      >
        <RefreshCw className="size-4" />
        Mettre à jour
      </Button>
    </div>
  );
}
