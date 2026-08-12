"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() =>
    typeof window !== "undefined" ? isStandalone() : false,
  );
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (installed) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [installed]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  if (installed) return null;

  if (deferredPrompt) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 shrink-0 gap-1.5 px-2.5 sm:px-3"
        onClick={() => void handleInstall()}
      >
        <Download className="size-4 shrink-0" />
        <span className="hidden sm:inline">Installer</span>
      </Button>
    );
  }

  if (isIos() && !showIosHint) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 shrink-0 px-2.5"
              onClick={() => setShowIosHint(true)}
              aria-label="Installer sur iOS"
            >
              <Share className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px] text-xs">
            Sur iOS : Partager → Sur l&apos;écran d&apos;accueil
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}
