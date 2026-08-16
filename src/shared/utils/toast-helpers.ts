import type { AppToastFn } from "@/shared/hooks/use-toast";
import { mapErrorToUserMessage } from "@/shared/utils/error-messages";
import { UI } from "@/shared/utils/ui-messages";

export type ToastFn = AppToastFn;

export function toastSuccess(
  toast: ToastFn,
  opts: { title: string; description?: string },
): void {
  toast({
    title: opts.title,
    description: opts.description,
    variant: "success",
  });
}

export function toastWarning(
  toast: ToastFn,
  opts: { title: string; description?: string },
): void {
  toast({
    title: opts.title,
    description: opts.description,
    variant: "warning",
  });
}

export function toastInfo(
  toast: ToastFn,
  opts: { title: string; description?: string },
): void {
  toast({
    title: opts.title,
    description: opts.description,
    variant: "info",
  });
}

export function toastError(
  toast: ToastFn,
  error: unknown,
  opts: {
    title: string;
    fallback?: string;
    action?: import("@/shared/components/ui/toast").ToastActionElement;
  },
): void {
  toast({
    title: opts.title,
    description: mapErrorToUserMessage(error, opts.fallback ?? UI.errors.generic),
    variant: "destructive",
    action: opts.action,
  });
}

export function toastLoading(
  toast: ToastFn,
  opts: { title: string; description?: string },
): ReturnType<ToastFn> {
  return toast({
    title: opts.title,
    description: opts.description ?? UI.loading.processing,
    variant: "default",
    duration: Number.POSITIVE_INFINITY,
  });
}
