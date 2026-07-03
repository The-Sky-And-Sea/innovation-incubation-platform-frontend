import { API_BASE_URL } from "./config";
import type { ApiResponse, Notification, NotificationType } from "../types";

type FetchNotificationsOptions = {
  page?: number;
  page_size?: number;
  userId?: number;
};

export async function fetchNotifications(
  optionsOrUserId: FetchNotificationsOptions | number = {},
  legacyLimit = 50,
): Promise<ApiResponse<{ list: Notification[]; unread_count: number }>> {
  const options = typeof optionsOrUserId === "number"
    ? { userId: optionsOrUserId, page: 1, page_size: legacyLimit }
    : optionsOrUserId;
  const page = options.page ?? 1;
  const pageSize = options.page_size ?? 50;

  const { get } = await import("../utils/request");
  const res = await get<{ list: Notification[]; unread_count: number }>("/notifications", {
    page,
    page_size: pageSize,
  });
  return res;
}

export async function markNotificationsRead(ids: number[]): Promise<ApiResponse<null>> {
  const { patch } = await import("../utils/request");
  return patch("/notifications/read", { ids });
}

export function pushNotification(
  userId: number,
  type: NotificationType,
  title: string,
  content: string,
  targetType: string,
  targetId: number,
): Notification {
  return {
    id: Date.now(),
    user_id: userId,
    type,
    title,
    content,
    target_type: targetType,
    target_id: targetId,
    is_read: false,
    created_at: new Date().toISOString(),
  };
}

export function subscribeNotificationStream(
  onNotification: (notification: Notification) => void,
  onError?: (error: unknown) => void,
): () => void {
  const controller = new AbortController();
  const token = localStorage.getItem("token");

  fetch(`${API_BASE_URL}/notifications/stream`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";
        chunks.forEach((chunk) => {
          const dataLine = chunk.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) return;
          try {
            onNotification(JSON.parse(dataLine.slice(5).trim()) as Notification);
          } catch (error) {
            onError?.(error);
          }
        });
      }
    })
    .catch((error) => {
      if (!controller.signal.aborted) onError?.(error);
    });

  return () => controller.abort();
}