import { AuthError } from "@/lib/auth/require-admin";
import { AppError, isAppError } from "./app-error";
import { NotFoundError } from "./not-found-error";
import { UnauthorizedError } from "./unauthorized-error";
import { ValidationError } from "./validation-error";
import { logError } from "@/shared/logger";

export type ApiErrorBody = {
  error: string;
  code?: string;
};

export function apiErrorResponse(message: string, status: number, code?: string): Response {
  const body: ApiErrorBody = { error: message };
  if (code) body.code = code;
  return Response.json(body, { status });
}

export function apiSuccessResponse<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

function mapAppErrorToStatus(error: AppError): number {
  if (error instanceof ValidationError) return 400;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof UnauthorizedError) return error.status;
  return 500;
}

/** Maps domain and auth errors to a uniform JSON response. */
export function toApiErrorResponse(error: unknown): Response {
  if (error instanceof AuthError) {
    return apiErrorResponse(error.message, error.status);
  }

  if (isAppError(error)) {
    return apiErrorResponse(error.message, mapAppErrorToStatus(error), error.code);
  }

  logError("Unhandled API error", error);
  return apiErrorResponse("Erreur serveur interne.", 500);
}
