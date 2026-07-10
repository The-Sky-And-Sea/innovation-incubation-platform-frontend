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

function mergeNotifications(list: Notification[], items: Notification[]) {
  return items.reduce((nextList, item) => mergeNotification(nextList, item), list);
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
      (payload) => {
        const notifications = Array.isArray(payload) ? payload : [payload];
        const userNotifications = notifications.filter((notification) => notification.user_id === userId);
        if (userNotifications.length === 0) return;
        set((state) => {
          const nextList = mergeNotifications(state.list, userNotifications);
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
    // 乐观更新本地状态（先让 UI 立即反馈）
    set((state) => {
      const nextList = state.list.map((item) =>
        ids.includes(item.id) ? { ...item, is_read: true } : item,
      );
      return {
        list: nextList,
        unreadCount: nextList.filter((item) => !item.is_read).length,
      };
    });
    // 异步同步到后端；失败仅记录日志，不回滚（避免频繁刷新导致状态闪烁）
    try {
      await markNotificationsRead(ids);
    } catch (err) {
      console.error("[notification] 标为已读失败（本地状态已更新，请检查后端服务）", err);
    }
  },

  markAllAsRead: async () => {
    const unreadIds = get().list.filter((item) => !item.is_read).map((item) => item.id);
    if (unreadIds.length > 0) {
      await get().markAsRead(unreadIds);
    }
  },
}));
