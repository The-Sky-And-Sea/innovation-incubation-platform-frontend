import { useState } from "react";
import { Alert, Button, Card, Empty, Form, InputNumber, List, Space, Tag, Typography, message } from "antd";
import { CheckCircleOutlined, HomeOutlined } from "@ant-design/icons";
import { govCompleteIncubation } from "../../api/gov";

const { Title, Text } = Typography;

interface CompletionLog {
  id: number;
  completed_at: string;
}

export default function GovIncubationCompletion() {
  const [form] = Form.useForm<{ id: number }>();
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState<CompletionLog[]>([]);

  const handleComplete = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await govCompleteIncubation(values.id);
      setLogs((prev) => [{ id: values.id, completed_at: new Date().toISOString() }, ...prev]);
      form.resetFields();
      message.success("孵化毕业已确认");
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error((err as Error).message || "操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Title level={3}>
        <HomeOutlined style={{ marginRight: 8 }} />
        孵化毕业确认
      </Title>
      <Alert
        message="对已完成孵化周期的入孵记录进行毕业确认。真实联调时将调用 POST /gov/incubations/:id/complete。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card title="完成孵化">
        <Form form={form} layout="inline" onFinish={handleComplete}>
          <Form.Item name="id" label="入孵记录编号" rules={[{ required: true, message: "请输入入孵记录编号" }]}>
            <InputNumber min={1} style={{ width: 220 }} placeholder="如 201" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />} loading={submitting}>
              确认毕业
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="本次操作记录" style={{ marginTop: 16 }}>
        {logs.length === 0 ? (
          <Empty description="暂无确认记录" />
        ) : (
          <List
            dataSource={logs}
            renderItem={(item) => (
              <List.Item>
                <Space>
                  <Tag color="success">已完成</Tag>
                  <Text>入孵记录 #{item.id}</Text>
                  <Text type="secondary">{new Date(item.completed_at).toLocaleString("zh-CN")}</Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
