"use client";

import { useId, isValidElement, cloneElement, type ReactElement, type ReactNode } from "react";
import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function FormField({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  /** Pass an id when `children` isn't a single labelable control (e.g. a wrapper
   * div around a Select/button group) — wire that same id onto the real control
   * yourself, as done in transporteur-form-fields.tsx / client-form-fields.tsx. */
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const errorId = useId();
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const control =
    !id && isValidElement(children)
      ? cloneElement(
          children as ReactElement<{
            id?: string;
            "aria-describedby"?: string;
            "aria-invalid"?: boolean;
          }>,
          {
            id: fieldId,
            ...(error ? { "aria-describedby": errorId, "aria-invalid": true } : {}),
          },
        )
      : children;

  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={fieldId}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                className="cursor-help text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <Info className="size-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {hint}
            </TooltipContent>
          </Tooltip>
        )}
      </Label>
      {control}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
