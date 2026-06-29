import { useState } from "react";
import { Alert, Button, Card, Form, Input, Typography, message } from "antd";
import { UserDeleteOutlined } from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import { submitCarrierDeletion, submitEnterpriseDeletion } from "../api/account";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function AccountDeletionRequestPage() {
  const role = useAuthStore((state) => state.user?.role);
  const [form] = Form.useForm<{ reason: string }>();
  const [submitting, setSubmitting] = useState(false);

  const isCarrier = role === "carrier";

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (isCarrier) {
        await submitCarrierDeletion(values.reason);
      } else {
        await submitEnterpriseDeletion(values.reason);
      }
      message.success("注销申请已提交，等待政务端审核");
      form.resetFields();
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "提交注销申请失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Title level={3}>
        <UserDeleteOutlined style={{ marginRight: 8 }} />
        账号注销申请
      </Title>

      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="提交后将进入政务端审核"
        description="审核通过后账号会被删除，相关业务数据会按后端规则处理。请确认原因填写完整。"
      />

      <Card style={{ maxWidth: 720 }}>
        <Form form={form} layout="vertical">
          <Form.Item label="申请主体">
            <Text strong>{isCarrier ? "载体端" : "企业端"}</Text>
          </Form.Item>
          <Form.Item
            name="reason"
            label="注销原因"
            rules={[{ required: true, message: "请输入注销原因" }]}
          >
            <TextArea rows={5} placeholder="请说明注销原因，例如业务调整、主体停止运营等" />
          </Form.Item>
          <Button
            danger
            type="primary"
            icon={<UserDeleteOutlined />}
            loading={submitting}
            onClick={handleSubmit}
          >
            提交注销申请
          </Button>
        </Form>
      </Card>
    </div>
  );
}
