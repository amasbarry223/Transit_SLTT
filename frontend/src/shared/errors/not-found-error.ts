import { AppError } from "./app-error";

export const NOT_FOUND_ERROR_CODE = "NOT_FOUND";

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string, cause?: unknown) {
    const message = id ? `${resource} introuvable (${id}).` : `${resource} introuvable.`;
    super(message, NOT_FOUND_ERROR_CODE, cause);
    this.name = "NotFoundError";
  }
}
