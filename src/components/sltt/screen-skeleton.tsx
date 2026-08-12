"use client";

import type { ViewKey } from "@/lib/nav-store";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/60", className)} />;
}

function ListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Bone className="h-8 w-48" />
          <Bone className="h-4 w-72 max-w-full" />
        </div>
        <Bone className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Bone className="h-10 w-full max-w-md" />
      <div className="overflow-hidden rounded-xl border border-border/60">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-14 rounded-none border-b border-border/40 last:border-0" />
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Bone className="h-8 w-56" />
        <Bone className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Bone className="h-64 rounded-xl" />
        <Bone className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <Bone className="h-9 w-32" />
      <Bone className="h-8 w-64" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Bone className="h-48 rounded-xl" />
          <Bone className="h-48 rounded-xl" />
        </div>
        <Bone className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

export function ScreenSkeleton({ view }: { view: ViewKey }) {
  if (view === "dashboard") return <DashboardSkeleton />;
  if (view === "dossier-form" || view === "recus-paiement") return <FormSkeleton />;
  return <ListSkeleton />;
}
