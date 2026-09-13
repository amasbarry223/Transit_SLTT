import type { AppError } from "@/shared/errors/app-error";

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  if (!result.ok) return result;
  return ok(fn(result.value));
}

export async function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<Result<U, E>>,
): Promise<Result<U, E>> {
  if (!result.ok) return result;
  return fn(result.value);
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}
