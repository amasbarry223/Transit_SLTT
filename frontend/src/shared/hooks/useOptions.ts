"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { logWarn } from "@/shared/logger";

export interface StatusOptionItem {
  id: string;
  entityType: string;
  value: string;
  label: string;
  color?: string;
  icon?: string;
  orderIndex: number;
}

const optionsCache: Record<string, StatusOptionItem[]> = {};

export function useStatusOptions(entityType: string) {
  const [options, setOptions] = useState<StatusOptionItem[]>(optionsCache[entityType] || []);
  const [isLoading, setIsLoading] = useState<boolean>(!optionsCache[entityType]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (optionsCache[entityType]) {
        setOptions(optionsCache[entityType]);
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.config.getStatuses(entityType);
        if (!cancelled && res?.data) {
          optionsCache[entityType] = res.data;
          setOptions(res.data);
        }
      } catch (err) {
        logWarn(`[useStatusOptions] Erreur chargement statuts ${entityType}`, err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [entityType]);

  return {
    data: options,
    options,
    isLoading,
  };
}

export function usePaymentMethods() {
  return useStatusOptions("paiement_mode");
}

export function useFournisseurTypes() {
  return useStatusOptions("fournisseur_type");
}

export function useClientTypes() {
  return useStatusOptions("client_type");
}

export function useVehiculeTypes() {
  return useStatusOptions("vehicule_type");
}

export function useDocumentTypes() {
  return useStatusOptions("document_type");
}
