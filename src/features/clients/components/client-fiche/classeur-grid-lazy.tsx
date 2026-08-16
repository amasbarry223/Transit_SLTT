"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { ClasseurEntry } from "@/lib/classeur";

const ClasseurGridImpl = dynamic(
  () => import("./classeur-grid").then((m) => ({ default: m.ClasseurGrid })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-lg border border-border bg-slate-50 text-sm text-slate-500 dark:bg-slate-900">
        <Loader2 className="mr-2 size-5 animate-spin text-primary" />
        Chargement du classeur…
      </div>
    ),
  },
);

export function ClasseurGridLazy(props: {
  rows: ClasseurEntry[];
  onRowClick: (entry: ClasseurEntry) => void;
  onDataChanged?: () => void;
  className?: string;
}) {
  return <ClasseurGridImpl {...props} />;
}
