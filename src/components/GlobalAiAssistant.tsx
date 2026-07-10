import type { CSSProperties, PointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CloseOutlined,
  CopyOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  HistoryOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  createAgentSession,
  editAgentMessageStream,
  getAgentQuickPrompts,
  getAgentSession,
  getAgentToolCatalog,
  deleteAgentSession,
  listAgentSessions,
  sendAgentMessageStream,
  type AgentChatSession,
  type AgentSSEEvent,
} from "../api/agent";
import { downloadFile } from "../api/files";
import { useAuthStore } from "../store/authStore";
import { triggerBrowserDownload } from "../utils/download";
import type { UserRole } from "../types";

type AssistantTab = "chat" | "workbench";
type ChatMessage = {
  id: number | string;
  role: "user" | "assistant";
  text: string;
  createdAt?: string;
  status?: "error";
  report?: ReportState;
};

type ReportState = {
  status: "running" | "done";
  phase?: string;
  current?: number;
  total?: number;
  title?: string;
  fileUrl?: string;
  fileId?: number;
  format?: string;
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

type AgentMessageLike = {
  id?: number | string;
  ID?: number | string;
  role?: string;
  Role?: string;
  content?: string;
  Content?: string;
  message?: string;
  Message?: string;
  text?: string;
  Text?: string;
  created_at?: string;
  createdAt?: string;
  CreatedAt?: string;
};

function readAgentMessages(source: unknown): AgentMessageLike[] {
  if (Array.isArray(source)) return source as AgentMessageLike[];
  if (!source || typeof source !== "object") return [];

  const record = source as Record<string, unknown>;
  for (const key of ["messages", "Messages", "records", "Records", "items", "Items", "list", "List", "data", "Data"]) {
    const messages = readAgentMessages(record[key]);
    if (messages.length > 0) return messages;
  }

  return [];
}

function getAgentMessageId(message: AgentMessageLike, index: number): number | string {
  return message.id || message.ID || `history-message-${index}`;
}

function getAgentMessageRole(message: AgentMessageLike): "user" | "assistant" | null {
  const role = String(message.role || message.Role || "").toLowerCase();
  if (role === "user") return "user";
  if (role === "assistant" || role === "ai") return "assistant";
  return null;
}

function getAgentMessageText(message: AgentMessageLike): string {
  return String(message.content || message.Content || message.message || message.Message || message.text || message.Text || "").trim();
}

function getAgentMessageTime(message: AgentMessageLike): string | undefined {
  return message.created_at || message.createdAt || message.CreatedAt;
}

function toChatMessages(source: unknown): ChatMessage[] {
  return readAgentMessages(source).flatMap((message, index) => {
    const role = getAgentMessageRole(message);
    const text = getAgentMessageText(message);
    if (!role || !text) return [];
    return [
      {
        id: getAgentMessageId(message, index),
        role,
        text,
        createdAt: getAgentMessageTime(message),
      },
    ];
  });
}

function mergeRefreshedMessages(
  currentMessages: ChatMessage[],
  refreshedMessages: unknown,
): ChatMessage[] {
  const persistedMessages = toChatMessages(refreshedMessages);
  const allCurrentMessagesPersisted = currentMessages.every((message) =>
    typeof message.id === "number"
      ? persistedMessages.some((persistedMessage) => persistedMessage.id === message.id)
      : persistedMessages.some((persistedMessage) => persistedMessage.role === message.role && persistedMessage.text === message.text),
  );
  if (allCurrentMessagesPersisted && persistedMessages.length >= currentMessages.length) return persistedMessages;

  const usedPersistedIndexes = new Set<number>();
  return currentMessages.map((message) => {
    if (typeof message.id === "number") {
      return persistedMessages.find((persistedMessage) => persistedMessage.id === message.id) || message;
    }

    const persistedIndex = persistedMessages.findIndex(
      (persistedMessage, index) =>
        !usedPersistedIndexes.has(index) && persistedMessage.role === message.role && persistedMessage.text === message.text,
    );
    if (persistedIndex === -1) return message;

    usedPersistedIndexes.add(persistedIndex);
    const persistedMessage = persistedMessages[persistedIndex];
    return {
      ...message,
      id: persistedMessage.id,
      createdAt: persistedMessage.createdAt || message.createdAt,
    };
  });
}

function formatMessageTime(value?: string): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getReportPhaseLabel(phase?: string): string {
  const labels: Record<string, string> = {
    analyst: "规划报告结构",
    executor: "查询并整理数据",
    summarizer: "撰写分析结论",
    converter: "转换报告格式",
  };
  return phase ? labels[phase] || phase : "生成报告";
}

function readReportData(data: unknown): ReportState {
  if (!data || typeof data !== "object") return { status: "running" };
  const record = data as Record<string, unknown>;
  const fileUrl = typeof record.file_url === "string" ? record.file_url : undefined;
  const fileIdFromUrl = fileUrl?.match(/\/files\/(\d+)\/download/)?.[1];
  const explicitFileId = Number(record.file_id ?? record.fileId ?? fileIdFromUrl);
  return {
    status: "running",
    phase: typeof record.phase === "string" ? record.phase : undefined,
    current: typeof record.current === "number" ? record.current : undefined,
    total: typeof record.total === "number" ? record.total : undefined,
    title: typeof record.title === "string" ? record.title : undefined,
    fileUrl,
    fileId: Number.isFinite(explicitFileId) ? explicitFileId : undefined,
    format: typeof record.format === "string" ? record.format.toUpperCase() : undefined,
  };
}

function formatReportStreamingText(report: ReportState): string {
  if (report.status === "done") {
    return `报告已生成${report.format ? `（${report.format}）` : ""}，可以下载查看。`;
  }
  const phase = getReportPhaseLabel(report.phase);
  const progress = report.current && report.total ? ` ${report.current}/${report.total}` : "";
  const title = report.title ? `：${report.title}` : "";
  return `正在${phase}${progress}${title}`;
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
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<number>>(new Set());
  const [deletingSessionIds, setDeletingSessionIds] = useState<Set<number>>(new Set());
  const [sessionManageMode, setSessionManageMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingReport, setStreamingReport] = useState<ReportState | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | string | null>(null);
  const [editingText, setEditingText] = useState("");
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
  const activeTabOffset = activeTab === "chat" ? "0px" : "calc(100% + 4px)";

  const currentSession = sessions.find((session) => session.id === currentSessionId);
  const sessionTitle = currentSession?.title || (messages.length === 0 ? "新会话" : messages[0].text.slice(0, 16));
  const editableMessageKey = [...messages].reverse().find((message) => message.role === "user")?.id;

  const showNotice = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 1800);
  }, []);

  const downloadReport = useCallback(async (report: ReportState) => {
    const fileId = report.fileId || Number(report.fileUrl?.match(/\/files\/(\d+)\/download/)?.[1]);
    if (!Number.isFinite(fileId)) {
      showNotice("报告下载地址缺少文件 ID");
      return;
    }
    try {
      const blobUrl = await downloadFile(fileId);
      const ext = (report.format || "pdf").toLowerCase();
      triggerBrowserDownload(blobUrl, `政务数据分析报告.${ext}`);
      showNotice("已开始下载报告");
    } catch (err) {
      showNotice((err as Error).message || "报告下载失败");
    }
  }, [showNotice]);

  const renderReportCard = (report: ReportState) => (
    <div className={`enterprise-ai-report-card is-${report.status}`}>
      <div className="enterprise-ai-report-icon" aria-hidden="true">
        <FileTextOutlined />
      </div>
      <div className="enterprise-ai-report-body">
        <strong>{report.status === "done" ? "报告已生成" : "报告生成中"}</strong>
        <span>{formatReportStreamingText(report)}</span>
        {report.status === "done" ? (
          <button type="button" onClick={() => downloadReport(report)}>
            <DownloadOutlined />
            下载{report.format || "报告"}
          </button>
        ) : (
          <div className="enterprise-ai-report-progress" aria-hidden="true">
            <i style={{ width: `${report.current && report.total ? Math.min(100, (report.current / report.total) * 100) : 32}%` }} />
          </div>
        )}
      </div>
    </div>
  );

  const loadSessions = useCallback(async (preserveSession?: AgentChatSession) => {
    setSessionsLoading(true);
    try {
      const nextSessions = await listAgentSessions();
      setSessions((items) => {
        const preservedSession =
          preserveSession ||
          (currentSessionId ? items.find((session) => session.id === currentSessionId) : undefined);
        if (!preservedSession || nextSessions.some((session) => session.id === preservedSession.id)) {
          return nextSessions;
        }
        return [preservedSession, ...nextSessions];
      });
      setSelectedSessionIds((ids) => new Set([...ids].filter((id) => nextSessions.some((session) => session.id === id))));
      sessionsLoadedRef.current = true;
    } catch (err) {
      showNotice((err as Error).message || "会话列表加载失败");
    } finally {
      setSessionsLoading(false);
    }
  }, [currentSessionId, showNotice]);

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
    setStreamingReport(null);
    setInputValue("");
    setEditingMessageId(null);
    setEditingText("");
    setHistoryOpen(false);
    setSessionManageMode(false);
    setActiveTab("chat");
    showNotice("已新建会话");
  };

  const openSession = async (sessionId: number) => {
    setActiveTab("chat");
    setHistoryOpen(false);
    setLoading(true);
    setStreamingText("");
    setStreamingReport(null);
    try {
      const detail = await getAgentSession(sessionId);
      setCurrentSessionId(detail.session.id);
      setMessages(toChatMessages(detail.messages?.length ? detail.messages : detail));
      setEditingMessageId(null);
      setEditingText("");
    } catch (err) {
      showNotice((err as Error).message || "打开会话失败");
    } finally {
      setLoading(false);
    }
  };

  const toggleSessionSelection = (sessionId: number) => {
    setSelectedSessionIds((ids) => {
      const nextIds = new Set(ids);
      if (nextIds.has(sessionId)) {
        nextIds.delete(sessionId);
      } else {
        nextIds.add(sessionId);
      }
      return nextIds;
    });
  };

  const clearCurrentSessionIfDeleted = (sessionIds: number[]) => {
    if (currentSessionId && sessionIds.includes(currentSessionId)) {
      setCurrentSessionId(null);
      setMessages([]);
      setStreamingText("");
      setStreamingReport(null);
      setInputValue("");
      setEditingMessageId(null);
      setEditingText("");
    }
  };

  const deleteSessions = async (sessionIds: number[]) => {
    if (!sessionIds.length) return;
    setDeletingSessionIds((ids) => new Set([...ids, ...sessionIds]));
    try {
      await Promise.all(sessionIds.map((sessionId) => deleteAgentSession(sessionId)));
      setSessions((items) => items.filter((session) => !sessionIds.includes(session.id)));
      setSelectedSessionIds((ids) => new Set([...ids].filter((id) => !sessionIds.includes(id))));
      if (sessionIds.length > 1) setSessionManageMode(false);
      clearCurrentSessionIfDeleted(sessionIds);
      showNotice(sessionIds.length > 1 ? "已删除选中的历史会话" : "已删除历史会话");
    } catch (err) {
      showNotice((err as Error).message || "删除历史会话失败");
    } finally {
      setDeletingSessionIds((ids) => new Set([...ids].filter((id) => !sessionIds.includes(id))));
    }
  };

  const startEditingMessage = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };

  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const copyMessageText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotice("已复制消息");
    } catch {
      showNotice("复制失败，请手动选择文本");
    }
  };

  const resendEditedMessage = async () => {
    const text = editingText.trim();
    if (!currentSessionId || !editingMessageId || !text || loading) {
      if (!text) showNotice("请输入要重发的消息");
      return;
    }

    const editingMessageKey = editingMessageId as number | string;
    const editingTargetMessage = messages.find((message) => message.id === editingMessageKey);
    let editedMessageId = typeof editingMessageKey === "number" ? editingMessageKey : null;
    if (!editedMessageId && currentSessionId) {
      try {
        const detail = await getAgentSession(currentSessionId);
        const refreshedMessages = toChatMessages(detail.messages?.length ? detail.messages : detail);
        setCurrentSessionId(detail.session.id);
        setMessages((items) => mergeRefreshedMessages(items, detail.messages?.length ? detail.messages : detail));
        const persistedMessage = [...refreshedMessages].reverse().find(
          (message) =>
            message.role === "user" &&
            message.text === (editingTargetMessage?.text || editingText) &&
            typeof message.id === "number",
        );
        editedMessageId = typeof persistedMessage?.id === "number" ? persistedMessage.id : null;
      } catch (err) {
        editedMessageId = null;
      }
    }

    const resolvedEditedMessageId = typeof editedMessageId === "number" ? editedMessageId : null;
    const shouldUseEditEndpoint = resolvedEditedMessageId !== null;
    const editedUserMessage: ChatMessage = {
      id: shouldUseEditEndpoint ? resolvedEditedMessageId : editingMessageKey,
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((items) => {
      const editIndex = items.findIndex((message) => message.id === editingMessageKey);
      if (editIndex === -1) return items;
      return [...items.slice(0, editIndex), editedUserMessage];
    });
    setEditingMessageId(null);
    setEditingText("");
    setActiveTab("chat");
    setHistoryOpen(false);
    setLoading(true);
    setStreamingText("");
    setStreamingReport(null);

    let accumulatedThinking = "";
    let finalReply = "";
    let streamError = "";
    let reportDraft: ReportState | null = null;

    try {
      const streamCallbacks = {
        onThinking: (chunk: string) => {
          accumulatedThinking += chunk;
          setStreamingText(accumulatedThinking);
        },
        onReply: (reply: string) => {
          finalReply = reply;
          setStreamingText(reply);
        },
        onError: (message: string) => {
          streamError = message;
          setStreamingText(message);
        },
        onEvent: (event: AgentSSEEvent) => {
          if (event.type === "report_start" || event.type === "report_progress") {
            reportDraft = { ...(reportDraft || { status: "running" as const }), ...readReportData(event.data), status: "running" };
            setStreamingReport(reportDraft);
            setStreamingText(formatReportStreamingText(reportDraft));
          }
          if (event.type === "report_done") {
            reportDraft = { ...(reportDraft || { status: "done" as const }), ...readReportData(event.data), status: "done" };
            finalReply = formatReportStreamingText(reportDraft);
            setStreamingReport(reportDraft);
            setStreamingText(finalReply);
          }
        },
      };

      if (shouldUseEditEndpoint) {
        await editAgentMessageStream(
          currentSessionId,
          resolvedEditedMessageId,
          text,
          {
            role,
          },
          streamCallbacks,
        );
      } else {
        await sendAgentMessageStream(
          currentSessionId,
          text,
          {
            role,
          },
          streamCallbacks,
        );
      }

      const assistantText = streamError || finalReply || accumulatedThinking || "已完成处理。";
      setMessages((items) => [
        ...items,
        {
          id: `local-assistant-${nextMessageIdRef.current++}`,
          role: "assistant",
          text: assistantText,
          createdAt: new Date().toISOString(),
          status: streamError ? "error" : undefined,
          report: reportDraft || undefined,
        },
      ]);
      if (!streamError && !reportDraft) {
        void getAgentSession(currentSessionId)
          .then((detail) => {
            setCurrentSessionId(detail.session.id);
            setMessages((items) => mergeRefreshedMessages(items, detail.messages?.length ? detail.messages : detail));
          })
          .catch(() => {
            // Keep the optimistic messages if the refresh fails.
          });
      }
      void loadSessions();
    } catch (err) {
      setMessages((items) => [
        ...items,
        {
          id: `local-assistant-${nextMessageIdRef.current++}`,
          role: "assistant",
          text: (err as Error).message || "AI 助手暂时不可用，请稍后再试。",
          createdAt: new Date().toISOString(),
          status: "error",
        },
      ]);
    } finally {
      setStreamingText("");
      setStreamingReport(null);
      setLoading(false);
    }
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
      createdAt: new Date().toISOString(),
    };
    setMessages((items) => [...items, userMessage]);
    setInputValue("");
    setActiveTab("chat");
    setToolsOpen(false);
    setHistoryOpen(false);
    setLoading(true);
    setStreamingText("");
    setStreamingReport(null);

    let accumulatedThinking = "";
    let finalReply = "";
    let streamError = "";
    let reportDraft: ReportState | null = null;

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
          onEvent: (event: AgentSSEEvent) => {
            if (event.type === "report_start" || event.type === "report_progress") {
              reportDraft = { ...(reportDraft || { status: "running" as const }), ...readReportData(event.data), status: "running" };
              setStreamingReport(reportDraft);
              setStreamingText(formatReportStreamingText(reportDraft));
            }
            if (event.type === "report_done") {
              reportDraft = { ...(reportDraft || { status: "done" as const }), ...readReportData(event.data), status: "done" };
              finalReply = formatReportStreamingText(reportDraft);
              setStreamingReport(reportDraft);
              setStreamingText(finalReply);
            }
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
          createdAt: new Date().toISOString(),
          status: streamError ? "error" : undefined,
          report: reportDraft || undefined,
        },
      ]);
      if (!streamError && !reportDraft) {
        void getAgentSession(sessionId)
          .then((detail) => {
            setCurrentSessionId(detail.session.id);
            setMessages((items) => mergeRefreshedMessages(items, detail.messages?.length ? detail.messages : detail));
          })
          .catch(() => {
            // Keep the optimistic messages if the refresh fails.
          });
      }
      void loadSessions();
    } catch (err) {
      setMessages((items) => [
        ...items,
        {
          id: `local-assistant-${nextMessageIdRef.current++}`,
          role: "assistant",
          text: (err as Error).message || "AI 助手暂时不可用，请稍后再试。",
          createdAt: new Date().toISOString(),
          status: "error",
        },
      ]);
    } finally {
      setStreamingText("");
      setStreamingReport(null);
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
            </div>
            <div className="enterprise-ai-header-tools">
              <button
                type="button"
                className={`enterprise-ai-history-toggle${historyOpen ? " is-active" : ""}`}
                aria-label="查看历史会话"
                title="历史会话"
                aria-expanded={historyOpen}
                aria-controls="enterprise-ai-history-menu"
                onClick={() => {
                  setHistoryOpen((value) => !value);
                  setToolsOpen(false);
                }}
              >
                <HistoryOutlined />
              </button>
              <button type="button" aria-label="新建会话" title="新建会话" onClick={startNewConversation}>
                <PlusOutlined />
              </button>
              {historyOpen ? (
                <div id="enterprise-ai-history-menu" className="enterprise-ai-history-popover" role="dialog" aria-label="历史会话">
                  <div className="enterprise-ai-section-heading enterprise-ai-history-heading">
                    <div>
                      <strong>历史会话</strong>
                      <span>继续最近的咨询记录，或新建会话处理新的业务问题。</span>
                    </div>
                    {sessions.length > 0 ? (
                      <button
                        type="button"
                        className="enterprise-ai-history-manage"
                        onClick={() => {
                          setSessionManageMode((value) => !value);
                          setSelectedSessionIds(new Set());
                        }}
                      >
                        {sessionManageMode ? "完成" : "管理"}
                      </button>
                    ) : null}
                  </div>
                  <div className="enterprise-ai-session-list">
                    {sessionsLoading ? <span className="enterprise-ai-muted">正在加载会话...</span> : null}
                    {!sessionsLoading && sessions.length === 0 ? <span className="enterprise-ai-muted">暂无历史会话</span> : null}
                    {sessionManageMode && !sessionsLoading && sessions.length > 0 ? (
                      <div className="enterprise-ai-session-bulk">
                        <span>{selectedSessionIds.size > 0 ? `已选择 ${selectedSessionIds.size} 项` : "选择要删除的会话"}</span>
                        <button
                          type="button"
                          disabled={selectedSessionIds.size === 0}
                          onClick={() => deleteSessions([...selectedSessionIds])}
                        >
                          删除选中 {selectedSessionIds.size}
                        </button>
                      </div>
                    ) : null}
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`enterprise-ai-session-item${session.id === currentSessionId ? " is-active" : ""}${sessionManageMode ? " is-managing" : ""}`}
                      >
                        {sessionManageMode ? (
                          <label className="enterprise-ai-session-check">
                            <input
                              type="checkbox"
                              aria-label={`选择会话 ${session.title || "未命名会话"}`}
                              checked={selectedSessionIds.has(session.id)}
                              onChange={() => toggleSessionSelection(session.id)}
                            />
                          </label>
                        ) : null}
                        <button type="button" className="enterprise-ai-session-open" onClick={() => openSession(session.id)}>
                          <HistoryOutlined />
                          <span>
                            <b>{session.title || "未命名会话"}</b>
                          </span>
                        </button>
                        <button
                          type="button"
                          className="enterprise-ai-session-delete"
                          aria-label={`删除会话 ${session.title || "未命名会话"}`}
                          disabled={deletingSessionIds.has(session.id)}
                          onClick={() => deleteSessions([session.id])}
                        >
                          <DeleteOutlined />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </header>

          <div
            className="enterprise-ai-tabs"
            role="tablist"
            aria-label="AI 助手模式"
            style={{ "--active-tab-offset": activeTabOffset } as CSSProperties}
          >
            <button
              type="button"
              className={activeTab === "chat" ? "is-active" : ""}
              onClick={() => {
                setActiveTab("chat");
                setToolsOpen(false);
                setHistoryOpen(false);
              }}
            >
              对话
            </button>
            <button
              type="button"
              className={activeTab === "workbench" ? "is-active" : ""}
              onClick={() => {
                setActiveTab("workbench");
                setToolsOpen(false);
                setHistoryOpen(false);
              }}
            >
              工作台
            </button>
          </div>

          <main className={`enterprise-ai-conversation${messages.length > 0 || streamingText ? " has-messages" : ""}`}>
            <div key={activeTab} className={`enterprise-ai-tab-panel is-${activeTab}`}>
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
                    {messages.map((message) => {
                      const canEditMessage = message.role === "user" && message.id === editableMessageKey && !loading;
                      const isEditingMessage = editingMessageId === message.id;

                      return (
                        <article
                          className={`enterprise-ai-bubble is-${message.role}${message.status === "error" ? " is-error" : ""}${isEditingMessage ? " is-editing" : ""}`}
                          key={message.id}
                        >
                          {isEditingMessage ? (
                            <div className="enterprise-ai-edit-message">
                              <textarea
                                aria-label="编辑要重发的消息"
                                rows={3}
                                value={editingText}
                                onChange={(event) => setEditingText(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                                    event.preventDefault();
                                    resendEditedMessage();
                                  }
                                }}
                              />
                              <div className="enterprise-ai-edit-actions">
                                <button type="button" onClick={cancelEditingMessage}>
                                  取消
                                </button>
                                <button type="button" disabled={!editingText.trim()} onClick={resendEditedMessage}>
                                  重发
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p>{message.text}</p>
                              {message.report ? renderReportCard(message.report) : null}
                              <div className="enterprise-ai-message-meta">
                                <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
                                <button
                                  type="button"
                                  aria-label={`复制消息 ${message.text}`}
                                  title="复制"
                                  onClick={() => copyMessageText(message.text)}
                                >
                                  <CopyOutlined />
                                </button>
                                {canEditMessage ? (
                                  <button
                                    type="button"
                                    aria-label={`编辑消息 ${message.text}`}
                                    title="编辑"
                                    onClick={() => startEditingMessage(message)}
                                  >
                                    <EditOutlined />
                                  </button>
                                ) : null}
                              </div>
                              {false && canEditMessage ? (
                                <button
                                  type="button"
                                  className="enterprise-ai-message-edit"
                                  aria-label={`编辑消息 ${message.text}`}
                                  onClick={() => startEditingMessage(message)}
                                >
                                  编辑
                                </button>
                              ) : null}
                            </>
                          )}
                        </article>
                      );
                    })}
                    {streamingText && (
                      <article className="enterprise-ai-bubble is-assistant is-streaming">
                        <p>{streamingText}</p>
                        {streamingReport ? renderReportCard(streamingReport) : null}
                      </article>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === "workbench" && (
              <div className="enterprise-ai-side-view">
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
            </div>
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
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
            />
            <div className="enterprise-ai-composer-actions">
              <div className="enterprise-ai-tool-picker">
                <button
                  type="button"
                  className={`enterprise-ai-tool-toggle${toolsOpen ? " is-active" : ""}`}
                  aria-label="查看可调用工具"
                  aria-expanded={toolsOpen}
                  aria-controls="enterprise-ai-tool-menu"
                  onClick={() => {
                    setToolsOpen((value) => !value);
                    setHistoryOpen(false);
                  }}
                >
                  <PlusOutlined />
                </button>
                {toolsOpen ? (
                  <div id="enterprise-ai-tool-menu" className="enterprise-ai-tool-popover" role="dialog" aria-label="可调用工具">
                    <div className="enterprise-ai-tool-popover-head">
                      <strong>可调用工具</strong>
                      <span>{toolCatalog.length > 0 ? "发送问题后，助手会自动选择合适工具。" : "当前角色暂无已注册业务工具。"}</span>
                    </div>
                    {toolCatalog.length > 0 ? (
                      <div className="enterprise-ai-tool-list">
                        {toolCatalog.map((tool) => (
                          <article key={tool.name}>
                            <DatabaseOutlined />
                            <span>
                              <b>{tool.label}</b>
                              <em>{tool.description}</em>
                            </span>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <span className="enterprise-ai-muted">可继续进行普通对话</span>
                    )}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className={`enterprise-ai-send${loading ? " is-sent" : ""}`}
                aria-label="发送"
                disabled={(!inputValue.trim() && !loading) || loading}
                onClick={() => sendMessage()}
              >
                <span className="enterprise-ai-send-outline" aria-hidden="true" />
                <span className="enterprise-ai-send-state enterprise-ai-send-default">
                  <span className="enterprise-ai-send-icon" aria-hidden="true">
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" focusable="false">
                      <g>
                        <path
                          d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z"
                          fill="currentColor"
                        />
                        <path
                          d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z"
                          fill="currentColor"
                        />
                      </g>
                    </svg>
                  </span>
                  <span className="enterprise-ai-send-label">
                    <span style={{ "--i": 0 } as CSSProperties}>发</span>
                    <span style={{ "--i": 1 } as CSSProperties}>送</span>
                  </span>
                </span>
                <span className="enterprise-ai-send-state enterprise-ai-send-sent">
                  <span className="enterprise-ai-send-icon" aria-hidden="true">
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" focusable="false">
                      <path
                        fill="currentColor"
                        d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z"
                      />
                      <path
                        fill="currentColor"
                        d="M10.5795 15.5801C10.3795 15.5801 10.1895 15.5001 10.0495 15.3601L7.21945 12.5301C6.92945 12.2401 6.92945 11.7601 7.21945 11.4701C7.50945 11.1801 7.98945 11.1801 8.27945 11.4701L10.5795 13.7701L15.7195 8.6301C16.0095 8.3401 16.4895 8.3401 16.7795 8.6301C17.0695 8.9201 17.0695 9.4001 16.7795 9.6901L11.1095 15.3601C10.9695 15.5001 10.7795 15.5801 10.5795 15.5801Z"
                      />
                    </svg>
                  </span>
                  <span className="enterprise-ai-send-label">
                    <span style={{ "--i": 0 } as CSSProperties}>已</span>
                    <span style={{ "--i": 1 } as CSSProperties}>发</span>
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
