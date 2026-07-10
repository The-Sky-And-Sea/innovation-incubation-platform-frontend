import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Empty, Form, Input, Modal, Space, Table, Tag, Typography, message } from "antd";
import { FileTextOutlined, ReloadOutlined, SearchOutlined, SendOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import FileUpload from "../../components/FileUpload";
import { searchCarrierPolicies } from "../../api/ai";
import { applyCarrierPolicy, getCarrierPolicies } from "../../api/policies";
import type { FileInfo, Policy, PolicyMaterial } from "../../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CarrierPolicyApplyValues {
  service_summary?: string;
  contact?: string;
}

function getPolicyMaterials(policy?: Policy | null): PolicyMaterial[] {
  const materials = policy?.requirements?.application_materials || policy?.conditions?.application_materials;
  if (Array.isArray(materials)) return materials as PolicyMaterial[];
  return [{ name: "载体服务报告", file_id: 21, necessity: "necessary" }];
}

export default function CarrierPolicyList() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [applying, setApplying] = useState(false);
  const [materialFiles, setMaterialFiles] = useState<Record<string, FileInfo | null>>({});
  const [form] = Form.useForm<CarrierPolicyApplyValues>();

  const fetchPolicies = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getCarrierPolicies(page, pageSize);
      setPolicies(res.data.list);
      setPagination({ current: res.data.page, pageSize: res.data.page_size, total: res.data.total });
    } catch {
      message.error("加载政策列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies(1, 10);
  }, [fetchPolicies]);

  const handleSearch = async () => {
    const query = keyword.trim();
    if (!query) {
      fetchPolicies(1, pagination.pageSize);
      return;
    }
    setSearching(true);
    try {
      const res = await searchCarrierPolicies(query);
      setPolicies(res.data.list);
      setPagination({ current: 1, pageSize: pagination.pageSize, total: res.data.total });
      message.success("已根据关键词匹配政策");
    } catch {
      message.error("政策检索失败");
    } finally {
      setSearching(false);
    }
  };

  const openApply = (policy: Policy) => {
    const materials = getPolicyMaterials(policy);
    setSelectedPolicy(policy);
    form.resetFields();
    form.setFieldsValue({
      contact: "载体管理员",
    });
    setMaterialFiles(Object.fromEntries(materials.map((item) => [item.name, null])));
    setApplyOpen(true);
  };

  const handleApply = async () => {
    if (!selectedPolicy) return;
    try {
      await form.validateFields();
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
      await applyCarrierPolicy(selectedPolicy.id, materials);
      message.success("载体政策申报已提交政务端审核");
      setApplyOpen(false);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "申报失败");
    } finally {
      setApplying(false);
    }
  };

  const columns: ColumnsType<Policy> = useMemo(
    () => [
      {
        title: "政策标题",
        dataIndex: "title",
        key: "title",
        render: (value: string, record) => (
          <Space direction="vertical" size={2}>
            <Text strong>{value}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.subsidy_amount || "按政策要求兑现"}
            </Text>
          </Space>
        ),
      },
      { title: "发布部门", dataIndex: "department", key: "department", width: 140, render: (value?: string) => value || "-" },
      {
        title: "适用对象",
        dataIndex: "target_role",
        key: "target_role",
        width: 120,
        render: (value: string) => <Tag color="green">{value === "both" ? "企业/载体" : "载体"}</Tag>,
      },
      { title: "有效期", key: "period", width: 210, render: (_, record) => `${record.start_date} ~ ${record.end_date}` },
      {
        title: "操作",
        key: "action",
        width: 110,
        render: (_, record) => (
          <Button type="primary" size="small" icon={<SendOutlined />} onClick={() => openApply(record)}>
            申报
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <Title level={3}>
        <FileTextOutlined style={{ marginRight: 8 }} />
        载体政策申报
      </Title>

      <Alert
        message="政策检索与申报"
        description="载体可按关键词检索适合的政策，确认材料后直接提交到政务端审核。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: "100%", maxWidth: 720 }}>
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={handleSearch}
            placeholder="输入服务能力、孵化成果、公共服务等关键词"
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} loading={searching} onClick={handleSearch}>
            检索
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setKeyword("");
              fetchPolicies(1, pagination.pageSize);
            }}
          >
            重置
          </Button>
        </Space.Compact>
      </Card>

      <Card extra={<Button icon={<ReloadOutlined />} onClick={() => fetchPolicies(pagination.current, pagination.pageSize)} loading={loading}>刷新</Button>}>
        <Table
          columns={columns}
          dataSource={policies}
          rowKey="id"
          loading={loading || searching}
          size="middle"
          locale={{ emptyText: <Empty description="暂无可申报政策" /> }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
            showTotal: (total, range) => `${range[0]}-${range[1]} / 共 ${total} 条`,
            onChange: (page, pageSize) => fetchPolicies(page, pageSize),
          }}
        />
      </Card>

      <Modal
        title={`申报政策 - ${selectedPolicy?.title || ""}`}
        open={applyOpen}
        onCancel={() => setApplyOpen(false)}
        onOk={handleApply}
        confirmLoading={applying}
        okText="提交申报"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="contact" label="联系人">
            <Input placeholder="请输入联系人" />
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
          <Form.Item name="service_summary" label="服务情况说明">
            <TextArea rows={3} placeholder="可说明服务企业数量、孵化成果、活动组织等情况" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
