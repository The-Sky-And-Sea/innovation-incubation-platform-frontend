import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  FormOutlined,
  ReloadOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import FileUpload from "../../components/FileUpload";
import { getChangeDetail, getChangeList, getChangeTypes, submitChange, updateChange } from "../../api/changes";
import { getMyEnterpriseInfo, getMyIncubation } from "../../api/enterprise";
import type { AuditStatus, ChangeRecord, ChangeType, EnterpriseInfo, FileInfo } from "../../types";
import { describeBusinessData } from "../../utils/businessDisplay";
import { CREDIT_CODE_MESSAGE, CREDIT_CODE_PATTERN, ENTERPRISE_INDUSTRIES, ENTERPRISE_SCALES } from "../../constants/enterprise";

const { Title } = Typography;

const statusMap: Record<AuditStatus, { color: string; icon: React.ReactNode; label: string }> = {
  draft: { color: "default", icon: <FileTextOutlined />, label: "草稿" },
  pending: { color: "processing", icon: <ClockCircleOutlined />, label: "待审核" },
  approved: { color: "success", icon: <CheckCircleOutlined />, label: "已通过" },
  rejected: { color: "error", icon: <CloseCircleOutlined />, label: "已拒绝" },
  returned: { color: "warning", icon: <RollbackOutlined />, label: "已退回" },
  carrier_review: { color: "processing", icon: <ClockCircleOutlined />, label: "载体审核中" },
  gov_review: { color: "processing", icon: <ClockCircleOutlined />, label: "政务审核中" },
};

const fieldLabels: Record<ChangeType, { current: string; next: string; proof: string }> = {
  企业名称: { current: "当前企业名称", next: "变更后企业名称", proof: "企业名称变更证明" },
  统一社会信用代码: { current: "当前统一社会信用代码", next: "变更后统一社会信用代码", proof: "信用代码变更证明" },
  所属行业: { current: "当前所属行业", next: "变更后所属行业", proof: "行业变更证明" },
  企业规模: { current: "当前企业规模", next: "变更后企业规模", proof: "企业规模变更证明" },
  企业地址: { current: "当前企业地址", next: "变更后企业地址", proof: "地址变更证明" },
  法定代表人: { current: "当前法定代表人", next: "变更后法定代表人", proof: "法定代表人变更证明" },
  入孵协议文件: { current: "当前入孵协议", next: "新入孵协议", proof: "新入孵协议文件" },
};

const enterpriseValue: Record<Exclude<ChangeType, "入孵协议文件">, keyof EnterpriseInfo> = {
  企业名称: "name",
  统一社会信用代码: "credit_code",
  所属行业: "industry",
  企业规模: "scale",
  企业地址: "address",
  法定代表人: "legal_person",
};

interface ChangeFormValues {
  change_type: ChangeType;
  new_value?: string;
  change_date: Dayjs;
}

export default function EnterpriseChangeManagement() {
  const [records, setRecords] = useState<ChangeRecord[]>([]);
  const [changeTypes, setChangeTypes] = useState<ChangeType[]>([]);
  const [enterprise, setEnterprise] = useState<EnterpriseInfo | null>(null);
  const [hasActiveIncubation, setHasActiveIncubation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState({ current: 1, pageSize: 10, total: 0 });
  const [proofFile, setProofFile] = useState<FileInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ChangeRecord | null>(null);
  const [detail, setDetail] = useState<ChangeRecord | null>(null);
  const [form] = Form.useForm<ChangeFormValues>();
  const selectedType = Form.useWatch("change_type", form) || "企业名称";
  const labels = fieldLabels[selectedType];

  const changeValueRules = selectedType === "统一社会信用代码"
    ? [{ required: true, message: `请输入${labels.next}` }, { pattern: CREDIT_CODE_PATTERN, message: CREDIT_CODE_MESSAGE }]
    : [{ required: true, whitespace: true, message: `请输入${labels.next}` }];

  const renderNewValueInput = () => {
    if (selectedType === "所属行业") {
      return <Select showSearch optionFilterProp="label" placeholder="请选择所属行业" options={ENTERPRISE_INDUSTRIES.map((item) => ({ label: item, value: item }))} />;
    }
    if (selectedType === "企业规模") {
      return <Select placeholder="请选择企业规模" options={ENTERPRISE_SCALES.map((item) => ({ label: item, value: item }))} />;
    }
    return <Input placeholder={`请输入${labels.next}`} maxLength={selectedType === "统一社会信用代码" ? 18 : undefined} />;
  };

  const currentValue = useMemo(() => {
    if (!enterprise || selectedType === "入孵协议文件") return selectedType === "入孵协议文件" ? "已生效协议" : "-";
    return enterprise[enterpriseValue[selectedType]] || "-";
  }, [enterprise, selectedType]);

  const fetchList = useCallback(async (current = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getChangeList(current, pageSize);
      setRecords(res.data.list);
      setPage({ current: res.data.page, pageSize: res.data.page_size, total: res.data.total });
    } catch {
      message.error("加载变更记录失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([getMyEnterpriseInfo(), getMyIncubation(1, 20), getChangeTypes()])
      .then(([profile, incubation, types]) => {
        setEnterprise(profile.data);
        setHasActiveIncubation(incubation.data.list.some(
          (item: any) => item.status === "approved" && item.incubate_status === "in_incubation",
        ));
        setChangeTypes(types.data);
      })
      .catch(() => message.error("加载企业变更信息失败"));
    fetchList();
  }, [fetchList]);

  const resetForm = () => {
    setEditingRecord(null);
    setProofFile(null);
    form.setFieldsValue({ change_type: "企业名称", new_value: "", change_date: dayjs() });
  };

  const handleSubmit = async () => {
    if (!hasActiveIncubation) return message.warning("请先申请入驻并通过载体审核后，再进行重大事项变更");
    try {
      const values = await form.validateFields();
      if (!proofFile && !editingRecord) return message.warning(`请上传${labels.proof}`);
      if (values.change_type !== "入孵协议文件" && values.new_value?.trim() === currentValue) {
        return message.warning("变更后的内容不能与当前内容相同");
      }
      setSubmitting(true);
      const newValue = values.change_type === "入孵协议文件"
        ? { new_file_id: proofFile?.file_id, proof_file_id: proofFile?.file_id, change_date: values.change_date.format("YYYY-MM-DD") }
        : { value: values.new_value?.trim(), proof_file_id: proofFile?.file_id, change_date: values.change_date.format("YYYY-MM-DD") };
      const description = `${values.change_type}变更，变更日期：${values.change_date.format("YYYY-MM-DD")}`;
      if (editingRecord) {
        await updateChange(editingRecord.id, { change_content: description, new_value: newValue });
        message.success("变更申请已重新提交");
      } else {
        await submitChange(values.change_type, description, newValue);
        message.success("变更流程已发起，请等待审核");
      }
      resetForm();
      fetchList(1, page.pageSize);
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) return;
      message.error((error as Error).message || "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const editRecord = (record: ChangeRecord) => {
    setEditingRecord(record);
    setProofFile(null);
    form.setFieldsValue({
      change_type: record.change_type,
      new_value: String(record.new_value.value || ""),
      change_date: dayjs(String(record.new_value.change_date || record.created_at)),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const columns: ColumnsType<ChangeRecord> = [
    { title: "流程申请时间", dataIndex: "created_at", width: 190, render: (v: string) => new Date(v).toLocaleString("zh-CN") },
    { title: "流程类型", dataIndex: "change_type", width: 180, render: (v: ChangeType) => <Tag color="blue">{v}</Tag> },
    { title: "流程结果（企业→园区）", dataIndex: "status", render: (v: AuditStatus) => {
      const status = statusMap[v] || statusMap.draft;
      return <Tag color={status.color} icon={status.icon}>{status.label}</Tag>;
    } },
    { title: "流程详情", key: "action", width: 180, render: (_, record) => <Space>
      <Button type="link" icon={<EyeOutlined />} onClick={() => getChangeDetail(record.id).then((res) => setDetail(res.data))}>详情</Button>
      {record.status === "returned" && <Button type="link" icon={<EditOutlined />} onClick={() => editRecord(record)}>重新提交</Button>}
    </Space> },
  ];

  return <div>
    <Title level={3}><FormOutlined style={{ marginRight: 8 }} />重大事项变更</Title>
    {!hasActiveIncubation && <Alert type="warning" showIcon message="请先完成入驻并通过载体审核，之后才能发起重大事项变更" style={{ marginBottom: 16 }} />}

    <Card title="企业信息变更申请" style={{ marginBottom: 18 }}>
      <Form form={form} layout="vertical" initialValues={{ change_type: "企业名称", change_date: dayjs() }} disabled={!hasActiveIncubation}>
        <Form.Item name="change_type" label="企业变更类型" rules={[{ required: true, message: "请选择企业变更类型" }]}>
          <Select disabled={Boolean(editingRecord) || !hasActiveIncubation} options={changeTypes.map((value) => ({ label: `${value}变更`, value }))} onChange={() => { setProofFile(null); form.setFieldValue("new_value", ""); }} />
        </Form.Item>
        <Row gutter={24}>
          <Col xs={24} md={12}><Form.Item label={labels.current}><Input value={String(currentValue)} disabled /></Form.Item></Col>
          {selectedType !== "入孵协议文件" && <Col xs={24} md={12}><Form.Item name="new_value" label={labels.next} rules={changeValueRules}>{renderNewValueInput()}</Form.Item></Col>}
        </Row>
        <Form.Item label={labels.proof} required={!editingRecord}>
          <FileUpload currentFile={proofFile} onUploaded={setProofFile} onRemove={() => setProofFile(null)} allowedTypes={[".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"]} />
        </Form.Item>
        <Form.Item name="change_date" label="变更时间" rules={[{ required: true, message: "请选择变更时间" }]}>
          <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" disabledDate={(date) => date.isAfter(dayjs(), "day")} />
        </Form.Item>
        <Space style={{ width: "100%", justifyContent: "center" }}>
          <Button type="primary" loading={submitting} onClick={handleSubmit}>{editingRecord ? "重新发起变更流程" : "发起变更流程"}</Button>
          <Button onClick={resetForm}>取消</Button>
        </Space>
      </Form>
    </Card>

    <Card title="企业重大事项变更申请记录" extra={<Button icon={<ReloadOutlined />} loading={loading} onClick={() => fetchList(page.current, page.pageSize)}>刷新</Button>}>
      <Table columns={columns} dataSource={records} rowKey="id" loading={loading} locale={{ emptyText: <Empty description="暂无记录" /> }} pagination={{ ...page, showSizeChanger: true, onChange: fetchList }} />
    </Card>

    <Modal title="变更详情" open={Boolean(detail)} footer={null} onCancel={() => setDetail(null)}>
      {detail && <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="变更类型">{detail.change_type}</Descriptions.Item>
        <Descriptions.Item label="原内容">{describeBusinessData(detail.old_value)}</Descriptions.Item>
        <Descriptions.Item label="变更后内容">{describeBusinessData(detail.new_value)}</Descriptions.Item>
        <Descriptions.Item label="申请时间">{new Date(detail.created_at).toLocaleString("zh-CN")}</Descriptions.Item>
        <Descriptions.Item label="状态">{statusMap[detail.status]?.label}</Descriptions.Item>
      </Descriptions>}
    </Modal>
  </div>;
}
