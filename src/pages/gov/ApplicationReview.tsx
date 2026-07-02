import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Empty, Space, Table, Tag, Typography, message } from "antd";
import { CheckCircleOutlined, InboxOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AuditReview from "../../components/AuditReview";
import { govCompleteIncubation } from "../../api/gov";
import { getGovPendingApplications, govReviewApplication } from "../../api/policies";
import type { AuditAction, PolicyApplication } from "../../types";
import { describeBusinessData } from "../../utils/businessDisplay";

const { Title, Text } = Typography;

const completionTasks = [
  {
    id: 201,
    enterprise: "测试科技有限公司",
    carrier: "天河软件园孵化器",
    period: "2025-01-01 ~ 2026-06-30",
  },
];

export default function GovApplicationReview() {
  const [apps, setApps] = useState<PolicyApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [completionLoading, setCompletionLoading] = useState<number | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getGovPendingApplications(page, pageSize);
      setApps(res.data.list);
      setPagination({
        current: res.data.page,
        pageSize: res.data.page_size,
        total: res.data.total,
      });
    } catch {
      message.error("加载待终审申报失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(1, 10);
  }, [fetchList]);

  const handleReview = async (id: number, action: AuditAction, comment: string) => {
    await govReviewApplication(id, { action, comment });
    fetchList(1, pagination.pageSize);
  };

  const handleCompleteIncubation = async (id: number) => {
    setCompletionLoading(id);
    try {
      await govCompleteIncubation(id);
      message.success("孵化完成备案已确认");
    } catch {
      message.error("完成备案失败");
    } finally {
      setCompletionLoading(null);
    }
  };

  const columns: ColumnsType<PolicyApplication> = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    {
      title: "政策",
      key: "policy",
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.policy?.title || `政策 #${record.policy_id}`}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.policy?.department || "发布部门待同步"}
          </Text>
        </Space>
      ),
    },
    {
      title: "申报主体",
      dataIndex: "applicant_type",
      key: "applicant_type",
      width: 110,
      render: (value: string) => <Tag color={value === "carrier" ? "green" : "blue"}>{value === "carrier" ? "载体" : "企业"}</Tag>,
    },
    {
      title: "材料",
      key: "materials",
      ellipsis: true,
      render: (_, record) =>
        record.materials?.map((item) => item.name).join("、") || describeBusinessData(record.form_data),
    },
    {
      title: "提交时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (value: string) => (value ? new Date(value).toLocaleString("zh-CN") : "-"),
    },
    {
      title: "操作",
      key: "action",
      width: 260,
      render: (_, record) => (
        <AuditReview
          targetName={`申报 #${record.id}`}
          onReview={(action, comment) => handleReview(record.id, action, comment)}
        />
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>
        <InboxOutlined style={{ marginRight: 8 }} />
        申报终审
      </Title>
      <Alert
        message="申报终审与孵化完成备案"
        description="载体初审通过后的申报在此终审；孵化期结束的企业可在同页完成备案确认。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card title="孵化完成备案" style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={completionTasks}
          columns={[
            { title: "入驻编号", dataIndex: "id", key: "id", width: 100 },
            { title: "企业", dataIndex: "enterprise", key: "enterprise" },
            { title: "载体", dataIndex: "carrier", key: "carrier" },
            { title: "孵化周期", dataIndex: "period", key: "period", width: 220 },
            {
              title: "操作",
              key: "action",
              width: 160,
              render: (_, record) => (
                <Button
                  icon={<CheckCircleOutlined />}
                  loading={completionLoading === record.id}
                  onClick={() => handleCompleteIncubation(record.id)}
                >
                  完成备案
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Card
        title="政策申报终审"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => fetchList(pagination.current, pagination.pageSize)} loading={loading}>
            刷新
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={apps}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
            showTotal: (total, range) => `${range[0]}-${range[1]} / 共 ${total} 条`,
            onChange: (page, pageSize) => fetchList(page, pageSize),
          }}
          size="middle"
          locale={{ emptyText: <Empty description="暂无待终审申报" /> }}
        />
      </Card>
    </div>
  );
}
