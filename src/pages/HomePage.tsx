import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRightOutlined,
  AuditOutlined,
  BankOutlined,
  BellOutlined,
  CheckCircleOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  LoginOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import BrandLogo from "../components/BrandLogo";
import AuthRouteTransition from "../components/AuthRouteTransition";

const libraryColumns = [
  {
    title: "主体",
    items: ["企业入驻", "载体审核", "政务终审", "账号治理", "通知中心"],
  },
  {
    title: "事项",
    items: ["材料上传", "政策申报", "变更申请", "绩效填报", "申诉处理"],
  },
  {
    title: "组件",
    items: ["工作台", "搜索", "表单", "队列", "审批流"],
  },
  {
    title: "流程",
    items: ["注册登录", "入驻办理", "政策匹配", "文件归档", "结果通知"],
  },
];

const previewCards = [
  { label: "企业工作台", title: "材料、政策和进度统一办理", tone: "enterprise" },
  { label: "载体审核", title: "把入驻、变更、绩效任务集中处理", tone: "carrier" },
  { label: "政务治理", title: "政策发布、终审流转和风险提醒", tone: "government" },
];

type PatternTab = "页面" | "组件" | "流程" | "材料字段";

const patternScreens: Record<PatternTab, { title: string; meta: string; tone: string; lines: string[] }[]> = {
  页面: [
    { title: "入驻申请", meta: "企业端", tone: "enterprise", lines: ["统一社会信用代码", "载体选择", "协议材料"] },
    { title: "审核队列", meta: "载体端", tone: "carrier", lines: ["待处理 6 条", "变更审核", "绩效考核"] },
    { title: "政策发布", meta: "政务端", tone: "government", lines: ["申报条件", "材料清单", "办理流程"] },
    { title: "智能匹配", meta: "AI 辅助", tone: "ai", lines: ["政策推荐", "材料预填", "依据标注"] },
    { title: "通知中心", meta: "全角色", tone: "notice", lines: ["实时推送", "未读提醒", "处理回执"] },
    { title: "绩效考核", meta: "协同", tone: "score", lines: ["年度模板", "材料提交", "结果归档"] },
  ],
  组件: [
    { title: "工作台", meta: "通用", tone: "enterprise", lines: ["统计卡片", "快捷操作", "进度概览"] },
    { title: "搜索筛选", meta: "通用", tone: "carrier", lines: ["关键词检索", "状态过滤", "角色筛选"] },
    { title: "文件上传", meta: "通用", tone: "government", lines: ["拖拽上传", "格式校验", "上传进度"] },
    { title: "审批流", meta: "通用", tone: "ai", lines: ["审核流转", "意见填写", "驳回/通过"] },
    { title: "表单组件", meta: "通用", tone: "notice", lines: ["动态校验", "下拉联动", "图片上传"] },
    { title: "通知提醒", meta: "通用", tone: "score", lines: ["实时推送", "未读标记", "处理回执"] },
  ],
  流程: [
    { title: "注册登录", meta: "全角色", tone: "enterprise", lines: ["账号创建", "角色选择", "实名认证"] },
    { title: "入驻办理", meta: "企业端", tone: "carrier", lines: ["提交申请", "载体审核", "政务终审"] },
    { title: "政策申报", meta: "企业端", tone: "government", lines: ["政策筛选", "材料上传", "提交审核"] },
    { title: "变更管理", meta: "企业端", tone: "ai", lines: ["变更申请", "材料更新", "审核确认"] },
    { title: "绩效考核", meta: "载体端", tone: "notice", lines: ["模板下发", "数据填报", "结果归档"] },
    { title: "申诉处理", meta: "全角色", tone: "score", lines: ["发起申诉", "材料补交", "审核回复"] },
  ],
  材料字段: [
    { title: "企业信息", meta: "必填", tone: "enterprise", lines: ["统一社会信用代码", "企业名称", "法定代表人"] },
    { title: "载体信息", meta: "必填", tone: "carrier", lines: ["载体名称", "运营主体", "孵化面积"] },
    { title: "政策材料", meta: "申报", tone: "government", lines: ["申报书模板", "财务报表", "知识产权"] },
    { title: "绩效数据", meta: "考核", tone: "ai", lines: ["入驻企业数", "毕业企业数", "营收数据"] },
    { title: "协议文件", meta: "签约", tone: "notice", lines: ["入驻协议", "服务合同", "补充条款"] },
    { title: "审批附件", meta: "审核", tone: "score", lines: ["审核意见书", "现场照片", "签名盖章"] },
  ],
};

const patternTabs: PatternTab[] = ["页面", "组件", "流程", "材料字段"];

const featureCards = [
  {
    title: "按角色保存上下文",
    text: "企业、载体、政务进入同一平台，但看到各自最重要的事项。",
    icon: <TeamOutlined />,
  },
  {
    title: "把流程整理成队列",
    text: "申报、审核、终审和通知都能在工作台里连续处理。",
    icon: <AuditOutlined />,
  },
  {
    title: "材料可复用",
    text: "上传后的文件可在入驻申请、政策申报和绩效填报中引用。",
    icon: <FileDoneOutlined />,
  },
];

const quoteCards = [
  { name: "企业服务专员", role: "申报服务", text: "不用在多个入口之间切换，企业资料、载体对接和政策申报都能沿着同一条线推进。" },
  { name: "孵化载体运营", role: "审核协同", text: "待审核事项能按类型聚合，临期任务和材料缺口一眼就能看到。" },
  { name: "政务审核人员", role: "监督治理", text: "政策发布、申报终审和通知管理放在同一个工作空间，决策链路更清楚。" },
  { name: "项目管理员", role: "联调准备", text: "前端界面已经能完整演示业务路径，后端接入时只需要逐步替换数据源。" },
  { name: "企业用户", role: "材料办理", text: "文件上传后能复用到多个申报场景，减少重复填报。" },
  { name: "平台维护人员", role: "统一入口", text: "登录、注册和三端权限清晰，演示时更容易说明平台价值。" },
];

const marqueeItems = ["企业端", "载体端", "政务端", "入驻申请", "政策申报", "文件管理", "审核流转", "绩效考核", "智能辅助", "通知中心"];

export default function HomePage() {
  const navigate = useNavigate();
  const [routeTransitioning, setRouteTransitioning] = useState(false);
  const [activePatternTab, setActivePatternTab] = useState<PatternTab>("页面");
  const routeTimerRef = useRef<number | null>(null);

  /* 滚动触发浮现动画 */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" },
    );
    const sections = document.querySelectorAll(".reveal-section");
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const smoothScrollTo = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNavClick = (e: React.MouseEvent, selector: string) => {
    e.preventDefault();
    smoothScrollTo(selector);
  };

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setRouteTransitioning(true);
    routeTimerRef.current = window.setTimeout(() => navigate("/login"), 520);
  };

  const currentPatterns = patternScreens[activePatternTab];

  return (
    <div className="public-home-page mobbin-home">
      <AuthRouteTransition active={routeTransitioning} />
      <header className="mobbin-home-nav reveal-nav">
        <Link to="/" className="mobbin-home-brand" aria-label="创新创业孵化载体管理平台首页">
          <BrandLogo />
          <strong>孵化平台</strong>
        </Link>
        <nav aria-label="首页导航">
          <a href="#patterns" onClick={(e) => handleNavClick(e, "#patterns")}>业务库</a>
          <a href="#flows" onClick={(e) => handleNavClick(e, "#flows")}>流程</a>
          <a href="#comments" onClick={(e) => handleNavClick(e, "#comments")}>反馈</a>
          <a href="/login" onClick={handleLoginClick}>登录</a>
          <Link to="/register" className="mobbin-home-join">
            注册
          </Link>
        </nav>
      </header>

      <main>
        <section className="mobbin-hero reveal-section">
          <div className="reveal-heading-wrapper">
            <div className="mobbin-hero-icon" aria-hidden="true">
              <BrandLogo variant="mark" />
            </div>
            <h1 className="reveal-heading">发现真实可用的孵化协同工作台。</h1>
            <p className="reveal-heading">面向企业、载体和政务三端，把入驻、材料、政策、审核与通知流程组织成一个清晰入口。</p>
          </div>
          <div className="reveal-body">
            <div className="mobbin-hero-actions">
            <a href="/login" className="mobbin-primary" onClick={handleLoginClick}>
              进入登录
            </a>
              <Link to="/register" className="mobbin-secondary">
                创建账号
                <ArrowRightOutlined />
              </Link>
            </div>
            <div className="mobbin-trust">
              <span>覆盖核心业务场景</span>
              <strong>企业服务</strong>
              <strong>载体协同</strong>
              <strong>政务治理</strong>
              <strong>数据归档</strong>
            </div>
          </div>
        </section>

        <section className="mobbin-product-stage" id="patterns" aria-label="平台业务库预览">
          <div className="mobbin-library-window">
            <div className="mobbin-window-bar">
              <div className="mobbin-mini-brand">
                <BrandLogo />
              </div>
              <span>Apps</span>
              <span>Services</span>
              <div className="mobbin-window-search">
                <SearchOutlined />
                <em>Search in platform...</em>
              </div>
              <Link to="/login">登录</Link>
            </div>

            <div className="mobbin-library-columns">
              {libraryColumns.map((column) => (
                <div key={column.title}>
                  <span>{column.title}</span>
                  {column.items.map((item) => (
                    <strong key={item}>{item}</strong>
                  ))}
                </div>
              ))}
            </div>

            <div className="mobbin-preview-grid">
              {previewCards.map((card) => (
                <article key={card.label} className={`mobbin-preview-card is-${card.tone}`}>
                  <small>{card.label}</small>
                  <h2>{card.title}</h2>
                  <div>
                    <i />
                    <i />
                    <i />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 大块 1: 一个持续扩展的业务库 */}
        <section className="mobbin-stats reveal-section">
          <div className="mobbin-floating-icon is-enterprise">
            <TeamOutlined />
          </div>
          <div className="mobbin-floating-icon is-carrier">
            <BankOutlined />
          </div>
          <div className="mobbin-floating-icon is-government">
            <SafetyCertificateOutlined />
          </div>
          <div className="mobbin-floating-icon is-file">
            <FileSearchOutlined />
          </div>
          <span className="reveal-heading">一个持续扩展的业务库</span>
          <div className="reveal-body">
            <strong>3 端工作台</strong>
            <strong>18+ 核心页面</strong>
            <em>6 条主流程</em>
          </div>
        </section>

        {/* 大块 2: 几秒钟找到业务模式 */}
        <section className="mobbin-patterns-showcase reveal-section" id="flows">
          <h2 className="reveal-heading">几秒钟找到业务模式。</h2>
          <div className="reveal-body">
            <div className="mobbin-tabs" aria-label="业务模式分类">
              {patternTabs.map((tab) => (
                <span
                  key={tab}
                  className={activePatternTab === tab ? "mobbin-tab-active" : ""}
                  onClick={() => setActivePatternTab(tab)}
                >
                  {tab}
                </span>
              ))}
            </div>
            <div className="mobbin-screen-rail" key={activePatternTab}>
              {currentPatterns.map((screen) => (
                <article key={screen.title} className={`mobbin-phone-card is-${screen.tone} mobbin-card-wave`}>
                  <small>{screen.meta}</small>
                  <h3>{screen.title}</h3>
                  <div>
                    {screen.lines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 大块 3: 探索完整用户旅程 */}
        <section className="mobbin-flow-duo reveal-section">
          <h2 className="reveal-heading">探索完整用户旅程。</h2>
          <div className="reveal-body">
            <div className="mobbin-duo-grid">
              <article>
                <div className="mobbin-video-mock">
                  <span />
                  <strong>企业入驻</strong>
                </div>
                <h3>流程演示</h3>
                <p>从账号创建、材料上传到载体审核，按真实办理顺序展示。</p>
              </article>
              <article>
                <div className="mobbin-prototype-mock">
                  <span>政务端</span>
                  <strong>发布政策</strong>
                  <em>申报条件 → 材料清单 → 结果通知</em>
                </div>
                <h3>交互原型</h3>
                <p>点击登录后进入现有登录页，继续选择角色进入对应工作台。</p>
              </article>
            </div>
          </div>
        </section>

        {/* 大块 4: 从入口到办理 */}
        <section className="mobbin-creation reveal-section">
          <h2 className="reveal-heading">从入口到办理。</h2>
          <div className="reveal-body">
            <div className="mobbin-feature-row">
              {featureCards.map((feature) => (
                <article key={feature.title}>
                  <div>{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mobbin-comments reveal-section" id="comments">
          <h2 className="reveal-heading">平台用户会怎么使用。</h2>
          <div className="reveal-body">
          <div className="mobbin-comment-grid">
            {quoteCards.map((quote, index) => (
              <article key={`${quote.name}-${quote.role}`}>
                <div>
                  <span>{quote.name.slice(0, 1)}</span>
                  <strong>{quote.name}</strong>
                  <small>{quote.role}</small>
                </div>
                <p>{quote.text}</p>
                {index % 3 === 0 ? <CheckCircleOutlined /> : index % 3 === 1 ? <BellOutlined /> : <AuditOutlined />}
              </article>
            ))}
          </div>
          </div>
        </section>

        {/* 大块 5: 别再让流程散在各处 */}
        <section className="mobbin-final-cta reveal-section">
          <h2 className="reveal-heading">别再让流程散在各处。</h2>
          <div className="reveal-body">
            <p>先从统一入口登录，再进入企业、载体或政务端工作台。</p>
            <div>
              <Link to="/login" className="mobbin-primary">
                <LoginOutlined />
                登录平台
              </Link>
              <Link to="/register" className="mobbin-secondary">
                注册账号
                <ArrowRightOutlined />
              </Link>
            </div>
            <div className="mobbin-marquee" aria-hidden="true">
              <div>
                {[...marqueeItems, ...marqueeItems].map((item, index) => (
                  <span key={`${item}-${index}`}>{item}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mobbin-footer">
        <div>
          <strong>孵化平台</strong>
          <span>创新创业孵化载体管理平台</span>
        </div>
        <nav aria-label="页脚导航">
          <a href="#patterns" onClick={(e) => handleNavClick(e, "#patterns")}>业务库</a>
          <a href="#flows" onClick={(e) => handleNavClick(e, "#flows")}>流程</a>
          <a href="#comments" onClick={(e) => handleNavClick(e, "#comments")}>反馈</a>
          <a href="/login" onClick={handleLoginClick}>登录</a>
        </nav>
        <small>© 2026 Incubation Platform</small>
      </footer>
    </div>
  );
}