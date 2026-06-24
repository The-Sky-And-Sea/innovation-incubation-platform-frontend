/**
 * 企业端重大事项变更管理页面
 *
 * 功能：
 * - 查看可变更指标列表
 * - 发起变更申请（弹窗表单：选变更类型 + 填写说明 + 输入新值）
 * - 查看变更记录列表（分页 + 状态标签）
 * - 查看变更详情
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
  Form,
  Select,
  Input,
  Descriptions,
  Alert,
  Empty,
} from "antd";
import {
  FormOutlined,
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import FileUpload from "../../components/FileUpload";
import {
  getChangeTypes,
  submitChange,
  getChangeList,
  getChangeDetail,
} from "../../api/changes";
import type {
  ChangeRecord,
  ChangeType,
  AuditStatus,
  FileInfo,
} from "../../types";

const { Title } = Typography;
const { TextArea } = Input;

/** 状态标签映射（复用第 4 层） */
const statusMap: Record<AuditStatus, { color: string; icon: React.ReactNode; label: string }> = {
  draft: { color: "default", icon: <FileTextOutlined />, label: "草稿" },
  pending: { color: "processing", icon: <ClockCircleOutlined />, label: "待审核" },
  approved: { color: "success", icon: <CheckCircleOutlined />, label: "已通过" },
  rejected: { color: "error", icon: <CloseCircleOutlined />, label: "已拒绝" },
  returned: { color: "warning", icon: <RollbackOutlined />, label: "已退回" },
  carrier_review: { color: "processing", icon: <ClockCircleOutlined />, label: "载体审核中" },
  gov_review: { color: "processing", icon: <ClockCircleOutlined />, label: "政务审核中" },
};

export default function EnterpriseChangeManagement() {
  const [records, setRecords] = useState<ChangeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // 新建弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [changeTypes, setChangeTypes] = useState<ChangeType[]>([]);
  const [isFileChange, setIsFileChange] = useState(false);
  const [agreementFileId, setAgreementFileId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<{
    change_type: ChangeType;
    change_content: string;
    new_value?: string;
  }>();

  // 详情弹窗
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    record: ChangeRecord | null;
  }>({ open: false, record: null });

  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getChangeList(page, pageSize);
      setRecords(res.data.list);
      setPagination((prev) => ({
        ...prev,
        current: res.data.page,
        pageSize: res.data.page_size,
        total: res.data.total,
      }));
    } catch {
      message.error("加载变更记录失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(1, 10); }, [fetchList]);

  const openCreateModal = async () => {
    try {
      const res = await getChangeTypes();
      setChangeTypes(res.data);
      form.resetFields();
      setIsFileChange(false);
      setAgreementFileId(null);
      setModalOpen(true);
    } catch {
      message.error("加载可变更指标失败");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (values.change_type === "入孵协议文件" && !agreementFileId) {
        message.warning("请先上传新的入孵协议文件");
        return;
      }
      setSubmitting(true);

      const newValue: Record<string, unknown> =
        values.change_type === "入孵协议文件"
          ? { new_file_id: agreementFileId }
          : { [`new_${values.change_type}`]: values.new_value || "" };

      await submitChange(values.change_type, values.change_content, newValue);
      message.success("变更申请已提交，请等待载体审核");
      setModalOpen(false);
      fetchList(1, pagination.pageSize);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const viewDetail = async (id: number) => {
    try {
      const res = await getChangeDetail(id);
      setDetailModal({ open: true, record: res.data });
    } catch {
      message.error("加载详情失败");
    }
  };

  const columns: ColumnsType<ChangeRecord> = [
    { title: "编号", dataIndex: "id", key: "id", width: 70 },
    {
      title: "变更类型",
      dataIndex: "change_type",
      key: "change_type",
      width: 140,
      render: (t: ChangeType) => <Tag color="purple">{t}</Tag>,
    },
    {
      title: "变更说明",
      dataIndex: "change_content",
      key: "change_content",
      width: 250,
      ellipsis: true,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (s: AuditStatus) => {
        const cfg = statusMap[s] || statusMap.draft;
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label}
          </Tag>
        );
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
      width: 100,
      render: (_, r) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => viewDetail(r.id)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>
        <FormOutlined style={{ marginRight: 8 }} />
        重大事项变更
      </Title>

      <Alert
        message="变更说明"
        description="企业名称、信用代码、行业、规模、地址、法定代表人、入孵协议文件等变更需经载体审核。联系人和联系电话可直接修改，无需变更流程。被退回的变更可重新编辑提交。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchList(pagination.current, pagination.pageSize)}
              loading={loading}
            >
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              新建变更申请
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
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
          locale={{ emptyText: <Empty description="暂无变更记录" /> }}
        />
      </Card>

      {/* 新建变更申请弹窗 */}
      <Modal
        title="新建变更申请"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
          onValuesChange={(changed) => {
            if ("change_type" in changed) {
              setIsFileChange(changed.change_type === "入孵协议文件");
            }
          }}
        >
          <Form.Item
            name="change_type"
            label="变更类型"
            rules={[{ required: true, message: "请选择变更类型" }]}
          >
            <Select
              placeholder="请选择变更类型"
              options={changeTypes.map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>

          {isFileChange && (
            <Form.Item label="新的入孵协议文件" required>
              <FileUpload
                onUploaded={(info: FileInfo) => setAgreementFileId(info.file_id)}
              />
            </Form.Item>
          )}

          <Form.Item
            name="new_value"
            label="新值"
            rules={[
              {
                required: !isFileChange,
                message: "请输入变更后的新值",
              },
            ]}
          >
            <Input
              placeholder={
                isFileChange
                  ? "文件变更通过文件上传处理"
                  : "请输入变更后的新值"
              }
              disabled={isFileChange}
            />
          </Form.Item>

          <Form.Item
            name="change_content"
            label="变更说明"
            rules={[{ required: true, message: "请填写变更说明" }]}
          >
            <TextArea rows={3} placeholder="请说明变更原因和具体内容" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 变更详情弹窗 */}
      <Modal
        title="变更详情"
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, record: null })}
        footer={null}
        width={540}
      >
        {detailModal.record && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="申请编号">
              {detailModal.record.id}
            </Descriptions.Item>
            <Descriptions.Item label="变更类型">
              <Tag color="purple">{detailModal.record.change_type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="变更说明">
              {detailModal.record.change_content}
            </Descriptions.Item>
            <Descriptions.Item label="新值">
              {JSON.stringify(detailModal.record.new_value, null, 2)}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[detailModal.record.status]?.color}>
                {statusMap[detailModal.record.status]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="提交时间">
              {new Date(detailModal.record.created_at).toLocaleString("zh-CN")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}