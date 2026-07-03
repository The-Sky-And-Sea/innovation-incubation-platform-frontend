/**
 * 企业入驻申请向导页面（独立全屏向导）
 *
 * 多步骤表单：
 * 1. 填报说明
 * 2. 公司简介
 * 3. 入孵情况
 * 4. 入驻材料
 * 5. 完成提交
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  message,
  Alert,
  Upload,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import Stepper, { Step } from "../../components/Stepper";
import { submitIncubation, getIncubationList, getIncubationDicts, type DictItem } from "../../api/incubation";
import { getCarrierList } from "../../api/carriers";
import { getMyEnterpriseInfo } from "../../api/enterprise";
import { uploadFileAction } from "../../api/files";
import type { CarrierInfo } from "../../types";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 步骤标签
const STEP_LABELS = ["填报说明", "公司简介", "入孵情况", "入驻材料", "完成"];

// 租房信息类型
interface RentInfo {
  rent_start?: string;
  rent_end?: string;
  rent_area?: number;
  rent_price?: number;
  rent_address?: string;
}

// 入驻申请表单数据
interface IncubationApplyForm {
  credit_code?: string;
  name?: string;
  registered_address?: string;
  office_address?: string;
  registered_capital?: number;
  registration_date?: string;
  enterprise_nature?: string;
  founding_category?: string;
  industry_category?: string;
  high_tech_field?: string;
  website?: string;
  main_business?: string;
  carrier_id?: number;
  incubate_status?: string;
  incubate_start?: string;
  incubate_end?: string;
  employee_count?: number;
  management_count?: number;
  high_education_count?: number;
  insurance_count?: number;
  research_count?: number;
  training_count?: number;
  rent_info?: RentInfo[];
}

// 表单验证规则
const validationRules: Record<number, string[]> = {
  2: ["credit_code", "name", "registered_address", "office_address",
       "registered_capital", "registration_date", "enterprise_nature",
       "founding_category", "industry_category", "main_business"],
  3: ["carrier_id", "incubate_status", "employee_count", "management_count",
       "high_education_count", "insurance_count", "research_count"],
  4: [], // 文件在提交时单独验证
};

export default function IncubationWizardPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm<IncubationApplyForm>();
  const [currentStep, setCurrentStep] = useState(1);
  const [formValues, setFormValues] = useState<IncubationApplyForm>({});
  const [submitting, setSubmitting] = useState(false);

  // 载体列表
  const [carriers, setCarriers] = useState<CarrierInfo[]>([]);

  // 字典数据
  const [enterpriseNatures, setEnterpriseNatures] = useState<DictItem[]>([]);
  const [foundingCategories, setFoundingCategories] = useState<DictItem[]>([]);
  const [industryCategories, setIndustryCategories] = useState<DictItem[]>([]);
  const [highTechFields, setHighTechFields] = useState<DictItem[]>([]);
  const [incubateStatuses, setIncubateStatuses] = useState<DictItem[]>([]);

  // 租房信息列表
  const [rentList, setRentList] = useState<RentInfo[]>([]);

  // 上传文件列表
  const [agreementFiles, setAgreementFiles] = useState<UploadFile[]>([]);
  const [otherFiles, setOtherFiles] = useState<UploadFile[]>([]);

  // 加载载体列表
  const loadCarriers = useCallback(async () => {
    try {
      const res = await getCarrierList(1, 50);
      setCarriers(res.data.list);
    } catch {
      setCarriers([]);
    }
  }, []);

  // 加载字典数据
  const loadDicts = useCallback(async () => {
    try {
      const res = await getIncubationDicts();
      const d = res.data;
      setEnterpriseNatures(d.enterprise_natures);
      setFoundingCategories(d.founding_categories);
      setIndustryCategories(d.industry_categories);
      setHighTechFields(d.high_tech_fields);
      setIncubateStatuses(d.incubate_statuses);
    } catch {
      // 静默失败
    }
  }, []);

  // 预填企业信息（信用代码、企业名称）
  const loadEnterprisePrefill = useCallback(async () => {
    try {
      const res = await getMyEnterpriseInfo();
      const ent = res.data;
      if (!ent) return;
      form.setFieldsValue({
        credit_code: ent.credit_code || undefined,
        name: ent.name || undefined,
      });
    } catch {
      // 静默失败
    }
  }, [form]);

  // 提交后刷新记录
  const fetchRecords = useCallback(async () => {
    try {
      await getIncubationList(1, 10);
    } catch {
      // 静默失败
    }
  }, []);

  useEffect(() => {
    loadCarriers();
    loadDicts();
    loadEnterprisePrefill();
    checkActiveIncubation();
  }, [loadCarriers, loadDicts, loadEnterprisePrefill]);

  // 检查是否已有未结束的入驻记录，如有则跳回列表
  const checkActiveIncubation = useCallback(async () => {
    try {
      const res = await getIncubationList(1, 50);
      const today = dayjs().format("YYYY-MM-DD");
      const active = res.data.list.find(
        (r) => r.status === "approved" && r.incubate_status === "in_incubation" && r.incubate_end >= today,
      );
      if (active) {
        message.warning(
          `您当前仍有未结束的入驻记录（结束时间：${active.incubate_end}），无法提交新申请`,
        );
        navigate("/enterprise/incubation");
      }
    } catch {
      // 静默失败
    }
  }, [navigate]);

  // 步骤验证
  const validateStep = async (step: number): Promise<boolean> => {
    const rules = validationRules[step];
    if (!rules) return true;

    try {
      const values = form.getFieldsValue();
      setFormValues(prev => ({ ...prev, ...values }));

      for (const field of rules) {
        const value = values[field as keyof IncubationApplyForm];
        if (value === undefined || value === null || value === "") {
          message.warning("请完善必填信息");
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  };

  // 添加租房记录
  const addRentRecord = () => {
    setRentList([...rentList, {}]);
  };

  // 更新租房记录
  const updateRentRecord = (index: number, field: keyof RentInfo, value: any) => {
    const updated = [...rentList];
    updated[index] = { ...updated[index], [field]: value };
    setRentList(updated);
  };

  // 删除租房记录
  const removeRentRecord = (index: number) => {
    setRentList(rentList.filter((_, i) => i !== index));
  };

  // 处理文件上传
  const handleFileUpload = async (file: File, type: 'agreement' | 'other') => {
    try {
      const res = await uploadFileAction(file);
      const fileInfo: UploadFile = {
        uid: res.data.file_id.toString(),
        name: file.name,
        status: 'done',
        url: `/api/v1/files/${res.data.file_id}/download`,
        response: res.data as unknown as any,
      };

      if (type === 'agreement') {
        setAgreementFiles(prev => [...prev, fileInfo]);
      } else {
        setOtherFiles(prev => [...prev, fileInfo]);
      }
      message.success(`${file.name} 上传成功`);
      return false;
    } catch {
      message.error(`${file.name} 上传失败`);
      return false;
    }
  };

  // 删除文件
  const removeFile = (file: UploadFile, type: 'agreement' | 'other') => {
    if (type === 'agreement') {
      setAgreementFiles(prev => prev.filter(f => f.uid !== file.uid));
    } else {
      setOtherFiles(prev => prev.filter(f => f.uid !== file.uid));
    }
  };

  // 提交申请
  const handleSubmit = async () => {
    try {
      const values = form.getFieldsValue();
      const allValues = { ...values, ...formValues, rent_info: rentList };

      setSubmitting(true);

      const agreementFileIds = agreementFiles
        .filter(f => f.response)
        .map(f => (f.response as any).file_id);

      if (agreementFileIds.length === 0) {
        message.warning("请上传入孵协议文件");
        setSubmitting(false);
        return;
      }

      await submitIncubation({
        carrier_id: allValues.carrier_id!,
        incubate_start: allValues.incubate_start || dayjs().format("YYYY-MM-DD"),
        incubate_end: allValues.incubate_end || dayjs().add(1, 'year').format("YYYY-MM-DD"),
        agreement_file_id: agreementFileIds[0],
        credit_code: allValues.credit_code,
        enterprise_name: allValues.name,
      });

      message.success("入驻申请已提交，请等待载体审核");
      await fetchRecords();
      setCurrentStep(5);
    } catch (err) {
      message.error((err as Error).message || "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 返回列表页
  const goBack = () => navigate("/enterprise/incubation");

  return (
    <div>
      {/* 顶部导航 */}
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
          返回入驻列表
        </Button>
      </div>

      <Card title={<><InfoCircleOutlined style={{ marginRight: 8 }} />入驻平台申请</>}>
        <Stepper
          labels={STEP_LABELS}
          initialStep={currentStep}
          onStepChange={setCurrentStep}
          beforeNext={validateStep}
          onFinalStepCompleted={handleSubmit}
          backButtonText="上一步"
          nextButtonText="下一步"
          finalButtonText="提交申请"
          loading={submitting}
        >
          {/* 步骤1: 填报说明 */}
          <Step>
            <div style={{ padding: "20px 0" }}>
              <Alert
                type="info"
                message="入驻流程说明"
                description={
                  <ol style={{ margin: "8px 0", paddingLeft: 20 }}>
                    <li>填写企业基本信息（统一社会信用代码、企业名称等）</li>
                    <li>选择入驻载体，填写入孵情况</li>
                    <li>上传入孵协议等相关材料</li>
                    <li>提交申请后等待载体审核</li>
                    <li>审核通过后正式入驻</li>
                  </ol>
                }
                style={{ marginBottom: 24 }}
              />
              <div style={{ background: "#f5f5f5", padding: 16, borderRadius: 8 }}>
                <Text type="secondary">
                  <strong>温馨提示：</strong>请确保所填信息真实有效，入孵协议文件需加盖公章后上传。
                  企业信息保存后将不可修改，如有疑问请联系载体管理员。
                </Text>
              </div>
            </div>
          </Step>

          {/* 步骤2: 公司简介 */}
          <Step>
            <Form form={form} layout="vertical" onValuesChange={(_, values) => setFormValues({ ...formValues, ...values })}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Form.Item
                  name="credit_code"
                  label="统一社会信用代码"
                  rules={[
                    { required: true, message: "请输入统一社会信用代码" },
                    { len: 18, message: "统一社会信用代码必须为 18 位" },
                    { pattern: /^[0-9A-Z]{18}$/, message: "由 18 位数字或大写字母组成" },
                  ]}
                >
                  <Input placeholder="请输入18位统一社会信用代码" maxLength={18} />
                </Form.Item>

                <Form.Item
                  name="name"
                  label="企业名称"
                  rules={[{ required: true, message: "请输入企业名称" }]}
                >
                  <Input placeholder="请输入企业全称" />
                </Form.Item>

                <Form.Item
                  name="registered_address"
                  label="注册地址"
                  rules={[{ required: true, message: "请输入注册地址" }]}
                >
                  <Input placeholder="应与营业执照一致" />
                </Form.Item>

                <Form.Item
                  name="office_address"
                  label="办公地址"
                  rules={[{ required: true, message: "请输入办公地址" }]}
                >
                  <Input placeholder="请输入实际办公地址" />
                </Form.Item>

                <Form.Item
                  name="registered_capital"
                  label="注册资本（万元）"
                  rules={[{ required: true, message: "请输入注册资本" }]}
                >
                  <Input type="number" placeholder="请输入注册资本金额" />
                </Form.Item>

                <Form.Item
                  name="registration_date"
                  label="注册时间"
                  rules={[{ required: true, message: "请选择注册时间" }]}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  name="enterprise_nature"
                  label="企业性质"
                  rules={[{ required: true, message: "请选择企业性质" }]}
                >
                  <Select placeholder="请选择">
                    {enterpriseNatures.map(n => <Option key={n.value} value={n.value}>{n.label}</Option>)}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="founding_category"
                  label="企业创办类别"
                  rules={[{ required: true, message: "请选择创办类别" }]}
                >
                  <Select placeholder="请选择">
                    {foundingCategories.map(c => <Option key={c.value} value={c.value}>{c.label}</Option>)}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="industry_category"
                  label="国民经济行业分类"
                  rules={[{ required: true, message: "请选择行业分类" }]}
                >
                  <Select
                    showSearch
                    placeholder="请选择行业分类"
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {industryCategories.map(c => <Option key={c.value} value={c.value}>{c.label}</Option>)}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="high_tech_field"
                  label="高新产业领域"
                >
                  <Select
                    showSearch
                    allowClear
                    placeholder="请选择（选填）"
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {highTechFields.map(c => <Option key={c.value} value={c.value}>{c.label}</Option>)}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="website"
                  label="公司网址"
                >
                  <Input placeholder="请输入公司网址（选填）" />
                </Form.Item>
              </div>

              <Form.Item
                name="main_business"
                label="主营业务"
                rules={[{ required: true, message: "请输入主营业务" }]}
              >
                <TextArea rows={4} placeholder="请详细描述企业的主营业务范围" />
              </Form.Item>
            </Form>
          </Step>

          {/* 步骤3: 入孵情况 */}
          <Step>
            <Form form={form} layout="vertical" onValuesChange={(_, values) => setFormValues({ ...formValues, ...values })}>
              <Form.Item
                name="carrier_id"
                label="入驻载体"
                rules={[{ required: true, message: "请选择入驻载体" }]}
              >
                <Select placeholder="请选择入驻载体">
                  {carriers.map(c => (
                    <Option key={c.id} value={c.id}>
                      {c.name} - {c.area}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="incubate_status"
                label="孵化状态"
                rules={[{ required: true, message: "请选择孵化状态" }]}
              >
                <Select placeholder="请选择">
                  {incubateStatuses.map(s => (
                    <Option key={s.value} value={s.value}>{s.label}</Option>
                  ))}
                </Select>
              </Form.Item>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Form.Item
                  name="incubate_start"
                  label="入驻开始时间"
                  rules={[{ required: true, message: "请选择入驻开始时间" }]}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  name="incubate_end"
                  label="入驻结束时间"
                  rules={[{ required: true, message: "请选择入驻结束时间" }]}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                <Form.Item name="employee_count" label="员工总数" rules={[{ required: true, message: "请输入" }]}>
                  <Input type="number" placeholder="0" />
                </Form.Item>
                <Form.Item name="management_count" label="管理人数" rules={[{ required: true, message: "请输入" }]}>
                  <Input type="number" placeholder="0" />
                </Form.Item>
                <Form.Item name="high_education_count" label="大专及以上学历人数" rules={[{ required: true, message: "请输入" }]}>
                  <Input type="number" placeholder="0" />
                </Form.Item>
                <Form.Item name="insurance_count" label="参保人数" rules={[{ required: true, message: "请输入" }]}>
                  <Input type="number" placeholder="0" />
                </Form.Item>
                <Form.Item name="research_count" label="研究人数" rules={[{ required: true, message: "请输入" }]}>
                  <Input type="number" placeholder="0" />
                </Form.Item>
                <Form.Item name="training_count" label="参加园区培训人数">
                  <Input type="number" placeholder="0" />
                </Form.Item>
              </div>

              {/* 租房信息 */}
              <div style={{ marginTop: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <Text strong>租房信息</Text>
                  <Button type="dashed" icon={<PlusOutlined />} onClick={addRentRecord}>
                    增加记录
                  </Button>
                </div>

                {rentList.map((rent, index) => (
                  <Card key={index} size="small" style={{ marginBottom: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                      <DatePicker
                        placeholder="租房开始时间"
                        onChange={(date) => updateRentRecord(index, 'rent_start', date?.format("YYYY-MM-DD"))}
                        style={{ width: "100%" }}
                      />
                      <DatePicker
                        placeholder="租房结束时间"
                        onChange={(date) => updateRentRecord(index, 'rent_end', date?.format("YYYY-MM-DD"))}
                        style={{ width: "100%" }}
                      />
                      <Input
                        type="number"
                        placeholder="租房面积(平米)"
                        onChange={(e) => updateRentRecord(index, 'rent_area', Number(e.target.value))}
                      />
                      <Input
                        type="number"
                        placeholder="单位租金(元/平/月)"
                        onChange={(e) => updateRentRecord(index, 'rent_price', Number(e.target.value))}
                      />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Input
                        placeholder="租赁地址"
                        value={rent.rent_address}
                        onChange={(e) => updateRentRecord(index, 'rent_address', e.target.value)}
                      />
                    </div>
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeRentRecord(index)}
                      style={{ marginTop: 8 }}
                    >
                      删除
                    </Button>
                  </Card>
                ))}
              </div>
            </Form>
          </Step>

          {/* 步骤4: 入驻材料 */}
          <Step>
            <Form layout="vertical">
              <Form.Item
                label={<><FileTextOutlined /> 入孵协议文件（必填）</>}
                required
              >
                <Upload.Dragger
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  beforeUpload={(file) => handleFileUpload(file, 'agreement')}
                  fileList={agreementFiles}
                  onRemove={(file) => removeFile(file, 'agreement')}
                  maxCount={5}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽上传入孵协议文件</p>
                  <p className="ant-upload-hint">支持 PDF、Word、图片格式，最多5个文件</p>
                </Upload.Dragger>
              </Form.Item>

              <Form.Item label={<><FileTextOutlined /> 其他入驻材料（选填）</>}>
                <Upload.Dragger
                  accept=".pdf,.doc,.docx,.jpg,.png,.xls,.xlsx"
                  beforeUpload={(file) => handleFileUpload(file, 'other')}
                  fileList={otherFiles}
                  onRemove={(file) => removeFile(file, 'other')}
                  maxCount={10}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽上传其他入驻材料</p>
                  <p className="ant-upload-hint">如：营业执照、资质证书等</p>
                </Upload.Dragger>
              </Form.Item>
            </Form>
          </Step>

          {/* 步骤5: 完成 */}
          <Step>
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <CheckCircleOutlined style={{ fontSize: 64, color: "#52c41a", marginBottom: 24 }} />
              <Title level={3}>入驻申请已提交</Title>
              <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
                您的入驻申请已成功提交，请等待载体审核。审核结果将通过站内信通知您。
              </Text>
              <Space>
                <Button onClick={() => navigate("/enterprise/incubation/apply")}>继续申请</Button>
                <Button type="primary" onClick={() => navigate("/enterprise/incubation")}>查看申请记录</Button>
              </Space>
            </div>
          </Step>
        </Stepper>
      </Card>
    </div>
  );
}
