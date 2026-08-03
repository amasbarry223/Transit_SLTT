"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export { FormField } from "@/components/sltt/form-field";

const toneMap: Record<"blue" | "emerald" | "amber" | "indigo", string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
};

export function SectionTitle({
  icon,
  title,
  description,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tone: "blue" | "emerald" | "amber" | "indigo";
}) {
  return (
    <div className="mb-4 flex items-start gap-2.5">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md",
          toneMap[tone],
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
    </div>
  );
}

export function CollapsibleSection({
  icon,
  title,
  description,
  tone,
  defaultOpen,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tone: "blue" | "emerald" | "amber" | "indigo";
  defaultOpen: boolean;
  badge?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border-border/80 p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-2.5 text-left"
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md",
            toneMap[tone],
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            {badge && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-slate-400 transition-transform dark:text-slate-500",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </Card>
  );
}

export function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "amber";
}) {
  if (tone === "amber") {
    return (
      <div className="flex items-center justify-between py-3 first:pt-0">
        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-amber-700 dark:text-amber-300">{value}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between py-3 first:pt-0">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}
