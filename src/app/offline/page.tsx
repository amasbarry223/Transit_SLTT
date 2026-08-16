"use client";

import Image from "next/image";
import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/80 p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-muted/60">
          <Image src="/logoV.png" alt="Transit" width={56} height={56} className="object-contain" unoptimized />
        </div>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
          <WifiOff className="size-6" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Vous êtes hors connexion</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          L&apos;application nécessite une connexion Internet pour charger vos dossiers, clients et données
          comptables. Vérifiez votre réseau puis réessayez.
        </p>
        <Button className="mt-6 h-11 min-w-[140px]" onClick={() => window.location.reload()}>
          <RefreshCw className="size-4" />
          Réessayer
        </Button>
      </Card>
    </div>
  );
}
