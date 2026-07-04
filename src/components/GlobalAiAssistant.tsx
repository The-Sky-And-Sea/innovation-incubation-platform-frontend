import type { PointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CloseOutlined,
  DatabaseOutlined,
  HistoryOutlined,
  PlusOutlined,
  SendOutlined,
} from "@ant-design/icons";
import {
  createAgentSession,
  getAgentQuickPrompts,
  getAgentSession,
  getAgentToolCatalog,
  listAgentSessions,
  sendAgentMessageStream,
  type AgentChatSession,
} from "../api/agent";
import { useAuthStore } from "../store/authStore";
import type { UserRole } from "../types";

type AssistantTab = "chat" | "assistant" | "workbench";
type ChatMessage = {
  id: number | string;
  role: "user" | "assistant";
  text: string;
  status?: "error";
};

const roleAssistantMeta: Record<
  UserRole,
  { title: string; subtitle: string; prompt: string; scope: string; workbench: Array<{ label: string; path: string }> }
> = {
  enterprise: {
    title: "企业工作台助手",
    subtitle: "企业工作台助手",
    prompt: "可以帮你查政策、核材料、看进度，也会标出下一步办理入口。",
    scope: "政策申报、入驻材料、办理进度",
    workbench: [
      { label: "完善企业信息", path: "/enterprise/info" },
      { label: "上传文件材料", path: "/enterprise/files" },
      { label: "查看政策申报", path: "/enterprise/policies" },
    ],
  },
  carrier: {
    title: "载体工作台助手",
    subtitle: "载体工作台助手",
    prompt: "可以帮你汇总待审事项、梳理材料风险、查看绩效任务。",
    scope: "审核待办、企业申报、绩效任务",
    workbench: [
      { label: "入驻审核", path: "/carrier/incubation" },
      { label: "企业申报审核", path: "/carrier/applications" },
      { label: "绩效考核", path: "/carrier/performances" },
    ],
  },
  government: {
    title: "政务工作台助手",
    subtitle: "政务工作台助手",
    prompt: "可以帮你汇总终审、政策、绩效、诉求和账号治理待办。",
    scope: "终审管理、政策治理、诉求跟踪",
    workbench: [
      { label: "政策管理", path: "/gov/policies" },
      { label: "申报终审", path: "/gov/applications" },
      { label: "账号治理", path: "/gov/account" },
    ],
  },
};

function toChatMessages(messages: Array<{ id: number; role: string; content: string }>): ChatMessage[] {
  return messages
    .filter((message) => (message.role === "user" || message.role === "assistant") && message.content)
    .map((message) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      text: message.content,
    }));
}

export default function GlobalAiAssistant() {
  const role = (useAuthStore((state) => state.user?.role) || "enterprise") as UserRole;
  const meta = roleAssistantMeta[role] || roleAssistantMeta.enterprise;
  const navigate = useNavigate();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AssistantTab>("chat");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<AgentChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const assistantElementRef = useRef<HTMLElement | null>(null);
  const nextMessageIdRef = useRef(1);
  const sessionsLoadedRef = useRef(false);
  const [assistantTop, setAssistantTop] = useState(() =>
    typeof window === "undefined" ? 360 : Math.round(window.innerHeight * 0.52),
  );
  const assistantDragRef = useRef({
    active: false,
    dragged: false,
    startTop: 0,
    startY: 0,
    currentTop: 0,
  });

  const quickPrompts = useMemo(() => getAgentQuickPrompts(role), [role]);
  const toolCatalog = useMemo(() => getAgentToolCatalog(role), [role]);

  const currentSession = sessions.find((session) => session.id === currentSessionId);
  const sessionTitle = currentSession?.title || (messages.length === 0 ? "新会话" : messages[0].text.slice(0, 16));
  const connectionLabel = loading ? "处理中" : "已连接";

  const showNotice = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 1800);
  }, []);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const nextSessions = await listAgentSessions();
      setSessions(nextSessions);
      sessionsLoadedRef.current = true;
    } catch (err) {
      showNotice((err as Error).message || "会话列表加载失败");
    } finally {
      setSessionsLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    if (assistantOpen && !sessionsLoadedRef.current) {
      loadSessions();
    }
  }, [assistantOpen, loadSessions]);

  const clampAssistantTop = (top: number) => {
    if (typeof window === "undefined") return top;
    return Math.min(Math.max(top, 96), window.innerHeight - 72);
  };

  const handleAssistantPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (assistantOpen) return;
    assistantDragRef.current = {
      active: true,
      dragged: false,
      startTop: assistantTop,
      startY: event.clientY,
      currentTop: assistantTop,
    };
    assistantElementRef.current?.classList.add("is-ai-dragging");
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleAssistantPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const dragState = assistantDragRef.current;
    if (!dragState.active || assistantOpen) return;

    const deltaY = event.clientY - dragState.startY;
    if (Math.abs(deltaY) > 3) dragState.dragged = true;
    dragState.currentTop = clampAssistantTop(dragState.startTop + deltaY);
    if (assistantElementRef.current) {
      assistantElementRef.current.style.top = `${dragState.currentTop}px`;
    }
  };

  const handleAssistantPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const dragState = assistantDragRef.current;
    assistantDragRef.current.active = false;
    assistantElementRef.current?.classList.remove("is-ai-dragging");
    setAssistantTop(dragState.currentTop || assistantTop);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleAssistantTriggerClick = () => {
    if (assistantDragRef.current.dragged) {
      assistantDragRef.current.dragged = false;
      return;
    }
    setAssistantOpen(true);
  };

  const startNewConversation = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setStreamingText("");
    setInputValue("");
    setActiveTab("chat");
    showNotice("已新建会话");
  };

  const openSession = async (sessionId: number) => {
    setActiveTab("chat");
    setLoading(true);
    setStreamingText("");
    try {
      const detail = await getAgentSession(sessionId);
      setCurrentSessionId(detail.session.id);
      setMessages(toChatMessages(detail.messages));
    } catch (err) {
      showNotice((err as Error).message || "打开会话失败");
    } finally {
      setLoading(false);
    }
  };

  const appendInputText = (text: string) => {
    setInputValue((value) => `${value}${value && !value.endsWith(" ") ? " " : ""}${text}`);
    setActiveTab("chat");
  };

  const ensureSession = async (firstMessage: string) => {
    if (currentSessionId) return currentSessionId;
    const session = await createAgentSession(firstMessage.slice(0, 24) || "新会话");
    setCurrentSessionId(session.id);
    setSessions((items) => [session, ...items.filter((item) => item.id !== session.id)]);
    return session.id;
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || inputValue).trim();
    if (!text || loading) {
      if (!text) showNotice("请输入问题");
      return;
    }

    const userMessage: ChatMessage = {
      id: `local-user-${nextMessageIdRef.current++}`,
      role: "user",
      text,
    };
    setMessages((items) => [...items, userMessage]);
    setInputValue("");
    setActiveTab("chat");
    setLoading(true);
    setStreamingText("");

    let accumulatedThinking = "";
    let finalReply = "";
    let streamError = "";

    try {
      const sessionId = await ensureSession(text);
      await sendAgentMessageStream(
        sessionId,
        text,
        {
          role,
        },
        {
          onThinking: (chunk) => {
            accumulatedThinking += chunk;
            setStreamingText(accumulatedThinking);
          },
          onReply: (reply) => {
            finalReply = reply;
            setStreamingText(reply);
          },
          onError: (message) => {
            streamError = message;
            setStreamingText(message);
          },
        },
      );

      const assistantText = streamError || finalReply || accumulatedThinking || "已完成处理。";
      setMessages((items) => [
        ...items,
        {
          id: `local-assistant-${nextMessageIdRef.current++}`,
          role: "assistant",
          text: assistantText,
          status: streamError ? "error" : undefined,
        },
      ]);
      window.setTimeout(() => {
        loadSessions();
      }, 500);
    } catch (err) {
      setMessages((items) => [
        ...items,
        {
          id: `local-assistant-${nextMessageIdRef.current++}`,
          role: "assistant",
          text: (err as Error).message || "AI 助手暂时不可用，请稍后再试。",
          status: "error",
        },
      ]);
    } finally {
      setStreamingText("");
      setLoading(false);
    }
  };

  return (
    <div className={`global-ai-host${assistantOpen ? " is-ai-open" : ""}`}>
      <aside
        ref={assistantElementRef}
        className="enterprise-ai-assistant"
        aria-label="孵小智 AI 助手"
        style={assistantOpen ? undefined : { top: assistantTop }}
      >
        <button
          type="button"
          className="enterprise-ai-collapsed-trigger"
          onClick={handleAssistantTriggerClick}
          onPointerDown={handleAssistantPointerDown}
          onPointerMove={handleAssistantPointerMove}
          onPointerUp={handleAssistantPointerUp}
          onPointerCancel={handleAssistantPointerUp}
          aria-label="展开 AI 助手"
        >
          <span className="enterprise-ai-mini-face">
            <i />
            <i />
          </span>
        </button>
        <button
          type="button"
          className="enterprise-ai-close"
          onClick={() => setAssistantOpen(false)}
          aria-label="收起 AI 助手"
        >
          <CloseOutlined />
        </button>

        <div className="enterprise-ai-panel">
          <header className="enterprise-ai-panel-header">
            <div>
              <strong>{meta.title}</strong>
              <span>{meta.scope}</span>
            </div>
            <div className="enterprise-ai-header-tools">
              <span className={`enterprise-ai-status${loading ? " is-busy" : ""}`}>{connectionLabel}</span>
              <button type="button" aria-label="新建会话" title="新建会话" onClick={startNewConversation}>
                <PlusOutlined />
              </button>
            </div>
          </header>

          <div className="enterprise-ai-tabs" role="tablist" aria-label="AI 助手模式">
            <button type="button" className={activeTab === "chat" ? "is-active" : ""} onClick={() => setActiveTab("chat")}>
              对话
            </button>
            <button type="button" className={activeTab === "assistant" ? "is-active" : ""} onClick={() => setActiveTab("assistant")}>
              工具
              <em>{toolCatalog.length}</em>
            </button>
            <button type="button" className={activeTab === "workbench" ? "is-active" : ""} onClick={() => setActiveTab("workbench")}>
              工作台
              <em>{sessions.length}</em>
            </button>
          </div>

          <main className={`enterprise-ai-conversation${messages.length > 0 || streamingText ? " has-messages" : ""}`}>
            {activeTab === "chat" && (
              <>
                {messages.length === 0 && !streamingText ? (
                  <div className="enterprise-ai-empty">
                    <span className="enterprise-ai-empty-mark">
                      <span className="enterprise-ai-css-bot" aria-hidden="true">
                        <span className="enterprise-ai-css-sprout">
                          <span className="enterprise-ai-css-stem" />
                          <span className="enterprise-ai-css-branch is-left" />
                          <span className="enterprise-ai-css-branch is-right" />
                        </span>
                        <span className="enterprise-ai-css-ear is-left" />
                        <span className="enterprise-ai-css-ear is-right" />
                        <span className="enterprise-ai-css-shell" />
                        <span className="enterprise-ai-css-face">
                          <i />
                          <i />
                          <em />
                        </span>
                        <span className="enterprise-ai-css-shadow" />
                      </span>
                    </span>
                    <strong className="enterprise-ai-empty-title">{sessionTitle}</strong>
                    <p>{meta.prompt}</p>
                    <div className="enterprise-ai-quick-prompts">
                      {quickPrompts.map((prompt) => (
                        <button type="button" key={prompt} onClick={() => sendMessage(prompt)}>
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="enterprise-ai-thread" aria-live="polite">
                    {messages.map((message) => (
                      <article
                        className={`enterprise-ai-bubble is-${message.role}${message.status === "error" ? " is-error" : ""}`}
                        key={message.id}
                      >
                        <p>{message.text}</p>
                      </article>
                    ))}
                    {streamingText && (
                      <article className="enterprise-ai-bubble is-assistant is-streaming">
                        <p>{streamingText}</p>
                      </article>
                    )}
                    {loading && <div className="enterprise-ai-loading">正在调用后端 Agent</div>}
                  </div>
                )}
              </>
            )}

            {activeTab === "assistant" && (
              <div className="enterprise-ai-side-view">
                <div className="enterprise-ai-section-heading">
                  <strong>可调用工具</strong>
                  <span>
                    {toolCatalog.length > 0
                      ? "助手会按问题自动选择工具；你也可以把工具说明填入输入框，明确本次查询范围。"
                      : "当前角色暂无已注册业务工具，可进行普通对话。"}
                  </span>
                </div>
                <div className="enterprise-ai-tool-list">
                  {toolCatalog.map((tool) => (
                    <button
                      type="button"
                      key={tool.name}
                      onClick={() => appendInputText(`请使用${tool.label}：${tool.description}`)}
                    >
                      <DatabaseOutlined />
                      <span>
                        <b>{tool.label}</b>
                        <em>{tool.description}</em>
                      </span>
                      <i>填入</i>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "workbench" && (
              <div className="enterprise-ai-side-view">
                <div className="enterprise-ai-section-heading">
                  <strong>历史会话</strong>
                  <span>继续最近的咨询记录，或新建会话处理新的业务问题。</span>
                </div>
                <div className="enterprise-ai-session-list">
                  {sessionsLoading ? <span className="enterprise-ai-muted">正在加载会话...</span> : null}
                  {!sessionsLoading && sessions.length === 0 ? <span className="enterprise-ai-muted">暂无历史会话</span> : null}
                  {sessions.map((session) => (
                    <button
                      type="button"
                      key={session.id}
                      className={session.id === currentSessionId ? "is-active" : ""}
                      onClick={() => openSession(session.id)}
                    >
                      <HistoryOutlined />
                      <span>
                      <b>{session.title || "未命名会话"}</b>
                      <em>{session.message_count} 条消息</em>
                      </span>
                    </button>
                  ))}
                </div>

                <div className="enterprise-ai-section-heading">
                  <strong>业务入口</strong>
                  <span>选择一个业务入口继续办理，或回到对话描述需要处理的问题。</span>
                </div>
                <div className="enterprise-ai-workbench-list">
                  {meta.workbench.map((item) => (
                    <button type="button" key={item.path} onClick={() => navigate(item.path)}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>

          <footer className="enterprise-ai-composer">
            {notice && (
              <div className="enterprise-ai-toast" role="status">
                {notice}
              </div>
            )}
            <textarea
              aria-label="输入给 AI 助手的问题"
              placeholder="问问孵小智..."
              rows={2}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
            />
            <div className="enterprise-ai-composer-actions">
              <div />
              <button
                type="button"
                className="enterprise-ai-send"
                aria-label="发送"
                disabled={(!inputValue.trim() && !loading) || loading}
                onClick={() => sendMessage()}
              >
                <span className="enterprise-ai-send-state enterprise-ai-send-default">
                  <span className="enterprise-ai-send-icon" aria-hidden="true">
                    <SendOutlined />
                  </span>
                  <span className="enterprise-ai-send-label">
                    <span>{loading ? "调用" : "发送"}</span>
                  </span>
                </span>
              </button>
            </div>
          </footer>
        </div>
      </aside>
    </div>
  );
}
