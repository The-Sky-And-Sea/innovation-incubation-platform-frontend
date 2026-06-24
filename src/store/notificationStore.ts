/**
 * 通知状态管理（zustand）
 *
 * 功能：
 * - 定时轮询拉取通知（模拟 SSE 推送）
 * - 未读数量统计（用于顶部铃铛角标）
 * - 标记已读
 * - 心跳保活（控制轮询间隔）
 */

import { create } from "zustand";
import type { Notification } from "../types";
import { fetchNotifications, markNotificationsRead } from "../api/notifications";

interface NotificationState {
  /** 通知列表 */
  list: Notification[];
  /** 未读数量 */
  unreadCount: number;
  /** 是否正在加载 */
  loading: boolean;
  /** 轮询定时器 ID */
  _intervalId: ReturnType<typeof setInterval> | null;

  /** 启动轮询（进入通知页时调用） */
  startPolling: (userId?: number) => void;
  /** 停止轮询（离开通知页时调用） */
  stopPolling: () => void;
  /** 手动刷新 */
  refresh: (userId?: number) => Promise<void>;
  /** 标记已读（支持批量） */
  markAsRead: (ids: number[]) => Promise<void>;
  /** 标记全部已读 */
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  list: [],
  unreadCount: 0,
  loading: false,
  _intervalId: null,

  /** 开始定时轮询（每 30 秒检查一次，模拟 SSE） */
  startPolling: (userId = 1) => {
    // 先停止旧的
    const prev = get()._intervalId;
    if (prev) clearInterval(prev);

    // 立即拉取一次
    get().refresh(userId);

    // 每 30 秒拉取一次（模拟 SSE heartbeat）
    const id = setInterval(() => {
      get().refresh(userId);
    }, 30000);

    set({ _intervalId: id });
  },

  stopPolling: () => {
    const id = get()._intervalId;
    if (id) {
      clearInterval(id);
      set({ _intervalId: null });
    }
  },

  refresh: async (userId = 1) => {
    set({ loading: true });
    try {
      const res = await fetchNotifications(userId);
      set({ list: res.data.list, unreadCount: res.data.unread_count, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  markAsRead: async (ids) => {
    try {
      await markNotificationsRead(ids);
      // 更新本地状态
      set((state) => ({
        list: state.list.map((n) =>
          ids.includes(n.id) ? { ...n, is_read: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - ids.length),
      }));
    } catch {
      // ignore
    }
  },

  markAllAsRead: async () => {
    const unreadIds = get().list.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await get().markAsRead(unreadIds);
    }
  },
}));