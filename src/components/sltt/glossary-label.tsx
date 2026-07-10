"use client";

import { Info } from "lucide-react";
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function GlossaryLabel({
  term,
  className,
  showIcon = true,
}: {
  term: GlossaryKey;
  className?: string;
  showIcon?: boolean;
}) {
  const entry = GLOSSARY[term];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn("inline-flex items-center gap-1 cursor-help", className)}
            tabIndex={0}
          >
            {entry.label}
            {showIcon && (
              <Info className="size-3.5 text-slate-400 dark:text-slate-500" aria-hidden />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {entry.definition}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
