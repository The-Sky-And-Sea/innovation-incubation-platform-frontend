import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  FormOutlined,
  PlusOutlined,
  ReloadOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import FileUpload from "../../components/FileUpload";
import {
  getChangeDetail,
  getChangeList,
  getChangeTypes,
  submitChange,
  updateChange,
} from "../../api/changes";
import { getMyIncubation } from "../../api/enterprise";
import type { AuditStatus, ChangeRecord, ChangeType, FileInfo } from "../../types";
import { describeBusinessData } from "../../utils/businessDisplay";

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusMap: Record<AuditStatus, { color: string; icon: React.ReactNode; label: string }> = {
  draft: { color: "default", icon: <FileTextOutlined />, label: "草稿" },
  pending: { color: "processing", icon: <ClockCircleOutlined />, label: "待审核" },
  approved: { color: "success", icon: <CheckCircleOutlined />, label: "已通过" },
  rejected: { color: "error", icon: <CloseCircleOutlined />, label: "已拒绝" },
  returned: { color: "warning", icon: <RollbackOutlined />, label: "已退回" },
  carrier_review: { color: "processing", icon: <ClockCircleOutlined />, label: "载体审核中" },
  gov_review: { color: "processing", icon: <ClockCircleOutlined />, label: "政务审核中" },
};

interface ChangeFormValues {
  change_type: ChangeType;
  change_content: string;
  new_value?: string;
}

function parseNewValue(type: ChangeType, value?: string, fileId?: number | null) {
  if (type === "入孵协议文件") return { new_file_id: fileId };
  return { value: value?.trim() || "" };
}

export default function EnterpriseChangeManagement() {
  const [records, setRecords] = useState<ChangeRecord[]>([]);
  const [changeTypes, setChangeTypes] = useState<ChangeType[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm<ChangeFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ChangeRecord | null>(null);
  const [isFileChange, setIsFileChange] = useState(false);
  const [agreementFileId, setAgreementFileId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [detailModal, setDetailModal] = useState<{ open: boolean; record: ChangeRecord | null }>({
    open: false,
    record: null,
  });
  const [hasActiveIncubation, setHasActiveIncubation] = useState(false);

  useEffect(() => {
    getMyIncubation(1, 1)
      .then((res) => {
        const active = res.data.list.some(
          (item: any) => item.status === "approved" && item.incubate_status === "in_incubation",
        );
        setHasActiveIncubation(active);
      })
      .catch(() => {});
  }, []);

  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getChangeList(page, pageSize);
      setRecords(res.data.list);
      setPagination({
        current: res.data.page,
        pageSize: res.data.page_size,
        total: res.data.total,
      });
    } catch {
      message.error("加载变更记录失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(1, 10);
  }, [fetchList]);

  const ensureChangeTypes = async () => {
    if (changeTypes.length > 0) return changeTypes;
    const res = await getChangeTypes();
    setChangeTypes(res.data);
    return res.data;
  };

  const openCreateModal = async () => {
    if (!hasActiveIncubation) {
      message.warning("请先申请入驻并通过载体审核后，再进行重大事项变更");
      return;
    }
    try {
      await ensureChangeTypes();
      setEditingRecord(null);
      form.resetFields();
      setIsFileChange(false);
      setAgreementFileId(null);
      setModalOpen(true);
    } catch {
      message.error("加载可变更指标失败");
    }
  };

  const openEditModal = async (record: ChangeRecord) => {
    if (!hasActiveIncubation) {
      message.warning("请先申请入驻并通过载体审核后，再进行重大事项变更");
      return;
    }
    try {
      await ensureChangeTypes();
      setEditingRecord(record);
      setIsFileChange(record.change_type === "入孵协议文件");
      setAgreementFileId(null);
      form.setFieldsValue({
        change_type: record.change_type,
        change_content: record.change_content,
        new_value: record.change_type === "入孵协议文件" ? "" : String(record.new_value.value || ""),
      });
      setModalOpen(true);
    } catch {
      message.error("加载可变更指标失败");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (values.change_type === "入孵协议文件" && !agreementFileId && !editingRecord) {
        message.warning("请先上传新的入孵协议文件");
        return;
      }
      setSubmitting(true);
      const newValue = parseNewValue(values.change_type, values.new_value, agreementFileId);

      if (editingRecord) {
        await updateChange(editingRecord.id, {
          change_content: values.change_content,
          new_value: newValue,
        });
        message.success("退回变更已重新提交");
      } else {
        await submitChange(values.change_type, values.change_content, newValue);
        message.success("变更申请已提交，请等待载体审核");
      }

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
    { title: "编号", dataIndex: "id", key: "id", width: 80 },
    {
      title: "变更类型",
      dataIndex: "change_type",
      key: "change_type",
      width: 150,
      render: (value: ChangeType) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "变更说明",
      dataIndex: "change_content",
      key: "change_content",
      ellipsis: true,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (value: AuditStatus) => {
        const cfg = statusMap[value] || statusMap.draft;
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
      width: 180,
      render: (value: string) => (value ? new Date(value).toLocaleString("zh-CN") : "-"),
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => viewDetail(record.id)}>
            详情
          </Button>
          {record.status === "returned" && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
              disabled={!hasActiveIncubation}
            >
              重新提交
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>
        <FormOutlined style={{ marginRight: 8 }} />
        重大事项变更
      </Title>

      {!hasActiveIncubation && (
        <Alert
          message="温馨提示"
          description="请先申请入驻并通过载体审核后，才能进行重大事项变更"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Alert
        message="变更说明"
        description="企业名称、信用代码、行业、规模、地址、法定代表人和入孵协议文件等变更需要走审核流程。被退回的变更可重新编辑后再次提交。"
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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
              disabled={!hasActiveIncubation}
            >
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
            showTotal: (total, range) => `${range[0]}-${range[1]} / 共 ${total} 条`,
            onChange: (page, pageSize) => fetchList(page, pageSize),
          }}
          size="middle"
          locale={{ emptyText: <Empty description="暂无变更记录" /> }}
        />
      </Card>

      <Modal
        title={editingRecord ? "重新提交变更" : "新建变更申请"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingRecord ? "重新提交" : "提交申请"}
        width={640}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
          onValuesChange={(changed) => {
            if ("change_type" in changed) {
              setIsFileChange(changed.change_type === "入孵协议文件");
              setAgreementFileId(null);
            }
          }}
        >
          <Form.Item name="change_type" label="变更类型" rules={[{ required: true, message: "请选择变更类型" }]}>
            <Select
              disabled={Boolean(editingRecord)}
              placeholder="请选择变更类型"
              options={changeTypes.map((item) => ({ label: item, value: item }))}
            />
          </Form.Item>

          {isFileChange ? (
            <Form.Item label="新的入孵协议文件" required={!editingRecord}>
              <FileUpload onUploaded={(info: FileInfo) => setAgreementFileId(info.file_id)} />
              {editingRecord && <Text type="secondary">不重新上传时，将沿用原退回记录中的文件信息。</Text>}
            </Form.Item>
          ) : (
            <Form.Item name="new_value" label="新值" rules={[{ required: true, message: "请输入变更后的新值" }]}>
              <Input placeholder="请输入变更后的新值" />
            </Form.Item>
          )}

          <Form.Item name="change_content" label="变更说明" rules={[{ required: true, message: "请填写变更说明" }]}>
            <TextArea rows={3} placeholder="说明变更原因、依据和补充材料情况" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更详情"
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, record: null })}
        footer={null}
        width={620}
      >
        {detailModal.record && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="申请编号">{detailModal.record.id}</Descriptions.Item>
            <Descriptions.Item label="变更类型">
              <Tag color="blue">{detailModal.record.change_type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="变更说明">{detailModal.record.change_content}</Descriptions.Item>
            <Descriptions.Item label="原值">
              {describeBusinessData(detailModal.record.old_value)}
            </Descriptions.Item>
            <Descriptions.Item label="新值">
              {describeBusinessData(detailModal.record.new_value)}
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