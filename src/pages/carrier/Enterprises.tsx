/**
 * 载体端 - 入驻企业管理
 *
 * 展示入驻在本载体下的所有企业，可对在孵企业发起"提前结束入驻"
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
  Empty,
  Alert,
  Form,
} from "antd";
import {
  TeamOutlined,
  ReloadOutlined,
  StopOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  getCarrierIncubationList,
  terminateIncubation,
} from "../../api/carrier";
import type { IncubationRecord, AuditStatus } from "../../types";

const { Title, Text } = Typography;

// 审核状态映射
const statusMap: Record<AuditStatus, { color: string; label: string }> = {
  draft: { color: "default", label: "草稿" },
  pending: { color: "processing", label: "待审核" },
  approved: { color: "success", label: "已通过" },
  rejected: { color: "error", label: "已拒绝" },
  returned: { color: "warning", label: "已退回" },
  carrier_review: { color: "processing", label: "载体审核中" },
  gov_review: { color: "processing", label: "政务审核中" },
};

// 孵化状态映射
const incubateMap: Record<string, { color: string; label: string }> = {
  in_incubation: { color: "green", label: "在孵" },
  graduated: { color: "blue", label: "已毕业" },
  exited: { color: "default", label: "已退出" },
};

export default function CarrierEnterprises() {
  const [records, setRecords] = useState<IncubationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // 提前结束弹窗
  const [terminateModal, setTerminateModal] = useState<{
    open: boolean;
    record: IncubationRecord | null;
  }>({ open: false, record: null });
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 加载列表
  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getCarrierIncubationList(page, pageSize);
      setRecords(res.data.list);
      setPagination({
        current: res.data.page,
        pageSize: res.data.page_size,
        total: res.data.total,
      });
    } catch {
      message.error("加载入驻企业列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(1, 10); }, [fetchList]);

  // 打开弹窗
  const openTerminate = (record: IncubationRecord) => {
    setTerminateModal({ open: true, record });
    setReason("");
  };

  // 提交提前结束
  const handleTerminate = async () => {
    if (!terminateModal.record) return;
    if (!reason.trim()) {
      message.warning("请填写提前结束的原因");
      return;
    }
    setSubmitting(true);
    try {
      await terminateIncubation(terminateModal.record.id, reason.trim());
      message.success("已提前结束该企业的入驻");
      setTerminateModal({ open: false, record: null });
      fetchList(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error((err as Error).message || "操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<IncubationRecord> = [
    { title: "编号", dataIndex: "id", key: "id", width: 60 },
    {
      title: "企业名称",
      key: "enterprise_name",
      width: 180,
      ellipsis: true,
      render: (_, r) => r.enterprise?.name || `企业 #${r.enterprise_id}`,
    },
    {
      title: "入孵时间",
      key: "date",
      width: 200,
      render: (_, r) => `${r.incubate_start} ~ ${r.incubate_end}`,
    },
    {
      title: "审核状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (s: AuditStatus) => {
        const cfg = statusMap[s] || statusMap.draft;
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "孵化状态",
      key: "incubate_status",
      width: 100,
      render: (_, r) => {
        const status = (r.incubate_status as string) || "in_incubation";
        const cfg = incubateMap[status] || { color: "default", label: status };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
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
      width: 160,
      fixed: "right",
      render: (_, r) => {
        const isInIncubation = r.status === "approved" && r.incubate_status === "in_incubation";
        return (
          <Button
            size="small"
            danger
            icon={<StopOutlined />}
            disabled={!isInIncubation}
            onClick={() => openTerminate(r)}
          >
            提前结束
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <Title level={3}>
        <TeamOutlined style={{ marginRight: 8 }} />
        入驻企业
      </Title>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="入驻企业管理"
        description="展示所有入驻本载体的企业记录。对于仍在孵的企业，可发起「提前结束」操作（需填写原因），结束后企业可重新提交入驻申请。"
      />

      <Card
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchList(pagination.current, pagination.pageSize)}
            loading={loading}
          >
            刷新
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          scroll={{ x: "max-content" }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
            showTotal: (t, r) => `${r[0]}-${r[1]} / 共 ${t} 条`,
            onChange: (p, ps) => fetchList(p, ps),
          }}
          size="middle"
          locale={{ emptyText: <Empty description="暂无入驻企业" /> }}
        />
      </Card>

      {/* 提前结束入驻 弹窗 */}
      <Modal
        title={
          <Space>
            <StopOutlined style={{ color: "#ff4d4f" }} />
            提前结束入驻
          </Space>
        }
        open={terminateModal.open}
        onOk={handleTerminate}
        onCancel={() => setTerminateModal({ open: false, record: null })}
        confirmLoading={submitting}
        okText="确认结束"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Text>
            将提前结束企业「
            <strong>{terminateModal.record?.enterprise?.name || `#${terminateModal.record?.enterprise_id}`}</strong>
            」的入驻。结束后：
          </Text>
          <ul style={{ marginTop: 8, color: "#666" }}>
            <li>该企业的入驻状态会变为"已退出"</li>
            <li>结束时间记为今天</li>
            <li>企业可立即重新提交入驻申请</li>
            <li>系统会通过站内信通知企业</li>
          </ul>
        </div>
        <Form layout="vertical">
          <Form.Item
            label="结束原因（必填）"
            required
            rules={[{ required: true, message: "请填写原因" }]}
          >
            <Input.TextArea
              rows={4}
              maxLength={200}
              showCount
              placeholder="请说明提前结束该企业入驻的原因，将记录在审批记录中并通知企业"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
