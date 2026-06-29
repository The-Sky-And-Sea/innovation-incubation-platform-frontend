import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Empty, Table, Tag, Typography, message } from "antd";
import { InboxOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AuditReview from "../../components/AuditReview";
import { getCarrierPendingApplications, reviewEnterpriseApplication } from "../../api/policies";
import type { AuditRequestBody, PolicyApplication } from "../../types";

const { Title } = Typography;

export default function CarrierApplicationReview() {
  const [apps, setApps] = useState<PolicyApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getCarrierPendingApplications(page, pageSize);
      setApps(res.data.list);
      setPagination({
        current: res.data.page,
        pageSize: res.data.page_size,
        total: res.data.total,
      });
    } catch {
      message.error("加载待审核申报失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(1, 10);
  }, [fetchList]);

  const handleReview = async (id: number, body: AuditRequestBody) => {
    await reviewEnterpriseApplication(id, body);
    fetchList(1, pagination.pageSize);
  };

  const columns: ColumnsType<PolicyApplication> = [
    { title: "申报编号", dataIndex: "id", key: "id", width: 90 },
    { title: "政策编号", dataIndex: "policy_id", key: "policy_id", width: 90, render: (id) => `#${id}` },
    {
      title: "材料数量",
      dataIndex: "materials",
      key: "materials",
      width: 100,
      render: (_, record) => <Tag color="blue">{record.materials?.length || 0} 项</Tag>,
    },
    {
      title: "申报摘要",
      key: "summary",
      ellipsis: true,
      render: (_, record) => JSON.stringify(record.materials || record.form_data || {}),
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
      width: 270,
      render: (_, record) => (
        <AuditReview
          targetName={`申报 #${record.id}`}
          onReview={(action, comment) => handleReview(record.id, { action, comment })}
        />
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>
        <InboxOutlined style={{ marginRight: 8 }} />
        企业申报审核
      </Title>
      <Alert
        message="载体初审通过后，申报会流转至政务端终审；拒绝或退回会通知企业。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Card
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
          size="middle"
          locale={{ emptyText: <Empty description="暂无待审核申报" /> }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
            showTotal: (total, range) => `${range[0]}-${range[1]} / 共 ${total} 条`,
            onChange: (page, pageSize) => fetchList(page, pageSize),
          }}
        />
      </Card>
    </div>
  );
}
