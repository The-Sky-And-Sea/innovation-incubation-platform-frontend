/**
 * 载体端绩效考核申报页面
 */

import { useState, useEffect, useCallback } from "react";
import { Card, Typography, Tag, Table, Button, message, Modal, Form, Input, Alert, Empty } from "antd";
import { TrophyOutlined, SendOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getPerformanceCampaigns, submitPerformance } from "../../api/performances";
import type { PerformanceCampaign } from "../../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CarrierPerformanceSubmit() {
  const [campaigns, setCampaigns] = useState<PerformanceCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // 提交弹窗
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<PerformanceCampaign | null>(null);
  const [submitForm] = Form.useForm<{ form_json: string }>();
  const [submitting, setSubmitting] = useState(false);

  const fetchCampaigns = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getPerformanceCampaigns(page, pageSize);
      setCampaigns(res.data.list);
      setPagination(prev => ({ ...prev, current: res.data.page, pageSize: res.data.page_size, total: res.data.total }));
    } catch { message.error("加载考核活动失败"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCampaigns(1, 10); }, [fetchCampaigns]);

  const openSubmit = (campaign: PerformanceCampaign) => {
    setSelectedCampaign(campaign);
    submitForm.resetFields();
    setSubmitOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedCampaign) return;
    try {
      const values = await submitForm.validateFields();
      setSubmitting(true);
      const formData: Record<string, unknown> = values.form_json ? JSON.parse(values.form_json) : {};
      await submitPerformance(selectedCampaign.id, formData);
      message.success("考核申报已提交");
      setSubmitOpen(false);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "提交失败");
    } finally { setSubmitting(false); }
  };

  const columns: ColumnsType<PerformanceCampaign> = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "考核名称", dataIndex: "name", key: "name", width: 220, render: (t: string) => <Text strong>{t}</Text> },
    { title: "年度", dataIndex: "year", key: "year", width: 70, render: (y: number) => <Tag color="blue">{y}</Tag> },
    { title: "有效期", key: "period", width: 200, render: (_, r) => `${r.start_date} ~ ${r.end_date}` },
    { title: "操作", key: "action", width: 100, render: (_, r) => (
      <Button type="primary" size="small" icon={<SendOutlined />} onClick={() => openSubmit(r)}>提交申报</Button>
    )},
  ];

  return (
    <div>
      <Title level={3}><TrophyOutlined style={{ marginRight: 8 }} />绩效考核</Title>
      <Alert message="选择已启动的考核活动，填写申报数据后提交。政务端将进行评分审核。" type="info" showIcon style={{ marginBottom: 16 }} />

      <Card extra={<Button icon={<ReloadOutlined />} onClick={() => fetchCampaigns(pagination.current, pagination.pageSize)} loading={loading}>刷新</Button>}>
        <Table columns={columns} dataSource={campaigns} rowKey="id" loading={loading}
          pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, pageSizeOptions: ["5","10","20"], showTotal: (t, r) => `${r[0]}-${r[1]} / 共 ${t} 条`, onChange: (p, ps) => fetchCampaigns(p, ps) }}
          size="middle" locale={{ emptyText: <Empty description="暂无考核活动" /> }} />
      </Card>

      {/* 提交申报弹窗 */}
      <Modal title={<><SendOutlined /> 提交考核申报 — {selectedCampaign?.name}</>} open={submitOpen} onCancel={() => setSubmitOpen(false)} onOk={handleSubmit} confirmLoading={submitting} width={500} destroyOnClose>
        <Form form={submitForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="form_json" label="申报数据 (JSON)" tooltip="根据考核模板的 form_schema 填写">
            <TextArea rows={4} placeholder='{"revenue": "5000万元", "employee_count": 120, "patent_count": 15}' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}