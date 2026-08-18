"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const StockRepartitionChartImpl = dynamic(
  () => import("./stock-repartition-chart").then((m) => ({ default: m.StockRepartitionChart })),
  {
    ssr: false,
    loading: () => (
      <Card className="flex h-[172px] items-center justify-center rounded-xl border-border/80 p-0 shadow-sm">
        <Loader2 className="size-5 animate-spin text-primary" />
      </Card>
    ),
  },
);

export function StockRepartitionChartLazy(props: {
  data: { name: string; value: number; color: string }[];
  totalValue: number;
}) {
  return <StockRepartitionChartImpl {...props} />;
}
