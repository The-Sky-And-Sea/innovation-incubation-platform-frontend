/**
 * 对话助手 Chat 共享组件（第二阶段：含 SSE 流式消息发送）
 *
 * 面向企业端和载体端：
 * - 左侧会话列表（新建、删除、切换）
 * - 右侧消息展示区 + 消息输入框
 * - SSE 流式接收 thinking / reply / error / done 事件
 *
 * 第三阶段将在此基础上添加编辑重发能力。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Input,
  List,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import {
  BulbOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  MessageOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  createChatSession,
  deleteChatSession,
  editChatMessage,
  getChatSession,
  getChatSessions,
  sendChatMessage,
} from "../api/chat";
import type { ChatMessage, ChatSession } from "../types";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

/** 流式消息气泡组件 — 实时渲染 thinking + reply */
function StreamingBubble({
  thinking,
  reply,
  loading,
}: {
  thinking: string;
  reply: string;
  loading: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
      <div
        style={{
          maxWidth: "70%",
          padding: "10px 16px",
          borderRadius: 12,
          background: "#f0f2f5",
          color: "#1f1f1f",
          minWidth: 120,
        }}
      >
        <div style={{ marginBottom: 4, fontSize: 12, opacity: 0.7 }}>
          <Space size={4}>
            {loading ? <LoadingOutlined /> : <RobotOutlined />}
            <span>助手</span>
            <span>·</span>
            <span>回复中...</span>
          </Space>
        </div>
        {thinking && (
          <details open style={{ marginBottom: thinking && reply ? 8 : 0 }}>
            <summary style={{ cursor: "pointer", fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
              <BulbOutlined style={{ marginRight: 4 }} />
              思考过程
            </summary>
            <Paragraph
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                fontSize: 13,
                opacity: 0.75,
                background: "#e6f0fa",
                padding: "8px 12px",
                borderRadius: 8,
              }}
            >
              {thinking}
            </Paragraph>
          </details>
        )}
        {reply && (
          <Paragraph style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {reply}
            {loading && <span className="streaming-cursor">▍</span>}
          </Paragraph>
        )}
        {!thinking && !reply && loading && (
          <Text type="secondary" style={{ fontSize: 13 }}>
            正在思考...
          </Text>
        )}
      </div>
    </div>
  );
}

export default function ChatPanel() {
  // --- 会话列表状态 ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  // --- 新建会话 ---
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // --- 会话详情（消息列表） ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // --- 发送消息 ---
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingThinking, setStreamingThinking] = useState("");
  const [streamingReply, setStreamingReply] = useState("");
  const [awaitingReply, setAwaitingReply] = useState(false);

  // --- 编辑重发 ---
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // --- Refs ---
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /** 自动滚动到底部 */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingThinking, streamingReply, awaitingReply, scrollToBottom]);

  /** 加载会话列表 */
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await getChatSessions();
      setSessions(res.data || []);
    } catch {
      message.error("加载会话列表失败");
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  /** 加载选中会话的消息 */
  const loadMessages = useCallback(async (sessionId: number) => {
    setMessagesLoading(true);
    try {
      const res = await getChatSession(sessionId);
      setMessages(res.data.messages || []);
    } catch {
      message.error("加载消息失败");
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  /** 切换会话（取消当前发送） */
  const handleSelectSession = (sessionId: number) => {
    // 如果正在发送，中止
    abortRef.current?.abort();
    setSending(false);
    setAwaitingReply(false);
    setStreamingThinking("");
    setStreamingReply("");

    setActiveSessionId(sessionId);
    loadMessages(sessionId);
  };

  /** 新建会话 */
  const handleCreate = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      message.warning("请输入会话标题");
      return;
    }
    setCreating(true);
    try {
      const res = await createChatSession({ title: trimmed });
      message.success("会话已创建");
      setNewTitle("");
      setCreateModalOpen(false);
      await loadSessions();
      if (res.data?.id) {
        setActiveSessionId(res.data.id);
        loadMessages(res.data.id);
      }
    } catch {
      message.error("创建会话失败");
    } finally {
      setCreating(false);
    }
  };

  /** 删除会话 */
  const handleDelete = async (sessionId: number) => {
    try {
      await deleteChatSession(sessionId);
      message.success("会话已删除");
      if (activeSessionId === sessionId) {
        abortRef.current?.abort();
        setActiveSessionId(null);
        setMessages([]);
        setSending(false);
        setAwaitingReply(false);
        setStreamingThinking("");
        setStreamingReply("");
      }
      await loadSessions();
    } catch {
      message.error("删除会话失败");
    }
  };

  /** 发送消息 */
  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !activeSessionId || sending) return;

    setSending(true);
    setInputValue("");
    setStreamingThinking("");
    setStreamingReply("");
    setAwaitingReply(true);

    // 不需要在这里手动添加 user 消息到列表，因为重载消息时会从后端获取
    try {
      const controller = await sendChatMessage(
        activeSessionId,
        { content: trimmed },
        {
          onThinking: (chunk) => {
            setStreamingThinking((prev) => prev + chunk);
          },
          onReply: (content) => {
            setAwaitingReply(false);
            setStreamingReply(content);
          },
          onError: (msg) => {
            message.error(msg);
          },
          onDone: () => {
            setSending(false);
            setAwaitingReply(false);
            // 重载消息列表获取完整对话历史
            if (activeSessionId) {
              loadMessages(activeSessionId);
              // 同时刷新会话列表（更新 last_message_at 和 message_count）
              loadSessions();
            }
            abortRef.current = null;
          },
        },
      );
      abortRef.current = controller;
    } catch (err) {
      message.error((err as Error).message || "发送失败");
      setSending(false);
      setAwaitingReply(false);
    }
  };

  /** 停止生成 */
  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSending(false);
    setAwaitingReply(false);
    // 重载消息列表
    if (activeSessionId) {
      loadMessages(activeSessionId);
      loadSessions();
    }
  };

  /** 获取最后一条 user 消息（用于判断是否可编辑） */
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user") || null;

  /** 进入编辑模式 */
  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
    setInputValue(msg.content);
  };

  /** 取消编辑 */
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
    setInputValue("");
  };

  /** 提交编辑重发 */
  const handleEditSubmit = async () => {
    const trimmed = editingContent.trim();
    if (!trimmed || !activeSessionId || !editingMessageId || sending) return;

    // 内容没变，直接取消
    const originalMsg = messages.find((m) => m.id === editingMessageId);
    if (originalMsg && trimmed === originalMsg.content) {
      handleCancelEdit();
      return;
    }

    setSending(true);
    setEditingMessageId(null);
    setEditingContent("");
    setInputValue("");
    setStreamingThinking("");
    setStreamingReply("");
    setAwaitingReply(true);

    try {
      const controller = await editChatMessage(
        activeSessionId,
        editingMessageId,
        { content: trimmed },
        {
          onThinking: (chunk) => {
            setStreamingThinking((prev) => prev + chunk);
          },
          onReply: (content) => {
            setAwaitingReply(false);
            setStreamingReply(content);
          },
          onError: (msg) => {
            message.error(msg);
          },
          onDone: () => {
            setSending(false);
            setAwaitingReply(false);
            if (activeSessionId) {
              loadMessages(activeSessionId);
              loadSessions();
            }
            abortRef.current = null;
          },
        },
      );
      abortRef.current = controller;
    } catch (err) {
      message.error((err as Error).message || "编辑失败");
      setSending(false);
      setAwaitingReply(false);
    }
  };

  /** 编辑模式下 Enter 提交编辑 */
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit();
    }
    if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  /** 按 Enter 发送（Shift+Enter 换行） */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /** 格式化时间 */
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return "刚刚";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 72px)", gap: 16 }}>
      {/* ========== 左侧：会话列表 ========== */}
      <Card
        className="chat-session-sidebar"
        style={{
          width: 280,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
        }}
        bodyStyle={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 12,
          overflow: "hidden",
        }}
        title={
          <Space>
            <MessageOutlined />
            <span>会话列表</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            新建
          </Button>
        }
      >
        <Spin spinning={sessionsLoading}>
          {sessions.length === 0 ? (
            <Empty
              description="暂无会话"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: 40 }}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalOpen(true)}
              >
                创建第一个会话
              </Button>
            </Empty>
          ) : (
            <List
              dataSource={sessions}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  onClick={() => handleSelectSession(item.id)}
                  style={{
                    cursor: "pointer",
                    padding: "8px 12px",
                    borderRadius: 8,
                    marginBottom: 4,
                    background:
                      activeSessionId === item.id ? "#e6f4ff" : "transparent",
                    border:
                      activeSessionId === item.id
                        ? "1px solid #1677ff"
                        : "1px solid transparent",
                  }}
                  actions={[
                    <Popconfirm
                      key="delete"
                      title="确定删除此会话？"
                      description="删除后无法恢复"
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        handleDelete(item.id);
                      }}
                      onCancel={(e) => e?.stopPropagation()}
                      okText="删除"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Tag color="blue" style={{ marginRight: 0 }}>
                        {item.message_count || 0}
                      </Tag>
                    }
                    title={
                      <Text ellipsis style={{ maxWidth: 160 }}>
                        {item.title}
                      </Text>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.last_message_at
                          ? formatTime(item.last_message_at)
                          : formatTime(item.created_at)}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Card>

      {/* ========== 右侧：消息展示区 + 输入框 ========== */}
      <Card
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
        bodyStyle={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "16px 16px 0 16px",
          overflow: "hidden",
        }}
        title={
          activeSession ? (
            <Space>
              <MessageOutlined />
              <span>{activeSession.title}</span>
              <Tag>{activeSession.message_count || 0} 条消息</Tag>
            </Space>
          ) : (
            <Space>
              <RobotOutlined />
              <span>对话助手</span>
            </Space>
          )
        }
      >
        {/* 消息列表区域 */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8, paddingRight: 4 }}>
          {!activeSessionId ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Empty description="选择一个会话或创建新会话开始对话">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalOpen(true)}
                >
                  新建会话
                </Button>
              </Empty>
            </div>
          ) : messagesLoading ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Spin tip="加载消息中..." />
            </div>
          ) : messages.length === 0 && !awaitingReply ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Empty description="发送第一条消息，开始与助手对话" />
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isLastUserMsg =
                  msg.role === "user" && lastUserMessage?.id === msg.id && !sending;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                      marginBottom: 16,
                      alignItems: isLastUserMsg ? "center" : undefined,
                      gap: isLastUserMsg ? 4 : undefined,
                    }}
                  >
                    {isLastUserMsg && (
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleStartEdit(msg)}
                        style={{
                          order: -1,
                          fontSize: 12,
                          color: "#8c8c8c",
                        }}
                        title="编辑此消息并重新发送"
                      />
                    )}
                    <div
                      style={{
                        maxWidth: "70%",
                        padding: "10px 16px",
                        borderRadius: 12,
                        background: msg.role === "user" ? "#1677ff" : "#f0f2f5",
                        color: msg.role === "user" ? "#fff" : "#1f1f1f",
                      }}
                    >
                      <div style={{ marginBottom: 4, fontSize: 12, opacity: 0.7 }}>
                        <Space size={4}>
                          {msg.role === "user" ? <UserOutlined /> : <RobotOutlined />}
                          <span>{msg.role === "user" ? "我" : "助手"}</span>
                          <span>·</span>
                          <span>{formatTime(msg.created_at)}</span>
                        </Space>
                      </div>
                      <Paragraph style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                        {msg.content}
                      </Paragraph>
                      {msg.state && Object.keys(msg.state).length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                          <Text
                            style={{
                              color:
                                msg.role === "user"
                                  ? "rgba(255,255,255,0.7)"
                                  : "rgba(0,0,0,0.45)",
                            }}
                          >
                            上下文: {JSON.stringify(msg.state)}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 流式回复气泡 */}
              {awaitingReply && (
                <StreamingBubble
                  thinking={streamingThinking}
                  reply={streamingReply}
                  loading={sending}
                />
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* 输入区域 */}
        <div
          style={{
            padding: "12px 0",
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            background: "#fff",
          }}
        >
          {editingMessageId !== null ? (
            <>
              <TextArea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setEditingContent(e.target.value);
                }}
                onKeyDown={handleEditKeyDown}
                placeholder="编辑消息，Enter 提交，Escape 取消"
                disabled={sending}
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ flex: 1 }}
              />
              <Button onClick={handleCancelEdit} disabled={sending}>
                取消
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleEditSubmit}
                disabled={!inputValue.trim() || sending}
              >
                重发
              </Button>
            </>
          ) : (
            <>
              <TextArea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeSessionId
                    ? "输入消息，Enter 发送，Shift+Enter 换行"
                    : "请先选择或创建会话"
                }
                disabled={!activeSessionId || sending}
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ flex: 1 }}
              />
              {sending ? (
                <Button
                  type="primary"
                  danger
                  icon={<StopOutlined />}
                  onClick={handleStop}
                >
                  停止
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  disabled={!activeSessionId || !inputValue.trim()}
                >
                  发送
                </Button>
              )}
            </>
          )}
        </div>
      </Card>

      {/* ========== 新建会话弹窗 ========== */}
      <Modal
        title="新建会话"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalOpen(false);
          setNewTitle("");
        }}
        confirmLoading={creating}
        okText="创建"
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text>请输入会话标题：</Text>
          <Input
            placeholder="例如：政策咨询、申报帮助..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onPressEnter={handleCreate}
            autoFocus
            maxLength={50}
            showCount
          />
        </Space>
      </Modal>
    </div>
  );
}