"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, MonitorSmartphone, Share } from "lucide-react";
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
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isDesktopChromium(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /chrome|edg/i.test(ua) && !/mobile/i.test(ua);
}

interface InstallPWAProps {
  /** Variante compacte pour la topbar, ou pleine largeur sur l'écran de login. */
  variant?: "toolbar" | "login";
}

export function InstallPWA({ variant = "toolbar" }: InstallPWAProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() =>
    typeof window !== "undefined" ? isStandalone() : false,
  );
  const [swReady, setSwReady] = useState(false);
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

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistration("/sw.js").then((reg) => {
      setSwReady(Boolean(reg?.active));
    });
  }, []);

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

  const toolbarClass = "h-9 shrink-0 gap-1.5 px-2.5 sm:px-3";
  const loginClass = "h-10 w-full gap-2";

  if (deferredPrompt) {
    return (
      <Button
        type="button"
        variant={variant === "login" ? "outline" : "outline"}
        size="sm"
        className={variant === "login" ? loginClass : toolbarClass}
        onClick={() => void handleInstall()}
      >
        <Download className="size-4 shrink-0" />
        <span className={variant === "toolbar" ? "hidden sm:inline" : undefined}>Installer l&apos;application</span>
      </Button>
    );
  }

  if (isIos()) {
    return (
      <TooltipProvider>
        <Tooltip open={showIosHint ? true : undefined}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={variant === "login" ? "outline" : "ghost"}
              size="sm"
              className={variant === "login" ? loginClass : toolbarClass}
              onClick={() => setShowIosHint(true)}
              aria-label="Installer sur iOS"
            >
              <Share className="size-4 shrink-0" />
              {variant === "login" ? (
                <span>Installer sur l&apos;écran d&apos;accueil (iOS)</span>
              ) : null}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[240px] text-xs">
            Safari → Partager → Sur l&apos;écran d&apos;accueil
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (swReady && isDesktopChromium() && variant === "login") {
    return (
      <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <MonitorSmartphone className="size-4 shrink-0 text-primary" />
          Application installable
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Chrome / Edge : menu <strong>⋮</strong> → « Installer Transit » ou icône <strong>+</strong> dans la barre d&apos;adresse.
        </p>
      </div>
    );
  }

  if (swReady && isDesktopChromium()) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={toolbarClass}
              aria-label="Installer l'application"
            >
              <MonitorSmartphone className="size-4 shrink-0" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px] text-xs">
            Menu ⋮ → Installer Transit, ou icône + dans la barre d&apos;adresse.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}
