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
  Divider,
} from "antd";
import {
  LockOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  BankOutlined,
  EnvironmentOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../store/authStore";
import type { RegisterRequest } from "../../types";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"enterprise" | "carrier">("enterprise");
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const [form] = Form.useForm<RegisterRequest>();

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
      <Card style={{ width: 500, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
        <Space
          direction="vertical"
          size="middle"
          style={{ width: "100%", textAlign: "center" }}
        >
          <Title level={2} style={{ marginBottom: 0 }}>
            用户注册
          </Title>
          <Text type="secondary">创新创业孵化管理平台</Text>
        </Space>

        {/* 角色选择 */}
        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          <Button
            type={role === "enterprise" ? "primary" : "default"}
            block
            size="large"
            onClick={() => {
              setRole("enterprise");
              form.resetFields();
            }}
          >
            🏢 企业注册
          </Button>
          <Button
            type={role === "carrier" ? "primary" : "default"}
            block
            size="large"
            onClick={() => {
              setRole("carrier");
              form.resetFields();
            }}
          >
            🏭 载体注册
          </Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ marginTop: 24 }}
        >
          {/* 公共字段 */}
          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ required: true, message: "请输入手机号" }]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="请输入手机号"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱（选填）"
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 6, message: "密码至少6位" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码（至少6位）"
              size="large"
            />
          </Form.Item>

          <Divider />
          <Text type="secondary" style={{ fontSize: 13 }}>
            {role === "enterprise" ? "企业信息" : "载体信息"}
          </Text>

          {/* 企业特有字段 */}
          {role === "enterprise" && (
            <>
              <Form.Item
                name="enterprise_name"
                label="企业名称"
                rules={[{ required: true, message: "请输入企业名称" }]}
                style={{ marginTop: 8 }}
              >
                <Input
                  prefix={<BankOutlined />}
                  placeholder="请输入企业名称"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="enterprise_credit_code"
                label="统一社会信用代码"
                rules={[{ required: true, message: "请输入统一社会信用代码" }]}
              >
                <Input
                  prefix={<IdcardOutlined />}
                  placeholder="请输入统一社会信用代码"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="enterprise_industry"
                label="所属行业"
              >
                <Input
                  prefix={<TeamOutlined />}
                  placeholder="如：信息技术、生物医药"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="enterprise_scale"
                label="企业规模"
              >
                <Select
                  size="large"
                  placeholder="请选择企业规模"
                  options={[
                    { label: "大型", value: "大型" },
                    { label: "中型", value: "中型" },
                    { label: "小型", value: "小型" },
                    { label: "微型", value: "微型" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="enterprise_address"
                label="企业地址"
              >
                <Input
                  prefix={<EnvironmentOutlined />}
                  placeholder="请输入企业地址"
                  size="large"
                />
              </Form.Item>
            </>
          )}

          {/* 载体特有字段 */}
          {role === "carrier" && (
            <>
              <Form.Item
                name="carrier_name"
                label="载体名称"
                rules={[{ required: true, message: "请输入载体名称" }]}
                style={{ marginTop: 8 }}
              >
                <Input
                  prefix={<BankOutlined />}
                  placeholder="请输入载体名称"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="carrier_type"
                label="载体类型"
              >
                <Select
                  size="large"
                  placeholder="请选择载体类型"
                  options={[
                    { label: "众创空间", value: "众创空间" },
                    { label: "科技企业孵化器", value: "科技企业孵化器" },
                    { label: "大学科技园", value: "大学科技园" },
                    { label: "加速器", value: "加速器" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="carrier_area"
                label="所在区域"
              >
                <Input
                  prefix={<EnvironmentOutlined />}
                  placeholder="请输入所在区域"
                  size="large"
                />
              </Form.Item>
            </>
          )}

          <Form.Item style={{ marginTop: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              注 册
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center" }}>
          <Link to="/login">已有账号？立即登录</Link>
        </div>
      </Card>
    </div>
  );
}