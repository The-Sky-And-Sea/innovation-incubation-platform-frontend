import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Select,
  message,
  Space,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../store/authStore";
import type { LoginRequest } from "../../types";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    try {
      await login(values.credential, values.password, values.role);
      message.success("登录成功");
      navigate("/dashboard");
    } catch (err) {
      message.error((err as Error).message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Card style={{ width: 440, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
        <Space
          direction="vertical"
          size="middle"
          style={{ width: "100%", textAlign: "center" }}
        >
          <Title level={2} style={{ marginBottom: 0 }}>
            创新创业孵化管理平台
          </Title>
          <Text type="secondary">企业/载体/政务 统一登录入口</Text>
        </Space>

        <Form<LoginRequest>
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ role: "enterprise" }}
          style={{ marginTop: 32 }}
        >
          {/* 角色选择 */}
          <Form.Item name="role" label="登录身份">
            <Select
              size="large"
              options={[
                { label: "🏢 企业端", value: "enterprise" },
                { label: "🏭 载体端", value: "carrier" },
                { label: "🏛 政务端", value: "government" },
              ]}
            />
          </Form.Item>

          {/* 凭据 */}
          <Form.Item
            name="credential"
            label="凭据（企业填信用代码，载体/政务填手机号）"
            rules={[{ required: true, message: "请输入凭据" }]}
          >
            <Input
              size="large"
              prefix={<UserOutlined />}
              placeholder="信用代码 / 手机号"
            />
          </Form.Item>

          {/* 密码 */}
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              icon={<LoginOutlined />}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center" }}>
          <Link to="/register">还没有账号？立即注册</Link>
        </div>
      </Card>
    </div>
  );
}