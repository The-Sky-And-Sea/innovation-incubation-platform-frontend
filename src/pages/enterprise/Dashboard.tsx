import { Card, Row, Col, Typography, Statistic } from "antd";
import {
  HomeOutlined,
  FileTextOutlined,
  FormOutlined,
  BellOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export default function EnterpriseDashboard() {
  return (
    <div>
      <Title level={3}>企业工作台</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="入驻状态"
              value="待提交"
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="我的变更"
              value={0}
              suffix="条"
              prefix={<FormOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="政策申报"
              value={0}
              suffix="条"
              prefix={<FileTextOutlined />}
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
        <p>后续将添加入驻申请、政策浏览、变更申请等快捷操作入口。</p>
      </Card>
    </div>
  );
}