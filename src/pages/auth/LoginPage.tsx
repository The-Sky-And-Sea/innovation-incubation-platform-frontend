import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Card, Typography, message, ConfigProvider } from "antd";
import { UserOutlined, LockOutlined, LoginOutlined, RocketOutlined } from "@ant-design/icons";
import { useAuthStore } from "../../store/authStore";
import type { LoginRequest, UserRole } from "../../types";

const { Title, Text } = Typography;

const ROLE_CONFIG: Record<UserRole, { label: string; emoji: string; color: string; bgColor: string }> = {
  enterprise: { label: "企业端", emoji: "🏢", color: "#1B4FD8", bgColor: "#EEF2FF" },
  carrier: { label: "载体端", emoji: "🏭", color: "#0D9488", bgColor: "#E6FFFA" },
  government: { label: "政务端", emoji: "🏛️", color: "#D97706", bgColor: "#FFF7ED" },
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("enterprise");
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [form] = Form.useForm<LoginRequest>();

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

  const roleConfig = ROLE_CONFIG[selectedRole];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f3f8",
        padding: 24,
      }}
    >
      <Card
        style={{
          width: 480,
          boxShadow: "0 8px 40px rgba(15, 23, 41, 0.12)",
          borderRadius: 16,
          border: "none",
        }}
        styles={{ body: { padding: 40 } }}
      >
        {/* Logo 区 */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: roleConfig.bgColor,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              marginBottom: 16,
            }}
          >
            <RocketOutlined style={{ color: roleConfig.color }} />
          </div>
          <Title level={2} style={{ marginBottom: 4, color: "#0F1729" }}>
            创新创业孵化管理平台
          </Title>
          <Text style={{ color: "#5A6B8A", fontSize: 14 }}>
            企业 · 载体 · 政务 统一管理入口
          </Text>
        </div>

        {/* 角色选择 */}
        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG["enterprise"]][]).map(
            ([key, cfg]) => {
              const isActive = selectedRole === key;
              return (
                <Button
                  key={key}
                  block
                  size="large"
                  style={{
                    height: 48,
                    borderRadius: 10,
                    fontWeight: isActive ? 600 : 400,
                    borderColor: isActive ? cfg.color : "#E2E8F0",
                    backgroundColor: isActive ? cfg.bgColor : "#FFFFFF",
                    color: isActive ? cfg.color : "#5A6B8A",
                    boxShadow: isActive ? `0 0 0 2px ${cfg.color}20` : "none",
                  }}
                  onClick={() => {
                    setSelectedRole(key);
                    form.setFieldsValue({ credential: "", password: "" });
                  }}
                >
                  {cfg.emoji} {cfg.label}
                </Button>
              );
            },
          )}
        </div>

        {/* 登录表单 */}
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: roleConfig.color,
              borderRadius: 10,
              controlHeight: 46,
            },
          }}
        >
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="credential"
              rules={[{ required: true, message: "请输入凭据" }]}
            >
              <Input
                size="large"
                prefix={<UserOutlined style={{ color: "#94A3B8" }} />}
                placeholder={
                  selectedRole === "enterprise"
                    ? "统一社会信用代码"
                    : "手机号"
                }
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined style={{ color: "#94A3B8" }} />}
                placeholder="请输入密码"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                icon={<LoginOutlined />}
                style={{
                  height: 48,
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 600,
                  background: roleConfig.color,
                  borderColor: roleConfig.color,
                  boxShadow: `0 4px 14px ${roleConfig.color}40`,
                }}
              >
                登 录
              </Button>
            </Form.Item>
          </Form>
        </ConfigProvider>

        <div style={{ textAlign: "center" }}>
          <Link
            to="/register"
            style={{ color: "#5A6B8A", fontSize: 13 }}
          >
            还没有账号？立即注册
          </Link>
        </div>
      </Card>
    </div>
  );
}