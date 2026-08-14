import { AuthError } from "@/lib/auth/require-admin";

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

/** Maps AuthError and unknown errors to a uniform JSON response. */
export function toApiErrorResponse(error: unknown): Response {
  if (error instanceof AuthError) {
    return apiErrorResponse(error.message, error.status);
  }
  console.error(error);
  return apiErrorResponse("Erreur serveur interne.", 500);
}
