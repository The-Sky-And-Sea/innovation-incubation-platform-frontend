import { useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Divider, Form, Input, Select, Space, Typography, message } from "antd";
import {
  BankOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../store/authStore";
import type { RegisterRequest, UserRole } from "../../types";
import AuthRouteTransition from "../../components/AuthRouteTransition";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>("enterprise");
  const [routeTransitioning, setRouteTransitioning] = useState(false);
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

  const goLogin = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setRouteTransitioning(true);
    window.setTimeout(() => navigate("/login"), 520);
  };

  return (
    <div className="auth-register-page">
      <AuthRouteTransition active={routeTransitioning} />
      <section className="auth-register-aside">
        <div className="gov-login-brand">
          <span className="gov-login-brand-mark">孵</span>
          <span>创新创业孵化载体管理平台</span>
        </div>
        <div className="auth-register-copy">
          <Title level={1}>建立可信主体档案，接入全流程协同服务</Title>
          <p>企业、载体和政务人员通过统一入口完成注册，后续进入入驻、政策、文件、审核与绩效等业务流程。</p>
        </div>
      </section>

      <main className="auth-register-panel">
        <Card className="auth-register-card" variant="borderless">
          <Space orientation="vertical" size={2} style={{ width: "100%" }}>
            <Text strong style={{ color: "#14508c" }}>
              主体注册
            </Text>
            <Title level={2} style={{ margin: 0 }}>
              创建账号
            </Title>
            <Text type="secondary">请选择注册主体类型，完善基础信息后进入平台。</Text>
          </Space>

          <div className="register-role-grid">
            <Button
              type={role === "enterprise" ? "primary" : "default"}
              icon={<TeamOutlined />}
              onClick={() => {
                setRole("enterprise");
                form.resetFields();
              }}
            >
              企业注册
            </Button>
            <Button
              type={role === "carrier" ? "primary" : "default"}
              icon={<BankOutlined />}
              onClick={() => {
                setRole("carrier");
                form.resetFields();
              }}
            >
              载体注册
            </Button>
            <Button
              type={role === "government" ? "primary" : "default"}
              icon={<SafetyCertificateOutlined />}
              onClick={() => {
                setRole("government");
                form.resetFields();
              }}
            >
              政务注册
            </Button>
          </div>

          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item name="phone" label="手机号" rules={[{ required: true, message: "请输入手机号" }]}>
              <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" size="large" />
            </Form.Item>

            <Form.Item name="email" label="邮箱">
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

            <Divider plain>
              <SafetyCertificateOutlined /> {role === "enterprise" ? "企业信息" : role === "carrier" ? "载体信息" : "政务信息"}
            </Divider>

            {role === "enterprise" ? (
              <>
                <Form.Item name="enterprise_name" label="企业名称" rules={[{ required: true, message: "请输入企业名称" }]}>
                  <Input prefix={<BankOutlined />} placeholder="请输入企业名称" size="large" />
                </Form.Item>
                <Form.Item
                  name="enterprise_credit_code"
                  label="统一社会信用代码"
                  rules={[{ required: true, message: "请输入统一社会信用代码" }]}
                >
                  <Input prefix={<IdcardOutlined />} placeholder="请输入统一社会信用代码" size="large" />
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
                <Form.Item name="enterprise_address" label="企业地址">
                  <Input prefix={<EnvironmentOutlined />} placeholder="请输入企业地址" size="large" />
                </Form.Item>
              </>
            ) : role === "carrier" ? (
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
            ) : (
              <>
                <Form.Item name="gov_name" label="政务人员姓名" rules={[{ required: true, message: "请输入政务人员姓名" }]}>
                  <Input prefix={<SafetyCertificateOutlined />} placeholder="请输入政务人员姓名" size="large" />
                </Form.Item>
                <Form.Item name="gov_department" label="所属部门" rules={[{ required: true, message: "请输入所属部门" }]}>
                  <Input prefix={<BankOutlined />} placeholder="如：工信科、科技局" size="large" />
                </Form.Item>
              </>
            )}

            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              注册并进入平台
            </Button>
          </Form>

          <div className="auth-register-login">
            <Link to="/login" onClick={goLogin}>已有账号？立即登录</Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
