/**
 * 政务端绩效考核管理页面
 *
 * 功能：创建模板 → 启动考核活动 → 考核申报列表 → 评分审核
 */

import { useState, useEffect, useCallback } from "react";
import { Card, Typography, Space, Tag, Table, Button, message, Modal, Form, Input, InputNumber, Select, DatePicker, Alert, Empty } from "antd";
import { TrophyOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { launchPerformanceCampaign, getPerformanceSubmissions, scorePerformance } from "../../api/performances";
import type { PerformanceSubmission, AuditStatus } from "../../types";
import dayjs from "dayjs";

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function GovPerformanceManagement() {
  const [submissions, setSubmissions] = useState<PerformanceSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // 启动考核弹窗
  const [launchOpen, setLaunchOpen] = useState(false);
  const [launchForm] = Form.useForm<{
    name: string; year: number;
    date_range: [dayjs.Dayjs, dayjs.Dayjs];
  }>();
  const [launching, setLaunching] = useState(false);

  // 评分弹窗
  const [scoreOpen, setScoreOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<PerformanceSubmission | null>(null);
  const [scoreForm] = Form.useForm<{ score: number; status: string; comment?: string }>();
  const [scoring, setScoring] = useState(false);

  const fetchSubmissions = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getPerformanceSubmissions(page, pageSize);
      setSubmissions(res.data.list);
      setPagination(prev => ({ ...prev, current: res.data.page, pageSize: res.data.page_size, total: res.data.total }));
    } catch { message.error("加载考核申报失败"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSubmissions(1, 10); }, [fetchSubmissions]);

  const handleLaunch = async () => {
    try {
      const values = await launchForm.validateFields();
      setLaunching(true);
      await launchPerformanceCampaign({
        template_id: 801,
        name: values.name,
        year: values.year,
        start_date: values.date_range[0].format("YYYY-MM-DD"),
        end_date: values.date_range[1].format("YYYY-MM-DD"),
      });
      message.success("考核活动已启动");
      setLaunchOpen(false);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "启动失败");
    } finally { setLaunching(false); }
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
      setScoring(true);
      await scorePerformance(
        selectedSubmission.id,
        values.score,
        values.status as "approved" | "rejected",
        values.comment || "无",
      );
      message.success("评分完成");
      setScoreOpen(false);
      fetchSubmissions(1, pagination.pageSize);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "评分失败");
    } finally { setScoring(false); }
  };

  const columns: ColumnsType<PerformanceSubmission> = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "考核活动ID", dataIndex: "campaign_id", key: "campaign_id", width: 90 },
    { title: "载体ID", dataIndex: "carrier_id", key: "carrier_id", width: 80 },
    { title: "申报数据", dataIndex: "form_data", key: "form_data", width: 180, ellipsis: true, render: (v: unknown) => JSON.stringify(v) },
    { title: "分数", dataIndex: "score", key: "score", width: 70, render: (s?: number) => s !== undefined ? <Tag color="blue">{s}</Tag> : "-" },
    { title: "状态", dataIndex: "status", key: "status", width: 90, render: (s: AuditStatus) => {
      const colors: Record<string, string> = { pending: "processing", approved: "success", rejected: "error" };
      const labels: Record<string, string> = { pending: "待评分", approved: "已通过", rejected: "已拒绝" };
      return <Tag color={colors[s] || "default"}>{labels[s] || s}</Tag>;
    }},
    { title: "操作", key: "action", width: 100, render: (_, r) => (
      <Button type="link" size="small" onClick={() => openScoreModal(r)} disabled={r.status !== "pending"}>评分</Button>
    )},
  ];

  return (
    <div>
      <Title level={3}><TrophyOutlined style={{ marginRight: 8 }} />绩效考核</Title>
      <Alert message="先启动考核活动，载体端提交后在此评分审核。" type="info" showIcon style={{ marginBottom: 16 }} />

      <Card extra={<Space><Button icon={<ReloadOutlined />} onClick={() => fetchSubmissions(pagination.current, pagination.pageSize)} loading={loading}>刷新</Button><Button type="primary" icon={<PlusOutlined />} onClick={() => { launchForm.resetFields(); setLaunchOpen(true); }}>启动考核</Button></Space>}>
        <Table columns={columns} dataSource={submissions} rowKey="id" loading={loading}
          pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, pageSizeOptions: ["5","10","20"], showTotal: (t, r) => `${r[0]}-${r[1]} / 共 ${t} 条`, onChange: (p, ps) => fetchSubmissions(p, ps) }}
          size="middle" locale={{ emptyText: <Empty description="暂无考核申报" /> }} />
      </Card>

      {/* 启动考核弹窗 */}
      <Modal title="启动考核活动" open={launchOpen} onCancel={() => setLaunchOpen(false)} onOk={handleLaunch} confirmLoading={launching} width={500} destroyOnClose>
        <Form form={launchForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="考核名称" rules={[{ required: true }]}><Input placeholder="如「2026年度孵化载体考核」" /></Form.Item>
          <Form.Item name="year" label="考核年度" rules={[{ required: true }]}><InputNumber min={2020} max={2030} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="date_range" label="起止时间" rules={[{ required: true }]}><RangePicker style={{ width: "100%" }} /></Form.Item>
        </Form>
      </Modal>

      {/* 评分弹窗 */}
      <Modal title="评分审核" open={scoreOpen} onCancel={() => setScoreOpen(false)} onOk={handleScore} confirmLoading={scoring} width={450} destroyOnClose>
        <Form form={scoreForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="score" label="评分（0-100）" rules={[{ required: true, type: "number", min: 0, max: 100 }]}><InputNumber min={0} max={100} step={0.5} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="status" label="审核结果" rules={[{ required: true }]}>
            <Select options={[{ label: "✅ 通过", value: "approved" }, { label: "❌ 拒绝", value: "rejected" }]} />
          </Form.Item>
          <Form.Item name="comment" label="评语"><TextArea rows={2} placeholder="请输入评语" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}