function isRetriableChunkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "ChunkLoadError" ||
    /Loading chunk .* failed/i.test(error.message) ||
    /Failed to fetch dynamically imported module/i.test(error.message)
  );
}

/** Réessaie un import() dynamique — utile en dev quand Webpack compile encore le chunk. */
export function importWithRetry<T>(
  factory: () => Promise<T>,
  retries = 3,
  delayMs = 800,
): Promise<T> {
  return factory().catch((error: unknown) => {
    if (!isRetriableChunkError(error) || retries <= 0) throw error;
    return new Promise<T>((resolve) => setTimeout(resolve, delayMs)).then(() =>
      importWithRetry(factory, retries - 1, Math.round(delayMs * 1.5)),
    );
  });
}
