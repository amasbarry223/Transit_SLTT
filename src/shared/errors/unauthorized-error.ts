import { AppError } from "./app-error";

export const UNAUTHORIZED_ERROR_CODE = "UNAUTHORIZED";

export class UnauthorizedError extends AppError {
  readonly status: number;

  constructor(message = "Accès non autorisé.", status = 403, cause?: unknown) {
    super(message, UNAUTHORIZED_ERROR_CODE, cause);
    this.name = "UnauthorizedError";
    this.status = status;
  }
}
