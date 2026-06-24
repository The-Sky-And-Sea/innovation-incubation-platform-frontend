import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Typography,
  Space,
  Tag,
  Table,
  Button,
  message,
  Modal,
  Form,
  Select,
  DatePicker,
  Descriptions,
  Alert,
  Empty,
} from "antd";
import {
  HomeOutlined,
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import FileUpload from "../../components/FileUpload";
import { submitIncubation, getIncubationList, getIncubationDetail } from "../../api/incubation";
import { getCarrierList } from "../../api/carriers";
import type { IncubationRecord, IncubationApplyRequest, FileInfo, CarrierInfo, AuditStatus } from "../../types";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

/** 弹窗表单字段（含前端临时字段 incubate_date） */
interface IncubationFormValues {
  carrier_id: number;
  incubate_date: [dayjs.Dayjs, dayjs.Dayjs];
}

/** 状态标签映射 */
const statusMap: Record<AuditStatus, { color: string; icon: React.ReactNode; label: string }> = {
  draft: { color: "default", icon: <FileTextOutlined />, label: "草稿" },
  pending: { color: "processing", icon: <ClockCircleOutlined />, label: "待审核" },
  approved: { color: "success", icon: <CheckCircleOutlined />, label: "已通过" },
  rejected: { color: "error", icon: <CloseCircleOutlined />, label: "已拒绝" },
  returned: { color: "warning", icon: <RollbackOutlined />, label: "已退回" },
  carrier_review: { color: "processing", icon: <ClockCircleOutlined />, label: "载体审核中" },
  gov_review: { color: "processing", icon: <ClockCircleOutlined />, label: "政务审核中" },
};

export default function EnterpriseIncubationManagement() {
  const [records, setRecords] = useState<IncubationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [carriers, setCarriers] = useState<CarrierInfo[]>([]);
  const [agreementFileId, setAgreementFileId] = useState<number | null>(null);
  const [detailDrawer, setDetailDrawer] = useState<{ open: boolean; record: IncubationRecord | null }>({ open: false, record: null });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [form] = Form.useForm<IncubationFormValues>();

  /** 加载入驻记录列表 */
  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getIncubationList(page, pageSize);
      setRecords(res.data.list);
      setPagination(prev => ({ ...prev, current: res.data.page, pageSize: res.data.page_size, total: res.data.total }));
    } catch {
      message.error("加载入驻记录失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(1, 10); }, [fetchList]);

  /** 打开新建入驻申请弹窗 */
  const openCreateModal = async () => {
    try {
      const res = await getCarrierList(1, 50);
      setCarriers(res.data.list);
    } catch {
      setCarriers([]);
    }
    setAgreementFileId(null);
    form.resetFields();
    setModalOpen(true);
  };

  /** 提交入驻申请 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!agreementFileId) {
        message.warning("请先上传入孵协议文件");
        return;
      }
      setSubmitting(true);
      const payload: IncubationApplyRequest = {
        carrier_id: values.carrier_id,
        incubate_start: values.incubate_date[0].format("YYYY-MM-DD"),
        incubate_end: values.incubate_date[1].format("YYYY-MM-DD"),
        agreement_file_id: agreementFileId!,
      };
      await submitIncubation(payload);
      message.success("入驻申请已提交，请等待载体审核");
      setModalOpen(false);
      fetchList(1, pagination.pageSize);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  /** 查看详情 */
  const viewDetail = async (id: number) => {
    try {
      const res = await getIncubationDetail(id);
      setDetailDrawer({ open: true, record: res.data });
    } catch {
      message.error("加载详情失败");
    }
  };

  const columns: ColumnsType<IncubationRecord> = [
    { title: "申请编号", dataIndex: "id", key: "id", width: 80 },
    { title: "载体ID", dataIndex: "carrier_id", key: "carrier_id", width: 80 },
    {
      title: "入孵时间",
      key: "date",
      width: 200,
      render: (_, r) => `${r.incubate_start} ~ ${r.incubate_end}`,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (s: AuditStatus) => {
        const config = statusMap[s] || statusMap.draft;
        return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
      },
    },
    {
      title: "提交时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (d: string) => d ? new Date(d).toLocaleString("zh-CN") : "-",
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      render: (_, r) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => viewDetail(r.id)}>详情</Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}><HomeOutlined style={{ marginRight: 8 }} />企业入驻</Title>

      <Alert
        message="入驻流程说明"
        description="选择载体 → 上传入孵协议 → 填写入驻时间 → 提交申请 → 载体审核 → 审核通过后入驻成功。被退回的申请可重新编辑提交。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchList(pagination.current, pagination.pageSize)} loading={loading}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>新建入驻申请</Button>
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
            showTotal: (t, r) => `${r[0]}-${r[1]} / 共 ${t} 条`,
            onChange: (p, ps) => fetchList(p, ps),
          }}
          size="middle"
          locale={{ emptyText: <Empty description="暂无入驻记录" /> }}
        />
      </Card>

      {/* 新建入驻申请弹窗 */}
      <Modal
        title="新建入驻申请"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="carrier_id"
            label="选择入驻载体"
            rules={[{ required: true, message: "请选择载体" }]}
          >
            <Select
              placeholder="请选择载体"
              options={carriers.map(c => ({ label: `${c.name} (${c.area})`, value: c.id }))}
            />
          </Form.Item>

          <Form.Item label={<Space><FileTextOutlined /> 入孵协议文件</Space>} required>
            <FileUpload
              onUploaded={(info: FileInfo) => setAgreementFileId(info.file_id)}
            />
          </Form.Item>

          <Form.Item
            name="incubate_date"
            label="入孵起止时间"
            rules={[{ required: true, message: "请选择入孵时间" }]}
          >
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情抽屉 */}
      <Modal
        title="入驻详情"
        open={detailDrawer.open}
        onCancel={() => setDetailDrawer({ open: false, record: null })}
        footer={null}
        width={500}
      >
        {detailDrawer.record && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="申请编号">{detailDrawer.record.id}</Descriptions.Item>
            <Descriptions.Item label="载体ID">{detailDrawer.record.carrier_id}</Descriptions.Item>
            <Descriptions.Item label="入孵时间">{detailDrawer.record.incubate_start} ~ {detailDrawer.record.incubate_end}</Descriptions.Item>
            <Descriptions.Item label="协议文件ID">{detailDrawer.record.agreement_file_id}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[detailDrawer.record.status]?.color}>
                {statusMap[detailDrawer.record.status]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="提交时间">{new Date(detailDrawer.record.created_at).toLocaleString("zh-CN")}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}