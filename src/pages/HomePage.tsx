import { Fragment, useEffect, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AliyunOutlined,
  ApiOutlined,
  AppstoreOutlined,
  ArrowUpOutlined,
  ArrowRightOutlined,
  AuditOutlined,
  BankOutlined,
  BellOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  CodeOutlined,
  DatabaseOutlined,
  DingdingOutlined,
  DockerOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  GithubFilled,
  GitlabFilled,
  OrderedListOutlined,
  PartitionOutlined,
  LeftOutlined,
  LoginOutlined,
  MoonFilled,
  QqCircleFilled,
  RightOutlined,
  SafetyCertificateOutlined,
  SunFilled,
  TeamOutlined,
  WechatWorkFilled,
} from "@ant-design/icons";
import { siBytedance, siGitee, siHuawei, siJenkins, type SimpleIcon } from "simple-icons";
import BrandLogo from "../components/BrandLogo";

const trustLogos = ["孵化服务", "企业服务", "载体协同", "政务治理", "数据归档", "智能辅助"];

const designPrinciples = [
  { title: "一致", text: "统一规则保证三端协作口径一致", tone: "blue", icon: <CheckCircleOutlined /> },
  { title: "有序", text: "把申报、审核和通知整理成清晰流程", tone: "green", icon: <OrderedListOutlined /> },
  { title: "清晰", text: "减少重复填报，让用户只关注下一步", tone: "cyan", icon: <PartitionOutlined /> },
  { title: "开放", text: "为接口服务和系统接入保留稳定入口", tone: "teal", icon: <ApiOutlined /> },
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
    screenTitle: "申报办理台",
    queue: ["企业信息完善", "材料上传复用", "政策匹配申报"],
    chips: ["入驻状态", "文件管理", "政策申报"],
    insight: "已同步载体初审、材料完整度和政策申报进度",
    status: "企业办理链路",
    leadMetric: "82%",
    leadLabel: "资料完整度",
    supporting: [
      ["待补材料", "2 项"],
      ["可申报政策", "5 条"],
      ["平均办理", "4.8h"],
    ],
    checklist: ["统一身份登录", "企业资料维护", "附件材料复用", "政策匹配申报"],
    result: "从首次入驻到政策申报保持同一份企业档案，后续材料不再反复提交。",
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
    screenTitle: "载体协同台",
    queue: ["入驻初审", "变更复核", "绩效填报"],
    chips: ["待审企业", "变更事项", "绩效任务"],
    insight: "集中查看企业材料、审核意见和绩效提交状态",
    status: "载体运营链路",
    leadMetric: "18",
    leadLabel: "待处理事项",
    supporting: [
      ["初审队列", "7 家"],
      ["变更复核", "3 项"],
      ["绩效进度", "88%"],
    ],
    checklist: ["入驻初审", "企业档案核验", "变更材料复核", "绩效填报归档"],
    result: "把企业材料、审核意见和载体服务记录放在同一个运营视图里。",
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
    screenTitle: "政务监管台",
    queue: ["政策发布", "申报终审", "通知监管"],
    chips: ["政策管理", "终审队列", "账号治理"],
    insight: "按风险、时限和办理结果跟踪跨端协同事项",
    status: "政务监管链路",
    leadMetric: "12+",
    leadLabel: "监管事项覆盖",
    supporting: [
      ["待终审", "9 件"],
      ["政策发布", "4 条"],
      ["通知触达", "96%"],
    ],
    checklist: ["政策发布", "申报终审", "账号治理", "通知监管"],
    result: "政务端不只看结果，也能追踪政策、申报、通知和账号治理的闭环状态。",
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
  { title: "agreement", text: "Shared rules keep all three roles aligned", tone: "blue", icon: <CheckCircleOutlined /> },
  { title: "rhythm", text: "Applications, reviews, and notices move in clear steps", tone: "green", icon: <OrderedListOutlined /> },
  { title: "clarity", text: "Less repeated input, more focus on the next action", tone: "cyan", icon: <PartitionOutlined /> },
  { title: "open", text: "Stable entries for interface services and system access", tone: "teal", icon: <ApiOutlined /> },
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
    screenTitle: "Application desk",
    queue: ["Profile completion", "File reuse", "Policy application"],
    chips: ["Entry status", "Files", "Policies"],
    insight: "Carrier review, file completeness, and policy progress stay in sync.",
    status: "Enterprise service path",
    leadMetric: "82%",
    leadLabel: "profile completeness",
    supporting: [
      ["Missing files", "2"],
      ["Matched policies", "5"],
      ["Avg. handling", "4.8h"],
    ],
    checklist: ["Unified sign-in", "Profile maintenance", "File reuse", "Policy application"],
    result: "The same enterprise profile carries onboarding and policy application without repeated file submission.",
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
    screenTitle: "Carrier desk",
    queue: ["Entry review", "Change review", "Performance filing"],
    chips: ["Review queue", "Changes", "Performance"],
    insight: "Enterprise files, review comments, and filing states are centralized.",
    status: "Carrier operation path",
    leadMetric: "18",
    leadLabel: "pending items",
    supporting: [
      ["Entry queue", "7"],
      ["Change reviews", "3"],
      ["Performance", "88%"],
    ],
    checklist: ["Entry review", "File verification", "Change review", "Performance archive"],
    result: "Enterprise files, review comments, and service records are kept in one carrier operation view.",
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
    screenTitle: "Governance desk",
    queue: ["Policy publishing", "Final review", "Notice supervision"],
    chips: ["Policies", "Final review", "Accounts"],
    insight: "Cross-role items are tracked by risk, deadline, and handling result.",
    status: "Government governance path",
    leadMetric: "12+",
    leadLabel: "governance items",
    supporting: [
      ["Final reviews", "9"],
      ["Policies", "4"],
      ["Notice reach", "96%"],
    ],
    checklist: ["Policy publishing", "Final review", "Account governance", "Notice supervision"],
    result: "Government users can trace the full loop of policy, application, notice, and account governance.",
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
    quickStart: "资源中心",
    resourcesTitle: "平台规范与接入能力",
    designResource: "业务规范",
    designResourceText: "围绕企业端、载体端和政务端的办理流程，沉淀统一的页面口径和操作规范。",
    designItems: ["入驻申请规范", "审核队列规范", "材料复用规范", "政策发布规范"],
    devResource: "接入能力",
    devResourceText: "围绕接口服务、运行环境、权限身份和数据归档，提供稳定的系统接入支撑。",
    devItems: ["接口服务管理", "后端服务支撑", "环境配置管理", "数据归档模型"],
    designLinks: ["业务规则", "页面规范", "流程说明"],
    devLinks: ["接口服务", "接入准备", "账号说明"],
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
    contactText: "将业务办理、系统接口和三端权限逐步接入正式运行环境。",
    footerDesign: "设计",
    footerComponents: "组件",
    footerProducts: "生态产品",
    footerResources: "资源",
    footerDesignLinks: ["设计规范", "设计原则", "页面模式"],
    footerComponentLinks: ["组件索引", "快速开始", "场景实践"],
    footerProductLinks: ["企业工作台", "载体工作台", "政务工作台"],
    footerResourceLinks: ["接口文档", "环境配置", "接入说明"],
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
    quickStart: "Resource center",
    resourcesTitle: "Platform standards and access capabilities",
    designResource: "Business standards",
    designResourceText: "Unified page rules and operating standards are organized around enterprise, carrier, and government workflows.",
    designItems: ["Entry application standard", "Review queue standard", "File reuse standard", "Policy publishing standard"],
    devResource: "Access capabilities",
    devResourceText: "Interface services, runtime environments, identity permissions, and archive models support stable system access.",
    devItems: ["Interface service management", "Backend service support", "Environment configuration", "Archive data model"],
    designLinks: ["Business rules", "Page standards", "Flow guide"],
    devLinks: ["Interface services", "Access preparation", "Account guide"],
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
    contactText: "Connect business workflows, system interfaces, and role permissions to a formal operating environment.",
    footerDesign: "Design",
    footerComponents: "Components",
    footerProducts: "Products",
    footerResources: "Resources",
    footerDesignLinks: ["Design spec", "Design principles", "Page patterns"],
    footerComponentLinks: ["Component index", "Access guide", "Scenario practice"],
    footerProductLinks: ["Enterprise workspace", "Carrier workspace", "Government workspace"],
    footerResourceLinks: ["Interface docs", "Environment setup", "Access guide"],
  },
};

const footerLinkGroups = {
  zh: [
    {
      title: "平台资源",
      links: [
        { label: "产品使用说明", href: "/docs/product-usage" },
        { label: "功能文档", href: "/docs/feature-docs" },
        { label: "政策规范", href: "/docs/policy-rules" },
        { label: "模板资源", href: "/docs/templates" },
        { label: "接口与接入说明", href: "/docs/api-access" },
      ],
    },
    {
      title: "业务场景",
      links: [
        { label: "企业入驻申请", href: "/enterprise/incubation" },
        { label: "材料文件管理", href: "/enterprise/files" },
        { label: "政策申报服务", href: "/enterprise/policies" },
        { label: "载体审核协同", href: "/carrier/incubation" },
        { label: "政务终审管理", href: "/gov/applications" },
      ],
    },
    {
      title: "运营支持",
      links: [
        { label: "通知中心", href: "/enterprise/notifications" },
        { label: "申诉与反馈", href: "/enterprise/appeals" },
        { label: "账号注销申请", href: "/enterprise/account-deletion" },
        { label: "AI 政策助手", href: "/enterprise/ai-assist" },
        { label: "平台操作指引", href: "/docs/product-usage" },
      ],
    },
    {
      title: "更多能力",
      links: [
        { label: "企业工作台", href: "/enterprise/dashboard" },
        { label: "载体工作台", href: "/carrier/dashboard" },
        { label: "政务工作台", href: "/gov/dashboard" },
        { label: "绩效填报与评估", href: "/carrier/performances" },
        { label: "账号与权限治理", href: "/gov/account" },
      ],
    },
  ],
  en: [
    {
      title: "Resources",
      links: [
        { label: "Product guide", href: "/docs/product-usage" },
        { label: "Feature docs", href: "/docs/feature-docs" },
        { label: "Policy rules", href: "/docs/policy-rules" },
        { label: "Templates", href: "/docs/templates" },
        { label: "API access guide", href: "/docs/api-access" },
      ],
    },
    {
      title: "Service Flows",
      links: [
        { label: "Enterprise onboarding", href: "/enterprise/incubation" },
        { label: "File management", href: "/enterprise/files" },
        { label: "Policy applications", href: "/enterprise/policies" },
        { label: "Carrier review", href: "/carrier/incubation" },
        { label: "Government final review", href: "/gov/applications" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Notification center", href: "/enterprise/notifications" },
        { label: "Appeals and feedback", href: "/enterprise/appeals" },
        { label: "Account deletion", href: "/enterprise/account-deletion" },
        { label: "AI policy assistant", href: "/enterprise/ai-assist" },
        { label: "Operation guide", href: "/docs/product-usage" },
      ],
    },
    {
      title: "More Capabilities",
      links: [
        { label: "Enterprise workspace", href: "/enterprise/dashboard" },
        { label: "Carrier workspace", href: "/carrier/dashboard" },
        { label: "Government workspace", href: "/gov/dashboard" },
        { label: "Performance filing", href: "/carrier/performances" },
        { label: "Account governance", href: "/gov/account" },
      ],
    },
  ],
};

function SimpleBrandIcon({ icon }: { icon: SimpleIcon }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={icon.path} />
    </svg>
  );
}

function BrandImageIcon({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} loading="lazy" decoding="async" />;
}

type FooterMarqueeItem = {
  label: string;
  icon: ReactNode;
  color: string;
};

type BrandIconStyle = CSSProperties & {
  "--brand-color": string;
};

function brandIconStyle(color: string): BrandIconStyle {
  return { "--brand-color": color };
}

const footerMarqueeItems = {
  zh: [
    { label: "GitHub", icon: <GithubFilled />, color: "#181717" },
    { label: "GitLab", icon: <GitlabFilled />, color: "#FC6D26" },
    { label: "钉钉", icon: <DingdingOutlined />, color: "#1677FF" },
    { label: "字节跳动", icon: <SimpleBrandIcon icon={siBytedance} />, color: `#${siBytedance.hex}` },
    { label: "QQ", icon: <QqCircleFilled />, color: "#0052D9" },
    { label: "飞书", icon: <BrandImageIcon src="https://www.feishu.cn/favicon.ico" alt="飞书" />, color: "#3370FF" },
    { label: "企业微信", icon: <WechatWorkFilled />, color: "#07C160" },
    { label: "阿里云", icon: <AliyunOutlined />, color: "#FF6A00" },
    { label: "华为云", icon: <SimpleBrandIcon icon={siHuawei} />, color: `#${siHuawei.hex}` },
    { label: "Gitee", icon: <SimpleBrandIcon icon={siGitee} />, color: `#${siGitee.hex}` },
    { label: "Jenkins", icon: <SimpleBrandIcon icon={siJenkins} />, color: `#${siJenkins.hex}` },
    { label: "Docker", icon: <DockerOutlined />, color: "#2496ED" },
  ],
  en: [
    { label: "GitHub", icon: <GithubFilled />, color: "#181717" },
    { label: "GitLab", icon: <GitlabFilled />, color: "#FC6D26" },
    { label: "DingTalk", icon: <DingdingOutlined />, color: "#1677FF" },
    { label: "ByteDance", icon: <SimpleBrandIcon icon={siBytedance} />, color: `#${siBytedance.hex}` },
    { label: "QQ", icon: <QqCircleFilled />, color: "#0052D9" },
    { label: "Feishu", icon: <BrandImageIcon src="https://www.feishu.cn/favicon.ico" alt="Feishu" />, color: "#3370FF" },
    { label: "WeCom", icon: <WechatWorkFilled />, color: "#07C160" },
    { label: "Alibaba Cloud", icon: <AliyunOutlined />, color: "#FF6A00" },
    { label: "Huawei Cloud", icon: <SimpleBrandIcon icon={siHuawei} />, color: `#${siHuawei.hex}` },
    { label: "Gitee", icon: <SimpleBrandIcon icon={siGitee} />, color: `#${siGitee.hex}` },
    { label: "Jenkins", icon: <SimpleBrandIcon icon={siJenkins} />, color: `#${siJenkins.hex}` },
    { label: "Docker", icon: <DockerOutlined />, color: "#2496ED" },
  ],
} satisfies Record<"zh" | "en", FooterMarqueeItem[]>;

type UsageCard = {
  name: string;
  role: string;
  text: string;
  icon: ReactNode;
};

const usageCards = {
  zh: [
    {
      name: "企业服务专员",
      role: "申报服务",
      text: "不用在多个入口之间切换，企业资料、载体对接和政策申报都能沿着同一条线推进。",
      icon: <CheckCircleOutlined />,
    },
    {
      name: "孵化载体运营",
      role: "审核协同",
      text: "待审核事项能按类型聚合，临期任务和材料缺口一眼就能看到。",
      icon: <BellOutlined />,
    },
    {
      name: "政务审核人员",
      role: "监督治理",
      text: "政策发布、申报终审和通知管理放在同一个工作空间，决策链路更清楚。",
      icon: <AuditOutlined />,
    },
    {
      name: "项目管理员",
      role: "联调准备",
      text: "前端界面已经能完整演示业务路径，后端接入时只需要逐步替换数据源。",
      icon: <CheckCircleOutlined />,
    },
    {
      name: "企业用户",
      role: "材料办理",
      text: "文件上传后能复用到多个申报场景，减少重复填报。",
      icon: <BellOutlined />,
    },
    {
      name: "平台维护人员",
      role: "统一入口",
      text: "登录、注册和三端权限清晰，演示时更容易说明平台价值。",
      icon: <AuditOutlined />,
    },
    {
      name: "载体审核专员",
      role: "材料初审",
      text: "企业提交后可以直接看到材料版本、缺项说明和审核意见，不再依赖线下表格来回确认。",
      icon: <FileSearchOutlined />,
    },
    {
      name: "政策运营人员",
      role: "政策发布",
      text: "政策、申报条件和通知可以集中维护，前台展示和三端办理口径更容易保持一致。",
      icon: <SafetyCertificateOutlined />,
    },
    {
      name: "材料管理员",
      role: "文件归集",
      text: "同一份证照、协议和申报附件能按企业归档，后续复核时不用重新追材料。",
      icon: <FileDoneOutlined />,
    },
    {
      name: "通知管理员",
      role: "消息触达",
      text: "审核退回、补充材料和终审结果都有统一通知入口，减少电话和群消息反复确认。",
      icon: <BellOutlined />,
    },
    {
      name: "数据归档人员",
      role: "台账沉淀",
      text: "入驻、申报、审核和绩效记录能形成完整台账，后续统计和追溯都有依据。",
      icon: <DatabaseOutlined />,
    },
    {
      name: "接口联调人员",
      role: "系统接入",
      text: "页面链路、角色权限和接口边界清楚，接入正式数据时可以分模块逐步替换。",
      icon: <CloudServerOutlined />,
    },
  ],
  en: [
    {
      name: "Enterprise Specialist",
      role: "Application service",
      text: "Company profiles, carrier matching, and policy applications move forward in one continuous path.",
      icon: <CheckCircleOutlined />,
    },
    {
      name: "Carrier Operator",
      role: "Review coordination",
      text: "Pending reviews, urgent tasks, and missing materials are grouped by type for quick follow-up.",
      icon: <BellOutlined />,
    },
    {
      name: "Government Reviewer",
      role: "Governance oversight",
      text: "Policy publishing, final review, and notification management sit in one clear workspace.",
      icon: <AuditOutlined />,
    },
    {
      name: "Project Admin",
      role: "Integration readiness",
      text: "The frontend already demonstrates the full path, so backend services can replace mock data step by step.",
      icon: <CheckCircleOutlined />,
    },
    {
      name: "Enterprise User",
      role: "Material handling",
      text: "Uploaded files can be reused across multiple application scenarios to reduce duplicate entry.",
      icon: <BellOutlined />,
    },
    {
      name: "Platform Operator",
      role: "Unified access",
      text: "Login, registration, and three-side permissions are clear, making the platform value easier to explain.",
      icon: <AuditOutlined />,
    },
    {
      name: "Carrier Reviewer",
      role: "Material pre-check",
      text: "Submitted materials, missing items, and review notes are visible in one place without back-and-forth spreadsheets.",
      icon: <FileSearchOutlined />,
    },
    {
      name: "Policy Operator",
      role: "Policy publishing",
      text: "Policies, eligibility rules, and notices can be maintained centrally so each portal keeps the same wording.",
      icon: <SafetyCertificateOutlined />,
    },
    {
      name: "Material Admin",
      role: "File collection",
      text: "Licenses, agreements, and application attachments can be archived by company for later review.",
      icon: <FileDoneOutlined />,
    },
    {
      name: "Notice Admin",
      role: "Message delivery",
      text: "Returned reviews, missing material requests, and final results all use one notification entry.",
      icon: <BellOutlined />,
    },
    {
      name: "Archive Specialist",
      role: "Ledger records",
      text: "Onboarding, applications, reviews, and performance records form a traceable operational ledger.",
      icon: <DatabaseOutlined />,
    },
    {
      name: "Integration Engineer",
      role: "System access",
      text: "Page flows, permissions, and API boundaries are clear enough to replace mock data module by module.",
      icon: <CloudServerOutlined />,
    },
  ],
} satisfies Record<"zh" | "en", UsageCard[]>;

const resourceCenterItems = [
  {
    title: "产品使用说明",
    text: "快速了解三端角色、登录入口、工作台使用路径和常见办理顺序。",
    icon: <FileDoneOutlined />,
    href: "/docs/product-usage",
    action: "查看流程",
  },
  {
    title: "功能文档",
    text: "按企业端、载体端、政务端整理功能说明，便于理解业务流程与操作边界。",
    icon: <CodeOutlined />,
    href: "/docs/feature-docs",
    action: "查看文档",
  },
  {
    title: "政策规范",
    text: "汇总政策申报、审核口径、材料校验和账号治理相关规范。",
    icon: <SafetyCertificateOutlined />,
    href: "/docs/policy-rules",
    action: "查看规范",
  },
  {
    title: "模板资源",
    text: "提供入驻协议、申报材料、绩效填报和通知公告模板入口。",
    icon: <DatabaseOutlined />,
    href: "/docs/templates",
    action: "进入下载",
  },
  {
    title: "FAQ与支持",
    text: "收纳账号登录、材料上传、审批流转、演示环境的常见问题。",
    icon: <BulbOutlined />,
    href: "/docs/faq-support",
    action: "获取支持",
  },
  {
    title: "更新公告",
    text: "查看近期页面、业务流程、账号权限和接口服务能力的更新记录。",
    icon: <AppstoreOutlined />,
    href: "/docs/release-notes",
    action: "查看更新",
  },
];

const resourceCardItems = [
  {
    label: "文档指南",
    bgColor: "#1b2433",
    textColor: "#ffffff",
    links: [resourceCenterItems[0], resourceCenterItems[1]],
  },
  {
    label: "规范资源",
    bgColor: "#233243",
    textColor: "#ffffff",
    links: [resourceCenterItems[2], resourceCenterItems[3]],
  },
  {
    label: "支持动态",
    bgColor: "#26323f",
    textColor: "#ffffff",
    links: [resourceCenterItems[4], resourceCenterItems[5]],
  },
];

export default function HomePage() {
  const [language, setLanguage] = useState<"zh" | "en">("zh");
  const [activePlatformIndex, setActivePlatformIndex] = useState(1);
  const [activeCaseIndex, setActiveCaseIndex] = useState(1);
  const [caseDirection, setCaseDirection] = useState<"prev" | "next">("next");
  const [themeMode, setThemeMode] = useState<"day" | "night">("day");
  const [resourceCenterOpen, setResourceCenterOpen] = useState(false);
  const [dotOffset, setDotOffset] = useState({ x: 0, y: 0 });
  const [showBackHome, setShowBackHome] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const isEnglish = language === "en";
  const isNight = themeMode === "night";
  const copy = homeCopy[language];
  const currentTrustLogos = isEnglish ? enTrustLogos : trustLogos;
  const currentDesignPrinciples = isEnglish ? enDesignPrinciples : designPrinciples;
  const currentPlatformTabs = isEnglish ? enPlatformTabs : platformTabs;
  const currentCaseSlides = isEnglish ? enCaseSlides : caseSlides;
  const currentPortalCards = isEnglish ? enPortalCards : portalCards;
  const currentFooterGroups = footerLinkGroups[language];
  const currentFooterMarqueeItems = footerMarqueeItems[language];
  const currentUsageCards = usageCards[language];
  const usageRows = [
    currentUsageCards.filter((_, index) => index % 2 === 0),
    currentUsageCards.filter((_, index) => index % 2 === 1),
  ];
  const activePlatform = currentPlatformTabs[activePlatformIndex];

  useEffect(() => {
    const updateBackHomeVisibility = () => {
      setShowBackHome(window.scrollY > 8);
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(scrollable > 0 ? Math.min(Math.max(window.scrollY / scrollable, 0), 1) : 0);
    };

    updateBackHomeVisibility();
    window.addEventListener("scroll", updateBackHomeVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateBackHomeVisibility);
    };
  }, []);

  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>(".arco-scroll-reveal"));
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -18% 0px",
        threshold: 0.16,
      },
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
    };
  }, []);

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

  const getCaseCardState = (index: number) => {
    const total = currentCaseSlides.length;
    const previousIndex = (activeCaseIndex - 1 + total) % total;
    const nextIndex = (activeCaseIndex + 1) % total;

    if (index === activeCaseIndex) return "is-active";
    if (index === previousIndex) return "is-prev";
    if (index === nextIndex) return "is-next";
    return "is-hidden";
  };

  const renderCaseCard = (caseItem: (typeof currentCaseSlides)[number], index: number) => {
    const isActive = index === activeCaseIndex;

    return (
      <div
        className={`arco-case-card is-${caseItem.tone} ${getCaseCardState(index)}`}
        key={caseItem.title}
        aria-hidden={!isActive}
      >
        <div className="arco-case-screen">
          <div className="case-screen-top">
            <div>
              <span>{caseItem.screenTitle}</span>
              <em>{caseItem.status}</em>
            </div>
            <strong>{caseItem.leadMetric}</strong>
          </div>
          <div className="case-screen-metrics">
            {caseItem.supporting.map(([name, value]) => (
              <div key={name}>
                <span>{name}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="case-screen-list">
            {caseItem.queue.map((item, queueIndex) => (
              <article key={item}>
                <em>{String(queueIndex + 1).padStart(2, "0")}</em>
                <div>
                  <strong>{item}</strong>
                  <span>
                    <i style={{ width: caseItem.bars[queueIndex] }} />
                  </span>
                </div>
              </article>
            ))}
          </div>
          <div className="case-screen-footer">
            <span>{caseItem.insight}</span>
          </div>
        </div>
        <article className="case-detail-panel">
          {caseItem.icon}
          <h3>{caseItem.title}</h3>
          <p>{caseItem.text}</p>
          <div className="case-detail-tags">
            {caseItem.chips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
          <div className="case-detail-metric">
            <strong>{caseItem.leadMetric}</strong>
            <span>{caseItem.leadLabel}</span>
          </div>
          <div className="case-detail-checklist">
            {caseItem.checklist.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <p className="case-detail-result">{caseItem.result}</p>
          <Link to={caseItem.link} tabIndex={isActive ? 0 : -1}>
            {copy.viewWorkspace}
            <ArrowRightOutlined />
          </Link>
        </article>
      </div>
    );
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

  const replaySectionReveal = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target || !target.classList.contains("arco-scroll-reveal")) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      target.classList.add("is-visible");
      return;
    }

    target.classList.remove("is-visible");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        target.classList.add("is-visible");
      });
    });
  };

  const handleSectionNavClick = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault();

    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targetHash = `#${sectionId}`;
    const updateHistory = window.location.hash === targetHash ? window.history.replaceState : window.history.pushState;

    updateHistory.call(window.history, null, "", targetHash);
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    window.setTimeout(() => replaySectionReveal(sectionId), prefersReducedMotion ? 0 : 340);
  };

  const scrollBackHome = () => {
    const startY = window.scrollY;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, 0);
      window.history.replaceState(null, "", window.location.pathname);
      setShowBackHome(false);
      return;
    }

    const duration = Math.min(520, Math.max(260, startY * 0.28));
    const startedAt = performance.now();
    const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3);

    const animate = (currentTime: number) => {
      const progress = Math.min(1, (currentTime - startedAt) / duration);
      window.scrollTo(0, Math.round(startY * (1 - easeOutCubic(progress))));

      if (progress < 1) {
        requestAnimationFrame(animate);
        return;
      }

      window.history.replaceState(null, "", window.location.pathname);
      setShowBackHome(false);
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className={`public-home-page arco-home ${isEnglish ? "is-english" : ""} ${isNight ? "is-night" : ""}`}>
      <header className="arco-home-header">
        <div className="arco-home-header-inner">
          <button
            className="arco-menu-grid"
            aria-label="打开平台文档与资源中心"
            aria-expanded={resourceCenterOpen}
            aria-controls="home-resource-center"
            type="button"
            onClick={() => setResourceCenterOpen((current) => !current)}
          >
            <span className="arco-menu-line" />
            <span className="arco-menu-line" />
          </button>
          <Link to="/" className="arco-brand" aria-label={copy.homeLabel}>
            <BrandLogo variant="mark" tone={isNight ? "night" : "default"} />
            <strong>{copy.brandName}</strong>
          </Link>
          <nav className="arco-nav-links" aria-label={isEnglish ? "Home navigation" : "首页导航"}>
            <a href="#home" className="arco-roll-link">
              <span className="arco-text-roller">
                <span>首页</span>
                <span>Home</span>
              </span>
            </a>
            <a href="#resources" className="arco-roll-link" onClick={(event) => handleSectionNavClick(event, "resources")}>
              <span className="arco-text-roller">
                <span>业务库</span>
                <span>Library</span>
              </span>
            </a>
            <a href="#ecosystem" className="arco-roll-link" onClick={(event) => handleSectionNavClick(event, "ecosystem")}>
              <span className="arco-text-roller">
                <span>流程</span>
                <span>Flows</span>
              </span>
            </a>
            <a href="#cases" className="arco-roll-link" onClick={(event) => handleSectionNavClick(event, "cases")}>
              <span className="arco-text-roller">
                <span>场景接入</span>
                <span>Scenarios</span>
              </span>
            </a>
            <a href="#journey" className="arco-roll-link" onClick={(event) => handleSectionNavClick(event, "journey")}>
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
        <div
          className="arco-home-scroll-progress"
          aria-hidden="true"
          style={{ "--home-scroll-progress": scrollProgress } as CSSProperties}
        >
          <span />
        </div>
      </header>

      <div
        className={`arco-resource-center-layer${resourceCenterOpen ? " is-open" : ""}`}
        aria-hidden={!resourceCenterOpen}
      >
        <button
          className="arco-resource-center-backdrop"
          type="button"
          tabIndex={resourceCenterOpen ? 0 : -1}
          aria-label="关闭平台文档与资源中心"
          onClick={() => setResourceCenterOpen(false)}
        />
        <aside id="home-resource-center" className="arco-resource-center-panel" aria-label="平台文档与资源中心">
          <div className="arco-resource-cardnav-top">
            <button type="button" onClick={() => setResourceCenterOpen(false)} aria-label="关闭资源中心">
              ×
            </button>
            <div className="arco-resource-cardnav-brand">
              <BrandLogo variant="mark" tone={isNight ? "night" : "default"} />
              <strong>平台资源中心</strong>
            </div>
            <Link to="/login" onClick={() => setResourceCenterOpen(false)}>
              开始使用
            </Link>
          </div>

          <div className="arco-resource-cardnav-content">
            {resourceCardItems.map((group) => (
              <section
                key={group.label}
                className="arco-resource-nav-card"
                style={{ backgroundColor: group.bgColor, color: group.textColor }}
              >
                <strong>{group.label}</strong>
                <div>
                  {group.links.map((item) => (
                    <Link key={item.title} to={item.href} onClick={() => setResourceCenterOpen(false)}>
                      <ArrowRightOutlined />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </aside>
      </div>

      <main>
        <section className="arco-hero" id="home">
          <div className="arco-hero-copy">
            <div className="home-hero-logo-reveal" aria-label={copy.heroBrand}>
              <span className="home-hero-logo-mark">
                <BrandLogo variant="mark" tone={isNight ? "night" : "default"} />
              </span>
              <span className="home-hero-logo-text">
                <strong>{copy.brandName}</strong>
              </span>
            </div>
            <h1 className="arco-hero-title-animated">
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
                <span className="arco-window-title">
                  <BrandLogo variant="mark" tone={isNight ? "night" : "default"} />
                  {isEnglish ? "Incubation Platform" : "孵化平台"}
                </span>
                <span className="arco-window-address">incubation.platform</span>
                <span className="arco-window-controls" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
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

        <section className="arco-resource-section arco-scroll-reveal" id="resources">
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
                <span className="arco-principle-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="arco-ecosystem-section arco-scroll-reveal" id="ecosystem">
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

        <section className="arco-case-section arco-scroll-reveal" id="cases">
          <span className="arco-section-kicker">{copy.caseKicker}</span>
          <h2>{copy.caseTitle}</h2>
          <div className={`arco-case-carousel is-${caseDirection}`}>
            <button type="button" aria-label={copy.prevCase} onClick={() => switchCase(-1)}>
              <LeftOutlined />
            </button>
            <div className="arco-case-stage" aria-live="polite">
              {currentCaseSlides.map((caseItem, index) => renderCaseCard(caseItem, index))}
            </div>
            <button type="button" aria-label={copy.nextCase} onClick={() => switchCase(1)}>
              <RightOutlined />
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

        <section className="arco-journey-section arco-scroll-reveal" id="journey">
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

        <section className="arco-usage-section arco-scroll-reveal" aria-label={isEnglish ? "How platform users work" : "平台用户使用方式"}>
          <h2>{isEnglish ? "How platform users work." : "平台用户会怎么使用。"}</h2>
          <div className="arco-usage-grid">
            {usageRows.map((row, rowIndex) => (
              <div key={rowIndex === 0 ? "usage-row-top" : "usage-row-bottom"} className={`arco-usage-track ${rowIndex === 0 ? "is-top" : "is-bottom"}`}>
                {[...row, ...row].map((quote, index) => (
                  <article key={`${quote.name}-${quote.role}-${rowIndex}-${index}`}>
                    <div className="arco-usage-person">
                      <span className="arco-usage-avatar" aria-hidden="true">
                        {quote.icon}
                      </span>
                      <strong>{quote.name}</strong>
                      <small>{quote.role}</small>
                    </div>
                    <p>{quote.text}</p>
                    <i aria-hidden="true">{quote.icon}</i>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="arco-flow-marquee-section arco-scroll-reveal" aria-label={isEnglish ? "Partners" : "合作伙伴"}>
          <h2>{isEnglish ? "Partners" : "合作伙伴"}</h2>
          <div className="arco-flow-marquee" aria-hidden="true">
            <div>
              {[...currentFooterMarqueeItems, ...currentFooterMarqueeItems].map((item, index) => (
                <span key={`${item.label}-${index}`}>
                  <i aria-hidden="true" style={brandIconStyle(item.color)}>
                    {item.icon}
                  </i>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="arco-footer">
        <div className="arco-footer-contact">
          <BrandLogo variant="mark" tone={isNight ? "night" : "default"} />
          <h2>{copy.contact}</h2>
          <p>{copy.contactText}</p>
          <Link to="/docs/product-usage">
            {isEnglish ? "View platform guide" : "查看平台指南"}
            <ArrowRightOutlined />
          </Link>
        </div>
        <nav className="arco-footer-map" aria-label={isEnglish ? "Footer resources" : "底部资源导航"}>
          {currentFooterGroups.map((group) => (
            <section key={group.title} className="arco-footer-column">
              <strong>{group.title}</strong>
              <div>
                {group.links.map((item) => (
                  <Link key={item.label} to={item.href}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </nav>
        <div className="arco-footer-action-row">
            <div className="arco-footer-rating" aria-label={isEnglish ? "Rate this platform" : "评价平台体验"}>
              <div>
                <strong>{isEnglish ? "Rate the experience" : "体验反馈"}</strong>
              </div>
              <div className="arco-star-rating" role="radiogroup" aria-label={isEnglish ? "Rating" : "评分"}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Fragment key={star}>
                    <input type="radio" id={`home-star-${star}`} name="home-star-rating" value={star} />
                    <label htmlFor={`home-star-${star}`} aria-label={`${star} ${isEnglish ? "stars" : "星"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          pathLength={360}
                          d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"
                        />
                      </svg>
                    </label>
                </Fragment>
              ))}
              </div>
            </div>
        </div>
        <div className="arco-footer-bottom">
          <span>Powered by Incubation Platform</span>
          <small>{isEnglish ? "Incubation service platform © 2026" : "创新创业孵化服务平台 © 2026"}</small>
        </div>
      </footer>
      <button
        type="button"
        className={`arco-back-home ${showBackHome ? "is-visible" : ""}`}
        aria-label={isEnglish ? "Back to homepage top" : "Back to home top"}
        onClick={scrollBackHome}
      >
        <ArrowUpOutlined />
      </button>
    </div>
  );
}
