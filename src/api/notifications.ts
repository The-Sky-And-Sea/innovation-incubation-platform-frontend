/**
 * SSE 通知机制 API 层
 *
 * 对应后端接口：
 * - GET  /notifications/subscribe    SSE 订阅（实时推送）
 * - PATCH /notifications/read        标记已读
 *
 * 覆盖 16 种通知事件：
 * incubation_pending, incubation_reviewed, change_pending, change_reviewed,
 * application_pending, application_carrier_approved, application_reviewed,
 * performance_submitted, performance_scored, policy_published, policy_updated,
 * incubation_graduated, deletion_applied, deletion_approved, deletion_rejected,
 * account_deleted
 *
 * Mock 模式：
 * - 不支持真实 SSE 连接，改用定时轮询 + 模拟事件注入
 * - 订阅时返回历史未读通知，之后每 30s 检查一次新通知
 * - 心跳保活由 store 层管理，API 层只负责数据
 */

import { mockApi } from "./mock";
import type { ApiResponse, Notification, NotificationType } from "../types";

const USE_MOCK = true;

// ============ Mock 数据 ============

let notificationIdCounter = 5000;
const mockNotifications: Notification[] = [];

/** 预置几条演示通知 */
function seedNotifications() {
  const now = new Date().toISOString();
  mockNotifications.push(
    {
      id: ++notificationIdCounter,
      user_id: 1,
      type: "incubation_pending",
      title: "有一份新的入驻申请待审核",
      content: "企业「测试科技有限公司」提交了入驻申请",
      target_type: "incubation",
      target_id: 201,
      is_read: false,
      created_at: now,
    },
    {
      id: ++notificationIdCounter,
      user_id: 1,
      type: "policy_published",
      title: "新政策已发布",
      content: "政务端发布了「2026年度高新技术企业补贴」政策",
      target_type: "policy",
      target_id: 601,
      is_read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: ++notificationIdCounter,
      user_id: 1,
      type: "incubation_reviewed",
      title: "入驻审核结果已出",
      content: "您的入驻申请 #201 已通过",
      target_type: "incubation",
      target_id: 201,
      is_read: false,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  );
}
seedNotifications();

/**
 * 获取当前用户的未读通知列表（模拟 SSE init 事件）
 * @param userId 用户 ID
 * @param limit 最多返回条数
 */
export async function fetchNotifications(
  userId = 1,
  limit = 50,
): Promise<ApiResponse<{ list: Notification[]; unread_count: number }>> {
  if (USE_MOCK) {
    const userNotifications = mockNotifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const unread = userNotifications.filter((n) => !n.is_read);
    const list = userNotifications.slice(0, limit);
    return mockApi({ list, unread_count: unread.length }, 300);
  }

  const { get } = await import("../utils/request");
  return get("/notifications/list", {
    user_id: String(userId),
    limit: String(limit),
  });
}

/**
 * 标记通知为已读
 * @param ids 通知 ID 数组（批量标记）
 */
export async function markNotificationsRead(
  ids: number[],
): Promise<ApiResponse<null>> {
  if (USE_MOCK) {
    ids.forEach((id) => {
      const n = mockNotifications.find((notif) => notif.id === id);
      if (n) n.is_read = true;
    });
    return mockApi(null);
  }

  const { patch } = await import("../utils/request");
  return patch("/notifications/read", { ids });
}

/**
 * 添加新通知（由业务层调用，模拟后端推送 event:update）
 * @param userId 接收者用户 ID
 * @param type 通知类型
 * @param title 标题
 * @param content 内容
 * @param targetType 关联业务类型
 * @param targetId 关联业务 ID
 */
export function pushNotification(
  userId: number,
  type: NotificationType,
  title: string,
  content: string,
  targetType: string,
  targetId: number,
): Notification {
  const id = ++notificationIdCounter;
  const notification: Notification = {
    id,
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