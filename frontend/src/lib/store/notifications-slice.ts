import type { StateCreator } from "zustand";
import type { AppNotification } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import { api } from "@/lib/api-client";

export interface NotificationsSlice {
  notifications: AppNotification[];
  notificationsUnread: number;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

export const createNotificationsSlice: StateCreator<SLTTState, [], [], NotificationsSlice> = (set, get) => ({
  notifications: [],
  notificationsUnread: 0,

  fetchNotifications: async () => {
    const { items, unreadCount } = await api.notifications.list(20);
    set({
      notifications: items.map((n) => ({
        id: n.id,
        titre: n.titre,
        message: n.message,
        lue: n.lue,
        lien: n.lien || undefined,
        createdAt: n.createdAt,
      })),
      notificationsUnread: unreadCount,
    });
  },

  // Optimiste : la cloche réagit au clic sans attendre le réseau ; un échec
  // est rattrapé au prochain cycle de rafraîchissement.
  markNotificationRead: async (id) => {
    const target = get().notifications.find((n) => n.id === id);
    if (!target || target.lue) return;
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, lue: true } : n)),
      notificationsUnread: Math.max(0, s.notificationsUnread - 1),
    }));
    await api.notifications.markRead(id);
  },

  markAllNotificationsRead: async () => {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, lue: true })), notificationsUnread: 0 }));
    await api.notifications.markAllRead();
  },
});
