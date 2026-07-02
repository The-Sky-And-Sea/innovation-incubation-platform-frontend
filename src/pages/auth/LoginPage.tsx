import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, ConfigProvider, Form, Input, Space, Typography, message } from "antd";
import {
  BankOutlined,
  CheckCircleOutlined,
  LockOutlined,
  LoginOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../store/authStore";
import type { LoginRequest, UserRole } from "../../types";
import AuthRouteTransition from "../../components/AuthRouteTransition";
import BrandLogo from "../../components/BrandLogo";

const { Title, Text } = Typography;

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; description: string; icon: ReactNode; color: string; bgColor: string }
> = {
  enterprise: {
    label: "企业端",
    description: "企业申报与材料管理",
    icon: <TeamOutlined />,
    color: "#14508c",
    bgColor: "#e6f0fa",
  },
  carrier: {
    label: "载体端",
    description: "载体审核与绩效填报",
    icon: <BankOutlined />,
    color: "#0b7568",
    bgColor: "#e4f5f2",
  },
  government: {
    label: "政务端",
    description: "政策发布与监督审核",
    icon: <SafetyCertificateOutlined />,
    color: "#b83246",
    bgColor: "#fdebed",
  },
};

const DEMO_LOGIN: Partial<Record<UserRole, Pick<LoginRequest, "credential" | "password">>> = {
  government: {
    credential: "1",
    password: "111111",
  },
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("enterprise");
  const [routeTransitioning, setRouteTransitioning] = useState(false);
  const [authError, setAuthError] = useState("");
  const routeTimerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [form] = Form.useForm<LoginRequest>();

  const roleConfig = ROLE_CONFIG[selectedRole];

  useEffect(() => {
    return () => {
      if (routeTimerRef.current) {
        window.clearTimeout(routeTimerRef.current);
      }
    };
  }, []);

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    setAuthError("");
    try {
      await login(values.credential, values.password, selectedRole);
      message.success("登录成功");
      // 延迟跳转，让用户看到成功提示
      setRouteTransitioning(true);
      routeTimerRef.current = window.setTimeout(() => navigate("/dashboard"), 300);
    } catch (err) {
      const errorMessage = (err as Error).message || "";
      setAuthError(
        errorMessage.includes("不能为空") || errorMessage.includes("至少")
          ? errorMessage
          : "账号或密码错误，请重新输入。",
      );
    } finally {
      setLoading(false);
    }
  };

  const goRegister = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setAuthError("");
    setRouteTransitioning(true);
    routeTimerRef.current = window.setTimeout(() => navigate("/register"), 520);
  };

  return (
    <div className="gov-login-page" data-selected-role={selectedRole}>
      <div className="gov-login-floaters" aria-hidden="true">
        <span className="login-floater login-floater-panel login-floater-panel-top" />
        <span className="login-floater login-floater-disk login-floater-disk-large" />
        <span className="login-floater login-floater-disk login-floater-disk-mid" />
        <span className="login-floater login-floater-disk login-floater-disk-small" />
      </div>
      <AuthRouteTransition active={routeTransitioning} />

      <div className="gov-login-brand-corner" aria-label="平台品牌">
        <span className="login-corner-mark">
          <BrandLogo />
        </span>
        <span className="login-corner-title">创新创业孵化载体管理平台</span>
      </div>

      <section className="gov-login-visual" aria-label="平台介绍">
        <div className="gov-login-copy">
          <Title level={1}>注册创新孵化 ID，成为平台实名用户</Title>
          <p>即可同步开通入驻管理、政策申报、绩效考核与多端审核业务。</p>
          <span>企业服务平台、载体协同平台、政策兑现平台、数据开放平台</span>
          <a href="#login-panel">了解更多 →</a>
        </div>
      </section>

      <main className="gov-login-panel" id="login-panel">
        <Card className="gov-login-card" variant="borderless">
          <Space orientation="vertical" size={2} style={{ width: "100%" }}>
            <Text strong style={{ color: "#14508c" }}>
              统一身份认证
            </Text>
            <Title level={2} style={{ margin: 0, color: "#10243e" }}>
              登录平台
            </Title>
            <Text style={{ color: "#65758b" }}>请选择角色后输入账号信息，Mock 环境任意账号可登录。</Text>
          </Space>

          <div className="login-role-grid" role="tablist" aria-label="选择登录角色">
            {(Object.entries(ROLE_CONFIG) as [UserRole, (typeof ROLE_CONFIG)["enterprise"]][]).map(
              ([key, cfg]) => {
                const isActive = selectedRole === key;
                return (
                  <Button
                    key={key}
                    className="login-role-button"
                    data-role={key}
                    aria-pressed={isActive}
                    style={{
                      borderColor: isActive ? cfg.color : "#dbe4ee",
                      backgroundColor: isActive ? cfg.bgColor : "#ffffff",
                      color: isActive ? cfg.color : "#475569",
                    }}
                    onClick={() => {
                      setSelectedRole(key);
                      setAuthError("");
                      form.setFieldsValue(DEMO_LOGIN[key] || { credential: "", password: "" });
                    }}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </Button>
                );
              },
            )}
          </div>

          <ConfigProvider
            theme={{
              token: {
                colorPrimary: roleConfig.color,
                borderRadius: 8,
                controlHeight: 44,
              },
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              onValuesChange={() => {
                if (authError) setAuthError("");
              }}
              requiredMark={false}
            >
              <Form.Item
                name="credential"
                label={selectedRole === "enterprise" ? "统一社会信用代码" : "登录账号"}
                rules={[{ required: true, message: "请输入登录账号" }]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined style={{ color: "#7b8da3" }} />}
                  placeholder={selectedRole === "enterprise" ? "请输入统一社会信用代码" : "请输入手机号或账号"}
                />
              </Form.Item>

              <Form.Item name="password" label="密码" rules={[{ required: true, message: "请输入密码" }]}>
                <Input.Password
                  size="large"
                  prefix={<LockOutlined style={{ color: "#7b8da3" }} />}
                  placeholder="请输入 6 位以上密码"
                />
              </Form.Item>

              {authError ? (
                <div className="login-auth-error" role="alert">
                  {authError}
                </div>
              ) : null}

              <Form.Item style={{ marginBottom: 14 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                  icon={<LoginOutlined />}
                  style={{ height: 46, fontWeight: 600 }}
                >
                  登录{roleConfig.label}
                </Button>
              </Form.Item>
            </Form>
          </ConfigProvider>

          <Space orientation="vertical" size={10} style={{ width: "100%" }}>
            <Text style={{ color: "#65758b", fontSize: 13 }}>
              <CheckCircleOutlined style={{ color: "#0b7568", marginRight: 6 }} />
              已启用角色隔离、审核流转与通知追踪。
            </Text>
            <div style={{ textAlign: "center" }}>
              <Link to="/register" onClick={goRegister} style={{ color: "#14508c", fontSize: 13 }}>
                还没有账号？立即注册
              </Link>
            </div>
          </Space>
        </Card>
      </main>
    </div>
  );
}
