import { API_BASE_URL, isMockEnabled } from "./config";
import { mockApi } from "./mock";
import type { ApiResponse, Notification, NotificationType } from "../types";

let notificationIdCounter = 5000;
const mockNotifications: Notification[] = [];

function seedNotifications() {
  if (mockNotifications.length > 0) return;
  const now = new Date().toISOString();

  mockNotifications.push(
    {
      id: ++notificationIdCounter,
      user_id: 1,
      type: "incubation_reviewed",
      title: "入驻审核结果已出",
      content: "你的入驻申请已通过，请继续完善企业资料。",
      target_type: "incubation",
      target_id: 201,
      is_read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: ++notificationIdCounter,
      user_id: 1,
      type: "policy_published",
      title: "新政策已发布",
      content: "2026 年高新技术企业研发补贴已开放申报。",
      target_type: "policy",
      target_id: 601,
      is_read: false,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: ++notificationIdCounter,
      user_id: 2,
      type: "incubation_pending",
      title: "新的入驻申请待审核",
      content: "测试科技有限公司提交了入驻申请，请及时处理。",
      target_type: "incubation",
      target_id: 201,
      is_read: false,
      created_at: now,
    },
    {
      id: ++notificationIdCounter,
      user_id: 2,
      type: "change_pending",
      title: "企业变更申请待审核",
      content: "测试科技有限公司发起了企业名称变更。",
      target_type: "change",
      target_id: 301,
      is_read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: ++notificationIdCounter,
      user_id: 3,
      type: "application_carrier_approved",
      title: "新的政策申报需要终审",
      content: "载体已初审通过一条政策申报，等待政务终审。",
      target_type: "application",
      target_id: 702,
      is_read: false,
      created_at: now,
    },
    {
      id: ++notificationIdCounter,
      user_id: 3,
      type: "deletion_applied",
      title: "账号注销申请待审核",
      content: "有企业提交了账号注销申请。",
      target_type: "account",
      target_id: 1,
      is_read: false,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  );
}

seedNotifications();

export async function fetchNotifications(
  userId = 1,
  limit = 50,
): Promise<ApiResponse<{ list: Notification[]; unread_count: number }>> {
  if (isMockEnabled()) {
    const userNotifications = mockNotifications
      .filter((item) => item.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const list = userNotifications.slice(0, limit);
    const unread_count = userNotifications.filter((item) => !item.is_read).length;
    return mockApi({ list, unread_count }, 300);
  }

  const { get } = await import("../utils/request");
  const res = await get<{ list: Notification[]; unread_count?: number }>("/notifications", {
    page: 1,
    page_size: limit,
  });
  const unreadCount = res.data.unread_count ?? res.data.list.filter((item) => !item.is_read).length;
  return { ...res, data: { list: res.data.list, unread_count: unreadCount } };
}

export async function markNotificationsRead(ids: number[]): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    ids.forEach((id) => {
      const notification = mockNotifications.find((item) => item.id === id);
      if (notification) notification.is_read = true;
    });
    return mockApi(null);
  }

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
  const notification: Notification = {
    id: ++notificationIdCounter,
    user_id: userId,
    type,
    title,
    content,
    target_type: targetType,
    target_id: targetId,
    is_read: false,
    created_at: new Date().toISOString(),
  };
  mockNotifications.push(notification);
  return notification;
}

export function subscribeNotificationStream(
  onNotification: (notification: Notification) => void,
  onError?: (error: unknown) => void,
): () => void {
  if (isMockEnabled()) {
    const timer = window.setInterval(() => {
      const latest = mockNotifications[mockNotifications.length - 1];
      if (latest) onNotification(latest);
    }, 30000);
    return () => window.clearInterval(timer);
  }

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
