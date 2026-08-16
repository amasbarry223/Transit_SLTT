"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { ClasseurEntry } from "@/lib/classeur";

const ExcelWorkbookPanel = dynamic(
  () =>
    import("./excel-workbook").then((m) => ({ default: m.ExcelWorkbookPanel })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[480px] items-center justify-center rounded-lg border border-border text-sm text-slate-500 bg-muted/40">
        <Loader2 className="mr-2 size-5 animate-spin text-primary" />
        Préparation d&apos;Excel…
      </div>
    ),
  },
);

export function ExcelWorkbookLazy(props: {
  clientId: string;
  clientNom: string;
  journalEntries: ClasseurEntry[];
  onApplied?: () => void;
}) {
  return <ExcelWorkbookPanel {...props} />;
}
