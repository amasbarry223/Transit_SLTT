type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

function writeLog(level: LogLevel, message: string, payload?: LogPayload): void {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(entry));
    return;
  }

  console.info(JSON.stringify(entry));
}

export function logInfo(message: string, payload?: LogPayload): void {
  writeLog("info", message, payload);
}

export function logWarn(message: string, error?: unknown, payload?: LogPayload): void {
  writeLog("warn", message, {
    ...payload,
    ...(error !== undefined ? { error: error instanceof Error ? error.message : String(error) } : {}),
  });
}

export function logError(message: string, error?: unknown, payload?: LogPayload): void {
  writeLog("error", message, {
    ...payload,
    error: error instanceof Error ? error.message : String(error),
  });
}
