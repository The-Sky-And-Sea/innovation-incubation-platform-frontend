import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Empty, Form, Input, InputNumber, Modal, Table, Tag, Typography, message } from "antd";
import { ReloadOutlined, SendOutlined, TrophyOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getPerformanceCampaigns, submitPerformance } from "../../api/performances";
import FileUpload from "../../components/FileUpload";
import type { FileInfo, PerformanceCampaign } from "../../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface PerformanceFormValues {
  service_enterprises: number;
  incubation_results: string;
  events: number;
  revenue?: string;
}

export default function CarrierPerformanceSubmit() {
  const [campaigns, setCampaigns] = useState<PerformanceCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<PerformanceCampaign | null>(null);
  const [submitForm] = Form.useForm<PerformanceFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState<FileInfo | null>(null);

  const fetchCampaigns = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getPerformanceCampaigns(page, pageSize);
      setCampaigns(res.data.list);
      setPagination({ current: res.data.page, pageSize: res.data.page_size, total: res.data.total });
    } catch {
      message.error("加载考核活动失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns(1, 10);
  }, [fetchCampaigns]);

  const openSubmit = (campaign: PerformanceCampaign) => {
    setSelectedCampaign(campaign);
    submitForm.resetFields();
    setDocumentFile(null);
    submitForm.setFieldsValue({ service_enterprises: 0, events: 0 });
    setSubmitOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedCampaign) return;
    try {
      const values = await submitForm.validateFields();
      setSubmitting(true);
      await submitPerformance(selectedCampaign.id, { ...values, document_file_id: documentFile?.file_id });
      message.success("考核申报已提交");
      setSubmitOpen(false);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<PerformanceCampaign> = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "考核名称", dataIndex: "name", key: "name", width: 220, render: (title: string) => <Text strong>{title}</Text> },
    { title: "年度", dataIndex: "year", key: "year", width: 80, render: (year: number) => <Tag color="blue">{year}</Tag> },
    { title: "有效期", key: "period", width: 220, render: (_, record) => `${record.start_date} ~ ${record.end_date}` },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Button type="primary" size="small" icon={<SendOutlined />} onClick={() => openSubmit(record)}>
          提交申报
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
        message="选择已启动的考核活动，按业务指标填写申报数据后提交。政务端将进行评分审核。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card extra={<Button icon={<ReloadOutlined />} onClick={() => fetchCampaigns(pagination.current, pagination.pageSize)} loading={loading}>刷新</Button>}>
        <Table
          columns={columns}
          dataSource={campaigns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
            showTotal: (total, range) => `${range[0]}-${range[1]} / 共 ${total} 条`,
            onChange: (page, pageSize) => fetchCampaigns(page, pageSize),
          }}
          size="middle"
          locale={{ emptyText: <Empty description="暂无考核活动" /> }}
        />
      </Card>

      <Modal
        title={`提交考核申报 - ${selectedCampaign?.name || ""}`}
        open={submitOpen}
        onCancel={() => setSubmitOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={560}
        destroyOnClose
        okText="提交申报"
      >
        <Form form={submitForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="service_enterprises" label="服务企业数量" rules={[{ required: true, type: "number", min: 0 }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="events" label="创业活动数量" rules={[{ required: true, type: "number", min: 0 }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="revenue" label="年度营收">
            <Input placeholder="例如：5000 万元" />
          </Form.Item>
          <Form.Item name="incubation_results" label="孵化成果说明" rules={[{ required: true, message: "请填写孵化成果说明" }]}>
            <TextArea rows={4} placeholder="请说明孵化项目、企业服务、活动组织和成果转化情况" />
          </Form.Item>
          <Form.Item label="考核文档（选填，仅 PDF/Word）">
            <FileUpload
              folderColor="#0b7568"
              allowedTypes={[".pdf", ".doc", ".docx"]}
              onUploaded={(fileInfo) => setDocumentFile(fileInfo)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
