"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const EvolutionChartCardImpl = dynamic(
  () => import("./evolution-chart-card").then((m) => ({ default: m.EvolutionChartCard })),
  {
    ssr: false,
    loading: () => (
      <Card className="flex h-[420px] items-center justify-center p-5 shadow-sm border-border/80">
        <Loader2 className="size-5 animate-spin text-primary" />
      </Card>
    ),
  },
);

export function EvolutionChartCardLazy(props: {
  chartData: Array<{ periode: string; investi: number; encaisse: number }>;
  mois: string;
}) {
  return <EvolutionChartCardImpl {...props} />;
}
