/** Règles de validation et limites upload. */

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export const MAX_FILE_SIZE_MB = 2;

/** Limite upload module Documents / OCR (Mo). */
export const DOC_MAX_FILE_MB = 10;
export const DOC_MAX_FILE_BYTES = DOC_MAX_FILE_MB * 1024 * 1024;

export const DOC_ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
] as const;

export const DOC_ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp";

/** Seuil sous lequel un champ OCR est flagué comme incertain. */
export const OCR_LOW_CONFIDENCE_THRESHOLD = 0.75;
