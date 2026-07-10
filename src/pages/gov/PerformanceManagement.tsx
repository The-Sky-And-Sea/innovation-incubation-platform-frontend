import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { PlusOutlined, ReloadOutlined, SettingOutlined, TrophyOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  createPerformanceTemplate,
  getPerformanceTemplates,
  getPerformanceSubmissions,
  launchPerformanceCampaign,
  scorePerformance,
} from "../../api/performances";
import type { AuditStatus, PerformanceSubmission, PerformanceTemplate } from "../../types";
import { describeBusinessData } from "../../utils/businessDisplay";

const { Title } = Typography;
const { TextArea } = Input;

const defaultTemplateSchema = {
  total_area: "可自主支配场地总面积",
  incubation_area: "孵化面积",
  public_service_platforms: "公共服务场地/平台数量",
  service_team_average: "专业孵化人员配备",
  seed_fund_amount: "自有孵化种子基金金额",
  invested_enterprises: "已投资企业数",
  financing_enterprises: "获得融资企业数",
  hefei_events: "主题活动数量",
  incubating_enterprises: "年末在孵企业数",
  graduated_enterprises: "年度培育毕业企业数",
  ip_total: "知识产权授权总数",
  new_high_tech_enterprises: "新增高新技术企业数",
  tech_sme_ratio: "科技型中小企业占比",
  safety_production_summary: "安全生产年度总结",
  high_level_platforms: "省级以上研发平台",
};

interface TemplateFormValues {
  name: string;
  year: number;
  include_basic_service?: boolean;
  include_incubation_service?: boolean;
  include_service_results?: boolean;
  include_public_service?: boolean;
  include_bonus?: boolean;
  custom_metric?: string;
}

export default function GovPerformanceManagement() {
  const [templates, setTemplates] = useState<PerformanceTemplate[]>([]);
  const [submissions, setSubmissions] = useState<PerformanceSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [templateOpen, setTemplateOpen] = useState(false);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<PerformanceSubmission | null>(null);
  const [templateForm] = Form.useForm<TemplateFormValues>();
  const [launchForm] = Form.useForm<{
    template_id: number;
    name: string;
    year: number;
    start_date: string;
    end_date: string;
  }>();
  const [scoreForm] = Form.useForm<{ score: number; status: "approved" | "rejected"; comment?: string }>();
  const [submitting, setSubmitting] = useState(false);

  const fetchSubmissions = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getPerformanceSubmissions(page, pageSize);
      setSubmissions(res.data.list);
      setPagination({
        current: res.data.page,
        pageSize: res.data.page_size,
        total: res.data.total,
      });
    } catch {
      message.error("加载考核申报失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await getPerformanceTemplates();
      setTemplates(res.data);
    } catch {
      message.error("加载考核模板失败");
    }
  }, []);

  const ensureDefaultTemplate = async () => {
    if (templates.length > 0) return templates[0];
    const year = dayjs().year();
    const res = await createPerformanceTemplate(`年度孵化服务绩效模板 ${year}`, year, defaultTemplateSchema);
    setTemplates([res.data]);
    return res.data;
  };

  useEffect(() => {
    fetchSubmissions(1, 10);
    fetchTemplates();
  }, [fetchSubmissions, fetchTemplates]);

  const handleCreateTemplate = async () => {
    try {
      const values = await templateForm.validateFields();
      setSubmitting(true);
      const formSchema: Record<string, unknown> = {};
      if (values.include_basic_service) {
        Object.assign(formSchema, {
          total_area: "可自主支配场地总面积",
          incubation_area: "孵化面积",
          service_team_average: "专业孵化人员配备",
        });
      }
      if (values.include_incubation_service) {
        Object.assign(formSchema, {
          seed_fund_amount: "自有孵化种子基金金额",
          invested_enterprises: "已投资企业数",
          financing_enterprises: "获得融资企业数",
          hefei_events: "主题活动数量",
        });
      }
      if (values.include_service_results) {
        Object.assign(formSchema, {
          incubating_enterprises: "年末在孵企业数",
          graduated_enterprises: "年度培育毕业企业数",
          ip_total: "知识产权授权总数",
          new_high_tech_enterprises: "新增高新技术企业数",
          tech_sme_ratio: "科技型中小企业占比",
        });
      }
      if (values.include_public_service) {
        Object.assign(formSchema, {
          safety_production_summary: "安全生产年度总结",
          annual_service_report: "年度服务报告",
          annual_work_summary: "年度工作总结",
        });
      }
      if (values.include_bonus) formSchema.high_level_platforms = "省级以上研发平台";
      if (values.custom_metric?.trim()) formSchema.custom_metric = values.custom_metric.trim();

      const res = await createPerformanceTemplate(values.name, values.year, formSchema);
      setTemplates((prev) => [res.data, ...prev]);
      message.success("考核模板已创建");
      setTemplateOpen(false);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLaunch = async () => {
    try {
      const values = await launchForm.validateFields();
      setSubmitting(true);
      await launchPerformanceCampaign(values);
      message.success("考核活动已启动，载体端可提交材料");
      setLaunchOpen(false);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "启动失败");
    } finally {
      setSubmitting(false);
    }
  };

  const openScoreModal = (submission: PerformanceSubmission) => {
    setSelectedSubmission(submission);
    scoreForm.resetFields();
    setScoreOpen(true);
  };

  const handleScore = async () => {
    if (!selectedSubmission) return;
    try {
      const values = await scoreForm.validateFields();
      setSubmitting(true);
      await scorePerformance(selectedSubmission.id, values.score, values.status, values.comment || "无");
      message.success("评分完成");
      setScoreOpen(false);
      fetchSubmissions(1, pagination.pageSize);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "评分失败");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<PerformanceSubmission> = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    { title: "考核活动", dataIndex: "campaign_id", key: "campaign_id", width: 110 },
    { title: "载体", dataIndex: "carrier_id", key: "carrier_id", width: 90, render: (value: number) => `载体 #${value}` },
    {
      title: "申报摘要",
      dataIndex: "form_data",
      key: "form_data",
      ellipsis: true,
      render: (value: Record<string, unknown>) => describeBusinessData(value),
    },
    { title: "分数", dataIndex: "score", key: "score", width: 90, render: (value?: number) => (value !== undefined ? <Tag color="blue">{value}</Tag> : "-") },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (value: AuditStatus) => {
        const colors: Record<string, string> = { pending: "processing", approved: "success", rejected: "error" };
        const labels: Record<string, string> = { pending: "待评分", approved: "已通过", rejected: "已拒绝" };
        return <Tag color={colors[value] || "default"}>{labels[value] || value}</Tag>;
      },
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => openScoreModal(record)} disabled={record.status !== "pending"}>
          评分
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>
        <TrophyOutlined style={{ marginRight: 8 }} />
        绩效考核
      </Title>
      <Alert
        message="模板配置 - 启动考核 - 载体提交 - 政务评分"
        description="模板按业务指标勾选配置，不需要填写技术格式。Mock 模式已预置一个年度模板和一条待评分申报。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchSubmissions(pagination.current, pagination.pageSize)} loading={loading}>
              刷新
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => {
                templateForm.setFieldsValue({
                  name: `孵化载体综合绩效模板 ${dayjs().year()}`,
                  year: dayjs().year(),
                  include_basic_service: true,
                  include_incubation_service: true,
                  include_service_results: true,
                  include_public_service: true,
                  include_bonus: true,
                });
                setTemplateOpen(true);
              }}
            >
              新建模板
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={async () => {
                const template = await ensureDefaultTemplate();
                launchForm.setFieldsValue({
                  template_id: template?.id,
                  name: `${dayjs().year()} 年度孵化载体绩效考核`,
                  year: dayjs().year(),
                  start_date: dayjs().format("YYYY-MM-DD"),
                  end_date: dayjs().add(3, "month").format("YYYY-MM-DD"),
                });
                setLaunchOpen(true);
              }}
            >
              启动考核
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={submissions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
            showTotal: (total, range) => `${range[0]}-${range[1]} / 共 ${total} 条`,
            onChange: (page, pageSize) => fetchSubmissions(page, pageSize),
          }}
          size="middle"
          locale={{ emptyText: <Empty description="暂无考核申报" /> }}
        />
      </Card>

      <Modal
        title="新建考核模板"
        open={templateOpen}
        onCancel={() => setTemplateOpen(false)}
        onOk={handleCreateTemplate}
        confirmLoading={submitting}
        width={620}
        destroyOnClose
      >
        <Form form={templateForm} layout="vertical">
          <Form.Item name="name" label="模板名称" rules={[{ required: true, message: "请输入模板名称" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="year" label="适用年度" rules={[{ required: true, type: "number" }]}>
            <InputNumber min={2020} max={2035} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="include_basic_service" valuePropName="checked">
            <Checkbox>基础服务能力：场地面积、孵化面积、服务团队</Checkbox>
          </Form.Item>
          <Form.Item name="include_incubation_service" valuePropName="checked">
            <Checkbox>孵化服务能力：基金投资、融资服务、活动组织</Checkbox>
          </Form.Item>
          <Form.Item name="include_service_results" valuePropName="checked">
            <Checkbox>孵化服务成效：在孵毕业企业、知识产权、高企与科小</Checkbox>
          </Form.Item>
          <Form.Item name="include_public_service" valuePropName="checked">
            <Checkbox>公共服务成效：安全生产、服务报告、年度总结</Checkbox>
          </Form.Item>
          <Form.Item name="include_bonus" valuePropName="checked">
            <Checkbox>加分项：省级以上研发平台</Checkbox>
          </Form.Item>
          <Form.Item name="custom_metric" label="补充指标">
            <Input placeholder="例如：投融资服务成效" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="启动考核活动"
        open={launchOpen}
        onCancel={() => setLaunchOpen(false)}
        onOk={handleLaunch}
        confirmLoading={submitting}
        width={560}
        destroyOnClose
      >
        <Form form={launchForm} layout="vertical">
          <Form.Item name="template_id" label="考核模板" rules={[{ required: true, message: "请选择考核模板" }]}>
            <Select options={templates.map((item) => ({ label: `${item.name}（${item.year}）`, value: item.id }))} />
          </Form.Item>
          <Form.Item name="name" label="考核名称" rules={[{ required: true, message: "请输入考核名称" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="year" label="考核年度" rules={[{ required: true, type: "number" }]}>
            <InputNumber min={2020} max={2035} style={{ width: "100%" }} />
          </Form.Item>
          <Space style={{ width: "100%" }} align="start">
            <Form.Item name="start_date" label="开始日期" rules={[{ required: true, message: "请输入开始日期" }]}>
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="end_date" label="结束日期" rules={[{ required: true, message: "请输入结束日期" }]}>
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        title="评分审核"
        open={scoreOpen}
        onCancel={() => setScoreOpen(false)}
        onOk={handleScore}
        confirmLoading={submitting}
        width={460}
        destroyOnClose
      >
        <Form form={scoreForm} layout="vertical">
          <Form.Item name="score" label="评分（0-100）" rules={[{ required: true, type: "number", min: 0, max: 100 }]}>
            <InputNumber min={0} max={100} step={0.5} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="status" label="审核结果" rules={[{ required: true, message: "请选择审核结果" }]}>
            <Select options={[{ label: "通过", value: "approved" }, { label: "拒绝", value: "rejected" }]} />
          </Form.Item>
          <Form.Item name="comment" label="评语">
            <TextArea rows={2} placeholder="请输入评语" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
