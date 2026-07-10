import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { ReloadOutlined, SendOutlined, TrophyOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getPerformanceCampaigns, submitPerformance } from "../../api/performances";
import FileUpload from "../../components/FileUpload";
import type { FileInfo, PerformanceCampaign } from "../../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface PerformanceFormValues {
  total_area: number;
  incubation_area: number;
  site_proof_material?: string;
  public_service_platforms: number;
  service_team_average: number;
  mentor_service_institutions: number;
  seed_fund_amount: number;
  invested_enterprises: number;
  invested_amount: number;
  listed_enterprises: number;
  financing_enterprises: number;
  financing_amount: number;
  hefei_events: number;
  regional_events: number;
  mentor_enterprises: number;
  media_reports: number;
  incubating_enterprises: number;
  new_incubating_enterprises: number;
  graduated_enterprises: number;
  high_growth_enterprises: number;
  listed_or_planned_enterprises: number;
  ip_total: number;
  ip_invention_patent: number;
  ip_software_copyright: number;
  competition_enterprises: number;
  new_high_tech_enterprises: number;
  tech_sme_enterprises: number;
  tech_sme_ratio: number;
  safety_production_summary?: string;
  annual_service_report?: string;
  annual_work_summary?: string;
  high_level_platforms: number;
  incubation_results?: string;
}

const numericDefaults: Partial<PerformanceFormValues> = {
  total_area: 0,
  incubation_area: 0,
  public_service_platforms: 0,
  service_team_average: 0,
  mentor_service_institutions: 0,
  seed_fund_amount: 0,
  invested_enterprises: 0,
  invested_amount: 0,
  listed_enterprises: 0,
  financing_enterprises: 0,
  financing_amount: 0,
  hefei_events: 0,
  regional_events: 0,
  mentor_enterprises: 0,
  media_reports: 0,
  incubating_enterprises: 0,
  new_incubating_enterprises: 0,
  graduated_enterprises: 0,
  high_growth_enterprises: 0,
  listed_or_planned_enterprises: 0,
  ip_total: 0,
  ip_invention_patent: 0,
  ip_software_copyright: 0,
  competition_enterprises: 0,
  new_high_tech_enterprises: 0,
  tech_sme_enterprises: 0,
  tech_sme_ratio: 0,
  high_level_platforms: 0,
};

function NumberItem({ name, label, suffix }: { name: keyof PerformanceFormValues; label: string; suffix?: string }) {
  return (
    <Col xs={24} md={12}>
      <Form.Item name={name} label={label} rules={[{ required: true, type: "number", min: 0 }]}>
        <InputNumber min={0} precision={suffix?.includes("%") ? 2 : 0} addonAfter={suffix} style={{ width: "100%" }} />
      </Form.Item>
    </Col>
  );
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
    submitForm.setFieldsValue(numericDefaults as PerformanceFormValues);
    setDocumentFile(null);
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
    { title: "考核名称", dataIndex: "name", key: "name", width: 240, render: (title: string) => <Text strong>{title}</Text> },
    { title: "年度", dataIndex: "year", key: "year", width: 90, render: (year: number) => <Tag color="blue">{year}</Tag> },
    { title: "有效期", key: "period", width: 240, render: (_, record) => `${record.start_date} ~ ${record.end_date}` },
    {
      title: "操作",
      key: "action",
      width: 130,
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
        message="选择已启动的考核活动，按基础服务、孵化服务、服务成效、公共服务和加分项填写年度绩效资料。"
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
        title={`提交绩效考核资料 - ${selectedCampaign?.name || ""}`}
        open={submitOpen}
        onCancel={() => setSubmitOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={980}
        destroyOnClose
        okText="提交申报"
      >
        <Form form={submitForm} layout="vertical" style={{ marginTop: 16 }}>
          <Divider>一、基础服务能力</Divider>
          <Row gutter={16}>
            <NumberItem name="total_area" label="可自主支配场地总面积" suffix="平方米" />
            <NumberItem name="incubation_area" label="孵化面积" suffix="平方米" />
            <NumberItem name="public_service_platforms" label="公共服务场地/平台数量" suffix="个" />
            <NumberItem name="service_team_average" label="近三年每10家在孵企业配备专业孵化人员数" suffix="人" />
            <NumberItem name="mentor_service_institutions" label="导师服务聘用企业/服务机构数" suffix="家" />
            <Col xs={24}>
              <Form.Item name="site_proof_material" label="场地证明材料说明">
                <Input placeholder="例如：租赁合同、产权证明、场地照片等材料名称" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>二、孵化服务能力</Divider>
          <Row gutter={16}>
            <NumberItem name="seed_fund_amount" label="自有孵化种子基金金额" suffix="万元" />
            <NumberItem name="invested_enterprises" label="已投资企业数" suffix="家" />
            <NumberItem name="invested_amount" label="已投资金额" suffix="万元" />
            <NumberItem name="listed_enterprises" label="获得股权挂牌/上市服务企业数" suffix="家" />
            <NumberItem name="financing_enterprises" label="获得融资企业数" suffix="家" />
            <NumberItem name="financing_amount" label="获得融资总金额" suffix="万元" />
            <NumberItem name="hefei_events" label="合肥汇品牌主题活动数" suffix="场" />
            <NumberItem name="regional_events" label="高新区/知识产权/成果转化等培训活动数" suffix="场" />
            <NumberItem name="mentor_enterprises" label="导师服务覆盖企业数" suffix="例" />
            <NumberItem name="media_reports" label="媒体宣传报道数量" suffix="篇" />
          </Row>

          <Divider>三、孵化服务成效</Divider>
          <Row gutter={16}>
            <NumberItem name="incubating_enterprises" label="年末在孵企业数" suffix="家" />
            <NumberItem name="new_incubating_enterprises" label="当年新增在孵企业数" suffix="家" />
            <NumberItem name="graduated_enterprises" label="年度培育毕业企业数" suffix="家" />
            <NumberItem name="high_growth_enterprises" label="高成长企业数" suffix="家" />
            <NumberItem name="listed_or_planned_enterprises" label="挂牌/上市/股改培育企业数" suffix="家" />
            <NumberItem name="ip_total" label="在孵企业知识产权授权总数" suffix="件" />
            <NumberItem name="ip_invention_patent" label="发明专利授权量" suffix="件" />
            <NumberItem name="ip_software_copyright" label="软件著作权数量" suffix="件" />
            <NumberItem name="competition_enterprises" label="创新创业大赛获奖企业数" suffix="家" />
            <NumberItem name="new_high_tech_enterprises" label="当年新增高新技术企业数" suffix="家" />
            <NumberItem name="tech_sme_enterprises" label="当年新增科技型中小企业数" suffix="家" />
            <NumberItem name="tech_sme_ratio" label="科技型中小企业占在孵企业比例" suffix="%" />
          </Row>

          <Divider>四、公共服务成效</Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="safety_production_summary" label="安全生产年度总结">
                <Input placeholder="填写材料名称或简要说明" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="annual_service_report" label="年度服务报告">
                <Input placeholder="填写材料名称或简要说明" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="annual_work_summary" label="年度工作总结">
                <Input placeholder="填写材料名称或简要说明" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>五、加分项与附件</Divider>
          <Row gutter={16}>
            <NumberItem name="high_level_platforms" label="当年获批省级以上研发平台数量" suffix="家" />
            <Col xs={24}>
              <Form.Item name="incubation_results" label="孵化成果补充说明">
                <TextArea rows={4} placeholder="说明年度重点服务、代表性企业、活动组织、成果转化、公共服务等情况" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="绩效考核佐证材料（选填，PDF/Word）">
                <FileUpload
                  folderColor="#0b7568"
                  allowedTypes={[".pdf", ".doc", ".docx"]}
                  currentFile={documentFile}
                  onUploaded={(fileInfo) => setDocumentFile(fileInfo)}
                  onRemove={() => setDocumentFile(null)}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
