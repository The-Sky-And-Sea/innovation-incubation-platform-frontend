/**
 * Chat 对话助手测试
 *
 * 覆盖聊天 API 层、SSE 工具层、类型定义
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { ChatSession, ChatMessage, ChatSendRequest } from "../types";

// ==================== 类型定义测试 ====================
describe("Chat 类型定义", () => {
  it("ChatSession 包含所有必需字段", () => {
    const session: ChatSession = {
      id: 1,
      title: "测试会话",
      message_count: 3,
      last_message_at: "2026-07-05T12:00:00Z",
      created_at: "2026-07-05T10:00:00Z",
      updated_at: "2026-07-05T12:00:00Z",
    };
    expect(session.id).toBe(1);
    expect(session.title).toBe("测试会话");
    expect(session.message_count).toBe(3);
  });

  it("ChatMessage 支持 user 和 assistant 两种角色", () => {
    const userMsg: ChatMessage = {
      id: 1,
      session_id: 1,
      role: "user",
      content: "你好",
      state: { current_policy_id: 123 },
      created_at: "2026-07-05T10:00:00Z",
    };
    expect(userMsg.role).toBe("user");
    expect(userMsg.state?.current_policy_id).toBe(123);

    const assistantMsg: ChatMessage = {
      id: 2,
      session_id: 1,
      role: "assistant",
      content: "你好，请问有什么可以帮助你的？",
      created_at: "2026-07-05T10:00:01Z",
    };
    expect(assistantMsg.role).toBe("assistant");
    expect(assistantMsg.state).toBeUndefined();
  });

  it("ChatSendRequest content 必填，state 可选", () => {
    const req1: ChatSendRequest = { content: "查询政策" };
    expect(req1.content).toBe("查询政策");
    expect(req1.state).toBeUndefined();

    const req2: ChatSendRequest = {
      content: "这个政策符合条件吗？",
      state: { 当前浏览政策ID: 601 },
    };
    expect(req2.state?.["当前浏览政策ID"]).toBe(601);
  });
});

// ==================== Chat API 层测试 (mock fetch) ====================
describe("Chat API 层", () => {
  const BASE = "http://api.test/api/v1";

  function mockFetch(data: unknown, status = 200) {
    return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 0, message: "success", data }), {
        status,
        headers: { "Content-Type": "application/json" },
      })
    );
  }

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_API_BASE_URL", BASE);
    localStorage.setItem("token", "test-token-chat");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.unstubAllEnvs();
  });

  it("createChatSession 应发送 POST 到 /chat/sessions", async () => {
    const session: ChatSession = {
      id: 1,
      title: "政策咨询",
      message_count: 0,
      last_message_at: "2026-07-05T10:00:00Z",
      created_at: "2026-07-05T10:00:00Z",
      updated_at: "2026-07-05T10:00:00Z",
    };
    const fetchSpy = mockFetch(session);

    const { createChatSession } = await import("../api/chat");
    const res = await createChatSession({ title: "政策咨询" });

    expect(res.data.title).toBe("政策咨询");
    expect(res.data.message_count).toBe(0);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe(`${BASE}/chat/sessions`);
    expect(fetchSpy.mock.calls[0][1]?.method).toBe("POST");
    expect(fetchSpy.mock.calls[0][1]?.body).toContain("政策咨询");
  });

  it("getChatSessions 应发送 GET 到 /chat/sessions", async () => {
    const sessions: ChatSession[] = [
      { id: 1, title: "会话1", message_count: 2, last_message_at: "2026-07-05T11:00:00Z", created_at: "2026-07-05T10:00:00Z", updated_at: "2026-07-05T11:00:00Z" },
      { id: 2, title: "会话2", message_count: 5, last_message_at: "2026-07-05T12:00:00Z", created_at: "2026-07-05T09:00:00Z", updated_at: "2026-07-05T12:00:00Z" },
    ];
    const fetchSpy = mockFetch(sessions);

    const { getChatSessions } = await import("../api/chat");
    const res = await getChatSessions();

    expect(res.data).toHaveLength(2);
    expect(res.data[0].title).toBe("会话1");
    expect(res.data[1].message_count).toBe(5);
    expect(fetchSpy.mock.calls[0][0]).toBe(`${BASE}/chat/sessions`);
    expect(fetchSpy.mock.calls[0][1]?.method).toBe("GET");
  });

  it("getChatSession 应发送 GET 到 /chat/sessions/:id 并返回消息列表", async () => {
    const messages: ChatMessage[] = [
      { id: 1, session_id: 1, role: "user", content: "你好", created_at: "2026-07-05T10:00:00Z" },
      { id: 2, session_id: 1, role: "assistant", content: "你好！", created_at: "2026-07-05T10:00:01Z" },
    ];
    const sessionWithMessages = {
      id: 1,
      title: "测试会话",
      message_count: 2,
      last_message_at: "2026-07-05T10:00:01Z",
      created_at: "2026-07-05T10:00:00Z",
      updated_at: "2026-07-05T10:00:01Z",
      messages,
    };
    const fetchSpy = mockFetch(sessionWithMessages);

    const { getChatSession } = await import("../api/chat");
    const res = await getChatSession(1);

    expect(res.data.id).toBe(1);
    expect(res.data.messages).toHaveLength(2);
    expect(res.data.messages[0].role).toBe("user");
    expect(res.data.messages[1].role).toBe("assistant");
    expect(fetchSpy.mock.calls[0][0]).toBe(`${BASE}/chat/sessions/1`);
  });

  it("deleteChatSession 应发送 DELETE 到 /chat/sessions/:id", async () => {
    const fetchSpy = mockFetch(null);

    const { deleteChatSession } = await import("../api/chat");
    const res = await deleteChatSession(1);

    expect(res.code).toBe(0);
    expect(fetchSpy.mock.calls[0][0]).toBe(`${BASE}/chat/sessions/1`);
    expect(fetchSpy.mock.calls[0][1]?.method).toBe("DELETE");
  });

  it("createChatSession 失败时应抛出异常", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 50000, message: "服务器内部错误", data: null }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { createChatSession } = await import("../api/chat");
    await expect(createChatSession({ title: "测试" })).rejects.toThrow("服务器内部错误");
  });
});

// ==================== SSE 流式工具测试 ====================
describe("SSE 流式工具", () => {
  const BASE = "http://api.test/api/v1";

  function createSSEResponse(events: string[]) {
    const body = events.join("\n\n") + "\n\n";
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(body));
        controller.close();
      },
    });
    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_API_BASE_URL", BASE);
    localStorage.setItem("token", "test-token-sse");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.unstubAllEnvs();
  });

  it("ssePost 应发送 POST 请求并解析 events", async () => {
    const events = [
      'data: {"type":"thinking","content":"正在思考..."}',
      'data: {"type":"reply","content":"好的，我来帮你查询。"}',
      'data: {"type":"done"}',
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(createSSEResponse(events));

    const { ssePost } = await import("../utils/sse");

    const chunks: string[] = [];
    let replyReceived = "";
    let doneReceived = false;

    const controller = await ssePost(
      "/chat/sessions/1/messages",
      { content: "帮我查政策" },
      {
        onThinking: (chunk) => chunks.push(chunk),
        onReply: (content) => { replyReceived = content; },
        onDone: () => { doneReceived = true; },
      },
    );

    // 等一小段让异步读取完成
    await vi.waitFor(() => {
      expect(chunks).toContain("正在思考...");
      expect(replyReceived).toBe("好的，我来帮你查询。");
      expect(doneReceived).toBe(true);
    }, { timeout: 1000 });

    expect(controller).toBeDefined();
    expect(typeof controller.abort).toBe("function");
  });

  it("ssePost 应处理 error 事件", async () => {
    const events = [
      'data: {"type":"error","message":"消息超过最大长度限制"}',
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(createSSEResponse(events));

    const { ssePost } = await import("../utils/sse");

    let errorMsg = "";

    await ssePost(
      "/chat/sessions/1/messages",
      { content: "x".repeat(5000) },
      {
        onError: (msg) => { errorMsg = msg; },
      },
    );

    await vi.waitFor(() => {
      expect(errorMsg).toBe("消息超过最大长度限制");
    }, { timeout: 1000 });
  });

  it("ssePost 应处理 HTTP 错误响应", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 10002, message: "会话不存在", data: null }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { ssePost } = await import("../utils/sse");

    let errorMsg = "";

    await ssePost(
      "/chat/sessions/999/messages",
      { content: "你好" },
      {
        onError: (msg) => { errorMsg = msg; },
      },
    );

    expect(errorMsg).toBe("会话不存在");
  });

  it("ssePut 应发送 PUT 请求", async () => {
    const events = [
      'data: {"type":"reply","content":"已重新生成回复。"}',
      'data: {"type":"done"}',
    ];

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(createSSEResponse(events));

    const { ssePut } = await import("../utils/sse");

    let reply = "";

    await ssePut(
      "/chat/sessions/1/messages/5",
      { content: "修改后的内容" },
      {
        onReply: (content) => { reply = content; },
      },
    );

    await vi.waitFor(() => {
      expect(reply).toBe("已重新生成回复。");
      expect(fetchSpy.mock.calls[0][1]?.method).toBe("PUT");
      expect(fetchSpy.mock.calls[0][0]).toBe(`${BASE}/chat/sessions/1/messages/5`);
    }, { timeout: 1000 });
  });

  it("ssePost support AbortController", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(createSSEResponse(['data: {"type":"thinking","content":"思考中..."}']));

    const { ssePost } = await import("../utils/sse");

    const controller = await ssePost(
      "/chat/sessions/1/messages",
      { content: "测试中断" },
      {},
    );

    // 调用 abort 不应抛出异常
    expect(() => controller.abort()).not.toThrow();
  });
});