"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { importWithRetry } from "@/lib/import-with-retry";

const TresorerieChartImpl = dynamic(
  () =>
    importWithRetry(() =>
      import("./tresorerie-chart").then((m) => ({
        default: m.TresorerieChart,
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

export function TresorerieChartLazy(props: {
  data: { mois: string; entrees: number; sorties: number }[];
  gridColor: string;
  tickColor: string;
}) {
  return <TresorerieChartImpl {...props} />;
}
