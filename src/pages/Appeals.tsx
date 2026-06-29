import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { CustomerServiceOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useAuthStore } from "../store/authStore";
import {
  getCarrierAppeals,
  getEnterpriseAppeals,
  getGovAppeals,
  submitCarrierAppeal,
  submitEnterpriseAppeal,
  updateGovAppealStatus,
} from "../api/appeals";
import type { Appeal, AppealRequest, AppealStatus, ProblemType, UserRole } from "../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

const problemOptions: { label: string; value: ProblemType }[] = [
  { label: "税务", value: "tax" },
  { label: "融资", value: "financing" },
  { label: "产权", value: "property" },
  { label: "水电气", value: "utility" },
  { label: "注册登记", value: "registration" },
  { label: "劳动用工", value: "labor" },
  { label: "建设审批", value: "construction" },
  { label: "监管执法", value: "supervision" },
  { label: "奖补兑现", value: "reward" },
  { label: "其他", value: "other" },
];

const statusLabels: Record<AppealStatus, string> = {
  pending: "待处理",
  processed: "已处理",
};

export default function AppealsPage() {
  const role = useAuthStore((state) => state.user?.role as UserRole | undefined);
  const [form] = Form.useForm<AppealRequest>();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AppealStatus | "">("pending");
  const [problemFilter, setProblemFilter] = useState<ProblemType | "">("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const isGov = role === "government";

  const fetchList = useCallback(
    async (page = 1, pageSize = 10) => {
      setLoading(true);
      try {
        const res = isGov
          ? await getGovAppeals({
              status: statusFilter,
              problem_type: problemFilter,
              page,
              page_size: pageSize,
            })
          : role === "carrier"
            ? await getCarrierAppeals(page, pageSize)
            : await getEnterpriseAppeals(page, pageSize);
        setAppeals(res.data.list);
        setPagination({ current: res.data.page, pageSize: res.data.page_size, total: res.data.total });
      } catch {
        message.error("加载诉求列表失败");
      } finally {
        setLoading(false);
      }
    },
    [isGov, problemFilter, role, statusFilter],
  );

  useEffect(() => {
    fetchList(1, 10);
  }, [fetchList]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (role === "carrier") {
        await submitCarrierAppeal(values);
      } else {
        await submitEnterpriseAppeal(values);
      }
      message.success("诉求已提交");
      form.resetFields();
      fetchList(1, pagination.pageSize);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "提交诉求失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessed = async (id: number) => {
    try {
      await updateGovAppealStatus(id, "processed");
      message.success("已标记为已处理");
      fetchList(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error((err as Error).message || "更新诉求状态失败");
    }
  };

  const columns = useMemo<ColumnsType<Appeal>>(
    () => [
      { title: "编号", dataIndex: "id", key: "id", width: 70 },
      {
        title: "问题类型",
        dataIndex: "problem_type",
        key: "problem_type",
        width: 110,
        render: (value: ProblemType) => <Tag>{problemOptions.find((item) => item.value === value)?.label || value}</Tag>,
      },
      { title: "主管部门", dataIndex: "department", key: "department", width: 120 },
      { title: "诉求内容", dataIndex: "content", key: "content", ellipsis: true },
      {
        title: "状态",
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (value: AppealStatus) => (
          <Tag color={value === "processed" ? "success" : "processing"}>{statusLabels[value]}</Tag>
        ),
      },
      {
        title: "提交时间",
        dataIndex: "created_at",
        key: "created_at",
        width: 170,
        render: (value: string) => new Date(value).toLocaleString("zh-CN"),
      },
      ...(isGov
        ? [
            {
              title: "操作",
              key: "action",
              width: 120,
              render: (_: unknown, record: Appeal) =>
                record.status === "pending" ? (
                  <Button size="small" type="primary" onClick={() => handleProcessed(record.id)}>
                    标记处理
                  </Button>
                ) : (
                  <Text type="secondary">已处理</Text>
                ),
            },
          ]
        : []),
    ],
    [isGov],
  );

  return (
    <div>
      <Title level={3}>
        <CustomerServiceOutlined style={{ marginRight: 8 }} />
        政策诉求
      </Title>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={isGov ? "查看并处理企业、载体提交的政策诉求。" : "提交政策诉求后，政务端会统一受理并更新处理状态。"}
      />

      {!isGov && (
        <Card style={{ marginBottom: 16 }} title="提交诉求">
          <Form form={form} layout="vertical">
            <Form.Item name="identifier" label="主体标识" rules={[{ required: true, message: "请输入主体标识" }]}>
              <Input placeholder={role === "carrier" ? "请输入联系电话或载体标识" : "请输入统一社会信用代码"} />
            </Form.Item>
            <Form.Item name="problem_type" label="问题类型" rules={[{ required: true, message: "请选择问题类型" }]}>
              <Select options={problemOptions} placeholder="请选择" />
            </Form.Item>
            <Form.Item name="department" label="主管部门" rules={[{ required: true, message: "请输入主管部门" }]}>
              <Input placeholder="如：税务局、财政局、科技局" />
            </Form.Item>
            <Form.Item name="content" label="诉求内容" rules={[{ required: true, message: "请输入诉求内容" }]}>
              <TextArea rows={4} placeholder="请描述需要协调或明确的政策问题" />
            </Form.Item>
            <Button type="primary" icon={<PlusOutlined />} loading={submitting} onClick={handleSubmit}>
              提交诉求
            </Button>
          </Form>
        </Card>
      )}

      <Card
        extra={
          <Space>
            {isGov && (
              <>
                <Select
                  value={statusFilter}
                  style={{ width: 120 }}
                  onChange={setStatusFilter}
                  options={[
                    { label: "全部状态", value: "" },
                    { label: "待处理", value: "pending" },
                    { label: "已处理", value: "processed" },
                  ]}
                />
                <Select
                  value={problemFilter}
                  style={{ width: 140 }}
                  onChange={setProblemFilter}
                  options={[{ label: "全部类型", value: "" }, ...problemOptions]}
                />
              </>
            )}
            <Button icon={<ReloadOutlined />} onClick={() => fetchList(pagination.current, pagination.pageSize)} loading={loading}>
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={appeals}
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
        />
      </Card>
    </div>
  );
}
