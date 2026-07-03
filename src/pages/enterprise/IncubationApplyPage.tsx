/**
 * 企业入驻记录列表页
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Space,
  Table,
  Tag,
  message,
  Alert,
  Tooltip,
} from "antd";
import {
  HomeOutlined,
  PlusOutlined,
  ReloadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getIncubationList } from "../../api/incubation";
import { getCarrierList } from "../../api/carriers";
import type { IncubationRecord, CarrierInfo, AuditStatus } from "../../types";
import dayjs from "dayjs";

const { Title } = Typography;

// 状态映射
const statusMap: Record<AuditStatus, { color: string; icon: React.ReactNode; label: string }> = {
  draft: { color: "default", icon: <FileTextOutlined />, label: "草稿" },
  pending: { color: "processing", icon: <FileTextOutlined />, label: "待审核" },
  approved: { color: "success", icon: <CheckCircleOutlined />, label: "已通过" },
  rejected: { color: "error", icon: <FileTextOutlined />, label: "已拒绝" },
  returned: { color: "warning", icon: <FileTextOutlined />, label: "已退回" },
  carrier_review: { color: "processing", icon: <FileTextOutlined />, label: "载体审核中" },
  gov_review: { color: "processing", icon: <FileTextOutlined />, label: "政务审核中" },
};

// 孵化状态映射
const incubateStatusMap: Record<string, { color: string; label: string }> = {
  in_incubation: { color: "green", label: "在孵" },
  graduated: { color: "blue", label: "已毕业" },
  exited: { color: "default", label: "已退出" },
};

export default function IncubationApplyPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<IncubationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [carriers, setCarriers] = useState<CarrierInfo[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // 加载记录列表
  const fetchRecords = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getIncubationList(page, pageSize);
      setRecords(res.data.list);
      setPagination({
        current: res.data.page,
        pageSize: res.data.page_size,
        total: res.data.total,
      });
    } catch {
      message.error("加载入驻记录失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载载体列表
  const loadCarriers = useCallback(async () => {
    try {
      const res = await getCarrierList(1, 50);
      setCarriers(res.data.list);
    } catch {
      setCarriers([]);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    loadCarriers();
  }, [fetchRecords, loadCarriers]);

  // 计算是否存在"未结束"的入驻记录
  // 规则：状态为已通过 + 孵化状态为在孵 + 结束时间 >= 今日
  const activeRecord = useMemo(() => {
    const today = dayjs().format("YYYY-MM-DD");
    return records.find(
      (r) => r.status === "approved" && r.incubate_status === "in_incubation" && r.incubate_end >= today,
    ) || null;
  }, [records]);

  // 记录列表列定义
  const columns: ColumnsType<IncubationRecord> = [
    { title: "申请编号", dataIndex: "id", key: "id", width: 80 },
    {
      title: "载体",
      key: "carrier",
      width: 150,
      render: (_, r) => carriers.find(c => c.id === r.carrier_id)?.name || r.carrier_id.toString(),
    },
    {
      title: "入孵时间",
      key: "date",
      render: (_, r) => `${r.incubate_start} ~ ${r.incubate_end}`,
    },
    {
      title: "审核状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (s: AuditStatus) => {
        const config = statusMap[s] || statusMap.draft;
        return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
      },
    },
    {
      title: "孵化状态",
      key: "incubate_status",
      width: 100,
      render: (_: unknown, r: IncubationRecord) => {
        // 审核未通过时不显示孵化状态
        if (r.status !== "approved") return <Tag color="default">-</Tag>;
        const status = (r.incubate_status as string) || "in_incubation";
        const cfg = incubateStatusMap[status] || { color: "default", label: status };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "提交时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (d: string) => d ? new Date(d).toLocaleString("zh-CN") : "-",
    },
  ];

  // 跳转到向导页：先检查是否可申请
  const handleNewApply = () => {
    if (activeRecord) {
      message.warning(
        `您当前仍有未结束的入驻记录（结束时间：${activeRecord.incubate_end}），请等待结束后再申请`,
      );
      return;
    }
    navigate("/enterprise/incubation/apply");
  };

  return (
    <div>
      <Title level={3}><HomeOutlined style={{ marginRight: 8 }} />企业入驻</Title>

      {activeRecord && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="存在未结束的入驻记录"
          description={
            <>
              您当前的入驻记录（编号 #{activeRecord.id}）将于 <strong>{activeRecord.incubate_end}</strong> 结束。
              期间无法提交新的入驻申请，请等待当前入驻周期结束或联系载体管理员处理。
            </>
          }
        />
      )}

      <Card
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchRecords()} loading={loading}>刷新</Button>
            <Tooltip title={activeRecord ? `当前入驻将于 ${activeRecord.incubate_end} 结束，期间不可申请` : ""}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleNewApply}
                disabled={!!activeRecord}
              >
                新建入驻申请
              </Button>
            </Tooltip>
          </Space>
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
            onChange: (p, ps) => fetchRecords(p, ps),
          }}
          size="middle"
        />
      </Card>
    </div>
  );
}
