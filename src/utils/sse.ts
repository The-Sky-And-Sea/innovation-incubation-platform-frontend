/**
 * SSE 流式请求工具
 *
 * 基于 fetch + ReadableStream reader 解析 text/event-stream 格式。
 * Chat 发送消息接口使用 POST 请求 + SSE 响应流。
 *
 * 事件格式（data: <JSON>\n\n）：
 * - { type: "thinking" } → 思考过程片段（增量）
 * - { type: "reply" }    → Agent 最终回复
 * - { type: "error" }    → { message: string }
 * - { type: "done" }     → 流结束
 */

import { API_BASE_URL } from "../api/config";

/** SSE 事件回调 */
export interface SseCallbacks {
  /** 思考过程片段（增量累积文本） */
  onThinking?: (chunk: string) => void;
  /** Agent 最终回复 */
  onReply?: (content: string) => void;
  /** 错误 */
  onError?: (message: string) => void;
  /** 流结束 */
  onDone?: () => void;
}

/** SSE POST 请求（用于 Chat 发送消息） */
export async function ssePost(
  url: string,
  body: unknown,
  callbacks: SseCallbacks,
): Promise<AbortController> {
  const controller = new AbortController();
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  if (!response.ok) {
    // 非 2xx 响应：尝试解析 JSON 错误
    try {
      const errBody = await response.json();
      callbacks.onError?.(errBody.message || `请求失败 (${response.status})`);
    } catch {
      callbacks.onError?.(`请求失败 (${response.status})`);
    }
    callbacks.onDone?.();
    return controller;
  }

  if (!response.body) {
    callbacks.onError?.("响应体为空");
    callbacks.onDone?.();
    return controller;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // 异步读取流（不阻塞返回 AbortController）
  (async () => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const dataLine = chunk
            .split("\n")
            .find((line) => line.startsWith("data:"));
          if (!dataLine) continue;

          const jsonStr = dataLine.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);
            dispatchEvent(event, callbacks);
          } catch {
            // 忽略解析失败的单条事件
          }
        }
      }

      // 处理缓冲区剩余数据
      if (buffer.trim()) {
        const dataLine = buffer
          .split("\n")
          .find((line) => line.startsWith("data:"));
        if (dataLine) {
          try {
            const event = JSON.parse(dataLine.slice(5).trim());
            dispatchEvent(event, callbacks);
          } catch {
            // 忽略
          }
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        callbacks.onError?.("流读取中断");
      }
    } finally {
      callbacks.onDone?.();
    }
  })();

  return controller;
}

interface SseEvent {
  type?: string;
  content?: string;
  message?: string;
}

function dispatchEvent(event: SseEvent, callbacks: SseCallbacks) {
  switch (event.type) {
    case "thinking":
      if (event.content !== undefined) {
        callbacks.onThinking?.(event.content);
      }
      break;
    case "reply":
      if (event.content !== undefined) {
        callbacks.onReply?.(event.content);
      }
      break;
    case "error":
      callbacks.onError?.(event.message || "未知错误");
      break;
    case "done":
      callbacks.onDone?.();
      break;
    default:
      // 未知事件类型，忽略
      break;
  }
}