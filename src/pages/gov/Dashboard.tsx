import { Card, Row, Col, Typography, Statistic } from "antd";
import {
  TeamOutlined,
  BankOutlined,
  FileProtectOutlined,
  BellOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export default function GovDashboard() {
  return (
    <div>
      <Title level={3}>政务工作台</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="企业总数"
              value={0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="载体总数"
              value={0}
              prefix={<BankOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待审核申报"
              value={0}
              suffix="条"
              prefix={<FileProtectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="未读通知"
              value={0}
              suffix="条"
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
      </Row>
      <Card style={{ marginTop: 16 }}>
        <Title level={5}>快捷入口</Title>
        <p>后续将添加企业查询、载体查询、政策发布、申报审核等快捷操作入口。</p>
      </Card>
    </div>
  );
}