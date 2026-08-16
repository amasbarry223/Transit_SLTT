import { AppError } from "./app-error";

export const VALIDATION_ERROR_CODE = "VALIDATION_ERROR";

export class ValidationError extends AppError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}, cause?: unknown) {
    super(message, VALIDATION_ERROR_CODE, cause);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
