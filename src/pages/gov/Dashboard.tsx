import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Drawer, Modal, Progress, Segmented, Space, Tag, Timeline, Typography } from "antd";
import {
  AuditOutlined,
  BankOutlined,
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileProtectOutlined,
  InboxOutlined,
  PlusOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserDeleteOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import CountUp from "../../components/react-bits/CountUp";
import SpotlightCard from "../../components/react-bits/SpotlightCard";

const { Text } = Typography;

interface QueueItem {
  id: string;
  title: string;
  owner: string;
  type: "review" | "risk" | "performance";
  due: string;
  status: string;
  level: "urgent" | "normal" | "watch";
}

const stats = [
  { title: "入驻企业", value: 128, suffix: "家", icon: <TeamOutlined />, trend: "+12 本月" },
  { title: "孵化载体", value: 24, suffix: "个", icon: <BankOutlined />, trend: "覆盖 6 区" },
  { title: "待终审申报", value: 7, suffix: "件", icon: <FileProtectOutlined />, trend: "2 件临近时限" },
  { title: "未读通知", value: 2, suffix: "条", icon: <BellOutlined />, trend: "实时推送" },
];

const queueItems: QueueItem[] = [
  {
    id: "A-701",
    title: "高新技术企业补贴申报终审",
    owner: "测试科技有限公司",
    type: "review",
    due: "今日 17:30",
    status: "载体初审通过",
    level: "urgent",
  },
  {
    id: "P-203",
    title: "年度绩效考核评分确认",
    owner: "天河软件园孵化器",
    type: "performance",
    due: "明日 12:00",
    status: "材料齐全",
    level: "normal",
  },
  {
    id: "D-011",
    title: "企业账号注销业务核验",
    owner: "星火智能装备有限公司",
    type: "risk",
    due: "2 天后",
    status: "存在未完成申报",
    level: "watch",
  },
  {
    id: "A-709",
    title: "创新券政策兑现复核",
    owner: "湾区生物医药科技有限公司",
    type: "review",
    due: "本周五",
    status: "等待政务复核",
    level: "normal",
  },
];

const flowSteps = [
  { label: "企业提交", value: 168, percent: 100 },
  { label: "载体初审", value: 94, percent: 76 },
  { label: "政务终审", value: 51, percent: 42 },
  { label: "完成归档", value: 37, percent: 31 },
];

const riskItems = [
  { label: "政策即将过期", value: "3 项", tone: "warning" },
  { label: "材料退回率偏高", value: "12%", tone: "danger" },
  { label: "载体响应超时", value: "2 个", tone: "watch" },
];

export default function GovDashboard() {
  const [filter, setFilter] = useState<string>("all");
  const [selectedCase, setSelectedCase] = useState<QueueItem | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const navigate = useNavigate();

  const filteredQueue = useMemo(() => {
    if (filter === "all") return queueItems;
    if (filter === "urgent") return queueItems.filter((item) => item.level === "urgent");
    return queueItems.filter((item) => item.type === filter);
  }, [filter]);

  const openCase = (item: QueueItem) => {
    setSelectedCase(item);
    setReviewOpen(true);
  };

  return (
    <div className="gov-dashboard gov-dashboard-pro">
      <section className="gov-command-hero">
        <div className="hero-main-copy">
          <Space size={10} wrap>
            <Tag color="gold" icon={<SafetyCertificateOutlined />}>
              政务端
            </Tag>
            <Text>今天有 7 件待终审、3 项绩效任务、2 条风险提醒</Text>
          </Space>
          <h1>监督、流转、决策，在一个工作空间完成</h1>
          <p>把分散的申报、政策、绩效和账号治理收拢到同一个节奏里，先处理临近时限事项，再跟踪全链路状态。</p>
          <div className="hero-action-row">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/gov/policies")}>
              发布政策
            </Button>
            <Button icon={<InboxOutlined />} onClick={() => navigate("/gov/applications")}>
              处理终审
            </Button>
            <Button icon={<CalendarOutlined />} onClick={() => setScheduleOpen(true)}>
              今日调度
            </Button>
          </div>
        </div>

        <div className="hero-pulse-panel">
          <div className="pulse-ring">
            <Progress type="circle" percent={86} size={118} strokeColor="#c8913a" />
          </div>
          <strong>业务健康度</strong>
          <span>审核时效、退回率、通知响应综合计算</span>
        </div>
      </section>

      <div className="gov-stat-grid">
        {stats.map((item, index) => (
          <div key={item.title}>
            <SpotlightCard
              className="gov-stat-card gov-animate-card"
              spotlightColor="rgba(20, 80, 140, 0.14)"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span className="gov-stat-icon">{item.icon}</span>
              <div className="gov-stat-label">{item.title}</div>
              <div className="gov-stat-number">
                <CountUp to={item.value} />
                <span>{item.suffix}</span>
              </div>
              <Text className="stat-trend">{item.trend}</Text>
            </SpotlightCard>
          </div>
        ))}
      </div>

      <div className="gov-dashboard-grid gov-dashboard-grid-main">
        <div className="gov-dashboard-primary">
          <Card
            className="gov-section-card workbench-card"
            variant="borderless"
            title="待办流转"
            extra={
              <Segmented
                size="small"
                value={filter}
                onChange={(value) => setFilter(String(value))}
                options={[
                  { label: "全部", value: "all" },
                  { label: "紧急", value: "urgent" },
                  { label: "终审", value: "review" },
                  { label: "风险", value: "risk" },
                ]}
              />
            }
          >
            <div className="queue-list">
              {filteredQueue.map((item) => (
                <button key={item.id} className={`queue-item queue-${item.level}`} type="button" onClick={() => openCase(item)}>
                  <span className="queue-badge">{item.id}</span>
                  <span className="queue-copy">
                    <strong>{item.title}</strong>
                    <small>
                      {item.owner} · {item.status}
                    </small>
                  </span>
                  <span className="queue-meta">
                    <Tag color={item.level === "urgent" ? "red" : item.level === "watch" ? "orange" : "blue"}>{item.due}</Tag>
                    <RightOutlined />
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="gov-dashboard-aside">
          <Card className="gov-section-card" variant="borderless" title="风险提示">
            <div className="risk-list">
              {riskItems.map((item) => (
                <div className={`risk-item risk-${item.tone}`} key={item.label}>
                  <WarningOutlined />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="gov-dashboard-grid gov-dashboard-grid-support">
        <div>
          <Card className="gov-section-card flow-card" variant="borderless" title="全链路流转态势">
            <div className="flow-grid">
              {flowSteps.map((step) => (
                <div className="flow-step" key={step.label}>
                  <div className="flow-value">
                    <CountUp to={step.value} />
                  </div>
                  <Text>{step.label}</Text>
                  <div className="flow-bar">
                    <span style={{ width: `${step.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div>
          <Card className="gov-section-card" variant="borderless" title="快捷办理">
            <div className="quick-grid">
              <Button icon={<SearchOutlined />} onClick={() => navigate("/gov/enterprises")}>
                企业查询
              </Button>
              <Button icon={<BankOutlined />} onClick={() => navigate("/gov/carriers")}>
                载体查询
              </Button>
              <Button icon={<TrophyOutlined />} onClick={() => navigate("/gov/performances")}>
                绩效考核
              </Button>
              <Button icon={<UserDeleteOutlined />} onClick={() => navigate("/gov/account")}>
                注销审核
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Drawer title="今日调度" open={scheduleOpen} onClose={() => setScheduleOpen(false)} width={420} className="gov-drawer">
        <Timeline
          items={[
            { color: "green", dot: <CheckCircleOutlined />, children: "09:30 已完成载体材料同步" },
            { color: "blue", dot: <ClockCircleOutlined />, children: "14:00 政策申报终审集中处理" },
            { color: "orange", dot: <ExclamationCircleOutlined />, children: "16:30 核验账号注销关联业务" },
            { color: "gray", dot: <AuditOutlined />, children: "17:30 输出今日审核归档清单" },
          ]}
        />
      </Drawer>

      <Modal
        title={selectedCase?.title || "事项详情"}
        open={reviewOpen}
        onCancel={() => setReviewOpen(false)}
        width={640}
        className="gov-review-modal"
        footer={[
          <Button key="cancel" onClick={() => setReviewOpen(false)}>
            稍后处理
          </Button>,
          <Button key="route" onClick={() => navigate(selectedCase?.type === "performance" ? "/gov/performances" : "/gov/applications")}>
            进入业务页
          </Button>,
          <Button key="primary" type="primary" onClick={() => setReviewOpen(false)}>
            标记已关注
          </Button>,
        ]}
      >
        {selectedCase && (
          <div className="case-detail">
            <div>
              <Text type="secondary">事项编号</Text>
              <strong>{selectedCase.id}</strong>
            </div>
            <div>
              <Text type="secondary">关联主体</Text>
              <strong>{selectedCase.owner}</strong>
            </div>
            <div>
              <Text type="secondary">当前状态</Text>
              <strong>{selectedCase.status}</strong>
            </div>
            <div>
              <Text type="secondary">办理时限</Text>
              <strong>{selectedCase.due}</strong>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
