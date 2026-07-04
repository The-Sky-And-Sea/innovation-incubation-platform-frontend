import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GlobalAiAssistant from "../components/GlobalAiAssistant";
import { useAuthStore } from "../store/authStore";
import { createAgentSession, listAgentSessions, sendAgentMessageStream } from "../api/agent";

vi.mock("../api/agent", async () => {
  const actual = await vi.importActual<typeof import("../api/agent")>("../api/agent");
  return {
    ...actual,
    listAgentSessions: vi.fn(async () => []),
    createAgentSession: vi.fn(async (title: string) => ({
      id: 77,
      user_id: 8,
      title,
      message_count: 0,
      last_message_at: "2026-07-04T00:00:00Z",
      created_at: "2026-07-04T00:00:00Z",
      updated_at: "2026-07-04T00:00:00Z",
    })),
    getAgentSession: vi.fn(),
    deleteAgentSession: vi.fn(),
    sendAgentMessageStream: vi.fn(async (_sessionId: number, _content: string, _state: unknown, callbacks: any) => {
      callbacks.onError?.("AI 服务暂不可用，请稍后重试");
    }),
  };
});

function renderAssistant() {
  useAuthStore.setState({
    token: "test-token",
    user: { id: 8, role: "enterprise", credit_code: "111", name: "测试企业" },
    loading: false,
  });

  return render(
    <MemoryRouter initialEntries={["/enterprise/dashboard"]}>
      <GlobalAiAssistant />
    </MemoryRouter>,
  );
}

describe("GlobalAiAssistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "test-token");
  });

  it("keeps the original icon, places agent tools in the tools tab, and sends through SSE", async () => {
    const user = userEvent.setup();
    const { container } = renderAssistant();

    expect(container.querySelectorAll(".enterprise-ai-mini-face i")).toHaveLength(2);

    await user.click(screen.getByLabelText("展开 AI 助手"));
    await waitFor(() => expect(listAgentSessions).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /工具/ }));
    expect(screen.getByText("可调用工具")).toBeInTheDocument();

    const toolButton = container.querySelector<HTMLButtonElement>(".enterprise-ai-tool-list button");
    expect(toolButton).toBeTruthy();
    await user.click(toolButton!);

    const input = screen.getByLabelText("输入给 AI 助手的问题");
    expect(input).toHaveValue("请使用政策检索：根据关键词、行业、企业规模等条件检索匹配政策。");

    await user.click(screen.getByLabelText("发送"));

    await waitFor(() => {
      expect(createAgentSession).toHaveBeenCalled();
      expect(sendAgentMessageStream).toHaveBeenCalledWith(
        77,
        expect.stringContaining("请使用"),
        expect.objectContaining({ role: "enterprise" }),
        expect.any(Object),
      );
    });
    expect(await screen.findByText("AI 服务暂不可用，请稍后重试")).toBeInTheDocument();
  });
});
