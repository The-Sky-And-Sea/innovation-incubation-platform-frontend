import type { PointerEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ClockCircleOutlined,
  CloseOutlined,
  CodeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import type { UserRole } from "../types";

type AssistantTab = "chat" | "assistant" | "workbench";
type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

const roleAssistantMeta: Record<
  UserRole,
  { subtitle: string; prompt: string; reply: string; workbench: Array<{ label: string; path: string }> }
> = {
  enterprise: {
    subtitle: "企业工作台助手",
    prompt: "先问我一个问题，或让我帮你梳理当前企业申报事项。",
    reply: "我已按企业端流程整理：先确认基础资料和文件材料，再检查政策申报条件，最后跟踪审核进度。",
    workbench: [
      { label: "完善企业信息", path: "/enterprise/info" },
      { label: "上传文件材料", path: "/enterprise/files" },
      { label: "查看政策申报", path: "/enterprise/policies" },
    ],
  },
  carrier: {
    subtitle: "载体工作台助手",
    prompt: "先问我一个问题，或让我帮你梳理当前载体审核事项。",
    reply: "我已按载体端流程整理：先处理入驻和变更审核，再查看政策申报与绩效考核事项。",
    workbench: [
      { label: "入驻审核", path: "/carrier/incubation" },
      { label: "企业申报审核", path: "/carrier/applications" },
      { label: "绩效考核", path: "/carrier/performances" },
    ],
  },
  government: {
    subtitle: "政务工作台助手",
    prompt: "先问我一个问题，或让我帮你梳理当前政务审核事项。",
    reply: "我已按政务端流程整理：先看终审待办，再处理政策管理、绩效考核和账号治理。",
    workbench: [
      { label: "政策管理", path: "/gov/policies" },
      { label: "申报终审", path: "/gov/applications" },
      { label: "账号治理", path: "/gov/account" },
    ],
  },
};

const historyItems = [
  "企业基础资料核对",
  "政策申报材料清单",
  "审核进度跟踪建议",
];

export default function GlobalAiAssistant() {
  const role = (useAuthStore((state) => state.user?.role) || "enterprise") as UserRole;
  const meta = roleAssistantMeta[role] || roleAssistantMeta.enterprise;
  const navigate = useNavigate();
  const location = useLocation();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AssistantTab>("chat");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notice, setNotice] = useState("");
  const [sendFeedback, setSendFeedback] = useState(false);
  const assistantElementRef = useRef<HTMLElement | null>(null);
  const nextMessageIdRef = useRef(1);
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

  const sessionTitle = useMemo(() => {
    if (messages.length === 0) return "Untitled";
    return messages[0].text.slice(0, 16) || "新会话";
  }, [messages]);

  const clampAssistantTop = (top: number) => {
    if (typeof window === "undefined") {
      return top;
    }

    return Math.min(Math.max(top, 96), window.innerHeight - 72);
  };

  const showNotice = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 1800);
  };

  const handleAssistantPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (assistantOpen) {
      return;
    }

    assistantDragRef.current = {
      active: true,
      dragged: false,
      startTop: assistantTop,
      startY: event.clientY,
      currentTop: assistantTop,
    };
    assistantElementRef.current?.classList.add("is-ai-dragging");
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleAssistantPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const dragState = assistantDragRef.current;
    if (!dragState.active || assistantOpen) {
      return;
    }

    const deltaY = event.clientY - dragState.startY;
    if (Math.abs(deltaY) > 3) {
      dragState.dragged = true;
    }
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
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
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
    setMessages([]);
    setInputValue("");
    setActiveTab("chat");
    showNotice("已新建会话");
  };

  const appendInputText = (text: string) => {
    setInputValue((value) => `${value}${value && !value.endsWith(" ") ? " " : ""}${text}`);
    setActiveTab("chat");
  };

  const addCurrentContext = () => {
    appendInputText(`请结合当前页面 ${location.pathname} 梳理待办事项。`);
    showNotice("已添加当前页面");
  };

  const insertCommand = () => {
    appendInputText("请按材料、流程、风险三部分整理：");
    showNotice("已插入指令");
  };

  const sendMessage = () => {
    const text = inputValue.trim();
    if (!text) {
      showNotice("请输入问题");
      return;
    }

    const userMessage: ChatMessage = {
      id: nextMessageIdRef.current++,
      role: "user",
      text,
    };
    const assistantMessage: ChatMessage = {
      id: nextMessageIdRef.current++,
      role: "assistant",
      text: meta.reply,
    };
    setMessages((items) => [...items, userMessage, assistantMessage]);
    setInputValue("");
    setActiveTab("chat");
    setSendFeedback(true);
    window.setTimeout(() => setSendFeedback(false), 1400);
  };

  const openHistoryItem = (title: string) => {
    setMessages([
      { id: nextMessageIdRef.current++, role: "user", text: title },
      { id: nextMessageIdRef.current++, role: "assistant", text: meta.reply },
    ]);
    setActiveTab("chat");
    showNotice("已打开历史会话");
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
          <div className="enterprise-ai-tabs" role="tablist" aria-label="AI 助手模式">
            <button type="button" className={activeTab === "chat" ? "is-active" : ""} onClick={() => setActiveTab("chat")}>
              聊天
            </button>
            <button type="button" className={activeTab === "assistant" ? "is-active" : ""} onClick={() => setActiveTab("assistant")}>
              孵小智
            </button>
            <button type="button" className={activeTab === "workbench" ? "is-active" : ""} onClick={() => setActiveTab("workbench")}>
              工作台
            </button>
          </div>

          <header className="enterprise-ai-panel-header">
            <div>
              <strong>{sessionTitle}</strong>
              <span>{meta.subtitle}</span>
            </div>
            <div className="enterprise-ai-header-tools">
              <button type="button" aria-label="历史记录" title="历史记录" onClick={() => setActiveTab("assistant")}>
                <ClockCircleOutlined />
              </button>
              <button type="button" aria-label="新建会话" title="新建会话" onClick={startNewConversation}>
                <PlusOutlined />
              </button>
            </div>
          </header>

          <main className={`enterprise-ai-conversation${messages.length > 0 ? " has-messages" : ""}`}>
            {activeTab === "chat" && (
              <>
                {messages.length === 0 ? (
                  <>
                    <div className="enterprise-ai-brand">孵小智 · 云芽</div>
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
                      <p>{meta.prompt}</p>
                    </div>
                  </>
                ) : (
                  <div className="enterprise-ai-thread" aria-live="polite">
                    {messages.map((message) => (
                      <article className={`enterprise-ai-bubble is-${message.role}`} key={message.id}>
                        {message.text}
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "assistant" && (
              <div className="enterprise-ai-side-view">
                <div>
                  <strong>孵小智 · 云芽</strong>
                  <span>可帮你拆解材料、流程、审核状态和当前页面待办。</span>
                </div>
                <div className="enterprise-ai-history-list">
                  {historyItems.map((item) => (
                    <button type="button" key={item} onClick={() => openHistoryItem(item)}>
                      <ClockCircleOutlined />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "workbench" && (
              <div className="enterprise-ai-side-view">
                <div>
                  <strong>{meta.subtitle}</strong>
                  <span>选择一个入口继续办理，或把当前页面加入问题上下文。</span>
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
            {notice && <div className="enterprise-ai-toast" role="status">{notice}</div>}
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
              <div>
                <button type="button" aria-label="添加内容" title="添加当前页面" onClick={addCurrentContext}>
                  <PlusOutlined />
                </button>
                <button type="button" aria-label="插入指令" title="插入指令" onClick={insertCommand}>
                  <CodeOutlined />
                </button>
              </div>
              <button
                type="button"
                className={`enterprise-ai-send${sendFeedback ? " is-sent" : ""}`}
                aria-label="发送"
                disabled={!inputValue.trim() && !sendFeedback}
                onClick={sendMessage}
              >
                <span className="enterprise-ai-send-outline" />
                <span className="enterprise-ai-send-state enterprise-ai-send-default">
                  <span className="enterprise-ai-send-icon" aria-hidden="true">
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none">
                      <path d="M14.22 21.63c-1.18 0-2.85-.83-4.17-4.8l-.72-2.16-2.16-.72c-3.96-1.32-4.79-2.99-4.79-4.17 0-1.17.83-2.85 4.79-4.18l8.49-2.83c2.12-.71 3.89-.5 4.98.58 1.09 1.08 1.3 2.86.59 4.98l-2.83 8.49c-1.33 3.98-3 4.81-4.18 4.81ZM7.64 7.03c-2.78.93-3.77 2.03-3.77 2.75s.99 1.82 3.77 2.74l2.52.84c.22.07.4.25.47.47l.84 2.52c.92 2.78 2.03 3.77 2.75 3.77s1.82-.99 2.75-3.77l2.83-8.49c.51-1.54.42-2.8-.23-3.45-.65-.65-1.91-.73-3.44-.22L7.64 7.03Z" fill="currentColor" />
                      <path d="M10.11 14.4a.75.75 0 0 1-.53-1.28l3.58-3.59a.75.75 0 0 1 1.06 1.06l-3.58 3.59a.74.74 0 0 1-.53.22Z" fill="currentColor" />
                    </svg>
                  </span>
                  <span className="enterprise-ai-send-label">
                    <span>发</span>
                    <span>送</span>
                  </span>
                </span>
                <span className="enterprise-ai-send-state enterprise-ai-send-sent">
                  <span className="enterprise-ai-send-icon" aria-hidden="true">
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none">
                      <path d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12S6.07 1.25 12 1.25 22.75 6.07 22.75 12 17.93 22.75 12 22.75Zm0-1.5A9.25 9.25 0 1 0 12 2.75a9.25 9.25 0 0 0 0 18.5Z" fill="currentColor" />
                      <path d="M10.58 15.58a.75.75 0 0 1-.53-.22l-2.83-2.83a.75.75 0 0 1 1.06-1.06l2.3 2.3 5.14-5.14a.75.75 0 0 1 1.06 1.06l-5.67 5.67a.75.75 0 0 1-.53.22Z" fill="currentColor" />
                    </svg>
                  </span>
                  <span className="enterprise-ai-send-label">
                    <span>已</span>
                    <span>发</span>
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
