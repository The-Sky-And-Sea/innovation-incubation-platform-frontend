/**
 * 载体端基础信息管理页面
 *
 * 功能：
 * - 查看载体自身详细信息
 * - 可编辑名称、类型、地址、区域、联系人、联系电话、简介
 * - 保存后自动刷新显示
 */

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Typography,
  Descriptions,
  Button,
  message,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Skeleton,
  Tag,
  Progress,
} from "antd";
import {
  SettingOutlined,
  EditOutlined,
  BankOutlined,
  EnvironmentOutlined,
  UserOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { getCarrierInfo, getCarrierIncubationList, getPendingIncubationList, updateCarrierInfo } from "../../api/carrier";
import type { CarrierInfo as CarrierInfoType } from "../../types";

const { Title } = Typography;
const { TextArea } = Input;

export default function CarrierInfoPage() {
  const [info, setInfo] = useState<CarrierInfoType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [incubationTotal, setIncubationTotal] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [form] = Form.useForm<CarrierInfoType>();

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    try {
      const [res, incubationRes, pendingRes] = await Promise.all([
        getCarrierInfo(),
        getCarrierIncubationList(1, 1),
        getPendingIncubationList(1, 1),
      ]);
      setInfo(res.data);
      setIncubationTotal(incubationRes.data.total ?? incubationRes.data.list.length);
      setPendingTotal(pendingRes.data.total ?? pendingRes.data.list.length);
    } catch {
      message.error("加载载体信息失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const openEdit = () => {
    form.setFieldsValue(info!);
    setEditOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await updateCarrierInfo(values);
      setInfo(res.data);
      message.success("载体信息已更新");
      setEditOpen(false);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Title level={3}>
          <SettingOutlined style={{ marginRight: 8 }} />
          载体信息
        </Title>
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Title level={3}>
        <SettingOutlined style={{ marginRight: 8 }} />
        载体信息
      </Title>

      <Card className="info-overview-card" style={{ marginBottom: 16 }}>
        <div className="info-overview-grid">
          <section className="info-overview-lead">
            <span className="info-overview-icon"><BankOutlined /></span>
            <div>
              <Typography.Text type="secondary">当前载体</Typography.Text>
              <strong>{info?.name || "载体信息"}</strong>
              <small>{info?.type || "暂无载体类型"}</small>
            </div>
          </section>
          <section className="info-overview-metrics">
            <div>
              <span>服务能力</span>
              <strong>{incubationTotal} 家</strong>
              <Progress percent={Math.min(100, incubationTotal * 8)} showInfo={false} strokeColor="#11a992" />
            </div>
            <div>
              <span>审核状态</span>
              <Tag color={pendingTotal > 0 ? "orange" : "green"}>{pendingTotal} 条待审核</Tag>
              <small>入驻审核、变更审核建议及时处理。</small>
            </div>
          </section>
        </div>
      </Card>

      <Card
        title={
          <Space>
            <BankOutlined />
            {info?.name}
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={openEdit}
          >
            编辑信息
          </Button>
        }
      >
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="middle">
          <Descriptions.Item
            label={<><BankOutlined /> 载体名称</>}
          >
            {info?.name}
          </Descriptions.Item>

          <Descriptions.Item label="载体类型">
            {info?.type}
          </Descriptions.Item>

          <Descriptions.Item
            label={<><EnvironmentOutlined /> 所在区域</>}
          >
            {info?.area}
          </Descriptions.Item>

          <Descriptions.Item
            label={<><EnvironmentOutlined /> 详细地址</>}
          >
            {info?.address}
          </Descriptions.Item>

          <Descriptions.Item
            label={<><UserOutlined /> 联系人</>}
          >
            {info?.manager_name}
          </Descriptions.Item>

          <Descriptions.Item
            label={<><PhoneOutlined /> 联系电话</>}
          >
            {info?.contact_phone}
          </Descriptions.Item>

          <Descriptions.Item label="简介" span={2}>
            {info?.description || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="特色领域" span={2}>
            {info?.specialty_fields?.length ? (
              <Space wrap>
                {info.specialty_fields.map((field) => <Tag key={field}>{field}</Tag>)}
              </Space>
            ) : "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑载体信息"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        width={560}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
          initialValues={info ?? undefined}
        >
          <Form.Item
            name="name"
            label="载体名称"
            rules={[{ required: true, message: "请输入载体名称" }]}
          >
            <Input prefix={<BankOutlined />} placeholder="载体名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="载体类型"
            rules={[{ required: true, message: "请选择载体类型" }]}
          >
            <Select
              placeholder="请选择"
              options={[
                { label: "众创空间", value: "众创空间" },
                { label: "科技企业孵化器", value: "科技企业孵化器" },
                { label: "大学科技园", value: "大学科技园" },
                { label: "加速器", value: "加速器" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="area"
            label="所在区域"
            rules={[{ required: true, message: "请输入所在区域" }]}
          >
            <Input prefix={<EnvironmentOutlined />} placeholder="如：天河区" />
          </Form.Item>

          <Form.Item
            name="address"
            label="详细地址"
            rules={[{ required: true, message: "请输入详细地址" }]}
          >
            <Input prefix={<EnvironmentOutlined />} placeholder="详细地址" />
          </Form.Item>

          <Form.Item
            name="manager_name"
            label="联系人"
            rules={[{ required: true, message: "请输入联系人" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="联系人姓名" />
          </Form.Item>

          <Form.Item
            name="contact_phone"
            label="联系电话"
            rules={[{ required: true, message: "请输入联系电话" }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="联系电话" />
          </Form.Item>

          <Form.Item name="description" label="简介">
            <TextArea rows={3} placeholder="载体简介（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
