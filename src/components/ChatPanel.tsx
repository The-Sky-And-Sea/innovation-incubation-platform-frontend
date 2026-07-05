/**
 * 对话助手 Chat 共享组件
 *
 * 面向企业端和载体端，提供会话管理（CRUD）功能：
 * - 左侧会话列表（支持新建、删除、切换）
 * - 右侧消息展示区（会加载选中会话的全部消息）
 *
 * 第二阶段将在此组件基础上添加 SSE 消息发送能力。
 */

import { useCallback, useEffect, useState } from "react";
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
  DeleteOutlined,
  MessageOutlined,
  PlusOutlined,
  RobotOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  createChatSession,
  deleteChatSession,
  getChatSession,
  getChatSessions,
} from "../api/chat";
import type { ChatMessage, ChatSession } from "../types";

const { Text, Paragraph } = Typography;

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

  /** 切换会话 */
  const handleSelectSession = (sessionId: number) => {
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
      // 自动选中新创建的会话
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
        setActiveSessionId(null);
        setMessages([]);
      }
      await loadSessions();
    } catch {
      message.error("删除会话失败");
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
        style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column" }}
        bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", padding: 12, overflow: "hidden" }}
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
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
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
                    background: activeSessionId === item.id ? "#e6f4ff" : "transparent",
                    border: activeSessionId === item.id ? "1px solid #1677ff" : "1px solid transparent",
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
                    title={<Text ellipsis style={{ maxWidth: 160 }}>{item.title}</Text>}
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.last_message_at ? formatTime(item.last_message_at) : formatTime(item.created_at)}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Card>

      {/* ========== 右侧：消息展示区 ========== */}
      <Card
        style={{ flex: 1, display: "flex", flexDirection: "column" }}
        bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, overflow: "hidden" }}
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
        {!activeSessionId ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Empty description="选择一个会话或创建新会话开始对话">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                新建会话
              </Button>
            </Empty>
          </div>
        ) : messagesLoading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Spin tip="加载消息中..." />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Empty description="暂无消息，发送第一条消息开始对话" />
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", paddingRight: 8 }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 16,
                }}
              >
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
                      <Text style={{ color: msg.role === "user" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.45)" }}>
                        上下文: {JSON.stringify(msg.state)}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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