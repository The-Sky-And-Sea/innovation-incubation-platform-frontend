import { Button, Card, Col, Progress, Row, Space, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import {
  AuditOutlined,
  BellOutlined,
  HomeOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import CountUp from "../../components/react-bits/CountUp";
import SpotlightCard from "../../components/react-bits/SpotlightCard";

const { Text } = Typography;
const statSpotlightColor = "rgba(11, 117, 104, 0.16)";

const stats = [
  { title: "入驻审核", value: 6, suffix: "条", label: "2 条今日到期", icon: <HomeOutlined />, tone: "warning" },
  { title: "变更审核", value: 3, suffix: "条", label: "等待处理", icon: <AuditOutlined />, tone: "info" },
  { title: "绩效考核", value: 1, suffix: "项", label: "年度考核进行中", icon: <TrophyOutlined />, tone: "success" },
  { title: "未读通知", value: 4, suffix: "条", label: "请及时响应", icon: <BellOutlined />, tone: "info" },
];

const tasks = [
  { title: "审核企业入驻申请", path: "/carrier/incubation", status: "优先处理" },
  { title: "复核重大事项变更", path: "/carrier/changes", status: "待审核" },
  { title: "提交年度绩效材料", path: "/carrier/performances", status: "进行中" },
];

export default function CarrierDashboard() {
  const navigate = useNavigate();

  return (
    <div className="role-dashboard role-dashboard-carrier">
      <section className="role-hero">
        <div>
          <Space wrap>
            <Tag color="green" icon={<SafetyCertificateOutlined />}>
              载体端
            </Tag>
            <Text>入驻审核、政策初审、绩效提交协同办理</Text>
          </Space>
          <h1>把载体运营中的审核、材料和绩效任务集中处理</h1>
          <p>快速识别临期审核任务，保持企业入驻、变更、政策申报和绩效填报流转顺畅。</p>
          <div className="hero-action-row">
            <Button type="primary" icon={<AuditOutlined />} onClick={() => navigate("/carrier/incubation")}>
              开始审核
            </Button>
            <Button icon={<SettingOutlined />} onClick={() => navigate("/carrier/info")}>
              维护信息
            </Button>
          </div>
        </div>
        <div className="role-hero-panel">
          <Text>审核响应率</Text>
          <Progress percent={82} strokeColor="#0b7568" />
          <small>本周平均响应 4.8 小时，优于平台均值</small>
        </div>
      </section>

      <Row gutter={[16, 16]}>
        {stats.map((item, index) => (
          <Col xs={24} sm={12} lg={6} key={item.title}>
            <SpotlightCard
              className={`role-stat-card role-stat-${item.tone}`}
              spotlightColor={statSpotlightColor}
              style={{ animationDelay: `${index * 70}ms` }}
            >
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
          <Card className="role-section-card" variant="borderless" title="待处理队列">
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
          <Card className="role-section-card" variant="borderless" title="运营态势">
            <div className="role-progress-stack">
              <div><span>入驻审核</span><Progress percent={74} showInfo={false} /></div>
              <div><span>政策初审</span><Progress percent={58} showInfo={false} /></div>
              <div><span>绩效填报</span><Progress percent={82} showInfo={false} /></div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
