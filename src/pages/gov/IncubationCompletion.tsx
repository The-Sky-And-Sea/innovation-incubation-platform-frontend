import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Empty, Input, Popconfirm, Segmented, Space, Table, Tag, Tooltip, Typography, message } from "antd";
import { CheckCircleOutlined, HomeOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getGovIncubations, govCompleteIncubation } from "../../api/gov";
import type { AuditStatus, IncubationRecord } from "../../types";

const { Title, Text } = Typography;

type IncubationCategory = "all" | "completable" | "in_incubation" | "graduated" | "exited";

const incubateStatusMap: Record<string, { color: string; label: string }> = {
  in_incubation: { color: "green", label: "在孵" },
  graduated: { color: "blue", label: "已毕业" },
  exited: { color: "default", label: "已退出" },
};

const auditStatusMap: Record<AuditStatus, { color: string; label: string }> = {
  draft: { color: "default", label: "草稿" },
  pending: { color: "processing", label: "待审核" },
  approved: { color: "success", label: "已通过" },
  rejected: { color: "error", label: "已拒绝" },
  returned: { color: "warning", label: "已退回" },
  carrier_review: { color: "processing", label: "载体审核中" },
  gov_review: { color: "processing", label: "政务审核中" },
};

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function canComplete(record: IncubationRecord) {
  return (
    record.status === "approved" &&
    record.incubate_status === "in_incubation" &&
    !!record.incubate_end &&
    record.incubate_end <= todayString()
  );
}

function disabledReason(record: IncubationRecord) {
  if (record.status !== "approved") return "入驻审核未通过";
  if (record.incubate_status !== "in_incubation") return "企业不处于在孵状态";
  if (!record.incubate_end || record.incubate_end > todayString()) return "尚未到孵化结束日期";
  return "";
}

export default function GovIncubationCompletion() {
  const [records, setRecords] = useState<IncubationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<IncubationCategory>("all");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchList = useCallback(async (page = 1, pageSize = 10, nextKeyword = keyword, nextCategory = category) => {
    setLoading(true);
    try {
      const res = await getGovIncubations(page, pageSize, nextKeyword.trim(), nextCategory);
      setRecords(res.data.list);
      setPagination({
        current: res.data.page,
        pageSize: res.data.page_size,
        total: res.data.total,
      });
    } catch (err) {
      message.error((err as Error).message || "加载孵化企业状态失败");
    } finally {
      setLoading(false);
    }
  }, [category, keyword]);

  useEffect(() => {
    fetchList(1, 10);
  }, [fetchList]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    fetchList(1, pagination.pageSize, value, category);
  };

  const handleCategoryChange = (value: IncubationCategory) => {
    setCategory(value);
    fetchList(1, pagination.pageSize, keyword, value);
  };

  const handleComplete = async (record: IncubationRecord) => {
    setSubmittingId(record.id);
    try {
      await govCompleteIncubation(record.id);
      message.success(`已确认「${record.enterprise?.name || `企业 #${record.enterprise_id}`}」孵化毕业`);
      fetchList(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error((err as Error).message || "操作失败");
    } finally {
      setSubmittingId(null);
    }
  };

  const columns: ColumnsType<IncubationRecord> = [
    { title: "记录编号", dataIndex: "id", key: "id", width: 100 },
    {
      title: "企业名称",
      key: "enterprise",
      width: 180,
      render: (_, record) => <Text strong>{record.enterprise?.name || `企业 #${record.enterprise_id}`}</Text>,
    },
    {
      title: "所属载体",
      key: "carrier",
      width: 180,
      render: (_, record) => record.carrier?.name || `载体 #${record.carrier_id}`,
    },
    {
      title: "入孵周期",
      key: "incubate_range",
      width: 220,
      render: (_, record) => `${record.incubate_start || "-"} ~ ${record.incubate_end || "-"}`,
    },
    {
      title: "审核状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: AuditStatus) => {
        const cfg = auditStatusMap[status] || { color: "default", label: status };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "孵化状态",
      key: "incubate_status",
      width: 120,
      render: (_, record) => {
        const status = record.incubate_status || "in_incubation";
        const cfg = incubateStatusMap[status] || { color: "default", label: status };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "毕业条件",
      key: "completion",
      width: 140,
      render: (_, record) => (
        canComplete(record)
          ? <Tag color="success">可毕业</Tag>
          : <Tag color="default">{disabledReason(record)}</Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      fixed: "right",
      render: (_, record) => {
        const enabled = canComplete(record);
        const button = (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            loading={submittingId === record.id}
            disabled={!enabled}
          >
            确认毕业
          </Button>
        );
        if (!enabled) {
          return <Tooltip title={disabledReason(record)}>{button}</Tooltip>;
        }
        return (
          <Popconfirm
            title="确认孵化毕业"
            description={`确认「${record.enterprise?.name || `企业 #${record.enterprise_id}`}」已完成孵化？`}
            okText="确认"
            cancelText="取消"
            onConfirm={() => handleComplete(record)}
          >
            {button}
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div>
      <Title level={3}>
        <HomeOutlined style={{ marginRight: 8 }} />
        孵化毕业确认
      </Title>
      <Alert
        message="展示所有入孵企业的审核状态与孵化状态。只有入驻审核已通过、仍处于在孵状态且已到孵化结束日期的企业可以确认毕业。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card
        title="孵化企业状态"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchList(pagination.current, pagination.pageSize)}
            loading={loading}
          >
            刷新
          </Button>
        }
      >
        <Space wrap style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
          <Input.Search
            allowClear
            enterButton={<SearchOutlined />}
            placeholder="按企业名称、信用代码或载体名称搜索"
            style={{ width: 360 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={handleSearch}
          />
          <Segmented
            value={category}
            onChange={(value) => handleCategoryChange(value as IncubationCategory)}
            options={[
              { label: "全部", value: "all" },
              { label: "可毕业", value: "completable" },
              { label: "在孵", value: "in_incubation" },
              { label: "已毕业", value: "graduated" },
              { label: "已退出", value: "exited" },
            ]}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          scroll={{ x: "max-content" }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
            showTotal: (total, range) => `${range[0]}-${range[1]} / 共 ${total} 条`,
            onChange: (page, pageSize) => fetchList(page, pageSize),
          }}
          locale={{ emptyText: <Empty description="暂无孵化企业记录" /> }}
        />
      </Card>
    </div>
  );
}
