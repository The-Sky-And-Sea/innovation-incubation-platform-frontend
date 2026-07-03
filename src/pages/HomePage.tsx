import { useState, type CSSProperties, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import {
  ApiOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  AuditOutlined,
  BankOutlined,
  BulbOutlined,
  CloudServerOutlined,
  CodeOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  LoginOutlined,
  MenuOutlined,
  MoonFilled,
  SafetyCertificateOutlined,
  SearchOutlined,
  SunFilled,
  TeamOutlined,
} from "@ant-design/icons";
import BrandLogo from "../components/BrandLogo";

const trustLogos = ["孵化服务", "企业服务", "载体协同", "政务治理", "数据归档", "智能辅助"];

const designPrinciples = [
  { title: "一致", text: "统一规则保证三端协作口径一致", tone: "blue" },
  { title: "有序", text: "把申报、审核和通知整理成清晰流程", tone: "green" },
  { title: "清晰", text: "减少重复填报，让用户只关注下一步", tone: "cyan" },
  { title: "开放", text: "为 API、Mock 和联调保留稳定入口", tone: "teal" },
];

const platformTabs = [
  {
    title: "企业服务",
    text: "入驻、材料、政策申报",
    icon: <TeamOutlined />,
    badge: "企业端最佳实践",
    headline: "企业服务链路开箱即用",
    role: "enterprise",
    component: "EnterpriseBoard",
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
    component: "CarrierBoard",
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
    component: "GovernmentBoard",
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
    component: "ArchiveBoard",
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
    component: "AssistantBoard",
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
    component: "ExtensionBoard",
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

const portalCards = [
  {
    role: "企业端",
    title: "企业服务入口",
    text: "资料完善、文件上传、政策申报和进度追踪集中办理。",
    icon: <TeamOutlined />,
    link: "/enterprise/dashboard",
    tone: "enterprise",
  },
  {
    role: "载体端",
    title: "载体协同入口",
    text: "入驻审核、变更审核、绩效任务和政策协同集中处理。",
    icon: <BankOutlined />,
    link: "/carrier/dashboard",
    tone: "carrier",
  },
  {
    role: "政务端",
    title: "政务治理入口",
    text: "政策发布、终审流转、账号治理和通知监管统一管理。",
    icon: <SafetyCertificateOutlined />,
    link: "/gov/dashboard",
    tone: "government",
  },
];

const enTrustLogos = ["Incubation", "Enterprise", "Carrier", "Government", "Archive", "AI Assist"];

const enDesignPrinciples = [
  { title: "agreement", text: "Shared rules keep all three roles aligned", tone: "blue" },
  { title: "rhythm", text: "Applications, reviews, and notices move in clear steps", tone: "green" },
  { title: "clarity", text: "Less repeated input, more focus on the next action", tone: "cyan" },
  { title: "open", text: "Stable entries for APIs, mocks, and integration work", tone: "teal" },
];

const enPlatformTabs = [
  {
    title: "Enterprise",
    text: "Onboarding, files, applications",
    icon: <TeamOutlined />,
    badge: "Enterprise workflow",
    headline: "Enterprise services ready to run",
    role: "enterprise",
    component: "EnterpriseBoard",
    flow: ["Profile setup", "File upload", "Policy application", "Progress tracking"],
    metrics: [
      ["Onboarding", "1 item"],
      ["Applications", "5"],
      ["File readiness", "68%"],
    ],
  },
  {
    title: "Carrier",
    text: "Reviews, changes, performance",
    icon: <BankOutlined />,
    badge: "Carrier workflow",
    headline: "Review tasks in one workspace",
    role: "carrier",
    component: "CarrierBoard",
    flow: ["Entry review", "Change review", "Performance filing", "Policy support"],
    metrics: [
      ["Pending reviews", "128"],
      ["File reuse", "82%"],
      ["Avg. response", "4.8h"],
    ],
  },
  {
    title: "Government",
    text: "Policies, final review, notices",
    icon: <SafetyCertificateOutlined />,
    badge: "Government workflow",
    headline: "Governance, routing, and decisions in sync",
    role: "government",
    component: "GovernmentBoard",
    flow: ["Policy release", "Final review", "Account governance", "Notice tracking"],
    metrics: [
      ["Final reviews", "7"],
      ["Risk alerts", "2"],
      ["Health score", "86%"],
    ],
  },
  {
    title: "Archive",
    text: "File reuse and traceability",
    icon: <DatabaseOutlined />,
    badge: "Archive capability",
    headline: "Files, applications, and review results stay traceable",
    role: "archive",
    component: "ArchiveBoard",
    flow: ["File intake", "Reuse across tasks", "Result trace", "Unified archive"],
    metrics: [
      ["Reusable files", "24"],
      ["Traceability", "100%"],
      ["Archive scenes", "6"],
    ],
  },
  {
    title: "AI Assist",
    text: "Policy matching and file tips",
    icon: <BulbOutlined />,
    badge: "AI assist capability",
    headline: "Policy search and file suggestions fit the task",
    role: "assistant",
    component: "AssistantBoard",
    flow: ["Policy search", "Condition match", "File suggestion", "Correction tips"],
    metrics: [
      ["Policy matches", "10"],
      ["Useful tips", "6"],
      ["Fix hints", "3"],
    ],
  },
  {
    title: "More",
    text: "Expandable business modules",
    icon: <AppstoreOutlined />,
    badge: "Open extension",
    headline: "A unified entry for future business modules",
    role: "extension",
    component: "ExtensionBoard",
    flow: ["Module access", "Permission setup", "API reserve", "Continuous growth"],
    metrics: [
      ["Modules", "Growing"],
      ["APIs", "Stable"],
      ["Roles", "Clear"],
    ],
  },
];

const enCaseSlides = [
  {
    tone: "enterprise",
    icon: <TeamOutlined />,
    title: "Enterprise Application Service",
    text: "Enterprise users move from profile completion and file upload to policy application on one clear path.",
    stat: "6 +",
    statLabel: "core flows connected",
    link: "/enterprise/dashboard",
    bars: ["82%", "64%", "74%"],
  },
  {
    tone: "carrier",
    icon: <BankOutlined />,
    title: "Incubation Carrier Collaboration",
    text: "Carrier operators handle entry reviews, change reviews, performance filings, and policy support in one place.",
    stat: "18 +",
    statLabel: "core pages connected",
    link: "/carrier/dashboard",
    bars: ["76%", "88%", "58%"],
  },
  {
    tone: "government",
    icon: <SafetyCertificateOutlined />,
    title: "Government Governance",
    text: "Government staff centralize policy publishing, final review, account governance, and notice supervision.",
    stat: "12 +",
    statLabel: "governance items covered",
    link: "/gov/dashboard",
    bars: ["68%", "90%", "72%"],
  },
];

const enPortalCards = [
  {
    role: "Enterprise",
    title: "Enterprise Entry",
    text: "Profile setup, file upload, policy applications, and progress tracking.",
    icon: <TeamOutlined />,
    link: "/enterprise/dashboard",
    tone: "enterprise",
  },
  {
    role: "Carrier",
    title: "Carrier Entry",
    text: "Entry reviews, change reviews, performance tasks, and policy support.",
    icon: <BankOutlined />,
    link: "/carrier/dashboard",
    tone: "carrier",
  },
  {
    role: "Government",
    title: "Government Entry",
    text: "Policy publishing, final review routing, account governance, and notices.",
    icon: <SafetyCertificateOutlined />,
    link: "/gov/dashboard",
    tone: "government",
  },
];

const homeCopy = {
  zh: {
    menuLabel: "打开平台菜单",
    homeLabel: "孵化平台首页",
    brandName: "孵化平台",
    search: "搜索业务、政策、企业",
    navResources: "业务库",
    navFlow: "流程",
    navCases: "三端工作台",
    language: "简体中文",
    login: "登录",
    register: "注册",
    heroBrand: "孵化平台品牌",
    heroTitleA: "协同工作台",
    heroTitleB: "让孵化服务更清晰",
    heroText: "面向企业、孵化载体与政务部门，把入驻、材料、政策、审核和通知流程统一到一个入口。",
    start: "开始使用",
    cases: "接入场景",
    visualLabel: "平台界面预览",
    identity: "统一身份",
    heroPanelTitle: "实名协同办理",
    heroPanelText: "企业提交材料，载体完成初审，政务部门终审办结。",
    enterpriseApply: "企业申报",
    carrierReview: "载体初审",
    govFinal: "政务终审",
    today: "今日概览",
    enterpriseCount: "入驻企业",
    reuseRate: "材料复用率",
    pendingFinal: "待终审申报",
    reviewFlow: "审核流转",
    fileUpload: "材料上传",
    queue: "协同队列",
    queueTitle: "高新技术企业补贴申报",
    queueText: "测试科技有限公司 · 载体初审通过",
    queueDue: "今日 17:30 前完成终审",
    fileReuse: "文件复用",
    fileReuseText: "一次上传，多处引用",
    trustLabel: "来自核心业务场景的信任",
    quickStart: "快速上手",
    resourcesTitle: "完善的设计开发资源",
    designResource: "设计资源",
    designResourceText: "使用孵化平台页面规范，帮助你创建一致、清晰的三端业务体验。",
    designItems: ["入驻申请页面", "审核队列组件", "材料上传与复用", "政策发布流程"],
    devResource: "开发资源",
    devResourceText: "接口、Mock、Docker 和页面状态都已围绕联调前准备整理。",
    devItems: ["API 服务层", "Docker 后端服务", "Mock 环境切换", "数据归档模型"],
    designLinks: ["设计原则", "样式指南", "组件用法"],
    devLinks: ["Web React", "联调准备", "演示账号"],
    platformKicker: "工具平台",
    platformTitle: "灵活丰富的生态平台",
    realTime: "实时同步",
    tracking: "持续跟踪",
    flowSummary: "按角色权限同步任务、材料、审核状态和办理结果。",
    caseKicker: "场景接入",
    caseTitle: "三端协同接入场景",
    prevCase: "上一个场景",
    nextCase: "下一个场景",
    viewWorkspace: "查看工作台",
    caseProgress: "场景进度",
    switchTo: "切换到",
    journeyKicker: "Arco Design",
    journeyTitle: "即刻开启你的体验旅程",
    enterWorkspace: "进入工作台",
    contact: "联系我们",
    contactText: "把前端演示、接口联调和三端权限逐步接入真实环境。",
    footerDesign: "设计",
    footerComponents: "组件",
    footerProducts: "生态产品",
    footerResources: "资源",
    footerDesignLinks: ["设计规范", "设计原则", "页面模式"],
    footerComponentLinks: ["组件索引", "快速开始", "场景实践"],
    footerProductLinks: ["企业工作台", "载体工作台", "政务工作台"],
    footerResourceLinks: ["API 文档", "Mock 环境", "Docker 联调"],
  },
  en: {
    menuLabel: "Open platform menu",
    homeLabel: "Incubation Platform home",
    brandName: "Incubation Platform",
    search: "Search services, policies, enterprises",
    navResources: "Library",
    navFlow: "Flows",
    navCases: "Workspaces",
    language: "EN",
    login: "Log in",
    register: "Sign up",
    heroBrand: "Incubation Platform brand",
    heroTitleA: "Collaborative Workspace",
    heroTitleB: "Clearer incubation services",
    heroText: "For enterprises, incubation carriers, and government teams, the platform unifies onboarding, files, policies, reviews, and notices in one entry.",
    start: "Get started",
    cases: "Scenarios",
    visualLabel: "Platform interface preview",
    identity: "Unified identity",
    heroPanelTitle: "Verified collaboration",
    heroPanelText: "Enterprises submit files, carriers complete initial review, and government teams finish final approval.",
    enterpriseApply: "Apply",
    carrierReview: "Review",
    govFinal: "Approve",
    today: "Today",
    enterpriseCount: "Enterprises",
    reuseRate: "File reuse",
    pendingFinal: "Final reviews",
    reviewFlow: "Review flow",
    fileUpload: "Upload",
    queue: "Work queue",
    queueTitle: "High-tech subsidy application",
    queueText: "Test Tech Co. · Carrier review approved",
    queueDue: "Final review due by 17:30 today",
    fileReuse: "File reuse",
    fileReuseText: "Upload once, reuse anywhere",
    trustLabel: "Trusted across core scenarios",
    quickStart: "Quick start",
    resourcesTitle: "Design and development resources",
    designResource: "Design resources",
    designResourceText: "Use the platform page patterns to create consistent, clear three-role business experiences.",
    designItems: ["Onboarding page", "Review queue component", "File upload and reuse", "Policy publishing flow"],
    devResource: "Development resources",
    devResourceText: "APIs, mocks, Docker, and page states are prepared for integration.",
    devItems: ["API service layer", "Docker backend service", "Mock environment switch", "Archive data model"],
    designLinks: ["Design principles", "Style guide", "Component usage"],
    devLinks: ["Web React", "Integration prep", "Demo accounts"],
    platformKicker: "Tool platform",
    platformTitle: "Flexible ecosystem capabilities",
    realTime: "Live sync",
    tracking: "Continuous tracking",
    flowSummary: "Tasks, files, review states, and results stay synchronized by role permission.",
    caseKicker: "Scenarios",
    caseTitle: "Three-role access scenarios",
    prevCase: "Previous scenario",
    nextCase: "Next scenario",
    viewWorkspace: "View workspace",
    caseProgress: "Scenario progress",
    switchTo: "Switch to ",
    journeyKicker: "Arco Design",
    journeyTitle: "Start your workspace journey",
    enterWorkspace: "Enter workspace",
    contact: "Contact us",
    contactText: "Connect the frontend demo, API integration, and role permissions to a real environment step by step.",
    footerDesign: "Design",
    footerComponents: "Components",
    footerProducts: "Products",
    footerResources: "Resources",
    footerDesignLinks: ["Design spec", "Design principles", "Page patterns"],
    footerComponentLinks: ["Component index", "Quick start", "Scenario practice"],
    footerProductLinks: ["Enterprise workspace", "Carrier workspace", "Government workspace"],
    footerResourceLinks: ["API docs", "Mock environment", "Docker integration"],
  },
};

export default function HomePage() {
  const [language, setLanguage] = useState<"zh" | "en">("zh");
  const [activePlatformIndex, setActivePlatformIndex] = useState(1);
  const [activeCaseIndex, setActiveCaseIndex] = useState(1);
  const [caseDirection, setCaseDirection] = useState<"prev" | "next">("next");
  const [themeMode, setThemeMode] = useState<"day" | "night">("day");
  const [dotOffset, setDotOffset] = useState({ x: 0, y: 0 });
  const isEnglish = language === "en";
  const isNight = themeMode === "night";
  const copy = homeCopy[language];
  const currentTrustLogos = isEnglish ? enTrustLogos : trustLogos;
  const currentDesignPrinciples = isEnglish ? enDesignPrinciples : designPrinciples;
  const currentPlatformTabs = isEnglish ? enPlatformTabs : platformTabs;
  const currentCaseSlides = isEnglish ? enCaseSlides : caseSlides;
  const currentPortalCards = isEnglish ? enPortalCards : portalCards;
  const activePlatform = currentPlatformTabs[activePlatformIndex];
  const activeCase = currentCaseSlides[activeCaseIndex];

  const switchCase = (direction: number) => {
    setCaseDirection(direction < 0 ? "prev" : "next");
    setActiveCaseIndex((current) => (current + direction + currentCaseSlides.length) % currentCaseSlides.length);
  };

  const selectCase = (index: number) => {
    if (index === activeCaseIndex) {
      return;
    }

    setCaseDirection(index > activeCaseIndex ? "next" : "prev");
    setActiveCaseIndex(index);
  };

  const handleHeroVisualMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width - 0.5;
    const yRatio = (event.clientY - rect.top) / rect.height - 0.5;
    const maxShift = 8;

    setDotOffset({
      x: Number((-xRatio * maxShift).toFixed(2)),
      y: Number((-yRatio * maxShift).toFixed(2)),
    });
  };

  return (
    <div className={`public-home-page arco-home ${isEnglish ? "is-english" : ""} ${isNight ? "is-night" : ""}`}>
      <header className="arco-home-header">
        <div className="arco-home-header-inner">
          <button className="arco-menu-grid" aria-label={copy.menuLabel} type="button">
            <MenuOutlined />
          </button>
          <Link to="/" className="arco-brand" aria-label={copy.homeLabel}>
            <BrandLogo variant="mark" tone={isNight ? "night" : "default"} />
            <strong>{copy.brandName}</strong>
          </Link>
          <label className="arco-search">
            <SearchOutlined />
            <span>{copy.search}</span>
            <kbd>⌘ K</kbd>
          </label>
          <nav className="arco-nav-links" aria-label={isEnglish ? "Home navigation" : "首页导航"}>
            <a href="#resources" className="arco-roll-link">
              <span className="arco-text-roller">
                <span>业务库</span>
                <span>Library</span>
              </span>
            </a>
            <a href="#ecosystem" className="arco-roll-link">
              <span className="arco-text-roller">
                <span>流程</span>
                <span>Flows</span>
              </span>
            </a>
            <a href="#cases" className="arco-roll-link">
              <span className="arco-text-roller">
                <span>三端工作台</span>
                <span>Workspaces</span>
              </span>
            </a>
            <button
              className="arco-language-toggle"
              type="button"
              aria-label={isEnglish ? "Switch to Simplified Chinese" : "Switch to English"}
              aria-pressed={isEnglish}
              onClick={() => setLanguage((current) => (current === "zh" ? "en" : "zh"))}
            >
              <span className="arco-language-roller">
                <span>简体中文</span>
                <span>EN</span>
              </span>
            </button>
          </nav>
          <div className="arco-nav-actions">
            <button
              className="arco-theme-toggle"
              type="button"
              aria-label={isNight ? "Switch to day theme" : "Switch to night theme"}
              aria-pressed={isNight}
              onClick={() => setThemeMode((current) => (current === "day" ? "night" : "day"))}
            >
              {isNight ? <MoonFilled /> : <SunFilled />}
            </button>
            <Link to="/login" className="arco-roll-link">
              <span className="arco-text-roller">
                <span>登录</span>
                <span>Log in</span>
              </span>
            </Link>
            <Link to="/register" className="arco-register-pill">
              <span className="arco-text-roller">
                <span>注册</span>
                <span>Sign up</span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="arco-hero">
          <div className="arco-hero-copy">
            <div className="home-hero-logo-reveal" aria-label={copy.heroBrand}>
              <span className="home-hero-logo-mark">
                <BrandLogo variant="mark" tone={isNight ? "night" : "default"} />
              </span>
              <span className="home-hero-logo-text">
                {isEnglish ? (
                  <strong>{copy.brandName}</strong>
                ) : (
                  <BrandLogo variant="text" tone={isNight ? "night" : "default"} />
                )}
              </span>
            </div>
            <h1>
              <span>{copy.heroTitleA}</span>
              <span>{copy.heroTitleB}</span>
            </h1>
            <p>{copy.heroText}</p>
            <div className="arco-hero-actions">
              <Link to="/login" className="arco-primary-button">
                <LoginOutlined />
                {copy.start}
              </Link>
              <a href="#cases" className="arco-secondary-button">
                {copy.cases}
                <ArrowRightOutlined />
              </a>
            </div>
          </div>

          <div
            className="arco-hero-visual"
            aria-label={copy.visualLabel}
            onMouseMove={handleHeroVisualMouseMove}
            onMouseLeave={() => setDotOffset({ x: 0, y: 0 })}
            style={
              {
                "--dot-shift-x": `${dotOffset.x}px`,
                "--dot-shift-y": `${dotOffset.y}px`,
              } as CSSProperties
            }
          >
            <div className="arco-browser-card">
              <div className="arco-browser-bar">
                <i />
                <i />
                <i />
                <span>incubation.platform</span>
              </div>
              <div className="arco-workspace-board">
                <div className="workspace-main-panel">
                  <span className="workspace-chip">{copy.identity}</span>
                  <h3>{copy.heroPanelTitle}</h3>
                  <p>{copy.heroPanelText}</p>
                  <div className="workspace-role-grid">
                    <span>
                      <TeamOutlined />
                      {copy.enterpriseApply}
                    </span>
                    <span>
                      <BankOutlined />
                      {copy.carrierReview}
                    </span>
                    <span>
                      <SafetyCertificateOutlined />
                      {copy.govFinal}
                    </span>
                  </div>
                </div>
                <div className="workspace-metrics-panel">
                  <span className="workspace-chip">{copy.today}</span>
                  <div>
                    <strong>128</strong>
                    <em>{copy.enterpriseCount}</em>
                  </div>
                  <div>
                    <strong>82%</strong>
                    <em>{copy.reuseRate}</em>
                  </div>
                  <div>
                    <strong>7</strong>
                    <em>{copy.pendingFinal}</em>
                  </div>
                </div>
                <div className="workspace-flow-panel">
                  <span className="workspace-chip">{copy.reviewFlow}</span>
                  <ol>
                    <li>
                      <FileDoneOutlined />
                      {copy.fileUpload}
                    </li>
                    <li>
                      <AuditOutlined />
                      {copy.carrierReview}
                    </li>
                    <li>
                      <SafetyCertificateOutlined />
                      {copy.govFinal}
                    </li>
                  </ol>
                </div>
                <div className="workspace-queue-panel">
                  <span className="workspace-chip">{copy.queue}</span>
                  <h3>{copy.queueTitle}</h3>
                  <p>{copy.queueText}</p>
                  <div className="workspace-progress">
                    <span />
                  </div>
                  <em>{copy.queueDue}</em>
                </div>
                <div className="workspace-file-panel">
                  <CloudServerOutlined />
                  <strong>{copy.fileReuse}</strong>
                  <span>{copy.fileReuseText}</span>
                </div>
              </div>
            </div>
            <span className="arco-float-dot is-one">
              <AuditOutlined />
            </span>
            <span className="arco-float-dot is-two">
              <CloudServerOutlined />
            </span>
            <span className="arco-float-dot is-three">
              <ApiOutlined />
            </span>
          </div>

          <div className="arco-trust-row" aria-label={isEnglish ? "Platform capabilities" : "平台能力"}>
            <span>{copy.trustLabel}</span>
            {currentTrustLogos.map((item) => (
              <strong key={item}>{item}</strong>
            ))}
          </div>
        </section>

        <section className="arco-resource-section" id="resources">
          <span className="arco-section-kicker">{copy.quickStart}</span>
          <h2>{copy.resourcesTitle}</h2>
          <div className="arco-resource-grid">
            <article className="arco-resource-card is-blue">
              <div>
                <h3>{copy.designResource}</h3>
                <p>{copy.designResourceText}</p>
              </div>
              <ul>
                <li>
                  <FileSearchOutlined />
                  {copy.designItems[0]}
                </li>
                <li>
                  <AuditOutlined />
                  {copy.designItems[1]}
                </li>
                <li>
                  <FileDoneOutlined />
                  {copy.designItems[2]}
                </li>
                <li>
                  <SafetyCertificateOutlined />
                  {copy.designItems[3]}
                </li>
              </ul>
              <div className="arco-card-footer">
                <a href="#ecosystem">{copy.designLinks[0]}</a>
                <a href="#ecosystem">{copy.designLinks[1]}</a>
                <a href="#ecosystem">{copy.designLinks[2]}</a>
              </div>
            </article>

            <article className="arco-resource-card is-dark">
              <div>
                <h3>{copy.devResource}</h3>
                <p>{copy.devResourceText}</p>
              </div>
              <ul>
                <li>
                  <ApiOutlined />
                  {copy.devItems[0]}
                </li>
                <li>
                  <CloudServerOutlined />
                  {copy.devItems[1]}
                </li>
                <li>
                  <CodeOutlined />
                  {copy.devItems[2]}
                </li>
                <li>
                  <DatabaseOutlined />
                  {copy.devItems[3]}
                </li>
              </ul>
              <div className="arco-card-footer">
                <Link to="/login">{copy.devLinks[0]}</Link>
                <a href="#cases">{copy.devLinks[1]}</a>
                <a href="#journey">{copy.devLinks[2]}</a>
              </div>
            </article>
          </div>
          <div className="arco-principles">
            {currentDesignPrinciples.map((item) => (
              <article key={item.title} className={`is-${item.tone}`}>
                <i />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="arco-ecosystem-section" id="ecosystem">
          <span className="arco-section-kicker">{copy.platformKicker}</span>
          <h2>{copy.platformTitle}</h2>
          <div className="arco-platform-tabs">
            {currentPlatformTabs.map((tab, index) => (
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
                {activePlatform.metrics.map(([label, value], index) => (
                  <article key={label} className={index === 2 ? "wide" : ""}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <em>{index === 2 ? copy.tracking : copy.realTime}</em>
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
                {activePlatform.flow.map((step, index) => (
                  <li key={step}>
                    <em>{String(index + 1).padStart(2, "0")}</em>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div key={`flow-summary-${activePlatform.title}`} className="arco-flow-summary">
                <strong>{activePlatform.headline}</strong>
                <span>{copy.flowSummary}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="arco-case-section" id="cases">
          <span className="arco-section-kicker">{copy.caseKicker}</span>
          <h2>{copy.caseTitle}</h2>
          <div className="arco-case-carousel">
            <button type="button" aria-label={copy.prevCase} onClick={() => switchCase(-1)}>
              ‹
            </button>
            <div className={`arco-case-card is-${activeCase.tone} is-${caseDirection}`} key={activeCase.title}>
              <div className="arco-case-screen">
                <div className="case-screen-top">
                  <span>{activeCase.title}</span>
                  <strong>{activeCase.stat}</strong>
                </div>
                <div className="case-screen-list">
                  {activeCase.bars.slice(0, 2).map((width, index) => (
                    <article key={width}>
                      <em>{String(index + 1).padStart(2, "0")}</em>
                      <div>
                        <strong>{[copy.realTime, copy.tracking, activeCase.statLabel][index]}</strong>
                        <span>
                          <i style={{ width }} />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="case-screen-footer">
                  <span>{copy.viewWorkspace}</span>
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
                  {copy.viewWorkspace}
                  <ArrowRightOutlined />
                </Link>
              </article>
            </div>
            <button type="button" aria-label={copy.nextCase} onClick={() => switchCase(1)}>
              ›
            </button>
          </div>
          <div className="arco-case-dots" aria-label={copy.caseProgress}>
            {currentCaseSlides.map((item, index) => (
              <button
                type="button"
                key={item.title}
                className={index === activeCaseIndex ? "is-active" : ""}
                aria-label={`${copy.switchTo}${item.title}`}
                onClick={() => selectCase(index)}
              />
            ))}
          </div>
        </section>

        <section className="arco-journey-section" id="journey">
          <span className="arco-section-kicker">{copy.journeyKicker}</span>
          <h2>{copy.journeyTitle}</h2>
          <div className="arco-journey-grid">
            {currentPortalCards.map((card) => (
              <article key={card.role} className={`is-${card.tone}`}>
                <div>{card.icon}</div>
                <h3>{card.role}</h3>
                <p>{card.title}</p>
                <span>{card.text}</span>
                <Link to={card.link}>
                  {copy.enterWorkspace}
                  <ArrowRightOutlined />
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="arco-footer">
        <div className="arco-footer-contact">
          <BrandLogo variant="mark" tone={isNight ? "night" : "default"} />
          <h2>{copy.contact}</h2>
          <p>{copy.contactText}</p>
        </div>
        <nav>
          <div className="arco-footer-workspaces">
            <strong>{copy.footerProducts}</strong>
            <div className="arco-footer-workspace-grid">
              {currentPortalCards.map((card) => (
                <Link key={card.role} to={card.link} className={`is-${card.tone}`}>
                  <span>{card.icon}</span>
                  <div>
                    <b>{card.role}</b>
                    <small>{card.title}</small>
                  </div>
                  <ArrowRightOutlined />
                </Link>
              ))}
            </div>
          </div>
        </nav>
        <div className="arco-footer-bottom">
          <span>Powered by Incubation Platform</span>
          <small>GIP UED & 架构前端 © 2026</small>
        </div>
      </footer>
    </div>
  );
}
