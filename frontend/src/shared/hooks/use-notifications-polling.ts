"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

const POLL_INTERVAL_MS = 60_000;

/**
 * Rafraîchit les notifications de la cloche : au montage, toutes les 60 s
 * tant que l'onglet est visible, et dès que l'utilisateur y revient. Pas de
 * temps réel côté serveur (ni SSE ni websocket) : un sondage léger suffit
 * pour des notifications métier. Les échecs sont silencieux — une cloche
 * momentanément périmée ne justifie pas un toast d'erreur toutes les minutes.
 */
export function useNotificationsPolling(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const { fetchNotifications } = useStore.getState();
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      fetchNotifications().catch(() => {});
    };

    refresh();
    const timer = window.setInterval(refresh, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      // Fin de session : ne jamais laisser les notifications d'un compte
      // visibles au suivant sur le même poste.
      useStore.setState({ notifications: [], notificationsUnread: 0 });
    };
  }, [enabled]);
}
