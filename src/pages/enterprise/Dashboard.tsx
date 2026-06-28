import { Button, Card, Col, Progress, Row, Space, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import {
  BankOutlined,
  BellOutlined,
  FileTextOutlined,
  FormOutlined,
  HomeOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import CountUp from "../../components/react-bits/CountUp";
import SpotlightCard from "../../components/react-bits/SpotlightCard";

const { Text } = Typography;

const stats = [
  { title: "入驻状态", value: 1, suffix: "项", label: "待提交材料", icon: <HomeOutlined />, tone: "warning" },
  { title: "变更申请", value: 2, suffix: "条", label: "1 条审核中", icon: <FormOutlined />, tone: "info" },
  { title: "政策申报", value: 5, suffix: "条", label: "2 条可继续完善", icon: <FileTextOutlined />, tone: "success" },
  { title: "未读通知", value: 3, suffix: "条", label: "实时提醒", icon: <BellOutlined />, tone: "info" },
];

const tasks = [
  { title: "完善企业基础资料", path: "/enterprise/info", status: "建议优先" },
  { title: "上传入驻协议文件", path: "/enterprise/files", status: "待处理" },
  { title: "查看可申报政策", path: "/enterprise/policies", status: "可办理" },
];

export default function EnterpriseDashboard() {
  const navigate = useNavigate();

  return (
    <div className="role-dashboard role-dashboard-enterprise">
      <section className="role-hero">
        <div>
          <Space wrap>
            <Tag color="blue" icon={<SafetyCertificateOutlined />}>
              企业端
            </Tag>
            <Text>入驻、文件、政策申报统一办理</Text>
          </Space>
          <h1>把企业材料、申报记录和政策机会放在同一个工作台</h1>
          <p>优先完善基础信息与文件材料，随后查看载体和政策机会，持续跟踪审核进度。</p>
          <div className="hero-action-row">
            <Button type="primary" icon={<UploadOutlined />} onClick={() => navigate("/enterprise/files")}>
              上传材料
            </Button>
            <Button icon={<BankOutlined />} onClick={() => navigate("/enterprise/carriers")}>
              浏览载体
            </Button>
          </div>
        </div>
        <div className="role-hero-panel">
          <Text>资料完整度</Text>
          <Progress percent={68} strokeColor="#14508c" />
          <small>补齐企业地址、联系人和协议文件后可提升办理效率</small>
        </div>
      </section>

      <Row gutter={[16, 16]}>
        {stats.map((item, index) => (
          <Col xs={24} sm={12} lg={6} key={item.title}>
            <SpotlightCard className={`role-stat-card role-stat-${item.tone}`} style={{ animationDelay: `${index * 70}ms` }}>
              <span className="role-stat-icon">{item.icon}</span>
              <Text>{item.title}</Text>
              <strong>
                <CountUp to={item.value} />
                <span>{item.suffix}</span>
              </strong>
              <small>{item.label}</small>
            </SpotlightCard>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card className="role-section-card" variant="borderless" title="今日建议">
            <div className="role-task-list">
              {tasks.map((item) => (
                <button key={item.title} type="button" onClick={() => navigate(item.path)}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.status}</small>
                  </span>
                  <RightOutlined />
                </button>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="role-section-card" variant="borderless" title="申报进度">
            <div className="role-progress-stack">
              <div><span>材料准备</span><Progress percent={68} showInfo={false} /></div>
              <div><span>载体对接</span><Progress percent={42} showInfo={false} /></div>
              <div><span>政策匹配</span><Progress percent={55} showInfo={false} /></div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
