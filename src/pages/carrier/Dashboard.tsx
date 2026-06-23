import { Card, Row, Col, Typography, Statistic } from "antd";
import {
  AuditOutlined,
  HomeOutlined,
  TrophyOutlined,
  BellOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export default function CarrierDashboard() {
  return (
    <div>
      <Title level={3}>载体工作台</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待审核入驻"
              value={0}
              suffix="条"
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待审核变更"
              value={0}
              suffix="条"
              prefix={<AuditOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="绩效考核"
              value={0}
              suffix="项"
              prefix={<TrophyOutlined />}
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
        <p>后续将添加入驻审核、变更审核、政策申报等快捷操作入口。</p>
      </Card>
    </div>
  );
}