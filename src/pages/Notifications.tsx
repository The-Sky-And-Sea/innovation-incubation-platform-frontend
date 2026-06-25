/**
 * 通知中心页面（所有角色共享）
 *
 * 功能：
 * - 通知列表（类型图标 + 标题 + 内容 + 时间）
 * - 已读 / 未读状态区分
 * - 标记已读（单条 / 全部）
 * - 自动轮询（进入页面启动，离开停止）
 */

import { useEffect } from "react";
import {
  Card,
  Typography,
  List,
  Button,
  Space,
  Badge,
  Empty,
} from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { NotificationType } from "../types";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";

const { Title, Text } = Typography;

/** 通知类型图标映射 */
const typeIcons: Partial<Record<NotificationType, React.ReactNode>> = {
  incubation_pending: "🏢",
  incubation_reviewed: "✅",
  incubation_graduated: "🎓",
  change_pending: "📝",
  change_reviewed: "✅",
  application_pending: "📋",
  application_carrier_approved: "👍",
  application_reviewed: "🏁",
  performance_submitted: "📊",
  performance_scored: "⭐",
  policy_published: "📢",
  policy_updated: "🔄",
  deletion_applied: "🗑",
  deletion_approved: "⭕",
  deletion_rejected: "🚫",
  account_deleted: "💀",
};

export default function NotificationCenter() {
  const {
    list,
    unreadCount,
    loading,
    startPolling,
    stopPolling,
    refresh,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const authUser = useAuthStore((s) => s.user);
  const userId = authUser?.id ?? 1;

  // 进入页面时启动轮询，离开时停止
  useEffect(() => {
    startPolling(userId);
    return () => stopPolling();
  }, [startPolling, stopPolling, userId]);

  return (
    <div>
      <Title level={3}>
        <BellOutlined style={{ marginRight: 8 }} />
        通知中心
        {unreadCount > 0 && (
          <Badge
            count={unreadCount}
            style={{ marginLeft: 12, backgroundColor: "#f5222d" }}
          />
        )}
      </Title>

      <Card
        extra={
          <Space>
            {unreadCount > 0 && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={markAllAsRead}
              >
                全部已读
              </Button>
            )}
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => refresh(userId)}
            >
              刷新
            </Button>
          </Space>
        }
      >
        {list.length === 0 && !loading ? (
          <Empty description="暂无通知" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={list}
            loading={loading}
            renderItem={(item) => (
              <List.Item
                style={{
                  background: item.is_read ? "transparent" : "#f6ffed",
                  padding: "12px 16px",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
                actions={[
                  !item.is_read && (
                    <Button
                      key="read"
                      type="link"
                      size="small"
                      onClick={() => markAsRead([item.id])}
                    >
                      标为已读
                    </Button>
                  ),
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={
                    <span style={{ fontSize: 24 }}>
                      {typeIcons[item.type] || "🔔"}
                    </span>
                  }
                  title={
                    <Space>
                      <Text strong={!item.is_read}>{item.title}</Text>
                      {!item.is_read && (
                        <Badge status="processing" />
                      )}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">{item.content}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(item.created_at).toLocaleString("zh-CN")}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}