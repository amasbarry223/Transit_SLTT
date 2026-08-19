"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { importWithRetry } from "@/lib/import-with-retry";

const DossiersEvolutionChartImpl = dynamic(
  () =>
    importWithRetry(() =>
      import("./dossiers-evolution-chart").then((m) => ({
        default: m.DossiersEvolutionChart,
      })),
    ),
  {
    ssr: false,
    loading: () => (
      <Card className="flex h-[356px] items-center justify-center rounded-xl border-border/80 p-5 shadow-sm">
        <Loader2 className="size-5 animate-spin text-primary" />
      </Card>
    ),
  },
);

export function DossiersEvolutionChartLazy(props: {
  data: { mois: string; valeur: number }[];
  gridColor: string;
  tickColor: string;
  barCursorFill: string;
}) {
  return <DossiersEvolutionChartImpl {...props} />;
}
