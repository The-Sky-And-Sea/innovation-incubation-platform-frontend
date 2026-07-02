import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Checkbox, Empty, Form, Input, Modal, Space, Table, Tabs, Tag, Typography, message } from "antd";
import { FileTextOutlined, ReloadOutlined, SendOutlined, StarOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  applyPolicy,
  followPolicy,
  getEnterprisePolicies,
  getFollowedPolicies,
  getMyApplications,
  unfollowPolicy,
} from "../../api/policies";
import type { MatchLevel, Policy, PolicyApplication, PolicyMaterial } from "../../types";
import { describeBusinessData } from "../../utils/businessDisplay";

const { Title, Text } = Typography;
const { TextArea } = Input;

const matchColors: Record<MatchLevel, string> = { high: "green", partial: "blue", none: "default", unknown: "orange" };
const matchLabels: Record<MatchLevel, string> = { high: "高匹配", partial: "部分匹配", none: "不匹配", unknown: "未知" };

interface ApplyFormValues {
  project: string;
  contact: string;
  amount?: string;
  material_names?: string[];
  note?: string;
}

function getPolicyMaterials(policy?: Policy | null): PolicyMaterial[] {
  const materials = policy?.requirements?.application_materials || policy?.conditions?.application_materials;
  if (Array.isArray(materials)) return materials as PolicyMaterial[];
  return [{ name: "营业执照", file_id: 12, necessity: "necessary" }];
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "待载体审核",
    carrier_review: "待政务审核",
    gov_review: "政务审核中",
    approved: "已通过",
    rejected: "已拒绝",
    returned: "已退回",
  };
  return labels[status] || status;
}

export default function EnterprisePolicyList() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [applyForm] = Form.useForm<ApplyFormValues>();
  const [applying, setApplying] = useState(false);
  const [myApps, setMyApps] = useState<PolicyApplication[]>([]);
  const [myAppsLoading, setMyAppsLoading] = useState(false);
  const [followedPolicies, setFollowedPolicies] = useState<Policy[]>([]);
  const [followedLoading, setFollowedLoading] = useState(false);

  const fetchPolicies = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getEnterprisePolicies(page, pageSize);
      setPolicies(res.data.list);
      setPagination({ current: res.data.page, pageSize: res.data.page_size, total: res.data.total });
    } catch {
      message.error("加载政策列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyApps = useCallback(async () => {
    setMyAppsLoading(true);
    try {
      const res = await getMyApplications(1, 20);
      setMyApps(res.data.list);
    } catch {
      message.error("加载申报记录失败");
    } finally {
      setMyAppsLoading(false);
    }
  }, []);

  const fetchFollowed = useCallback(async () => {
    setFollowedLoading(true);
    try {
      const res = await getFollowedPolicies(1, 20);
      setFollowedPolicies(res.data.list);
    } catch {
      message.error("加载关注政策失败");
    } finally {
      setFollowedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies(1, 10);
    fetchMyApps();
    fetchFollowed();
  }, [fetchPolicies, fetchMyApps, fetchFollowed]);

  const openApply = (policy: Policy) => {
    const materials = getPolicyMaterials(policy);
    setSelectedPolicy(policy);
    applyForm.resetFields();
    applyForm.setFieldsValue({
      project: policy.title,
      contact: "李四",
      material_names: materials.filter((item) => item.necessity === "necessary").map((item) => item.name),
    });
    setApplyOpen(true);
  };

  const handleApply = async () => {
    if (!selectedPolicy) return;
    try {
      const values = await applyForm.validateFields();
      setApplying(true);
      const availableMaterials = getPolicyMaterials(selectedPolicy);
      const materials = availableMaterials.filter((item) => values.material_names?.includes(item.name));
      await applyPolicy(selectedPolicy.id, {
        project: values.project,
        contact: values.contact,
        amount: values.amount,
        note: values.note,
        materials,
      });
      message.success("申报已提交");
      setApplyOpen(false);
      fetchMyApps();
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "申报失败");
    } finally {
      setApplying(false);
    }
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
    { title: "政策标题", dataIndex: "title", key: "title", width: 220, render: (title: string) => <Text strong>{title}</Text> },
    { title: "补贴额度", dataIndex: "subsidy_amount", key: "amount", width: 120, render: (amount: string) => <Tag color="green">{amount || "-"}</Tag> },
    { title: "有效期", key: "period", width: 190, render: (_, record) => `${record.start_date} ~ ${record.end_date}` },
    {
      title: "AI匹配度",
      dataIndex: "match_level",
      key: "match",
      width: 120,
      render: (match: MatchLevel) => (match ? <Tag color={matchColors[match]} icon={<StarOutlined />}>{matchLabels[match]}</Tag> : <Tag>-</Tag>),
    },
    {
      title: "操作",
      key: "action",
      width: 170,
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" icon={<SendOutlined />} onClick={() => openApply(record)}>
            申报
          </Button>
          <Button size="small" icon={<StarOutlined />} onClick={() => handleToggleFollow(record)}>
            {record.followed ? "取消关注" : "关注"}
          </Button>
        </Space>
      ),
    },
  ];

  const appColumns: ColumnsType<PolicyApplication> = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    { title: "政策", key: "policy", render: (_, record) => record.policy?.title || `政策 #${record.policy_id}` },
    { title: "申报摘要", dataIndex: "form_data", key: "form_data", ellipsis: true, render: (value) => describeBusinessData(value as Record<string, unknown>) },
    { title: "状态", dataIndex: "status", key: "status", width: 120, render: (status: string) => <Tag>{statusLabel(status)}</Tag> },
    { title: "提交时间", dataIndex: "created_at", key: "created_at", width: 170, render: (date: string) => (date ? new Date(date).toLocaleString("zh-CN") : "-") },
  ];

  return (
    <div>
      <Title level={3}>
        <FileTextOutlined style={{ marginRight: 8 }} />
        政策申报
      </Title>
      <Alert
        message="选择政策后填写申报信息并提交。申报将经过载体审核和政务终审，AI 匹配度由系统根据企业画像自动分析。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Tabs
        defaultActiveKey="policies"
        items={[
          {
            key: "policies",
            label: "可申报政策",
            children: (
              <Card extra={<Button icon={<ReloadOutlined />} onClick={() => fetchPolicies(pagination.current, pagination.pageSize)} loading={loading}>刷新</Button>}>
                <Table
                  columns={policyColumns}
                  dataSource={policies}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    pageSizeOptions: ["5", "10", "20"],
                    showTotal: (total, range) => `${range[0]}-${range[1]} / 共 ${total} 条`,
                    onChange: (page, pageSize) => fetchPolicies(page, pageSize),
                  }}
                  size="middle"
                  locale={{ emptyText: <Empty description="暂无政策" /> }}
                />
              </Card>
            ),
          },
          {
            key: "myApps",
            label: "我的申报",
            children: (
              <Card extra={<Button icon={<ReloadOutlined />} onClick={fetchMyApps} loading={myAppsLoading}>刷新</Button>}>
                <Table columns={appColumns} dataSource={myApps} rowKey="id" loading={myAppsLoading} pagination={false} size="middle" />
              </Card>
            ),
          },
          {
            key: "followed",
            label: "我的关注",
            children: (
              <Card extra={<Button icon={<ReloadOutlined />} onClick={fetchFollowed} loading={followedLoading}>刷新</Button>}>
                <Table columns={policyColumns} dataSource={followedPolicies} rowKey="id" loading={followedLoading} pagination={false} size="middle" />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={`申报政策 - ${selectedPolicy?.title || ""}`}
        open={applyOpen}
        onCancel={() => setApplyOpen(false)}
        onOk={handleApply}
        confirmLoading={applying}
        okText="提交申报"
        width={560}
        destroyOnClose
      >
        <Form form={applyForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="project" label="申报项目名称" rules={[{ required: true, message: "请填写申报项目名称" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contact" label="联系人" rules={[{ required: true, message: "请填写联系人" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="amount" label="申请金额">
            <Input placeholder="例如：20 万元" />
          </Form.Item>
          <Form.Item name="material_names" label="已准备材料" rules={[{ required: true, message: "请选择已准备材料" }]}>
            <Checkbox.Group options={getPolicyMaterials(selectedPolicy).map((item) => ({ label: item.name, value: item.name }))} />
          </Form.Item>
          <Form.Item name="note" label="补充说明">
            <TextArea rows={3} placeholder="可补充项目情况、资金用途或材料说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
