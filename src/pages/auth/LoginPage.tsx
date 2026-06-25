import { useState, type ReactNode } from "react";
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
    color: "#9a5b12",
    bgColor: "#fff1dc",
  },
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("government");
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [form] = Form.useForm<LoginRequest>();

  const roleConfig = ROLE_CONFIG[selectedRole];

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    try {
      await login(values.credential, values.password, selectedRole);
      message.success("登录成功");
      navigate("/dashboard");
    } catch (err) {
      message.error((err as Error).message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gov-login-page">
      <section className="gov-login-visual" aria-label="平台介绍">
        <div className="gov-login-brand">
          <span className="gov-login-brand-mark">孵</span>
          <span>创新创业孵化载体管理平台</span>
        </div>

        <div className="gov-login-copy">
          <Title level={1}>面向政企协同的孵化载体治理工作台</Title>
          <p>聚合企业入驻、政策兑现、绩效考核与多级审核流程，让政务人员在同一入口完成监督、流转和跟踪。</p>
        </div>

      </section>

      <main className="gov-login-panel">
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
                    aria-pressed={isActive}
                    style={{
                      borderColor: isActive ? cfg.color : "#dbe4ee",
                      backgroundColor: isActive ? cfg.bgColor : "#ffffff",
                      color: isActive ? cfg.color : "#475569",
                    }}
                    onClick={() => {
                      setSelectedRole(key);
                      form.setFieldsValue({ credential: "", password: "" });
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
            <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
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
              <Link to="/register" style={{ color: "#14508c", fontSize: 13 }}>
                还没有账号？立即注册
              </Link>
            </div>
          </Space>
        </Card>
      </main>
    </div>
  );
}
