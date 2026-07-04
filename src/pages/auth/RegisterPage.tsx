import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Form, Input, Select, Space, Typography, message } from "antd";
import {
  ArrowLeftOutlined,
  BankOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../store/authStore";
import type { RegisterRequest, UserRole } from "../../types";
import AuthRouteTransition from "../../components/AuthRouteTransition";
import BrandLogo from "../../components/BrandLogo";
import Stepper, { Step } from "../../components/Stepper";

const { Title, Text } = Typography;

type RegisterField = keyof RegisterRequest;
type RegisterableRole = Exclude<UserRole, "government">;

const ROLE_META: Record<
  RegisterableRole,
  {
    title: string;
    shortTitle: string;
    icon: ReactNode;
  }
> = {
  enterprise: {
    title: "企业注册",
    shortTitle: "企业",
    icon: <TeamOutlined />,
  },
  carrier: {
    title: "载体注册",
    shortTitle: "载体",
    icon: <BankOutlined />,
  },
};

const ROLE_FIELDS: Record<RegisterableRole, RegisterField[]> = {
  enterprise: ["enterprise_name", "enterprise_credit_code", "enterprise_industry", "enterprise_scale", "enterprise_address"],
  carrier: ["carrier_name", "carrier_type", "carrier_area"],
};

const ALL_ROLE_FIELDS = Array.from(new Set(Object.values(ROLE_FIELDS).flat()));

const STEP_LABELS = ["选择身份", "账号信息", "主体资料", "确认提交"];

function getSubjectName(role: RegisterableRole, values: Partial<RegisterRequest>) {
  if (role === "enterprise") return values.enterprise_name;
  return values.carrier_name;
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<RegisterableRole>("enterprise");
  const [routeTransitioning, setRouteTransitioning] = useState(false);
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [form] = Form.useForm<RegisterRequest>();
  const [formValues, setFormValues] = useState<Partial<RegisterRequest>>({});
  const roleInfo = ROLE_META[role];

  const summaryItems = useMemo(
    () => [
      { label: "注册身份", value: roleInfo.title },
      { label: "登录手机号", value: formValues.phone || "待填写" },
      { label: "主体名称", value: getSubjectName(role, formValues) || "待填写" },
      { label: "联系邮箱", value: formValues.email || "待填写" },
    ],
    [role, roleInfo.title, formValues],
  );

  const onFinish = async (values: RegisterRequest) => {
    setLoading(true);
    try {
      await register({ ...values, role });
      message.success("注册成功");
      navigate("/dashboard");
    } catch (err) {
      message.error((err as Error).message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  const validateBeforeNext = async (step: number) => {
    let fields: RegisterField[];
    if (step === 2) {
      fields = ["phone", "email", "password"];
    } else if (step === 3) {
      fields = ROLE_FIELDS[role];
    } else if (step === 4) {
      fields = ["phone", "password", ...ROLE_FIELDS[role]];
    } else {
      fields = [];
    }
    if (!fields.length) return true;
    try {
      await form.validateFields(fields);
      setFormValues(form.getFieldsValue(true) as Partial<RegisterRequest>);
      return true;
    } catch {
      message.warning("请先完善当前步骤的信息");
      return false;
    }
  };

  const changeRole = (nextRole: RegisterableRole) => {
    setRole(nextRole);
    form.resetFields(ALL_ROLE_FIELDS);
    setFormValues(form.getFieldsValue(true) as Partial<RegisterRequest>);
  };

  const goLogin = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setRouteTransitioning(true);
    window.setTimeout(() => navigate("/login"), 520);
  };

  return (
    <div className="auth-register-page">
      <AuthRouteTransition active={routeTransitioning} />
      <Link className="auth-home-link" to="/">
        <ArrowLeftOutlined />
        <span>返回首页</span>
      </Link>
      <section className="auth-register-aside">
        <div className="gov-login-brand">
          <span className="gov-login-brand-mark">
            <BrandLogo />
          </span>
          <span>创新创业孵化载体管理平台</span>
        </div>
        <div className="auth-register-copy">
          <Title level={1}>注册创新孵化 ID，成为平台实名用户</Title>
          <p>按主体身份完成账号与基础资料登记，即可进入入驻管理、政策申报、绩效考核与多端审核业务。</p>
        </div>
      </section>

      <main className="auth-register-panel">
        <Card className="auth-register-card" variant="borderless">
          <Space orientation="vertical" size={2} style={{ width: "100%" }}>
            <Text strong className="register-section-kicker">
              主体注册
            </Text>
            <Title level={2} style={{ margin: 0 }}>
              创建实名账号
            </Title>
          </Space>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onValuesChange={() => setFormValues(form.getFieldsValue(true) as Partial<RegisterRequest>)}
            requiredMark={false}
          >
            <Stepper
              labels={STEP_LABELS}
              initialStep={1}
              beforeNext={validateBeforeNext}
              onFinalStepCompleted={() => form.submit()}
              backButtonText="上一步"
              nextButtonText="下一步"
              finalButtonText="提交注册"
              loading={loading}
            >
              <Step>
                <div className="register-step-heading">
                  <span>01</span>
                  <div>
                    <h3>选择注册主体</h3>
                  </div>
                </div>
                <div className="register-role-grid">
                  {(Object.keys(ROLE_META) as RegisterableRole[]).map((itemRole) => {
                    const item = ROLE_META[itemRole];
                    return (
                      <Button
                        key={itemRole}
                        className={`register-role-card ${role === itemRole ? "is-active" : ""}`}
                        type={role === itemRole ? "primary" : "default"}
                        icon={item.icon}
                        onClick={() => changeRole(itemRole)}
                      >
                        <strong>{item.title}</strong>
                      </Button>
                    );
                  })}
                </div>
              </Step>

              <Step>
                <div className="register-step-heading">
                  <span>02</span>
                  <div>
                    <h3>设置登录账号</h3>
                  </div>
                </div>
                <Form.Item
                  name="phone"
                  label="手机号"
                  rules={[
                    { required: true, message: "请输入手机号" },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        if (!/^1[3-9]\d{9}$/.test(value)) {
                          return Promise.reject(new Error("手机号错误"));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input prefix={<PhoneOutlined />} placeholder="请输入 11 位手机号" size="large" maxLength={11} />
                </Form.Item>
                <Form.Item name="email" label="邮箱" rules={[{ type: "email", message: "请输入正确的邮箱地址" }]}>
                  <Input prefix={<MailOutlined />} placeholder="请输入邮箱" size="large" />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="密码"
                  rules={[
                    { required: true, message: "请输入密码" },
                    { min: 6, message: "密码至少 6 位" },
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="请输入至少 6 位密码" size="large" />
                </Form.Item>
              </Step>

              <Step>
                <div className="register-step-heading">
                  <span>03</span>
                  <div>
                    <h3>完善{roleInfo.shortTitle}资料</h3>
                  </div>
                </div>

                {role === "enterprise" ? (
                  <div className="register-form-grid">
                    <Form.Item name="enterprise_name" label="企业名称" rules={[{ required: true, message: "请输入企业名称" }]}>
                      <Input prefix={<BankOutlined />} placeholder="请输入企业名称" size="large" />
                    </Form.Item>
                    <Form.Item
                      name="enterprise_credit_code"
                      label="统一社会信用代码"
                      rules={[
                        { required: true, message: "请输入统一社会信用代码" },
                        { len: 18, message: "统一社会信用代码必须为 18 位" },
                        {
                          pattern: /^[0-9A-Z]{18}$/,
                          message: "由 18 位数字或大写字母组成",
                        },
                      ]}
                    >
                      <Input
                        prefix={<IdcardOutlined />}
                        placeholder="请输入 18 位统一社会信用代码"
                        size="large"
                        maxLength={18}
                      />
                    </Form.Item>
                    <Form.Item name="enterprise_industry" label="所属行业" rules={[{ required: true, message: "请输入所属行业" }]}>
                      <Input prefix={<TeamOutlined />} placeholder="如：信息技术、生物医药" size="large" />
                    </Form.Item>
                    <Form.Item name="enterprise_scale" label="企业规模">
                      <Select
                        size="large"
                        placeholder="请选择企业规模"
                        options={["大型", "中型", "小型", "微型"].map((item) => ({ label: item, value: item }))}
                      />
                    </Form.Item>
                    <Form.Item className="register-form-span" name="enterprise_address" label="企业地址">
                      <Input prefix={<EnvironmentOutlined />} placeholder="请输入企业地址" size="large" />
                    </Form.Item>
                  </div>
                ) : (
                  <>
                    <Form.Item name="carrier_name" label="载体名称" rules={[{ required: true, message: "请输入载体名称" }]}>
                      <Input prefix={<BankOutlined />} placeholder="请输入载体名称" size="large" />
                    </Form.Item>
                    <Form.Item name="carrier_type" label="载体类型" rules={[{ required: true, message: "请选择载体类型" }]}>
                      <Select
                        size="large"
                        placeholder="请选择载体类型"
                        options={["众创空间", "科技企业孵化器", "大学科技园", "加速器"].map((item) => ({
                          label: item,
                          value: item,
                        }))}
                      />
                    </Form.Item>
                    <Form.Item name="carrier_area" label="所在区域" rules={[{ required: true, message: "请输入所在区域" }]}>
                      <Input prefix={<EnvironmentOutlined />} placeholder="请输入所在区域" size="large" />
                    </Form.Item>
                  </>
                )}
              </Step>

              <Step>
                <div className="register-step-heading">
                  <span>04</span>
                  <div>
                    <h3>确认注册信息</h3>
                  </div>
                </div>
                <div className="register-summary-panel">
                  {summaryItems.map((item) => (
                    <div key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </Step>
            </Stepper>
          </Form>

          <div className="auth-register-login">
            <Link to="/login" onClick={goLogin}>
              已有账号？立即登录
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
