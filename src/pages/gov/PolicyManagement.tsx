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
  EditOutlined,
  EyeOutlined,
  FileProtectOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import FileUpload from "../../components/FileUpload";
import { getPolicyList, publishPolicy, updatePolicy } from "../../api/policies";
import type { FileInfo, Policy } from "../../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface PolicyFormValues {
  target_role: "enterprise" | "carrier" | "both";
  title: string;
  department: string;
  subsidy_amount?: string;
  start_date: string;
  end_date: string;
  requirements_json?: string;
}

function parseJson(value?: string): Record<string, unknown> {
  if (!value?.trim()) return {};
  return JSON.parse(value) as Record<string, unknown>;
}

function prettyJson(value?: Record<string, unknown>) {
  return JSON.stringify(value || {}, null, 2);
}

export default function GovPolicyManagement() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm<PolicyFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fileId, setFileId] = useState<number | null>(null);
  const [detailPolicy, setDetailPolicy] = useState<Policy | null>(null);

  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getPolicyList(page, pageSize);
      setPolicies(res.data.list);
      setPagination({
        current: res.data.page,
        pageSize: res.data.page_size,
        total: res.data.total,
      });
    } catch {
      message.error("加载政策列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(1, 10);
  }, [fetchList]);

  const openCreateModal = () => {
    setEditingPolicy(null);
    setFileId(null);
    form.resetFields();
    form.setFieldsValue({
      target_role: "enterprise",
      start_date: dayjs().format("YYYY-MM-DD"),
      end_date: dayjs().add(6, "month").format("YYYY-MM-DD"),
      requirements_json: prettyJson({
        application_condition: "",
        application_materials: [{ name: "营业执照", file_id: 12, necessity: "necessary" }],
        process: "提交申报 - 审核流转 - 结果通知",
      }),
    });
    setModalOpen(true);
  };

  const openEditModal = (policy: Policy) => {
    setEditingPolicy(policy);
    setFileId(policy.file_id || null);
    form.setFieldsValue({
      target_role: policy.target_role === "government" ? "enterprise" : policy.target_role,
      title: policy.title,
      department: policy.department || "",
      subsidy_amount: policy.subsidy_amount,
      start_date: policy.start_date,
      end_date: policy.end_date,
      requirements_json: prettyJson(policy.requirements || policy.conditions),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const requirements = parseJson(values.requirements_json);
      const payload = {
        target_role: values.target_role,
        title: values.title,
        department: values.department,
        subsidy_amount: values.subsidy_amount,
        requirements,
        start_date: values.start_date,
        end_date: values.end_date,
        file_id: fileId || undefined,
      };

      if (editingPolicy) {
        await updatePolicy(editingPolicy.id, payload);
        message.success("政策已更新，关注用户将在真实环境收到通知");
      } else {
        await publishPolicy(payload);
        message.success("政策发布成功");
      }

      setModalOpen(false);
      fetchList(1, pagination.pageSize);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "保存失败，请检查 JSON 格式");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<Policy> = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    {
      title: "政策标题",
      dataIndex: "title",
      key: "title",
      render: (value: string) => <Text strong>{value}</Text>,
    },
    { title: "发布部门", dataIndex: "department", key: "department", width: 140, render: (value?: string) => value || "-" },
    {
      title: "适用对象",
      dataIndex: "target_role",
      key: "target_role",
      width: 130,
      render: (value: string) => (
        <Tag color="blue">{value === "both" ? "企业/载体" : value === "carrier" ? "载体" : "企业"}</Tag>
      ),
    },
    {
      title: "有效期",
      key: "period",
      width: 210,
      render: (_, record) => `${record.start_date} ~ ${record.end_date}`,
    },
    {
      title: "金额/口径",
      dataIndex: "subsidy_amount",
      key: "subsidy_amount",
      width: 150,
      render: (value?: string) => value || "-",
    },
    {
      title: "操作",
      key: "action",
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetailPolicy(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>
        <FileProtectOutlined style={{ marginRight: 8 }} />
        政策管理
      </Title>
      <Alert
        message="政策发布与维护"
        description="政务端可发布、查看和更新政策。更新政策时真实环境会通知关注用户，Mock 模式会立即更新列表数据。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchList(pagination.current, pagination.pageSize)} loading={loading}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              发布政策
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={policies}
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
          locale={{ emptyText: <Empty description="暂无政策" /> }}
        />
      </Card>

      <Modal
        title={editingPolicy ? "编辑政策" : "发布新政策"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingPolicy ? "保存更新" : "发布政策"}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="target_role" label="适用对象" rules={[{ required: true, message: "请选择适用对象" }]}>
            <Select
              options={[
                { label: "企业", value: "enterprise" },
                { label: "载体", value: "carrier" },
                { label: "企业/载体", value: "both" },
              ]}
            />
          </Form.Item>
          <Form.Item name="title" label="政策标题" rules={[{ required: true, message: "请输入政策标题" }]}>
            <Input placeholder="如：2026 年高新技术企业研发补贴" />
          </Form.Item>
          <Form.Item name="department" label="发布部门" rules={[{ required: true, message: "请输入发布部门" }]}>
            <Input placeholder="如：科技创新局" />
          </Form.Item>
          <Form.Item name="subsidy_amount" label="金额/兑现口径">
            <Input placeholder="如：最高 30 万元，或按评审结果确定" />
          </Form.Item>
          <Space style={{ width: "100%" }} align="start">
            <Form.Item name="start_date" label="开始日期" rules={[{ required: true, message: "请输入开始日期" }]}>
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="end_date" label="结束日期" rules={[{ required: true, message: "请输入结束日期" }]}>
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
          </Space>
          <Form.Item
            name="requirements_json"
            label="政策要求 requirements"
            tooltip="按接口文档发送结构化 requirements 字段。"
          >
            <TextArea rows={6} />
          </Form.Item>
          <Form.Item label="政策原文附件">
            <FileUpload onUploaded={(info: FileInfo) => setFileId(info.file_id)} />
            {fileId && <Text type="secondary">已关联文件 ID：{fileId}</Text>}
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={detailPolicy?.title || "政策详情"}
        open={Boolean(detailPolicy)}
        onCancel={() => setDetailPolicy(null)}
        footer={null}
        width={680}
      >
        {detailPolicy && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="发布部门">{detailPolicy.department || "-"}</Descriptions.Item>
            <Descriptions.Item label="适用对象">
              {detailPolicy.target_role === "both" ? "企业/载体" : detailPolicy.target_role === "carrier" ? "载体" : "企业"}
            </Descriptions.Item>
            <Descriptions.Item label="有效期">
              {detailPolicy.start_date} ~ {detailPolicy.end_date}
            </Descriptions.Item>
            <Descriptions.Item label="金额/口径">{detailPolicy.subsidy_amount || "-"}</Descriptions.Item>
            <Descriptions.Item label="政策要求">
              <pre className="json-preview">{prettyJson(detailPolicy.requirements || detailPolicy.conditions)}</pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
