import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Empty, List, Segmented, Space, Tag, Typography } from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { Notification, NotificationType } from "../types";
import { downloadFile } from "../api/files";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { triggerBrowserDownload } from "../utils/download";

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
  appeal_submitted: "诉求提交",
  appeal_processed: "诉求处理",
  report_generated: "报告生成",
};

type ReportNotificationData = {
  fileId?: number;
  format?: string;
};

function parseJsonObject(value: string): Record<string, unknown> | null {
  const text = value.trim();
  if (!text.startsWith("{") || !text.endsWith("}")) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function getReportNotificationData(item: Notification): ReportNotificationData | null {
  if (item.type !== "report_generated") return null;
  const parsed = parseJsonObject(item.content);
  const fileId = Number(parsed?.file_id ?? parsed?.fileId ?? item.target_id);
  const format = String(parsed?.format || "").trim().toUpperCase();
  return {
    fileId: Number.isFinite(fileId) && fileId > 0 ? fileId : undefined,
    format: format || undefined,
  };
}

function getNotificationContent(item: Notification): string {
  const report = getReportNotificationData(item);
  if (report) {
    const formatText = report.format ? `${report.format} ` : "";
    return `${formatText}政务数据分析报告已生成，可下载留存或归档。`;
  }
  const parsed = parseJsonObject(item.content);
  if (parsed) return "系统业务通知已更新，请进入对应业务页面查看详情。";
  return item.content;
}

function reportFilename(format?: string): string {
  const ext = (format || "md").toLowerCase();
  return `政务数据分析报告.${ext}`;
}

export default function NotificationCenter() {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());
  const { list, unreadCount, loading, startPolling, stopPolling, refresh, markAsRead, markAllAsRead } =
    useNotificationStore();
  const authUser = useAuthStore((state) => state.user);
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

  const handleDownloadReport = async (item: Notification) => {
    const report = getReportNotificationData(item);
    if (!report?.fileId || downloadingIds.has(item.id)) return;
    setDownloadingIds((ids) => new Set(ids).add(item.id));
    try {
      const blobUrl = await downloadFile(report.fileId);
      triggerBrowserDownload(blobUrl, reportFilename(report.format));
      if (!item.is_read) await markAsRead([item.id]);
    } finally {
      setDownloadingIds((ids) => {
        const next = new Set(ids);
        next.delete(item.id);
        return next;
      });
    }
  };

  return (
    <div className="notifications-page">
      <section className="notification-heading">
        <div className="notification-heading-main">
          <span className="notification-heading-icon">
            <BellOutlined />
          </span>
          <div className="notification-heading-copy">
            <div className="notification-title-row">
              <Title level={3}>通知中心</Title>
              {unreadCount > 0 && <span className="notification-unread-pill">未读 {unreadCount}</span>}
            </div>
            <Text type="secondary">统一查看审核流转、政策发布、绩效考核与账号治理提醒。</Text>
          </div>
        </div>
        <Space className="notification-actions">
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
        className="role-section-card notification-list-card"
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
            renderItem={(item) => {
              const report = getReportNotificationData(item);
              const actions = [
                report?.fileId ? (
                  <Button
                    key="download"
                    type="primary"
                    size="small"
                    icon={<DownloadOutlined />}
                    loading={downloadingIds.has(item.id)}
                    onClick={() => handleDownloadReport(item)}
                  >
                    下载报告
                  </Button>
                ) : null,
                !item.is_read ? (
                  <Button key="read" type="link" size="small" onClick={() => markAsRead([item.id])}>
                    标为已读
                  </Button>
                ) : null,
              ].filter(Boolean);

              return (
                <List.Item
                  className={`notification-item ${item.is_read ? "is-read" : "is-unread"}`}
                  actions={actions}
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
                      <Space direction="vertical" size={6} className="notification-description">
                        <Text type="secondary">{getNotificationContent(item)}</Text>
                        {report?.fileId ? (
                          <Text className="notification-meta-line">
                            文件编号：{report.fileId}
                            {report.format ? ` · 格式：${report.format}` : ""}
                          </Text>
                        ) : null}
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <ClockCircleOutlined /> {new Date(item.created_at).toLocaleString("zh-CN")}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
}
