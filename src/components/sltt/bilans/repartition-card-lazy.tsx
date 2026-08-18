"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const RepartitionCardImpl = dynamic(
  () => import("./repartition-card").then((m) => ({ default: m.RepartitionCard })),
  {
    ssr: false,
    loading: () => (
      <Card className="flex h-[340px] items-center justify-center p-5 shadow-sm border-border/80 lg:col-span-1">
        <Loader2 className="size-5 animate-spin text-primary" />
      </Card>
    ),
  },
);

export function RepartitionCardLazy(props: {
  pieData: Array<{ name: string; value: number; color: string }>;
  pieTotal: number;
  tauxRecouvrement: number;
}) {
  return <RepartitionCardImpl {...props} />;
}
