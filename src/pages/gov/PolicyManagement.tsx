/**
 * 政务端政策兑现管理页面
 *
 * 功能：创建模板 → 发布政策 → 政策列表
 */

import { useState, useEffect, useCallback } from "react";
import { Card, Typography, Space, Tag, Table, Button, message, Modal, Form, Input, Select, DatePicker, Alert, Empty } from "antd";
import { FileProtectOutlined, PlusOutlined, ReloadOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import FileUpload from "../../components/FileUpload";
import { publishPolicy, getPolicyList } from "../../api/policies";
import type { Policy, FileInfo } from "../../types";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function GovPolicyManagement() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  // 发布弹窗
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishSubmitting, setPublishSubmitting] = useState(false);
  const [publishFileId, setPublishFileId] = useState<number | null>(null);
  const [publishForm] = Form.useForm<{
    template_id: number; title: string; subsidy_amount: string;
    conditions_json?: string; date_range: [dayjs.Dayjs, dayjs.Dayjs];
  }>();

  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getPolicyList(page, pageSize);
      setPolicies(res.data.list);
      setPagination(prev => ({ ...prev, current: res.data.page, pageSize: res.data.page_size, total: res.data.total }));
    } catch { message.error("加载政策列表失败"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchList(1, 10); }, [fetchList]);

  const openPublishModal = () => {
    setPublishFileId(null);
    publishForm.resetFields();
    setPublishOpen(true);
  };

  const handlePublish = async () => {
    try {
      const values = await publishForm.validateFields();
      setPublishSubmitting(true);
      const conditions: Record<string, unknown> = values.conditions_json ? JSON.parse(values.conditions_json) : {};
      await publishPolicy({
        template_id: values.template_id,
        title: values.title,
        conditions,
        subsidy_amount: values.subsidy_amount,
        start_date: values.date_range[0].format("YYYY-MM-DD"),
        end_date: values.date_range[1].format("YYYY-MM-DD"),
        file_id: publishFileId ?? undefined,
      });
      message.success("政策发布成功");
      setPublishOpen(false);
      fetchList(1, pagination.pageSize);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "发布失败");
    } finally { setPublishSubmitting(false); }
  };

  const columns: ColumnsType<Policy> = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "政策标题", dataIndex: "title", key: "title", width: 200, render: (t: string) => <Text strong>{t}</Text> },
    { title: "补贴额度", dataIndex: "subsidy_amount", key: "amount", width: 100, render: (a: string) => <Tag color="green">{a}</Tag> },
    { title: "有效期", key: "period", width: 200, render: (_, r) => `${r.start_date} ~ ${r.end_date}` },
    { title: "AI匹配度", dataIndex: "match_level", key: "match", width: 100, render: (m: string) => {
      const colors: Record<string, string> = { high: "green", partial: "blue", none: "default", unknown: "orange" };
      return <Tag color={colors[m] || "default"}>{m || "-"}</Tag>;
    }},
    { title: "操作", key: "action", width: 80, render: (_, r) => <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => {
      Modal.info({ title: r.title, content: JSON.stringify(r.conditions, null, 2), width: 500 });
    }}>条件</Button> },
  ];

  return (
    <div>
      <Title level={3}><FileProtectOutlined style={{ marginRight: 8 }} />政策管理</Title>
      <Alert message="政策发布时系统会自动调用 AI 提取政策结构化字段，提取失败则回滚。支持关联政策原文附件。" type="info" showIcon style={{ marginBottom: 16 }} />

      <Card extra={<Space><Button icon={<ReloadOutlined />} onClick={() => fetchList(pagination.current, pagination.pageSize)} loading={loading}>刷新</Button><Button type="primary" icon={<PlusOutlined />} onClick={openPublishModal}>发布政策</Button></Space>}>
        <Table columns={columns} dataSource={policies} rowKey="id" loading={loading}
          pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, pageSizeOptions: ["5","10","20"], showTotal: (t, r) => `${r[0]}-${r[1]} / 共 ${t} 条`, onChange: (p, ps) => fetchList(p, ps) }}
          size="middle" locale={{ emptyText: <Empty description="暂无政策" /> }} />
      </Card>

      {/* 发布政策弹窗 */}
      <Modal title="发布新政策" open={publishOpen} onCancel={() => setPublishOpen(false)} onOk={handlePublish} confirmLoading={publishSubmitting} width={640} destroyOnClose>
        <Alert message="发布前请先在下方创建模板。模板为一次性操作，创建后可多次发布政策。" type="info" style={{ marginBottom: 16 }} />
        <Form form={publishForm} layout="vertical">
          <Form.Item name="template_id" label="选择模板" rules={[{ required: true, message: "请选择或创建模板" }]}>
            <Select placeholder="选择模板" options={[
              { label: "📋 通用申报模板 (企业)", value: 501 },
              { label: "📋 通用申报模板 (载体)", value: 502 },
            ]} />
          </Form.Item>
          <Form.Item name="title" label="政策标题" rules={[{ required: true }]}><Input placeholder="如「2026年度高新技术企业补贴」" /></Form.Item>
          <Form.Item name="subsidy_amount" label="补贴额度" rules={[{ required: true }]}><Input placeholder="如「10万元」" /></Form.Item>
          <Form.Item name="date_range" label="有效期" rules={[{ required: true }]}><RangePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="conditions_json" label="申报条件 (JSON)" tooltip="可选，如 { 'industry': 'IT', 'scale': '小型' }"><TextArea rows={2} placeholder='{"industry": "信息技术", "scale": "小型"}' /></Form.Item>
          <Form.Item label="政策原文附件 (可选)"><FileUpload onUploaded={(info: FileInfo) => setPublishFileId(info.file_id)} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}