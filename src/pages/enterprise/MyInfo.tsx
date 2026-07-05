import { useState, useEffect } from "react";
import { Card, Typography, Descriptions, message, Skeleton, Tag, Button, Modal, Form, Input, Select, Space, Alert, Progress } from "antd";
import {
  IdcardOutlined,
  BankOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  UserOutlined,
  PhoneOutlined,
  InfoCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { getMyEnterpriseInfo, getMyIncubation } from "../../api/enterprise";
import { submitChange } from "../../api/changes";
import type { EnterpriseInfo, ChangeType } from "../../types";

const { Title } = Typography;

const CHANGE_TYPE_MAP: Record<string, ChangeType> = {
  name: "企业名称",
  credit_code: "统一社会信用代码",
  industry: "所属行业",
  scale: "企业规模",
  address: "企业地址",
  legal_person: "法定代表人",
};

const ENTERPRISE_SCALES = ["微型", "小型", "中型", "大型"];

export default function EnterpriseMyInfo() {
  const [enterprise, setEnterprise] = useState<EnterpriseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasActiveIncubation, setHasActiveIncubation] = useState(false);
  const [incubationTotal, setIncubationTotal] = useState(0);
  const [latestIncubation, setLatestIncubation] = useState<any>(null);
  const [form] = Form.useForm<EnterpriseInfo>();

  useEffect(() => {
    Promise.all([
      getMyEnterpriseInfo(),
      getMyIncubation(1, 1),
    ])
      .then(([entRes, incRes]) => {
        setEnterprise(entRes.data);
        form.setFieldsValue(entRes.data);
        const active = incRes.data.list.some(
          (item: any) => item.status === "approved" && item.incubate_status === "in_incubation",
        );
        setHasActiveIncubation(active);
        setIncubationTotal(incRes.data.total ?? incRes.data.list.length);
        setLatestIncubation(incRes.data.list[0] ?? null);
      })
      .catch(() => message.error("加载企业信息失败"))
      .finally(() => setLoading(false));
  }, [form]);

  const handleEdit = () => {
    if (!hasActiveIncubation) {
      message.warning("请先申请入驻并通过载体审核后，再进行信息变更");
      return;
    }
    if (enterprise) {
      form.setFieldsValue(enterprise);
      setEditModalOpen(true);
    }
  };

  const profileFields = enterprise
    ? [
      enterprise.name,
      enterprise.credit_code,
      enterprise.industry,
      enterprise.scale,
      enterprise.address,
      enterprise.legal_person,
      enterprise.contact_name,
      enterprise.contact_phone,
    ]
    : [];
  const completionPercent = profileFields.length
    ? Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)
    : 0;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const changedFields: Array<{ field: string; oldValue: string; newValue: string }> = [];
      if (!enterprise) return;

      if (values.name !== enterprise.name) {
        changedFields.push({ field: "name", oldValue: enterprise.name, newValue: values.name });
      }
      if (values.credit_code !== enterprise.credit_code) {
        changedFields.push({ field: "credit_code", oldValue: enterprise.credit_code, newValue: values.credit_code });
      }
      if (values.industry !== enterprise.industry) {
        changedFields.push({ field: "industry", oldValue: enterprise.industry, newValue: values.industry });
      }
      if (values.scale !== enterprise.scale) {
        changedFields.push({ field: "scale", oldValue: enterprise.scale, newValue: values.scale });
      }
      if (values.address !== enterprise.address) {
        changedFields.push({ field: "address", oldValue: enterprise.address, newValue: values.address });
      }
      if (values.legal_person !== enterprise.legal_person) {
        changedFields.push({ field: "legal_person", oldValue: enterprise.legal_person, newValue: values.legal_person });
      }

      if (changedFields.length === 0) {
        message.info("未修改任何信息");
        setEditModalOpen(false);
        setSubmitting(false);
        return;
      }

      let successCount = 0;
      for (const item of changedFields) {
        const changeType = CHANGE_TYPE_MAP[item.field];
        try {
          await submitChange(changeType, `${changeType}由"${item.oldValue}"变更为"${item.newValue}"`, { value: item.newValue });
          successCount++;
        } catch {
          message.error(`${changeType}提交失败`);
        }
      }

      if (successCount > 0) {
        message.success(`成功提交 ${successCount} 项变更申请，请等待载体审核`);
        setEditModalOpen(false);
        getMyEnterpriseInfo()
          .then((res) => {
            setEnterprise(res.data);
            form.setFieldsValue(res.data);
          })
          .catch(() => message.error("刷新企业信息失败"));
      }
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Title level={3}>
          <IdcardOutlined style={{ marginRight: 8 }} />
          我的企业信息
        </Title>
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  if (!enterprise) {
    return (
      <div>
        <Title level={3}>我的企业信息</Title>
        <Card>
          <p>暂无企业信息</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Title level={3}>
        <IdcardOutlined style={{ marginRight: 8 }} />
        我的企业信息
      </Title>

      {!hasActiveIncubation && (
        <Alert
          message="温馨提示"
          description="请先申请入驻并通过载体审核后，才能进行信息变更等操作"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card className="info-overview-card" style={{ marginBottom: 16 }}>
        <div className="info-overview-grid">
          <section className="info-overview-lead">
            <span className="info-overview-icon"><BankOutlined /></span>
            <div>
              <Typography.Text type="secondary">当前企业</Typography.Text>
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
        title={
          <>
            <BankOutlined style={{ marginRight: 8 }} />
            {enterprise.name}
          </>
        }
        extra={
          <Space>
            <Tag color={hasActiveIncubation ? "green" : "orange"}>
              {hasActiveIncubation ? "已入驻" : "未入驻"}
            </Tag>
            <Button
              icon={<EditOutlined />}
              onClick={handleEdit}
              disabled={!hasActiveIncubation}
            >
              修改信息
            </Button>
          </Space>
        }
      >
        <Descriptions
          column={{ xs: 1, sm: 2, md: 3, lg: 4 }}
          bordered
          size="middle"
        >
          <Descriptions.Item
            label={<><IdcardOutlined /> 统一社会信用代码</>}
          >
            {enterprise.credit_code}
          </Descriptions.Item>

          <Descriptions.Item
            label={<><TeamOutlined /> 所属行业</>}
          >
            <Tag>{enterprise.industry || "-"}</Tag>
          </Descriptions.Item>

          <Descriptions.Item
            label={<><EnvironmentOutlined /> 企业地址</>}
            span={2}
          >
            {enterprise.address || "-"}
          </Descriptions.Item>

          <Descriptions.Item
            label={<><UserOutlined /> 法定代表人</>}
          >
            {enterprise.legal_person || "-"}
          </Descriptions.Item>

          <Descriptions.Item
            label={<><UserOutlined /> 联系人</>}
          >
            {enterprise.contact_name || "-"}
          </Descriptions.Item>

          <Descriptions.Item
            label={<><PhoneOutlined /> 联系电话</>}
          >
            {enterprise.contact_phone || "-"}
          </Descriptions.Item>

          <Descriptions.Item
            label={<><InfoCircleOutlined /> 企业规模</>}
          >
            {enterprise.scale || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal
        title="修改企业信息"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText="提交变更申请"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="企业名称" rules={[{ required: true, message: "请输入企业名称" }]}>
            <Input placeholder="请输入企业名称" />
          </Form.Item>

          <Form.Item name="credit_code" label="统一社会信用代码" rules={[{ required: true, message: "请输入统一社会信用代码" }]}>
            <Input placeholder="请输入统一社会信用代码" />
          </Form.Item>

          <Form.Item name="industry" label="所属行业">
            <Input placeholder="请输入所属行业" />
          </Form.Item>

          <Form.Item name="scale" label="企业规模">
            <Select placeholder="请选择企业规模" options={ENTERPRISE_SCALES.map((s) => ({ label: s, value: s }))} />
          </Form.Item>

          <Form.Item name="address" label="企业地址">
            <Input placeholder="请输入企业地址" />
          </Form.Item>

          <Form.Item name="legal_person" label="法定代表人">
            <Input placeholder="请输入法定代表人" />
          </Form.Item>

          <Form.Item name="contact_name" label="联系人">
            <Input placeholder="请输入联系人" />
          </Form.Item>

          <Form.Item name="contact_phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
