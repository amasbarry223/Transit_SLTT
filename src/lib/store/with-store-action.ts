import { getErrorMessage } from "@/lib/utils";
import { logError } from "@/shared/logger";

type SetStateFn = (
  partial:
    | Record<string, unknown>
    | ((state: Record<string, unknown>) => Record<string, unknown>),
) => void;

export interface WithStoreActionOptions {
  loadingKey?: string;
  onError?: (error: unknown) => void;
}

/**
 * Wraps an async store action with optional loading state and error handling.
 * Returns null on failure instead of throwing (unless re-throw is needed by caller).
 */
export async function withStoreAction<T>(
  set: SetStateFn,
  action: () => Promise<T>,
  options?: WithStoreActionOptions,
): Promise<T | null> {
  const { loadingKey, onError } = options ?? {};
  if (loadingKey) set({ [loadingKey]: true });
  try {
    return await action();
  } catch (error) {
    onError?.(error);
    logError("[SLTT store]", error, { message: getErrorMessage(error) });
    return null;
  } finally {
    if (loadingKey) set({ [loadingKey]: false });
  }
}
