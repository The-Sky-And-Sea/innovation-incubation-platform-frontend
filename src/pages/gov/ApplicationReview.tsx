/**
 * 政务端 — 政策申报终审页面
 *
 * 复用 AuditReview 组件
 */

import { useState, useEffect, useCallback } from "react";
import { Card, Typography, Table, Button, message, Alert, Empty } from "antd";
import { InboxOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AuditReview from "../../components/AuditReview";
import { getGovPendingApplications, govReviewApplication } from "../../api/policies";
import type { PolicyApplication } from "../../types";

const { Title } = Typography;

export default function GovApplicationReview() {
  const [apps, setApps] = useState<PolicyApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getGovPendingApplications(page, pageSize);
      setApps(res.data.list);
      setPagination(prev => ({ ...prev, current: res.data.page, pageSize: res.data.page_size, total: res.data.total }));
    } catch { message.error("加载待审核申报失败"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchList(1, 10); }, [fetchList]);

  const handleReview = async (id: number, action: string, comment: string) => {
    await govReviewApplication(id, { action, comment } as unknown as import("../../types").AuditRequestBody);
    fetchList(1, pagination.pageSize);
  };

  const columns: ColumnsType<PolicyApplication> = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "政策ID", dataIndex: "policy_id", key: "policy_id", width: 70 },
    { title: "申报数据", dataIndex: "form_data", key: "form_data", width: 200, ellipsis: true, render: (v: unknown) => JSON.stringify(v) },
    { title: "提交时间", dataIndex: "created_at", key: "created_at", width: 150, render: (d: string) => d ? new Date(d).toLocaleString("zh-CN") : "-" },
    { title: "操作", key: "action", width: 260, render: (_, r) => (
      <AuditReview targetName={`申报 #${r.id}`} onReview={async (action, comment) => { await handleReview(r.id, action, comment); }} />
    )},
  ];

  return (
    <div>
      <Title level={3}><InboxOutlined style={{ marginRight: 8 }} />申报终审</Title>
      <Alert message="载体审核通过后的申报流转至此，进行最终审批。" type="info" showIcon style={{ marginBottom: 16 }} />
      <Card extra={<Button icon={<ReloadOutlined />} onClick={() => fetchList(pagination.current, pagination.pageSize)} loading={loading}>刷新</Button>}>
        <Table columns={columns} dataSource={apps} rowKey="id" loading={loading}
          pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, showSizeChanger: true, pageSizeOptions: ["5","10","20"], showTotal: (t, r) => `${r[0]}-${r[1]} / 共 ${t} 条`, onChange: (p, ps) => fetchList(p, ps) }}
          size="middle" locale={{ emptyText: <Empty description="暂无待审核申报" /> }} />
      </Card>
    </div>
  );
}