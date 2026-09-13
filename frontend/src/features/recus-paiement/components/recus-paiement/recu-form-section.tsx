"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecuFormSectionProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function RecuFormSection({ title, description, icon: Icon, children, className }: RecuFormSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-4 pl-0 sm:pl-12">{children}</div>
    </section>
  );
}
