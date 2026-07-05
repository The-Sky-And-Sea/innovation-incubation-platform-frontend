import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ApiOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  AuditOutlined,
  BankOutlined,
  BellOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  CodeOutlined,
  DatabaseOutlined,
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

const platformTabs = [
  {
    title: "企业服务",
    text: "入驻、材料、政策申报",
    icon: <TeamOutlined />,
    badge: "企业端最佳实践",
    headline: "企业服务链路开箱即用",
    role: "enterprise",
    flow: ["资料完善", "材料上传", "政策申报", "进度追踪"],
    metrics: [
      ["入驻状态", "1 项"],
      ["政策申报", "5 条"],
      ["材料完整度", "68%"],
    ],
  },
  {
    title: "载体协同",
    text: "审核、变更、绩效任务",
    icon: <BankOutlined />,
    badge: "载体端最佳实践",
    headline: "把审核任务集中到一个工作台",
    role: "carrier",
    flow: ["入驻初审", "变更审核", "绩效填报", "政策协同"],
    metrics: [
      ["待审核事项", "128"],
      ["材料复用率", "82%"],
      ["平均响应", "4.8h"],
    ],
  },
  {
    title: "政务治理",
    text: "政策、终审、通知监管",
    icon: <SafetyCertificateOutlined />,
    badge: "政务端最佳实践",
    headline: "监管、流转、决策同步推进",
    role: "government",
    flow: ["政策发布", "申报终审", "账号治理", "通知监管"],
    metrics: [
      ["待终审申报", "7 件"],
      ["风险提醒", "2 条"],
      ["业务健康度", "86%"],
    ],
  },
  {
    title: "数据归档",
    text: "文件复用与结果留痕",
    icon: <DatabaseOutlined />,
    badge: "数据归档能力",
    headline: "文件、申报和审核结果自动留痕",
    role: "archive",
    flow: ["文件入库", "多处复用", "结果留痕", "统一归档"],
    metrics: [
      ["文件复用", "24 个"],
      ["结果留痕", "100%"],
      ["归档场景", "6 类"],
    ],
  },
  {
    title: "智能辅助",
    text: "政策匹配与材料建议",
    icon: <BulbOutlined />,
    badge: "智能辅助能力",
    headline: "政策检索和材料建议更贴近办理",
    role: "assistant",
    flow: ["政策检索", "条件匹配", "材料建议", "补正提示"],
    metrics: [
      ["政策匹配", "10 条"],
      ["建议命中", "6 项"],
      ["补正提示", "3 类"],
    ],
  },
  {
    title: "更多",
    text: "持续扩展业务模块",
    icon: <AppstoreOutlined />,
    badge: "开放扩展能力",
    headline: "为后续业务模块保留统一扩展入口",
    role: "extension",
    flow: ["模块接入", "权限配置", "接口预留", "持续扩展"],
    metrics: [
      ["模块扩展", "持续"],
      ["接口预留", "稳定"],
      ["角色权限", "清晰"],
    ],
  },
];

const caseSlides = [
  {
    tone: "enterprise",
    icon: <TeamOutlined />,
    title: "企业端申报服务",
    text: "企业用户从资料完善、文件上传到政策申报都在同一条线上推进，减少重复录入。",
    stat: "6 +",
    statLabel: "主流程串联",
    link: "/enterprise/dashboard",
    bars: ["82%", "64%", "74%"],
  },
  {
    tone: "carrier",
    icon: <BankOutlined />,
    title: "孵化载体协同",
    text: "载体运营方统一处理入驻审核、变更审核、绩效填报和政策协同，为企业提供系统化路径。",
    stat: "18 +",
    statLabel: "核心页面接入",
    link: "/carrier/dashboard",
    bars: ["76%", "88%", "58%"],
  },
  {
    tone: "government",
    icon: <SafetyCertificateOutlined />,
    title: "政务端监管治理",
    text: "政务人员集中完成政策发布、申报终审、账号治理和通知监管，关键风险更容易被发现。",
    stat: "12 +",
    statLabel: "监管事项覆盖",
    link: "/gov/dashboard",
    bars: ["68%", "90%", "72%"],
  },
];

const marqueeItems = ["企业端", "载体端", "政务端", "入驻申请", "政策申报", "文件管理", "审核流转", "绩效考核", "智能辅助", "通知中心"];

export default function HomePage() {
  const navigate = useNavigate();
  const [routeTransitioning, setRouteTransitioning] = useState(false);
  const [activePatternTab, setActivePatternTab] = useState<PatternTab>("页面");
  const [activePlatformIndex, setActivePlatformIndex] = useState(0);
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [caseDirection, setCaseDirection] = useState<"prev" | "next">("next");
  const [darkMode, setDarkMode] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [circlePos, setCirclePos] = useState({ cx: "50%", cy: "50%" });
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

  const activePlatform = platformTabs[activePlatformIndex];
  const activeCase = caseSlides[activeCaseIndex];

  const switchCase = (direction: number) => {
    setCaseDirection(direction === 1 ? "next" : "prev");
    setActiveCaseIndex((current) => (current + direction + caseSlides.length) % caseSlides.length);
  };

  const currentPatterns = patternScreens[activePatternTab];

  return (
    <div className="public-home-page mobbin-home">
      <AuthRouteTransition active={routeTransitioning} />
      <div
        className={`theme-diff-overlay${darkMode ? " is-expanded" : ""}${animating ? " is-animating" : ""}`}
        style={{ "--cx": circlePos.cx, "--cy": circlePos.cy } as React.CSSProperties}
        onTransitionEnd={() => setAnimating(false)}
      />
      <header className="mobbin-home-nav reveal-nav">
        <Link to="/" className="mobbin-home-brand" aria-label="创新创业孵化载体管理平台首页">
          <BrandLogo />
          <strong>孵化平台</strong>
        </Link>
        <button
          className="mobbin-theme-toggle"
          type="button"
          aria-label={darkMode ? "切换到浅色模式" : "切换到深色模式"}
          onClick={(e) => {
            if (animating) return;
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            setCirclePos({ cx: `${rect.left + rect.width / 2}px`, cy: `${rect.top + rect.height / 2}px` });
            setAnimating(true);
            setDarkMode((v) => !v);
          }}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        <nav aria-label="首页导航">
          <a href="#patterns" onClick={(e) => handleNavClick(e, "#patterns")}>业务库</a>
          <a href="#flows" onClick={(e) => handleNavClick(e, "#flows")}>流程</a>
          <a href="#cases" onClick={(e) => handleNavClick(e, "#cases")}>场景接入</a>
          <a href="#comments" onClick={(e) => handleNavClick(e, "#comments")}>反馈</a>
          <a href="/login" onClick={handleLoginClick}>登录</a>
          <Link to="/register" className="mobbin-home-join">
            注册
          </Link>
        </nav>
      </header>

      <main>
        <section className="mobbin-hero reveal-section">
          <svg className="hero-stroke-svg" viewBox="0 0 1000 160" aria-label="创新创业孵化载体管理平台" aria-hidden="true">
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
              创新创业孵化载体管理平台
            </text>
          </svg>
          <div className="reveal-heading-wrapper">
            <h1 className="reveal-heading">发现真实可用的孵化协同工作台。</h1>
            <p className="reveal-heading">面向企业、载体和政务三端，把入驻、材料、政策、审核与通知流程组织成一个清晰入口。</p>
          </div>
          <div className="reveal-body">
            <div className="mobbin-hero-actions">
              <Link to="/login" className="mobbin-primary" onClick={handleLoginClick}>
                <LoginOutlined />
                登录平台
              </Link>
              <Link to="/register" className="mobbin-secondary">
                注册账号
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

        <section className="mobbin-product-stage reveal-section" id="patterns" aria-label="平台业务库预览">
          <h2 className="mobbin-product-stage-heading reveal-heading">业务库</h2>
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

        {/* 完善的设计开发资源 */}
        <section className="arco-resource-section reveal-section" aria-label="设计开发资源">
          <span className="arco-section-kicker reveal-heading">快速上手</span>
          <h2 className="reveal-heading">完善的设计开发资源</h2>
          <div className="reveal-body">
            <div className="arco-resource-grid">
              <article className="arco-resource-card is-blue">
                <div>
                  <h3>设计资源</h3>
                  <p>使用孵化平台页面规范，帮助你创建一致、清晰的三端业务体验。</p>
                </div>
                <ul>
                  <li><FileSearchOutlined />入驻申请页面</li>
                  <li><AuditOutlined />审核队列组件</li>
                  <li><FileDoneOutlined />材料上传与复用</li>
                  <li><SafetyCertificateOutlined />政策发布流程</li>
                </ul>
                <div className="arco-card-footer">
                  <a href="#flows">设计原则</a>
                  <a href="#flows">样式指南</a>
                  <a href="#flows">组件用法</a>
                </div>
              </article>
              <article className="arco-resource-card is-dark">
                <div>
                  <h3>开发资源</h3>
                  <p>接口、Mock、Docker 和页面状态都已围绕联调前准备整理。</p>
                </div>
                <ul>
                  <li><ApiOutlined />API 服务层</li>
                  <li><CloudServerOutlined />Docker 后端服务</li>
                  <li><CodeOutlined />Mock 环境切换</li>
                  <li><DatabaseOutlined />数据归档模型</li>
                </ul>
                <div className="arco-card-footer">
                  <Link to="/login">Web React</Link>
                  <a href="#patterns">联调准备</a>
                  <a href="#patterns">演示账号</a>
                </div>
              </article>
            </div>
            <div className="arco-principles">
              <article className="is-blue">
                <i />
                <div>
                  <h3>一致</h3>
                  <p>统一规则保证三端协作口径一致</p>
                </div>
              </article>
              <article className="is-green">
                <i />
                <div>
                  <h3>有序</h3>
                  <p>把申报、审核和通知整理成清晰流程</p>
                </div>
              </article>
              <article className="is-cyan">
                <i />
                <div>
                  <h3>清晰</h3>
                  <p>减少重复填报，让用户只关注下一步</p>
                </div>
              </article>
              <article className="is-teal">
                <i />
                <div>
                  <h3>开放</h3>
                  <p>为 API、Mock 和联调保留稳定入口</p>
                </div>
              </article>
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

        {/* 工具平台 - 灵活丰富的生态平台 */}
        <section className="arco-ecosystem-section" id="ecosystem">
          <span className="arco-section-kicker">工具平台</span>
          <h2>灵活丰富的生态平台</h2>
          <div className="arco-platform-tabs">
            {platformTabs.map((tab, index) => (
              <button
                type="button"
                key={tab.title}
                className={index === activePlatformIndex ? "is-active" : ""}
                onClick={() => setActivePlatformIndex(index)}
              >
                <div>{tab.icon}</div>
                <strong>{tab.title}</strong>
                <span>{tab.text}</span>
              </button>
            ))}
          </div>
          <div className="arco-ecosystem-panel">
            <div
              key={`dashboard-${activePlatform.title}`}
              className={`arco-dashboard-preview is-${activePlatform.role}`}
            >
              <span className="arco-preview-label">{activePlatform.badge}</span>
              <h3>{activePlatform.headline}</h3>
              <div className="arco-dashboard-grid">
                {activePlatform.metrics.map(([label, value], idx) => (
                  <article key={label} className={idx === 2 ? "wide" : ""}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <em>实时</em>
                  </article>
                ))}
              </div>
            </div>
            <div className={`arco-flow-preview is-${activePlatform.role}`}>
              <div key={`flow-heading-${activePlatform.title}`} className="arco-flow-heading">
                <span>{activePlatform.title}</span>
                <strong>{activePlatform.badge}</strong>
              </div>
              <ol key={`flow-steps-${activePlatform.title}`} className="arco-flow-steps">
                {activePlatform.flow.map((step, idx) => (
                  <li key={step}>
                    <em>{String(idx + 1).padStart(2, "0")}</em>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 场景接入 */}
        <section className="arco-case-section" id="cases">
          <span className="arco-section-kicker">场景接入</span>
          <h2>三端协同接入场景</h2>
          <div className="arco-case-carousel">
            <button type="button" aria-label="上一个场景" onClick={() => switchCase(-1)}>
              ‹
            </button>
            <div className={`arco-case-card is-${activeCase.tone} is-${caseDirection}`} key={activeCase.title}>
              <div className="arco-case-screen">
                <div className="case-screen-top">
                  <span>{activeCase.title}</span>
                  <strong>{activeCase.stat}</strong>
                </div>
                <div className="case-screen-list">
                  {activeCase.bars.slice(0, 2).map((width, idx) => (
                    <article key={width}>
                      <em>{String(idx + 1).padStart(2, "0")}</em>
                      <div>
                        <strong>{["", "流程跟踪", activeCase.statLabel][idx + 1] ?? activeCase.statLabel}</strong>
                        <span>
                          <i style={{ width }} />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="case-screen-footer">
                  <span>查看工作台</span>
                  <ArrowRightOutlined />
                </div>
              </div>
              <article>
                {activeCase.icon}
                <h3>{activeCase.title}</h3>
                <p>{activeCase.text}</p>
                <strong>{activeCase.stat}</strong>
                <span>{activeCase.statLabel}</span>
                <Link to={activeCase.link}>
                  查看工作台
                  <ArrowRightOutlined />
                </Link>
              </article>
            </div>
            <button type="button" aria-label="下一个场景" onClick={() => switchCase(1)}>
              ›
            </button>
          </div>
          <div className="arco-case-dots" aria-label="场景进度">
            {caseSlides.map((cs, i) => (
              <button
                key={cs.title}
                type="button"
                className={i === activeCaseIndex ? "is-active" : ""}
                onClick={() => {
                  setCaseDirection(i > activeCaseIndex ? "next" : "prev");
                  setActiveCaseIndex(i);
                }}
              />
            ))}
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
        <svg className="mobbin-footer-svg" width="1" height="1" aria-hidden="true">
          <filter id="fractal" filterUnits="objectBoundingBox" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence id="turbulence" type="fractalNoise" baseFrequency="0.02 0.02" numOctaves="5">
              <animate
                attributeName="baseFrequency"
                dur="20s"
                values="0.02 0.02;0.022 0.15;0.02 0.02"
                repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="15" />
          </filter>
        </svg>
        <div className="mobbin-footer-left">
          <p className="mobbin-footer-contact">联系我们</p>
          <div className="mobbin-footer-icons">
            <a
              className="mobbin-footer-icon-link"
              href="https://github.com/The-Sky-And-Sea/innovation-incubation-platform-frontend"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <span className="mobbin-footer-icon-link" aria-label="邮箱">
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </span>
            <span className="mobbin-footer-icon-link" aria-label="微信">
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.952-7.062-6.122zm-2.18 2.769c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z" />
              </svg>
            </span>
          </div>
          <div className="mobbin-footer-team">
            <span className="mobbin-footer-team-name">brain_404</span>
            <div className="mobbin-footer-team-members">
              <span>有手就行</span>
              <span>没手也行</span>
              <span>别人都行</span>
              <span>就我不行</span>
              <span>彳亍</span>
            </div>
          </div>
        </div>
        <div className="mobbin-footer-animation">
          <div className="g-container">
            <div className="g-top" />
            <div className="g-bottom" />
            <p>Innovati<span>o</span>n</p>
          </div>
        </div>
        <div className="mobbin-footer-right">
          <div className="mobbin-footer-eco">
            <span className="mobbin-footer-section-title">更多生态产品</span>
            <p className="mobbin-footer-eco-pending">敬请期待</p>
          </div>
          <div className="mobbin-footer-feedback">
            <span className="mobbin-footer-section-title">体验反馈</span>
            <div
              className="mobbin-footer-stars"
              onMouseLeave={() => setFeedbackHover(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`mobbin-footer-star${star <= (feedbackHover || feedbackRating) ? " is-active" : ""}`}
                  onClick={() => setFeedbackRating(star)}
                  onMouseEnter={() => setFeedbackHover(star)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <small className="mobbin-footer-powered">Powered by Incubation Platform</small>
        </div>
      </footer>
    </div>
  );
}