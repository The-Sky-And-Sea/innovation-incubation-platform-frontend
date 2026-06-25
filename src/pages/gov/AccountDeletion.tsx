/**
 * 政务端 — 账号注销管理页面
 *
 * 功能：
 * - 查看注销申请列表（可选筛选 status: pending/approved/rejected）
 * - 审核注销申请（通过后自动软删除并清理关联数据）
 */

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Typography,
  Space,
  Tag,
  Table,
  Button,
  message,
  Modal,
  Input,
  Alert,
  Empty,
  Select,
} from "antd";
import {
  UserDeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
const { TextArea } = Input;

/** 模拟注销申请数据 */
interface DeletionRequest {
  id: number;
  applicant_name: string;
  applicant_type: "enterprise" | "carrier";
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

const mockDeletions: DeletionRequest[] = [
  {
    id: 1,
    applicant_name: "测试科技有限公司",
    applicant_type: "enterprise",
    reason: "企业已停止运营",
    status: "pending",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    applicant_name: "深圳湾创业广场",
    applicant_type: "carrier",
    reason: "载体已停止运营",
    status: "pending",
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 3,
    applicant_name: "某企业已注销",
    applicant_type: "enterprise",
    reason: "经营已满5年",
    status: "approved",
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
];

export default function GovAccountDeletion() {
  const [deletions, setDeletions] = useState<DeletionRequest[]>(mockDeletions);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("pending");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // 审核弹窗
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    record: DeletionRequest | null;
    action: "approve" | "reject" | null;
  }>({ open: false, record: null, action: null });
  const [reviewComment, setReviewComment] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const fetchList = useCallback(
    (page = 1, pageSize = 10, statusFilter = filter) => {
      setLoading(true);
      try {
        const filtered = statusFilter
          ? mockDeletions.filter((d) => d.status === statusFilter)
          : mockDeletions;
        const list = filtered.slice((page - 1) * pageSize, page * pageSize);
        setDeletions(list);
        setPagination({ current: page, pageSize, total: filtered.length });
        // mock 延迟
        setTimeout(() => setLoading(false), 300);
      } catch {
        message.error("加载注销申请失败");
        setLoading(false);
      }
    },
    [filter],
  );

  useEffect(() => {
    fetchList(1, 10, filter);
  }, [fetchList, filter]);

  const openReview = (record: DeletionRequest, action: "approve" | "reject") => {
    setReviewModal({ open: true, record, action });
    setReviewComment("");
  };

  const handleReview = () => {
    if (!reviewModal.record || !reviewModal.action) return;
    setReviewing(true);
    // Mock 审核逻辑
    setTimeout(() => {
      const idx = mockDeletions.findIndex((d) => d.id === reviewModal.record!.id);
      if (idx !== -1) {
        mockDeletions[idx].status = reviewModal.action as "approved" | "rejected";
      }
      message.success(reviewModal.action === "approve" ? "已批准注销，账号已删除" : "已拒绝注销申请");
      setReviewing(false);
      setReviewModal({ open: false, record: null, action: null });
      fetchList(1, pagination.pageSize, filter);
    }, 600);
  };

  const columns: ColumnsType<DeletionRequest> = [
    { title: "编号", dataIndex: "id", key: "id", width: 60 },
    { title: "申请人", dataIndex: "applicant_name", key: "applicant_name", width: 180, render: (n: string) => <Text strong>{n}</Text> },
    {
      title: "类型",
      dataIndex: "applicant_type",
      key: "applicant_type",
      width: 80,
      render: (t: string) => (
        <Tag color={t === "enterprise" ? "blue" : "green"}>
          {t === "enterprise" ? "企业" : "载体"}
        </Tag>
      ),
    },
    { title: "注销原因", dataIndex: "reason", key: "reason", width: 200, ellipsis: true },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (s: string) => {
        const colors: Record<string, string> = { pending: "processing", approved: "success", rejected: "error" };
        const labels: Record<string, string> = { pending: "待审核", approved: "已通过", rejected: "已拒绝" };
        return <Tag color={colors[s] || "default"}>{labels[s] || s}</Tag>;
      },
    },
    {
      title: "提交时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (d: string) => (d ? new Date(d).toLocaleString("zh-CN") : "-"),
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      render: (_, r) =>
        r.status === "pending" ? (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => openReview(r, "approve")}
            >
              通过
            </Button>
            <Button
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => openReview(r, "reject")}
            >
              拒绝
            </Button>
          </Space>
        ) : (
          <Text type="secondary">已审核</Text>
        ),
    },
  ];

  return (
    <div>
      <Title level={3}>
        <UserDeleteOutlined style={{ marginRight: 8 }} />
        账号注销管理
      </Title>

      <Alert
        message="审核说明"
        description="通过注销后自动执行软删除并清理关联数据。拒绝则保留账号。注销申请由企业或载体端提交。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card
        extra={
          <Space>
            <Select
              value={filter}
              onChange={(v) => { setFilter(v); fetchList(1, 10, v); }}
              style={{ width: 120 }}
              options={[
                { label: "全部", value: "" },
                { label: "待审核", value: "pending" },
                { label: "已通过", value: "approved" },
                { label: "已拒绝", value: "rejected" },
              ]}
            />
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => fetchList(pagination.current, pagination.pageSize, filter)}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={deletions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
            showTotal: (t, r) => `${r[0]}-${r[1]} / 共 ${t} 条`,
            onChange: (p, ps) => fetchList(p, ps, filter),
          }}
          size="middle"
          locale={{ emptyText: <Empty description="暂无注销申请" /> }}
        />
      </Card>

      {/* 审核弹窗 */}
      <Modal
        title={
          <Space>
            {reviewModal.action === "approve" ? (
              <><CheckCircleOutlined /> 批准注销</>
            ) : (
              <><CloseCircleOutlined /> 拒绝注销</>
            )}
          </Space>
        }
        open={reviewModal.open}
        onOk={handleReview}
        onCancel={() => setReviewModal({ open: false, record: null, action: null })}
        confirmLoading={reviewing}
        okText="确认"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Text>
            {reviewModal.record?.applicant_type === "enterprise" ? "企业" : "载体"}
            「{reviewModal.record?.applicant_name}」的账号注销申请
          </Text>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">注销原因：{reviewModal.record?.reason}</Text>
        </div>
        <TextArea
          rows={2}
          placeholder="审核意见（选填）"
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
        />
      </Modal>
    </div>
  );
}