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
  Input,
  Empty,
  Alert,
  Descriptions,
} from "antd";
import {
  AuditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  RollbackOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getPendingIncubationList, reviewIncubation } from "../../api/carrier";
import { downloadFile } from "../../api/files";
import { triggerBrowserDownload } from "../../utils/download";
import type { IncubationRecord, AuditAction } from "../../types";

const { Title, Text } = Typography;
const { TextArea } = Input;

/** 审核操作配置 */
const reviewActions: { action: AuditAction; label: string; icon: React.ReactNode; color: string }[] = [
  { action: "approve", label: "通过", icon: <CheckCircleOutlined />, color: "green" },
  { action: "reject", label: "拒绝", icon: <CloseCircleOutlined />, color: "red" },
  { action: "return", label: "退回", icon: <RollbackOutlined />, color: "orange" },
];

export default function CarrierIncubationReview() {
  const [records, setRecords] = useState<IncubationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailRecord, setDetailRecord] = useState<IncubationRecord | null>(null);

  // 审核弹窗
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    record: IncubationRecord | null;
    action: AuditAction | null;
  }>({ open: false, record: null, action: null });
  const [comment, setComment] = useState("");
  const [reviewing, setReviewing] = useState(false);

  /** 加载待审核列表 */
  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getPendingIncubationList(page, pageSize);
      setRecords(res.data.list);
      setPagination(prev => ({
        ...prev,
        current: res.data.page,
        pageSize: res.data.page_size,
        total: res.data.total,
      }));
    } catch {
      message.error("加载待审核列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(1, 10); }, [fetchList]);

  /** 打开审核弹窗 */
  const openReviewModal = (record: IncubationRecord, action: AuditAction) => {
    setReviewModal({ open: true, record, action });
    setComment("");
  };

  /** 执行审核 */
  const handleReview = async () => {
    if (!reviewModal.record || !reviewModal.action) return;
    setReviewing(true);
    try {
      await reviewIncubation(reviewModal.record.id, {
        action: reviewModal.action,
        comment: comment || "无",
      });
      message.success(`审核${reviewActions.find(a => a.action === reviewModal.action)?.label}操作完成`);
      setReviewModal({ open: false, record: null, action: null });
      fetchList(1, pagination.pageSize);
    } catch (err) {
      message.error((err as Error).message || "审核操作失败");
    } finally {
      setReviewing(false);
    }
  };

  const handleDownloadAgreement = async (record: IncubationRecord) => {
    if (!record.agreement_file_id) {
      message.warning("该申请未关联协议文件");
      return;
    }
    try {
      const url = await downloadFile(record.agreement_file_id);
      triggerBrowserDownload(url, `入孵协议-${record.enterprise?.name || record.enterprise_id}`);
    } catch (err) {
      message.error((err as Error).message || "下载协议文件失败");
    }
  };

  const columns: ColumnsType<IncubationRecord> = [
    { title: "编号", dataIndex: "id", key: "id", width: 60 },
    {
      title: "企业名称",
      key: "enterprise_name",
      width: 150,
      ellipsis: true,
      render: (_, r) => r.enterprise?.name || "-",
    },
    {
      title: "入孵时间",
      key: "date",
      width: 180,
      render: (_, r) => `${r.incubate_start} ~ ${r.incubate_end}`,
    },
    {
      title: "协议文件",
      dataIndex: "agreement_file_id",
      key: "file",
      width: 80,
      render: (id: number) => (
        <Tag icon={<FileTextOutlined />}>ID: {id}</Tag>
      ),
    },
    {
      title: "提交时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 140,
      render: (d: string) => (d ? new Date(d).toLocaleString("zh-CN") : "-"),
    },
    {
      title: "操作",
      key: "action",
      width: 320,
      render: (_, record) => (
        <Space wrap size={[4, 4]}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailRecord(record)}
          >
            详情
          </Button>
          {reviewActions.map((ra) => (
            <Button
              key={ra.action}
              size="small"
              type={ra.action === "approve" ? "primary" : "default"}
              danger={ra.action === "reject"}
              icon={ra.icon}
              onClick={() => openReviewModal(record, ra.action)}
            >
              {ra.label}
            </Button>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>
        <AuditOutlined style={{ marginRight: 8 }} />
        入驻审核
      </Title>

      <Alert
        message="审核说明"
        description="通过：企业入驻成功；拒绝：企业不可重新提交；退回：企业可修改后再次提交。审核意见会写入审批记录。"
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
          scroll={{ x: "max-content" }}
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
          locale={{ emptyText: <Empty description="暂无待审核申请" /> }}
        />
      </Card>

      <Modal
        title="入驻申请详情"
        open={!!detailRecord}
        onCancel={() => setDetailRecord(null)}
        footer={
          <Space>
            <Button onClick={() => setDetailRecord(null)}>关闭</Button>
            {detailRecord && (
              <Button icon={<DownloadOutlined />} onClick={() => handleDownloadAgreement(detailRecord)}>
                下载协议文件
              </Button>
            )}
          </Space>
        }
        width={820}
      >
        <Descriptions column={2} bordered size="middle">
          <Descriptions.Item label="申请编号">{detailRecord?.id ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="审核状态">
            <Tag color="processing">待审核</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="企业名称" span={2}>
            {detailRecord?.enterprise?.name || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="统一社会信用代码">
            {detailRecord?.enterprise?.credit_code || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="所属行业">
            {detailRecord?.enterprise?.industry || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="企业规模">
            {detailRecord?.enterprise?.scale || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="法定代表人">
            {detailRecord?.enterprise?.legal_person || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="联系人">
            {detailRecord?.enterprise?.contact_name || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {detailRecord?.enterprise?.contact_phone || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="企业地址" span={2}>
            {detailRecord?.enterprise?.address || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="申请载体">
            {detailRecord?.carrier?.name || `载体 #${detailRecord?.carrier_id || "-"}`}
          </Descriptions.Item>
          <Descriptions.Item label="载体区域">
            {detailRecord?.carrier?.area || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="入孵开始时间">
            {detailRecord?.incubate_start || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="入孵结束时间">
            {detailRecord?.incubate_end || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="协议文件">
            {detailRecord?.agreement_file_id ? (
              <Button
                type="link"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadAgreement(detailRecord)}
              >
                文件 ID: {detailRecord.agreement_file_id}
              </Button>
            ) : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="提交时间">
            {detailRecord?.created_at ? new Date(detailRecord.created_at).toLocaleString("zh-CN") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {detailRecord?.updated_at ? new Date(detailRecord.updated_at).toLocaleString("zh-CN") : "-"}
          </Descriptions.Item>
        </Descriptions>
      </Modal>

      {/* 审核意见弹窗 */}
      <Modal
        title={
          <Space>
            {reviewModal.action &&
              (() => {
                const cfg = reviewActions.find((a) => a.action === reviewModal.action);
                return cfg ? <>{cfg.icon} 审核{cfg.label}</> : null;
              })()}
          </Space>
        }
        open={reviewModal.open}
        onOk={handleReview}
        onCancel={() => setReviewModal({ open: false, record: null, action: null })}
        confirmLoading={reviewing}
        okText="确认"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Text>
            入驻申请 #
            {reviewModal.record?.id} — 企业 ID:
            {reviewModal.record?.enterprise_id}
          </Text>
        </div>
        <TextArea
          rows={3}
          placeholder="审核意见（选填）"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Modal>
    </div>
  );
}
