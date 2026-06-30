import { create } from "zustand";
import {
  fetchNotifications,
  markNotificationsRead,
  subscribeNotificationStream,
} from "../api/notifications";
import type { Notification } from "../types";

interface NotificationState {
  list: Notification[];
  unreadCount: number;
  loading: boolean;
  _intervalId: ReturnType<typeof setInterval> | null;
  _unsubscribeStream: (() => void) | null;
  startPolling: (userId?: number) => void;
  stopPolling: () => void;
  refresh: (userId?: number) => Promise<void>;
  markAsRead: (ids: number[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

function mergeNotification(list: Notification[], item: Notification) {
  const exists = list.some((current) => current.id === item.id);
  if (exists) {
    return list.map((current) => (current.id === item.id ? item : current));
  }
  return [item, ...list];
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  list: [],
  unreadCount: 0,
  loading: false,
  _intervalId: null,
  _unsubscribeStream: null,

  startPolling: (userId = 1) => {
    get().stopPolling();
    get().refresh(userId);

    const unsubscribe = subscribeNotificationStream(
      (notification) => {
        if (notification.user_id !== userId) return;
        set((state) => {
          const nextList = mergeNotification(state.list, notification);
          return {
            list: nextList,
            unreadCount: nextList.filter((item) => !item.is_read).length,
          };
        });
      },
      () => {
        // SSE 失败时保持轮询兜底，不在 UI 中打断用户。
      },
    );

    const intervalId = setInterval(() => {
      get().refresh(userId);
    }, 30000);

    set({ _intervalId: intervalId, _unsubscribeStream: unsubscribe });
  },

  stopPolling: () => {
    const { _intervalId, _unsubscribeStream } = get();
    if (_intervalId) clearInterval(_intervalId);
    if (_unsubscribeStream) _unsubscribeStream();
    set({ _intervalId: null, _unsubscribeStream: null });
  },

  refresh: async (userId = 1) => {
    set({ loading: true });
    try {
      const res = await fetchNotifications(userId);
      set({
        list: res.data.list,
        unreadCount: res.data.unread_count,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  markAsRead: async (ids) => {
    try {
      await markNotificationsRead(ids);
      set((state) => {
        const nextList = state.list.map((item) =>
          ids.includes(item.id) ? { ...item, is_read: true } : item,
        );
        return {
          list: nextList,
          unreadCount: nextList.filter((item) => !item.is_read).length,
        };
      });
    } catch {
      // 页面保留当前状态，下一次刷新会恢复真实数据。
    }
  },

  markAllAsRead: async () => {
    const unreadIds = get().list.filter((item) => !item.is_read).map((item) => item.id);
    if (unreadIds.length > 0) {
      await get().markAsRead(unreadIds);
    }
  },
}));
