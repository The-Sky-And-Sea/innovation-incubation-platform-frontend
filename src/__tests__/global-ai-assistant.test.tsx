import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAgentSession,
  deleteAgentSession,
  getAgentSession,
  listAgentSessions,
  sendAgentMessageStream,
} from "../api/agent";
import GlobalAiAssistant from "../components/GlobalAiAssistant";
import { useAuthStore } from "../store/authStore";

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
    deleteAgentSession: vi.fn(async () => undefined),
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
    <MemoryRouter>
      <GlobalAiAssistant />
    </MemoryRouter>,
  );
}

async function openAssistant(container: HTMLElement) {
  const trigger = container.querySelector<HTMLButtonElement>(".enterprise-ai-collapsed-trigger");
  expect(trigger).toBeTruthy();
  await userEvent.setup().click(trigger!);
}

async function openHistoryPanel(container: HTMLElement) {
  const historyToggle = container.querySelector<HTMLButtonElement>(".enterprise-ai-history-toggle");
  expect(historyToggle).toBeTruthy();
  await userEvent.setup().click(historyToggle!);
}

describe("GlobalAiAssistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "test-token");
  });

  it("shows tools from the composer and sends through SSE", async () => {
    const user = userEvent.setup();
    const { container } = renderAssistant();

    await openAssistant(container);
    await waitFor(() => expect(listAgentSessions).toHaveBeenCalled());

    expect(container.querySelectorAll<HTMLButtonElement>(".enterprise-ai-tabs button")).toHaveLength(2);

    const toolToggle = container.querySelector<HTMLButtonElement>(".enterprise-ai-tool-toggle");
    expect(toolToggle).toBeTruthy();
    await user.click(toolToggle!);

    const toolCard = container.querySelector<HTMLElement>(".enterprise-ai-tool-list article");
    expect(toolCard).toBeTruthy();
    expect(toolCard).not.toHaveTextContent("填入");

    const input = container.querySelector<HTMLTextAreaElement>(".enterprise-ai-composer textarea");
    expect(input).toBeTruthy();
    await user.type(input!, "请帮我查询企业画像");
    await user.click(container.querySelector<HTMLButtonElement>(".enterprise-ai-send")!);

    await waitFor(() => {
      expect(createAgentSession).toHaveBeenCalled();
      expect(sendAgentMessageStream).toHaveBeenCalledWith(
        77,
        expect.stringContaining("请帮我查询企业画像"),
        expect.objectContaining({ role: "enterprise" }),
        expect.any(Object),
      );
    });
    expect(await screen.findByText("AI 服务暂不可用，请稍后重试")).toBeInTheDocument();
  });

  it("keeps history out of the workbench and opens it from the header button", async () => {
    vi.mocked(listAgentSessions).mockResolvedValueOnce([
      { id: 11, title: "会话一", message_count: 2, last_message_at: "2026-07-04T00:00:00Z" },
    ]);
    const user = userEvent.setup();
    const { container } = renderAssistant();

    await openAssistant(container);
    await user.click(screen.getByRole("button", { name: "工作台" }));
    expect(screen.queryByText("会话一")).not.toBeInTheDocument();

    await openHistoryPanel(container);
    expect(await screen.findByText("会话一")).toBeInTheDocument();
  });

  it("opens a history session from the header history panel", async () => {
    vi.mocked(listAgentSessions).mockResolvedValueOnce([
      { id: 66, title: "字段兼容会话", message_count: 2, last_message_at: "2026-07-04T00:00:00Z" },
    ]);
    vi.mocked(getAgentSession).mockResolvedValueOnce({
      session: { id: 66, title: "字段兼容会话", message_count: 2, last_message_at: "2026-07-04T00:00:00Z" },
      messages: [
        { id: 661, role: "user", message: "历史里的问题" },
        { id: 662, role: "assistant", message: "历史里的回答" },
      ] as any,
    });
    const { container } = renderAssistant();

    await openAssistant(container);
    await openHistoryPanel(container);
    await screen.findByText("字段兼容会话");
    await userEvent.setup().click(container.querySelector<HTMLButtonElement>(".enterprise-ai-session-open")!);

    expect(await screen.findByText("历史里的问题")).toBeInTheDocument();
    expect(screen.getByText("历史里的回答")).toBeInTheDocument();
  });

  it("deletes a history session from the header history panel", async () => {
    vi.mocked(listAgentSessions).mockResolvedValueOnce([
      { id: 21, title: "待删除会话", message_count: 1, last_message_at: "2026-07-04T00:00:00Z" },
      { id: 22, title: "保留会话", message_count: 1, last_message_at: "2026-07-04T00:00:00Z" },
    ]);
    const user = userEvent.setup();
    const { container } = renderAssistant();

    await openAssistant(container);
    await openHistoryPanel(container);
    expect(await screen.findByText("待删除会话")).toBeInTheDocument();

    await user.click(container.querySelector<HTMLButtonElement>(".enterprise-ai-session-delete")!);

    await waitFor(() => expect(deleteAgentSession).toHaveBeenCalledWith(21));
    expect(screen.queryByText("待删除会话")).not.toBeInTheDocument();
    expect(screen.getByText("保留会话")).toBeInTheDocument();
  });
});
