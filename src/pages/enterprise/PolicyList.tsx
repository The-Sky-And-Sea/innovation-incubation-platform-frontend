import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Descriptions, Empty, Form, Input, Modal, Space, Table, Tabs, Tag, Typography, message } from "antd";
import { DeleteOutlined, EyeOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined, SendOutlined, StarFilled, StarOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import FileUpload from "../../components/FileUpload";
import {
  applyPolicy,
  followPolicy,
  getEnterprisePolicies,
  getFollowedPolicies,
  getMyApplications,
  unfollowPolicy,
} from "../../api/policies";
import type { FileInfo, MatchLevel, Policy, PolicyApplication, PolicyMaterial } from "../../types";
import { describeBusinessData } from "../../utils/businessDisplay";

const { Paragraph, Title, Text } = Typography;
const matchColors: Record<MatchLevel, string> = { high: "green", partial: "blue", none: "default", unknown: "orange" };
const matchLabels: Record<MatchLevel, string> = { high: "高匹配", partial: "部分匹配", none: "不匹配", unknown: "未知" };
const resubmittableStatuses = new Set(["rejected", "returned"]);

interface ApplyFormValues {
  project: string;
  contact: string;
  amount?: string;
  note?: string;
}

function getPolicyMaterials(policy?: Policy | null): PolicyMaterial[] {
  const materials = policy?.requirements?.application_materials || policy?.conditions?.application_materials;
  if (Array.isArray(materials)) return materials as PolicyMaterial[];
  return [{ name: "营业执照", file_id: 12, necessity: "necessary" }];
}

function getPolicyRequirements(policy?: Policy | null): Record<string, unknown> {
  return (policy?.requirements || policy?.conditions || {}) as Record<string, unknown>;
}

function valueText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) {
    if (value.length === 0) return "-";
    return value
      .map((item) => {
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return String(record.name || record.title || record.value || Object.values(record).filter(Boolean).join(" "));
        }
        return String(item);
      })
      .filter(Boolean)
      .join(" / ") || "-";
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined && item !== null && item !== "")
      .map(([key, item]) => `${key}: ${valueText(item)}`)
      .join("; ") || "-";
  }
  return String(value);
}

function materialsText(policy?: Policy | null) {
  const materials = getPolicyMaterials(policy);
  if (!materials.length) return "-";
  return materials.map((item) => `${item.name}${item.necessity === "necessary" ? " (required)" : ""}`).join(" / ");
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
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [detailPolicy, setDetailPolicy] = useState<Policy | null>(null);
  const [applyForm] = Form.useForm<ApplyFormValues>();
  const [applying, setApplying] = useState(false);
  const [myApps, setMyApps] = useState<PolicyApplication[]>([]);
  const [myAppsLoading, setMyAppsLoading] = useState(false);
  const [followedPolicies, setFollowedPolicies] = useState<Policy[]>([]);
  const [followedLoading, setFollowedLoading] = useState(false);
  const [updatingFollowIDs, setUpdatingFollowIDs] = useState<Set<number>>(new Set());
  const [materialFiles, setMaterialFiles] = useState<Record<string, FileInfo | null>>({});
  const [supplementFiles, setSupplementFiles] = useState<(FileInfo | null)[]>([]);

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
    if (hasBlockingApplication(policy.id)) {
      message.warning("该政策已提交或已通过申报，不能重复申报");
      return;
    }
    const materials = getPolicyMaterials(policy);
    setSelectedPolicy(policy);
    applyForm.resetFields();
    applyForm.setFieldsValue({
      project: policy.title,
      contact: "李四",
    });
    setMaterialFiles(Object.fromEntries(materials.map((item) => [item.name, null])));
    setSupplementFiles([]);
    setApplyOpen(true);
  };

  const openDetail = (policy: Policy) => {
    setDetailPolicy(policy);
    setDetailOpen(true);
  };

  const hasBlockingApplication = (policyID: number) =>
    myApps.some((app) => app.policy_id === policyID && !resubmittableStatuses.has(app.status));

  const setPolicyFollowed = (policy: Policy, followed: boolean) => {
    const nextPolicy = { ...policy, followed };
    setPolicies((prev) => prev.map((item) => (item.id === policy.id ? { ...item, followed } : item)));
    setFollowedPolicies((prev) => {
      if (followed) {
        return prev.some((item) => item.id === policy.id) ? prev.map((item) => (item.id === policy.id ? nextPolicy : item)) : [nextPolicy, ...prev];
      }
      return prev.filter((item) => item.id !== policy.id);
    });
  };

  const handleApply = async () => {
    if (!selectedPolicy) return;
    try {
      const values = await applyForm.validateFields();
      setApplying(true);
      const availableMaterials = getPolicyMaterials(selectedPolicy);
      const missingRequired = availableMaterials.filter(
        (item) => item.necessity === "necessary" && !materialFiles[item.name]?.file_id,
      );
      if (missingRequired.length > 0) {
        message.error(`请上传必需材料：${missingRequired.map((item) => item.name).join("、")}`);
        return;
      }
      const materials = availableMaterials.reduce<PolicyMaterial[]>((acc, item) => {
          const file = materialFiles[item.name];
          if (file?.file_id) {
            acc.push({ ...item, file_ids: [file.file_id] });
          }
          return acc;
        }, []);
      const supplementFileIds = supplementFiles
        .map((file) => file?.file_id)
        .filter((fileID): fileID is number => Boolean(fileID));
      if (supplementFileIds.length > 0) {
        materials.push({
          name: "补充材料",
          necessity: "optional",
          file_ids: supplementFileIds,
        });
      }
      await applyPolicy(selectedPolicy.id, {
        project: values.project,
        contact: values.contact,
        amount: values.amount,
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
    if (updatingFollowIDs.has(policy.id)) return;
    const nextFollowed = !policy.followed;
    setUpdatingFollowIDs((prev) => new Set(prev).add(policy.id));
    setPolicyFollowed(policy, nextFollowed);
    try {
      if (!nextFollowed) {
        await unfollowPolicy(policy.id);
        message.success("已取消关注");
      } else {
        await followPolicy(policy.id);
        message.success("已关注政策");
      }
    } catch (err) {
      setPolicyFollowed(policy, Boolean(policy.followed));
      message.error((err as Error).message || "关注操作失败");
    } finally {
      setUpdatingFollowIDs((prev) => {
        const next = new Set(prev);
        next.delete(policy.id);
        return next;
      });
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
      width: 240,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>
            详情
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<SendOutlined />}
            disabled={hasBlockingApplication(record.id)}
            onClick={() => openApply(record)}
          >
            申报
          </Button>
          <Button
            size="small"
            type={record.followed ? "primary" : "default"}
            icon={record.followed ? <StarFilled /> : <StarOutlined />}
            loading={updatingFollowIDs.has(record.id)}
            onClick={() => handleToggleFollow(record)}
          >
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
          <Form.Item label="已准备材料" required>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {getPolicyMaterials(selectedPolicy).map((item) => (
                <Card
                  key={item.name}
                  size="small"
                  title={
                    <Space>
                      <span>{item.name}</span>
                      {item.necessity === "necessary" && <Tag color="red">必需</Tag>}
                    </Space>
                  }
                >
                  <FileUpload
                    currentFile={materialFiles[item.name] || null}
                    onUploaded={(file) => setMaterialFiles((prev) => ({ ...prev, [item.name]: file }))}
                    onRemove={() => setMaterialFiles((prev) => ({ ...prev, [item.name]: null }))}
                  />
                </Card>
              ))}
            </Space>
          </Form.Item>
          <Form.Item label="补充材料">
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {supplementFiles.map((file, index) => (
                <Card
                  key={index}
                  size="small"
                  title={`补充材料 ${index + 1}`}
                  extra={
                    <Button
                      size="small"
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => setSupplementFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))}
                    />
                  }
                >
                  <FileUpload
                    currentFile={file}
                    onUploaded={(uploadedFile) =>
                      setSupplementFiles((prev) => prev.map((item, fileIndex) => (fileIndex === index ? uploadedFile : item)))
                    }
                    onRemove={() => setSupplementFiles((prev) => prev.map((item, fileIndex) => (fileIndex === index ? null : item)))}
                  />
                </Card>
              ))}
              <Button icon={<PlusOutlined />} onClick={() => setSupplementFiles((prev) => [...prev, null])}>
                添加补充材料
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`政策详情 - ${detailPolicy?.title || ""}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>关闭</Button>}
        width={760}
        destroyOnClose
      >
        {detailPolicy && (
          <Space direction="vertical" size="middle" style={{ width: "100%", marginTop: 8 }}>
            <Descriptions column={2} bordered size="middle">
              <Descriptions.Item label="政策标题" span={2}>{detailPolicy.title}</Descriptions.Item>
              <Descriptions.Item label="发布部门">{valueText(detailPolicy.department)}</Descriptions.Item>
              <Descriptions.Item label="适用对象">{valueText(detailPolicy.target_role)}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{valueText(detailPolicy.start_date)}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{valueText(detailPolicy.end_date)}</Descriptions.Item>
              <Descriptions.Item label="AI匹配度">{detailPolicy.match_level ? matchLabels[detailPolicy.match_level] : "-"}</Descriptions.Item>
              <Descriptions.Item label="匹配说明">{valueText(detailPolicy.match_reason)}</Descriptions.Item>
            </Descriptions>
            <Card size="small" title="申报条件">
              <Paragraph style={{ marginBottom: 0 }}>{valueText(getPolicyRequirements(detailPolicy).application_condition)}</Paragraph>
            </Card>
            <Card size="small" title="兑现标准">
              <Paragraph style={{ marginBottom: 0 }}>{valueText(getPolicyRequirements(detailPolicy).fulfillment_criteria)}</Paragraph>
            </Card>
            <Card size="small" title="申报材料">
              <Paragraph style={{ marginBottom: 0 }}>{materialsText(detailPolicy)}</Paragraph>
            </Card>
            <Card size="small" title="办理流程">
              <Paragraph style={{ marginBottom: 0 }}>{valueText(getPolicyRequirements(detailPolicy).process)}</Paragraph>
            </Card>
            <Card size="small" title="联系方式">
              <Paragraph style={{ marginBottom: 0 }}>{valueText(getPolicyRequirements(detailPolicy).contact_methods)}</Paragraph>
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  );
}
