/**
 * 对话助手 Chat API 层
 *
 * 接口：
 * - POST   /chat/sessions             创建会话
 * - GET    /chat/sessions              会话列表
 * - GET    /chat/sessions/:id          会话详情（含消息列表）
 * - DELETE /chat/sessions/:id          删除会话
 * - POST   /chat/sessions/:id/messages 发送消息（SSE 流式，第二阶段实现）
 * - PUT    /chat/sessions/:id/messages/:messageId 编辑重发（第三阶段实现）
 */

import type {
  ApiResponse,
  ChatCreateRequest,
  ChatMessage,
  ChatSendRequest,
  ChatSession,
} from "../types";
import { ssePost, ssePut, type SseCallbacks } from "../utils/sse";

/** 创建会话 */
export async function createChatSession(
  data: ChatCreateRequest,
): Promise<ApiResponse<ChatSession>> {
  const { post } = await import("../utils/request");
  return post("/chat/sessions", data);
}

/** 获取会话列表（按 last_message_at DESC 排序） */
export async function getChatSessions(): Promise<
  ApiResponse<ChatSession[]>
> {
  const { get } = await import("../utils/request");
  return get("/chat/sessions");
}

/** 获取会话详情（含全部消息列表） */
export async function getChatSession(
  id: number,
): Promise<ApiResponse<ChatSession & { messages: ChatMessage[] }>> {
  const { get } = await import("../utils/request");
  return get(`/chat/sessions/${id}`);
}

/** 删除会话（软删除） */
export async function deleteChatSession(
  id: number,
): Promise<ApiResponse<null>> {
  const { del } = await import("../utils/request");
  return del(`/chat/sessions/${id}`);
}

/**
 * 发送消息（SSE 流式）
 *
 * POST /chat/sessions/:id/messages
 * Content-Type: text/event-stream
 *
 * @returns AbortController 用于中断请求
 */
export function sendChatMessage(
  sessionId: number,
  data: ChatSendRequest,
  callbacks: SseCallbacks,
): Promise<AbortController> {
  return ssePost(
    `/chat/sessions/${sessionId}/messages`,
    data,
    callbacks,
  );
}

/**
 * 编辑重发消息（SSE 流式）
 *
 * PUT /chat/sessions/:id/messages/:messageId
 * 只允许编辑会话中最后一条 role=user 的消息。
 * 成功后后端会软删旧消息并插入新消息。
 *
 * @returns AbortController 用于中断请求
 */
export function editChatMessage(
  sessionId: number,
  messageId: number,
  data: ChatSendRequest,
  callbacks: SseCallbacks,
): Promise<AbortController> {
  return ssePut(
    `/chat/sessions/${sessionId}/messages/${messageId}`,
    data,
    callbacks,
  );
}
