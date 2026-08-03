import { getErrorMessage } from "@/lib/utils";

type ToastFn = (props: {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}) => unknown;

/** Toast d'erreur destructif standardisé (message extrait de `unknown`). */
export function toastError(
  toast: ToastFn,
  error: unknown,
  fallback: string,
  title = "Erreur",
): void {
  toast({
    title,
    description: getErrorMessage(error, fallback),
    variant: "destructive",
  });
}
