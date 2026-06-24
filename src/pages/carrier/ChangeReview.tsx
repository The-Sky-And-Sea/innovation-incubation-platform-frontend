/**
 * 载体端重大事项变更审核页面
 *
 * 复用 AuditReview 通用审批组件
 */

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Typography,
  Tag,
  Table,
  Button,
  message,
  Alert,
  Empty,
} from "antd";
import {
  FormOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AuditReview from "../../components/AuditReview";
import { getPendingChangeList, reviewChange } from "../../api/changes";
import type { ChangeRecord, ChangeType, AuditStatus } from "../../types";

const { Title } = Typography;

export default function CarrierChangeReview() {
  const [records, setRecords] = useState<ChangeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getPendingChangeList(page, pageSize);
      setRecords(res.data.list);
      setPagination((prev) => ({
        ...prev,
        current: res.data.page,
        pageSize: res.data.page_size,
        total: res.data.total,
      }));
    } catch {
      message.error("加载待审核变更列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(1, 10); }, [fetchList]);

  const handleReview = async (recordId: number, action: string, comment: string) => {
    await reviewChange(recordId, { action: action as AuditStatus & string, comment } as unknown as import("../../types").AuditRequestBody);
    fetchList(1, pagination.pageSize);
  };

  const columns: ColumnsType<ChangeRecord> = [
    { title: "编号", dataIndex: "id", key: "id", width: 70 },
    { title: "企业ID", dataIndex: "enterprise_id", key: "enterprise_id", width: 80 },
    {
      title: "变更类型",
      dataIndex: "change_type",
      key: "change_type",
      width: 140,
      render: (t: ChangeType) => <Tag color="purple">{t}</Tag>,
    },
    {
      title: "变更说明",
      dataIndex: "change_content",
      key: "change_content",
      width: 250,
      ellipsis: true,
    },
    {
      title: "新值",
      dataIndex: "new_value",
      key: "new_value",
      width: 150,
      ellipsis: true,
      render: (v: Record<string, unknown>) =>
        v ? JSON.stringify(v) : "-",
    },
    {
      title: "提交时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      render: (d: string) => (d ? new Date(d).toLocaleString("zh-CN") : "-"),
    },
    {
      title: "操作",
      key: "action",
      width: 260,
      render: (_, record) => (
        <AuditReview
          targetName={`变更 #${record.id}`}
          onReview={async (action, comment) => {
            await handleReview(record.id, action, comment);
          }}
        />
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>
        <FormOutlined style={{ marginRight: 8 }} />
        变更审核
      </Title>

      <Alert
        message="审核说明"
        description="通过后自动更新企业对应字段。入孵协议文件变更审核通过后，旧入驻记录和旧协议文件将被删除，企业需重新提交入驻申请。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card
        extra={
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => fetchList(pagination.current, pagination.pageSize)}
            loading={loading}
          >
            刷新
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
            showTotal: (t, r) => `${r[0]}-${r[1]} / 共 ${t} 条`,
            onChange: (p, ps) => fetchList(p, ps),
          }}
          size="middle"
          locale={{ emptyText: <Empty description="暂无待审核变更" /> }}
        />
      </Card>
    </div>
  );
}