"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { ConfigMap, ConfigValue } from "@/lib/api-types";
import { logWarn } from "@/shared/logger";

// Cache mémoire client pour éviter les requêtes redondantes
let cachedConfig: ConfigMap | null = null;
let inFlightPromise: Promise<ConfigMap> | null = null;
const listeners = new Set<(cfg: ConfigMap) => void>();

function notifyListeners(cfg: ConfigMap) {
  cachedConfig = cfg;
  listeners.forEach((fn) => fn(cfg));
}

async function fetchConfigOnce(): Promise<ConfigMap> {
  if (cachedConfig) return cachedConfig;
  if (inFlightPromise) return inFlightPromise;

  inFlightPromise = (async () => {
    try {
      // Tente d'abord les paramètres complets si connecté, sinon paramètres publics
      const res = await api.settings.getAll().catch(() => null);
      if (res?.parsedMap && Object.keys(res.parsedMap).length > 0) {
        notifyListeners(res.parsedMap);
        return res.parsedMap;
      }
      const pubRes = await api.settings.getPublic().catch(() => null);
      if (pubRes && Object.keys(pubRes).length > 0) {
        notifyListeners(pubRes);
        return pubRes;
      }
    } catch (e) {
      logWarn("[useConfig] Impossible de charger la configuration", e);
    }
    return cachedConfig || {};
  })().finally(() => {
    inFlightPromise = null;
  });

  return inFlightPromise;
}

export function useConfig() {
  const [config, setConfig] = useState<ConfigMap>(cachedConfig || {});
  const [isLoading, setIsLoading] = useState<boolean>(!cachedConfig);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      cachedConfig = null;
      const data = await fetchConfigOnce();
      setConfig(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = (newCfg: ConfigMap) => {
      setConfig({ ...newCfg });
      setIsLoading(false);
    };
    listeners.add(handler);

    if (!cachedConfig) {
      void fetchConfigOnce().then((res) => {
        setConfig(res);
        setIsLoading(false);
      });
    }

    return () => {
      listeners.delete(handler);
    };
  }, []);

  return {
    data: config,
    config,
    isLoading,
    error,
    refetch: reload,
  };
}

/**
 * Récupère une valeur spécifique de configuration avec repli sécurisé
 */
export function useConfigValue<T = string>(key: string, fallback?: T): T {
  const { config } = useConfig();
  if (config && config[key] !== undefined && config[key] !== null) {
    const val = config[key];
    if (typeof fallback === "number") {
      const parsed = Number(val);
      return (Number.isFinite(parsed) ? parsed : fallback) as unknown as T;
    }
    if (typeof fallback === "boolean") {
      return (val === true || val === "true" || val === 1 || val === "1") as unknown as T;
    }
    return val as T;
  }
  return fallback as T;
}

/**
 * Permet de forcer une mise à jour locale immédiate après modification admin
 */
export function updateLocalConfig(key: string, value: ConfigValue) {
  const updated = { ...(cachedConfig || {}), [key]: value };
  notifyListeners(updated);
}
