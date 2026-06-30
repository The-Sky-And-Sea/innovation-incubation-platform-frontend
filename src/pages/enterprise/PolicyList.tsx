/**
 * 企业端政策申报页面
 *
 * 功能：可申报政策列表（AI 匹配度）+ 提交申报 + 我的申报记录
 */

import { useState, useEffect, useCallback } from "react";
import { Card, Typography, Space, Tag, Table, Button, message, Modal, Form, Input, Alert, Empty, Tabs } from "antd";
import { FileTextOutlined, StarOutlined, ReloadOutlined, SendOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  applyPolicy,
  followPolicy,
  getEnterprisePolicies,
  getFollowedPolicies,
  getMyApplications,
  unfollowPolicy,
} from "../../api/policies";
import type { Policy, PolicyApplication, MatchLevel, PolicyMaterial } from "../../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

/** AI 匹配度颜色 */
const matchColors: Record<MatchLevel, string> = { high: "green", partial: "blue", none: "default", unknown: "orange" };
const matchLabels: Record<MatchLevel, string> = { high: "高匹配", partial: "部分匹配", none: "不匹配", unknown: "未知" };

export default function EnterprisePolicyList() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // 申报弹窗
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [applyForm] = Form.useForm<{ form_json: string }>();
  const [applying, setApplying] = useState(false);

  // 我的申报
  const [myApps, setMyApps] = useState<PolicyApplication[]>([]);
  const [myAppsLoading, setMyAppsLoading] = useState(false);
  const [followedPolicies, setFollowedPolicies] = useState<Policy[]>([]);
  const [followedLoading, setFollowedLoading] = useState(false);

  const fetchPolicies = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getEnterprisePolicies(page, pageSize);
      setPolicies(res.data.list);
      setPagination(prev => ({ ...prev, current: res.data.page, pageSize: res.data.page_size, total: res.data.total }));
    } catch { message.error("加载政策列表失败"); }
    finally { setLoading(false); }
  }, []);

  const fetchMyApps = useCallback(async () => {
    setMyAppsLoading(true);
    try {
      const res = await getMyApplications(1, 20);
      setMyApps(res.data.list);
    } catch { message.error("加载申报记录失败"); }
    finally { setMyAppsLoading(false); }
  }, []);

  const fetchFollowed = useCallback(async () => {
    setFollowedLoading(true);
    try {
      const res = await getFollowedPolicies(1, 20);
      setFollowedPolicies(res.data.list);
    } catch { message.error("加载关注政策失败"); }
    finally { setFollowedLoading(false); }
  }, []);

  useEffect(() => { fetchPolicies(1, 10); fetchMyApps(); fetchFollowed(); }, [fetchPolicies, fetchMyApps, fetchFollowed]);

  const openApply = (policy: Policy) => {
    setSelectedPolicy(policy);
    applyForm.resetFields();
    setApplyOpen(true);
  };

  const handleApply = async () => {
    if (!selectedPolicy) return;
    try {
      const values = await applyForm.validateFields();
      setApplying(true);
      const parsed = values.form_json ? JSON.parse(values.form_json) : {};
      const materials: PolicyMaterial[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.materials)
          ? parsed.materials
          : [];
      const formData: Record<string, unknown> = { materials };
      await applyPolicy(selectedPolicy.id, formData);
      message.success("申报已提交");
      setApplyOpen(false);
      fetchMyApps();
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "申报失败");
    } finally { setApplying(false); }
  };

  const handleToggleFollow = async (policy: Policy) => {
    try {
      if (policy.followed) {
        await unfollowPolicy(policy.id);
        message.success("已取消关注");
      } else {
        await followPolicy(policy.id);
        message.success("已关注政策");
      }
      fetchPolicies(pagination.current, pagination.pageSize);
      fetchFollowed();
    } catch (err) {
      message.error((err as Error).message || "关注操作失败");
    }
  };

  const policyColumns: ColumnsType<Policy> = [
    { title: "政策标题", dataIndex: "title", key: "title", width: 220, render: (t: string) => <Text strong>{t}</Text> },
    { title: "补贴额度", dataIndex: "subsidy_amount", key: "amount", width: 90, render: (a: string) => <Tag color="green">{a}</Tag> },
    { title: "有效期", key: "period", width: 180, render: (_, r) => `${r.start_date} ~ ${r.end_date}` },
    { title: "AI匹配度", dataIndex: "match_level", key: "match", width: 110, render: (m: MatchLevel) => {
      if (!m) return <Tag>-</Tag>;
      return <Tag color={matchColors[m] || "default"} icon={<StarOutlined />}>{matchLabels[m] || m}</Tag>;
    }},
    { title: "操作", key: "action", width: 160, render: (_, r) => (
      <Space>
        <Button type="primary" size="small" icon={<SendOutlined />} onClick={() => openApply(r)}>申报</Button>
        <Button size="small" icon={<StarOutlined />} onClick={() => handleToggleFollow(r)}>
          {r.followed ? "取消关注" : "关注"}
        </Button>
      </Space>
    )},
  ];

  const appColumns: ColumnsType<PolicyApplication> = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "政策ID", dataIndex: "policy_id", key: "policy_id", width: 70 },
    { title: "状态", dataIndex: "status", key: "status", width: 110, render: (s: string) => {
      const colors: Record<string, string> = { pending: "processing", carrier_review: "processing", gov_review: "processing", approved: "success", rejected: "error", returned: "warning" };
      const labels: Record<string, string> = { pending: "待载体审核", carrier_review: "待政务审核", gov_review: "政务审核中", approved: "已通过", rejected: "已拒绝", returned: "已退回" };
      return <Tag color={colors[s] || "default"}>{labels[s] || s}</Tag>;
    }},
    { title: "提交时间", dataIndex: "created_at", key: "created_at", width: 150, render: (d: string) => d ? new Date(d).toLocaleString("zh-CN") : "-" },
  ];

  return (
    <div>
      <Title level={3}><FileTextOutlined style={{ marginRight: 8 }} />政策申报</Title>
      <Alert message="选择政策后点击「申报」填写表单数据并提交。申报将经过载体审核 → 政务终审。AI 匹配度由系统根据企业画像自动分析。" type="info" showIcon style={{ marginBottom: 16 }} />

      <Tabs defaultActiveKey="policies" items={[
        {
          key: "policies",
          label: "可申报政策",
          children: (
            <Card extra={<Button icon={<ReloadOutlined />} onClick={() => fetchPolicies(pagination.current, pagination.pageSize)} loading={loading}>刷新</Button>}>
              <Table columns={policyColumns} dataSource={policies} rowKey="id" loading={loading}
                pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, pageSizeOptions: ["5","10","20"], showTotal: (t, r) => `${r[0]}-${r[1]} / 共 ${t} 条`, onChange: (p, ps) => fetchPolicies(p, ps) }}
                size="middle" locale={{ emptyText: <Empty description="暂无政策" /> }} />
            </Card>
          ),
        },
        {
          key: "myApps",
          label: "我的申报",
          children: (
            <Card extra={<Button icon={<ReloadOutlined />} onClick={fetchMyApps} loading={myAppsLoading}>刷新</Button>}>
              <Table columns={appColumns} dataSource={myApps} rowKey="id" loading={myAppsLoading} pagination={false} size="middle" locale={{ emptyText: <Empty description="暂无申报记录" /> }} />
            </Card>
          ),
        },
        {
          key: "followed",
          label: "我的关注",
          children: (
            <Card extra={<Button icon={<ReloadOutlined />} onClick={fetchFollowed} loading={followedLoading}>刷新</Button>}>
              <Table columns={policyColumns} dataSource={followedPolicies} rowKey="id" loading={followedLoading} pagination={false} size="middle" locale={{ emptyText: <Empty description="暂无关注政策" /> }} />
            </Card>
          ),
        },
      ]} />

      {/* 申报弹窗 */}
      <Modal title={<><SendOutlined /> 申报政策 — {selectedPolicy?.title}</>} open={applyOpen} onCancel={() => setApplyOpen(false)} onOk={handleApply} confirmLoading={applying} width={500} destroyOnClose>
        <Form form={applyForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="form_json" label="申报材料 (JSON)" tooltip="按接口文档发送 materials 数组">
            <TextArea rows={4} placeholder='{"materials":[{"name":"营业执照","file_id":12,"necessity":"necessary"}]}' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
