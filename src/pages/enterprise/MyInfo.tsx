import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Progress,
  Row,
  Select,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import {
  BankOutlined,
  BuildOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  IdcardOutlined,
  PhoneOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { getMyEnterpriseInfo, getMyIncubation, updateMyEnterpriseInfo } from "../../api/enterprise";
import type { EnterpriseInfo } from "../../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

const ENTERPRISE_SCALES = ["微型", "小型", "中型", "大型"];
const ENTERPRISE_NATURES = ["国有企业", "集体企业", "有限责任公司", "股份有限公司", "私营企业", "港澳台投资企业", "外商投资企业", "其他"];
const ENTERPRISE_TYPES = ["专业型", "综合型", "科技型", "服务型", "其他"];
const ENTERPRISE_LEVELS = ["国家级", "省级", "市级", "区县级", "其他"];

const numberFields: Array<keyof EnterpriseInfo> = [
  "fixed_asset_investment",
  "total_area",
  "functional_area",
  "incubation_area",
  "rent_area",
  "rent_price",
  "workstation_count",
  "managers_count",
  "technical_staff_count",
  "bachelor_above_count",
  "trained_staff_count",
  "seed_fund_amount",
];

function valueText(value: unknown, suffix = "") {
  if (value === undefined || value === null || value === "") return "-";
  return `${value}${suffix}`;
}

function normalizeValues(values: EnterpriseInfo): Partial<EnterpriseInfo> {
  const next: Partial<EnterpriseInfo> = { ...values };
  numberFields.forEach((field) => {
    const value = next[field];
    next[field] = (value === undefined || value === null ? 0 : Number(value)) as never;
  });
  return next;
}

export default function EnterpriseMyInfo() {
  const [enterprise, setEnterprise] = useState<EnterpriseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasActiveIncubation, setHasActiveIncubation] = useState(false);
  const [incubationTotal, setIncubationTotal] = useState(0);
  const [latestIncubation, setLatestIncubation] = useState<any>(null);
  const [form] = Form.useForm<EnterpriseInfo>();

  const loadData = async () => {
    setLoading(true);
    try {
      const [entRes, incRes] = await Promise.all([getMyEnterpriseInfo(), getMyIncubation(1, 1)]);
      setEnterprise(entRes.data);
      form.setFieldsValue(entRes.data);
      const active = incRes.data.list.some(
        (item: any) => item.status === "approved" && item.incubate_status === "in_incubation",
      );
      setHasActiveIncubation(active);
      setIncubationTotal(incRes.data.total ?? incRes.data.list.length);
      setLatestIncubation(incRes.data.list[0] ?? null);
    } catch {
      message.error("加载企业信息失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const profileFields = useMemo(() => {
    if (!enterprise) return [];
    return [
      enterprise.name,
      enterprise.credit_code,
      enterprise.industry,
      enterprise.scale,
      enterprise.address,
      enterprise.legal_person,
      enterprise.contact_name,
      enterprise.contact_phone,
      enterprise.office_phone,
      enterprise.mobile_phone,
      enterprise.bank_name,
      enterprise.bank_account,
      enterprise.nature,
      enterprise.type,
      enterprise.establishment_date,
      enterprise.total_area,
      enterprise.managers_count,
      enterprise.site_proof_material,
    ];
  }, [enterprise]);

  const completionPercent = profileFields.length
    ? Math.round((profileFields.filter((item) => item !== undefined && item !== null && item !== "").length / profileFields.length) * 100)
    : 0;

  const handleEdit = () => {
    if (enterprise) {
      form.setFieldsValue(enterprise);
      setEditModalOpen(true);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const res = await updateMyEnterpriseInfo(normalizeValues(values));
      setEnterprise(res.data);
      form.setFieldsValue(res.data);
      setEditModalOpen(false);
      message.success("企业信息已保存");
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Title level={3}><IdcardOutlined style={{ marginRight: 8 }} />我的企业信息</Title>
        <Card><Skeleton active paragraph={{ rows: 8 }} /></Card>
      </div>
    );
  }

  if (!enterprise) {
    return (
      <div>
        <Title level={3}>我的企业信息</Title>
        <Card><Text type="secondary">暂无企业信息</Text></Card>
      </div>
    );
  }

  return (
    <div>
      <Title level={3}><IdcardOutlined style={{ marginRight: 8 }} />我的企业信息</Title>

      <Alert
        message="注册登录后可在这里完善企业资料"
        description="企业名称、统一社会信用代码等基础身份信息会用于登录和业务办理，请确认真实准确；补齐联系方式、银行、面积、人员和材料信息后，后续申报会更顺畅。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card className="info-overview-card" style={{ marginBottom: 16 }}>
        <div className="info-overview-grid">
          <section className="info-overview-lead">
            <span className="info-overview-icon"><BankOutlined /></span>
            <div>
              <Text type="secondary">当前企业</Text>
              <strong>{enterprise.name}</strong>
              <small>{enterprise.credit_code || "暂无统一社会信用代码"}</small>
            </div>
          </section>
          <section className="info-overview-metrics">
            <div>
              <span>资料完整度</span>
              <Progress percent={completionPercent} strokeColor="#1f78d8" />
            </div>
            <div>
              <span>入驻状态</span>
              <Tag color={hasActiveIncubation ? "green" : "orange"}>{hasActiveIncubation ? "已入驻" : "未入驻"}</Tag>
              <small>
                {latestIncubation?.incubate_start && latestIncubation?.incubate_end
                  ? `${latestIncubation.incubate_start} 至 ${latestIncubation.incubate_end}`
                  : `共 ${incubationTotal} 条入驻记录`}
              </small>
            </div>
          </section>
        </div>
      </Card>

      <Card
        title={<><BankOutlined style={{ marginRight: 8 }} />企业基础信息</>}
        extra={<Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>完善资料</Button>}
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} bordered size="middle">
          <Descriptions.Item label={<><IdcardOutlined /> 统一社会信用代码</>}>{valueText(enterprise.credit_code)}</Descriptions.Item>
          <Descriptions.Item label={<><TeamOutlined /> 所属行业</>}>{valueText(enterprise.industry)}</Descriptions.Item>
          <Descriptions.Item label={<><BuildOutlined /> 企业规模</>}>{valueText(enterprise.scale)}</Descriptions.Item>
          <Descriptions.Item label={<><UserOutlined /> 法定代表人</>}>{valueText(enterprise.legal_person)}</Descriptions.Item>
          <Descriptions.Item label="性质">{valueText(enterprise.nature)}</Descriptions.Item>
          <Descriptions.Item label="类型">{valueText(enterprise.type)}</Descriptions.Item>
          <Descriptions.Item label="级别">{valueText(enterprise.level)}</Descriptions.Item>
          <Descriptions.Item label="成立时间">{valueText(enterprise.establishment_date)}</Descriptions.Item>
          <Descriptions.Item label="认定备案时间">{valueText(enterprise.certification_date)}</Descriptions.Item>
          <Descriptions.Item label={<><EnvironmentOutlined /> 企业地址</>} span={3}>{valueText(enterprise.address)}</Descriptions.Item>
          <Descriptions.Item label="企业简介" span={3}>{valueText(enterprise.description)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={<><PhoneOutlined style={{ marginRight: 8 }} />联系与银行信息</>} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} bordered size="middle">
          <Descriptions.Item label="运营单位名称">{valueText(enterprise.operating_unit_name)}</Descriptions.Item>
          <Descriptions.Item label="联系人">{valueText(enterprise.contact_name)}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{valueText(enterprise.contact_phone)}</Descriptions.Item>
          <Descriptions.Item label="手机号码">{valueText(enterprise.mobile_phone)}</Descriptions.Item>
          <Descriptions.Item label="办公电话">{valueText(enterprise.office_phone)}</Descriptions.Item>
          <Descriptions.Item label="开户银行">{valueText(enterprise.bank_name)}</Descriptions.Item>
          <Descriptions.Item label="银行账号" span={2}>{valueText(enterprise.bank_account)}</Descriptions.Item>
          <Descriptions.Item label="固定资产投入">{valueText(enterprise.fixed_asset_investment, " 万元")}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={<><TeamOutlined style={{ marginRight: 8 }} />场地与人员信息</>} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} bordered size="middle">
          <Descriptions.Item label="总面积">{valueText(enterprise.total_area, " 平方米")}</Descriptions.Item>
          <Descriptions.Item label="功能区面积">{valueText(enterprise.functional_area, " 平方米")}</Descriptions.Item>
          <Descriptions.Item label="孵化区面积">{valueText(enterprise.incubation_area, " 平方米")}</Descriptions.Item>
          <Descriptions.Item label="房租租赁面积">{valueText(enterprise.rent_area, " 平方米")}</Descriptions.Item>
          <Descriptions.Item label="房租市场租金">{valueText(enterprise.rent_price, " 元/月/平方米")}</Descriptions.Item>
          <Descriptions.Item label="工位数量">{valueText(enterprise.workstation_count, " 个")}</Descriptions.Item>
          <Descriptions.Item label="工位标准" span={3}>{valueText(enterprise.workstation_standard)}</Descriptions.Item>
          <Descriptions.Item label="管理人员总数">{valueText(enterprise.managers_count, " 人")}</Descriptions.Item>
          <Descriptions.Item label="专业技术人员数">{valueText(enterprise.technical_staff_count, " 人")}</Descriptions.Item>
          <Descriptions.Item label="本科以上学历人数">{valueText(enterprise.bachelor_above_count, " 人")}</Descriptions.Item>
          <Descriptions.Item label="参加专业培训人员数">{valueText(enterprise.trained_staff_count, " 人")}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={<><FileTextOutlined style={{ marginRight: 8 }} />材料与基金信息</>}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="middle">
          <Descriptions.Item label="自有孵化种子基金">{valueText(enterprise.seed_fund_amount, " 万元")}</Descriptions.Item>
          <Descriptions.Item label="场地证明材料">{valueText(enterprise.site_proof_material)}</Descriptions.Item>
          <Descriptions.Item label="自有孵化种子基金证明材料" span={2}>{valueText(enterprise.seed_fund_material)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal
        title="完善企业信息"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText="保存"
        width={920}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Title level={5}>基础信息</Title>
          <Row gutter={16}>
            <Col xs={24} md={12}><Form.Item name="name" label="企业名称" rules={[{ required: true, message: "请输入企业名称" }]}><Input /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="credit_code" label="统一社会信用代码" rules={[{ required: true, len: 18, message: "请输入18位统一社会信用代码" }]}><Input maxLength={18} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="industry" label="所属行业"><Input /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="scale" label="企业规模"><Select options={ENTERPRISE_SCALES.map((value) => ({ label: value, value }))} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="legal_person" label="法定代表人"><Input /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="nature" label="性质"><Select options={ENTERPRISE_NATURES.map((value) => ({ label: value, value }))} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="type" label="类型"><Select options={ENTERPRISE_TYPES.map((value) => ({ label: value, value }))} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="level" label="级别"><Select options={ENTERPRISE_LEVELS.map((value) => ({ label: value, value }))} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="establishment_date" label="成立时间"><Input placeholder="YYYY-MM-DD" /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="certification_date" label="认定备案时间"><Input placeholder="YYYY-MM-DD" /></Form.Item></Col>
            <Col span={24}><Form.Item name="address" label="企业地址"><Input /></Form.Item></Col>
            <Col span={24}><Form.Item name="description" label="企业简介"><TextArea rows={3} placeholder="请填写主营业务、核心产品、技术方向或服务领域" /></Form.Item></Col>
          </Row>

          <Title level={5}>联系与银行信息</Title>
          <Row gutter={16}>
            <Col xs={24} md={12}><Form.Item name="operating_unit_name" label="运营单位名称"><Input /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="contact_name" label="联系人"><Input /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item name="contact_phone" label="联系电话"><Input /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item name="mobile_phone" label="手机号码"><Input /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item name="office_phone" label="办公电话"><Input /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="bank_name" label="开户银行"><Input /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="bank_account" label="银行账号"><Input /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="fixed_asset_investment" label="固定资产投入（万元）"><InputNumber min={0} precision={2} style={{ width: "100%" }} /></Form.Item></Col>
          </Row>

          <Title level={5}>场地与人员信息</Title>
          <Row gutter={16}>
            <Col xs={24} md={8}><Form.Item name="total_area" label="总面积（平方米）"><InputNumber min={0} precision={2} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item name="functional_area" label="功能区面积（平方米）"><InputNumber min={0} precision={2} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item name="incubation_area" label="孵化区面积（平方米）"><InputNumber min={0} precision={2} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item name="rent_area" label="房租租赁面积（平方米）"><InputNumber min={0} precision={2} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item name="rent_price" label="房租市场租金（元/月/平方米）"><InputNumber min={0} precision={2} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={8}><Form.Item name="workstation_count" label="工位数量"><InputNumber min={0} precision={0} style={{ width: "100%" }} /></Form.Item></Col>
            <Col span={24}><Form.Item name="workstation_standard" label="工位标准"><Input placeholder="例如：独立工位、共享工位或其他说明" /></Form.Item></Col>
            <Col xs={24} md={6}><Form.Item name="managers_count" label="管理人员总数"><InputNumber min={0} precision={0} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={6}><Form.Item name="technical_staff_count" label="专业技术人员数"><InputNumber min={0} precision={0} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={6}><Form.Item name="bachelor_above_count" label="本科以上学历人数"><InputNumber min={0} precision={0} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={6}><Form.Item name="trained_staff_count" label="参加专业培训人员数"><InputNumber min={0} precision={0} style={{ width: "100%" }} /></Form.Item></Col>
          </Row>

          <Title level={5}>材料与基金信息</Title>
          <Row gutter={16}>
            <Col xs={24} md={12}><Form.Item name="seed_fund_amount" label="自有孵化种子基金（万元）"><InputNumber min={0} precision={2} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="site_proof_material" label="场地证明材料"><Input placeholder="填写材料名称或说明" /></Form.Item></Col>
            <Col span={24}><Form.Item name="seed_fund_material" label="自有孵化种子基金证明材料"><Input placeholder="填写材料名称或说明" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
