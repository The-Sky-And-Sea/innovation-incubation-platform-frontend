import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAgentQuickPrompts,
  getAgentToolCatalog,
  parseAgentSSEBuffer,
  sendAgentMessageStream,
} from "../api/agent";

describe("agent assistant API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes backend-registered tools by role", () => {
    expect(getAgentToolCatalog("enterprise").map((tool) => tool.name)).toEqual(
      expect.arrayContaining(["search_policy", "query_enterprise_info", "query_my_files"]),
    );
    expect(getAgentToolCatalog("carrier").map((tool) => tool.name)).toEqual(
      expect.arrayContaining(["query_pending_incubations", "query_applications_by_status"]),
    );
    expect(getAgentToolCatalog("government")).toEqual([]);
  });

  it("keeps role-specific quick prompts", () => {
    expect(getAgentQuickPrompts("enterprise")[0]).toContain("政策");
    expect(getAgentQuickPrompts("carrier")[0]).toContain("审核");
    expect(getAgentQuickPrompts("government")[0]).toContain("终审");
  });

  it("parses streamed backend SSE frames", () => {
    const events: unknown[] = [];
    const rest = parseAgentSSEBuffer(
      'data: {"type":"thinking","data":"正在"}\n\n' +
        'data: {"type":"reply","data":"处理完成"}\n\n' +
        'data: {"type":"done","data":null}\n\n',
      (event) => events.push(event),
    );

    expect(rest).toBe("");
    expect(events).toEqual([
      { type: "thinking", data: "正在" },
      { type: "reply", data: "处理完成" },
      { type: "done", data: null },
    ]);
  });

  it("posts chat messages and dispatches stream callbacks", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"thinking","data":"分析"}\n\n'));
        controller.enqueue(encoder.encode('data: {"type":"reply","data":"可以申报"}\n\n'));
        controller.close();
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(body, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const onThinking = vi.fn();
    const onReply = vi.fn();
    await sendAgentMessageStream(7, "帮我查政策", { current_page: "/enterprise/dashboard" }, { onThinking, onReply });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/chat/sessions/7/messages"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          content: "帮我查政策",
          state: { current_page: "/enterprise/dashboard" },
        }),
      }),
    );
    expect(onThinking).toHaveBeenCalledWith("分析");
    expect(onReply).toHaveBeenCalledWith("可以申报");
  });

  it("sanitizes upstream authentication errors from SSE", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"type":"error","data":{"message":"error, status code: 401, status: 401 Unauthorized, message: invalid character \\"A\\" looking for beginning of value, body: Authentication Fails (governor)"}}\n\n',
          ),
        );
        controller.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));

    const onError = vi.fn();
    await sendAgentMessageStream(7, "你好", { current_page: "/enterprise/dashboard" }, { onError });

    expect(onError).toHaveBeenCalledWith("AI 服务鉴权失败，请联系管理员检查模型 API Key。");
  });
});
