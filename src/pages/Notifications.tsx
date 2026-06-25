import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Empty, List, Segmented, Space, Tag, Typography } from "antd";
import { BellOutlined, CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import type { NotificationType } from "../types";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";

const { Title, Text } = Typography;

const typeLabels: Partial<Record<NotificationType, string>> = {
  incubation_pending: "入驻待审",
  incubation_reviewed: "入驻结果",
  incubation_graduated: "孵化毕业",
  change_pending: "变更待审",
  change_reviewed: "变更结果",
  application_pending: "申报待审",
  application_carrier_approved: "载体通过",
  application_reviewed: "申报结果",
  performance_submitted: "绩效提交",
  performance_scored: "绩效评分",
  policy_published: "政策发布",
  policy_updated: "政策更新",
  deletion_applied: "注销申请",
  deletion_approved: "注销通过",
  deletion_rejected: "注销驳回",
  account_deleted: "账号注销",
};

export default function NotificationCenter() {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const { list, unreadCount, loading, startPolling, stopPolling, refresh, markAsRead, markAllAsRead } =
    useNotificationStore();
  const authUser = useAuthStore((s) => s.user);
  const userId = authUser?.id ?? 1;

  const filteredList = useMemo(() => {
    if (filter === "unread") return list.filter((item) => !item.is_read);
    if (filter === "read") return list.filter((item) => item.is_read);
    return list;
  }, [filter, list]);

  useEffect(() => {
    startPolling(userId);
    return () => stopPolling();
  }, [startPolling, stopPolling, userId]);

  return (
    <div className="notifications-page">
      <section className="page-heading">
        <div>
          <Space>
            <BellOutlined />
            <Title level={3}>通知中心</Title>
            {unreadCount > 0 && <Badge count={unreadCount} />}
          </Space>
          <Text type="secondary">统一查看审核流转、政策发布、绩效考核与账号治理提醒。</Text>
        </div>
        <Space>
          {unreadCount > 0 && (
            <Button icon={<CheckCircleOutlined />} onClick={markAllAsRead}>
              全部已读
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={() => refresh(userId)} loading={loading}>
            刷新
          </Button>
        </Space>
      </section>

      <Card
        className="role-section-card"
        variant="borderless"
        title="通知列表"
        extra={
          <Segmented
            size="small"
            value={filter}
            onChange={(value) => setFilter(value as "all" | "unread" | "read")}
            options={[
              { label: `全部 ${list.length}`, value: "all" },
              { label: `未读 ${unreadCount}`, value: "unread" },
              { label: `已读 ${Math.max(list.length - unreadCount, 0)}`, value: "read" },
            ]}
          />
        }
      >
        {filteredList.length === 0 && !loading ? (
          <Empty description={filter === "all" ? "暂无通知" : "当前筛选下暂无通知"} />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={filteredList}
            loading={loading}
            renderItem={(item) => (
              <List.Item
                className={`notification-item ${item.is_read ? "is-read" : "is-unread"}`}
                actions={[
                  !item.is_read && (
                    <Button key="read" type="link" size="small" onClick={() => markAsRead([item.id])}>
                      标为已读
                    </Button>
                  ),
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={
                    <span className="notification-avatar">
                      <BellOutlined />
                    </span>
                  }
                  title={
                    <Space wrap>
                      <Text strong={!item.is_read}>{item.title}</Text>
                      <Tag color={item.is_read ? "default" : "blue"}>{typeLabels[item.type] || "系统通知"}</Tag>
                      {!item.is_read && <Badge status="processing" />}
                    </Space>
                  }
                  description={
                    <Space orientation="vertical" size={4}>
                      <Text type="secondary">{item.content}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <ClockCircleOutlined /> {new Date(item.created_at).toLocaleString("zh-CN")}
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
