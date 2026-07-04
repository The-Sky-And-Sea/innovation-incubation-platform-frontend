import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BulbOutlined,
  CodeOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Link, Navigate, useParams } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";

const docs = [
  {
    slug: "product-usage",
    group: "产品使用说明",
    title: "平台使用总览",
    icon: <FileDoneOutlined />,
    summary: "了解企业端、载体端、政务端如何围绕入驻、材料、审核、政策和通知完成协同办理。",
    sections: [
      {
        heading: "适用角色",
        body: "平台面向企业用户、孵化载体运营人员和政务管理人员。企业侧负责提交信息和材料，载体侧负责初审与协同，政务侧负责终审、政策发布和监督管理。",
      },
      {
        heading: "推荐使用路径",
        body: "首次进入建议先完成账号登录和角色确认，再进入对应工作台。企业端优先完善企业信息和材料；载体端优先处理待审企业；政务端优先查看申报与通知状态。",
      },
    ],
    steps: ["完成账号开通与登录", "进入对应角色工作台", "完善基础资料", "提交或审核业务事项", "查看通知和进度"],
    table: [
      ["企业端", "企业信息、文件管理、载体浏览、政策申报"],
      ["载体端", "入驻审核、变更审核、绩效填报、企业管理"],
      ["政务端", "企业查询、载体查询、政策管理、申报终审"],
    ],
  },
  {
    slug: "feature-docs",
    group: "功能文档",
    title: "功能模块说明",
    icon: <CodeOutlined />,
    summary: "按业务模块说明页面能力、主要操作和使用范围，方便用户理解业务流程与操作边界。",
    sections: [
      {
        heading: "工作台",
        body: "工作台聚合当前角色的待办、业务入口、进度指标和通知提醒，是用户进入系统后的首要操作页面。",
      },
      {
        heading: "材料与申报",
        body: "材料模块用于上传、复用和查看申报文件；申报模块用于提交入驻、政策、绩效等业务事项，并展示处理进度。",
      },
    ],
    steps: ["确认页面角色", "查看功能卡片", "进入业务列表", "发起新增或审核", "返回工作台追踪状态"],
    table: [
      ["文件管理", "企业材料上传、状态展示、复用提示"],
      ["政策管理", "政策查看、申报入口、匹配辅助"],
      ["审核管理", "待办列表、审核结果、流程追踪"],
    ],
  },
  {
    slug: "policy-rules",
    group: "政策规范",
    title: "政策与审核规范",
    icon: <SafetyCertificateOutlined />,
    summary: "沉淀政策发布、申报条件、材料校验、审核流转和账号治理相关规则。",
    sections: [
      {
        heading: "申报规范",
        body: "政策申报需要满足政策适用范围、企业资质、材料完整度和时限要求。页面中应优先展示必填材料和当前处理状态。",
      },
      {
        heading: "审核规范",
        body: "审核流程建议保留受理、初审、复核、终审和通知节点，重要操作需要明确结果、意见和时间。",
      },
    ],
    steps: ["确认政策范围", "核验企业条件", "检查材料完整度", "提交审核意见", "同步通知结果"],
    table: [
      ["材料完整", "企业基础信息、协议文件、申报附件均已提交"],
      ["流程清晰", "每个节点保留状态、处理人和处理时间"],
      ["结果可追踪", "审核意见和通知回执可在工作台查看"],
    ],
  },
  {
    slug: "templates",
    group: "模板资源",
    title: "业务模板资源",
    icon: <DatabaseOutlined />,
    summary: "整理入驻协议、申报材料、绩效填报、通知公告等常用模板的使用说明。",
    sections: [
      {
        heading: "模板分类",
        body: "模板按业务场景拆分为企业入驻、政策申报、载体绩效、通知公告和账号治理，便于统一材料标准和规范填报口径。",
      },
      {
        heading: "使用建议",
        body: "模板上传后应形成可复用材料，避免企业在不同申报流程中重复提交同一类文件。",
      },
    ],
    steps: ["选择业务场景", "下载或查看模板", "按要求补充材料", "上传到文件管理", "在申报中复用"],
    table: [
      ["入驻协议", "企业入驻和载体对接场景"],
      ["申报附件", "政策申报和补贴申请场景"],
      ["通知公告", "政务发布和结果告知场景"],
    ],
  },
  {
    slug: "faq-support",
    group: "FAQ与支持",
    title: "常见问题与支持",
    icon: <BulbOutlined />,
    summary: "回答账号登录、权限范围、材料上传、申报流转和页面操作中的高频问题。",
    sections: [
      {
        heading: "登录失败怎么办",
        body: "请确认账号已由管理员开通，并选择与账号权限一致的身份入口登录。若仍无法登录，请联系平台管理员核验账号状态。",
      },
      {
        heading: "看不到业务入口怎么办",
        body: "业务入口受角色控制。企业、载体、政务三端拥有不同菜单，登录后会自动进入对应工作台。",
      },
    ],
    steps: ["确认角色身份", "核验账号状态", "刷新当前页面", "查看资源中心文档", "进入对应工作台"],
    table: [
      ["账号开通", "由平台管理员按组织与角色统一配置"],
      ["权限范围", "企业端、载体端、政务端按岗位职责分别授权"],
      ["服务支持", "账号登录、材料提交、流程流转、通知接收等使用问题"],
    ],
  },
  {
    slug: "release-notes",
    group: "更新公告",
    title: "更新公告",
    icon: <AppstoreOutlined />,
    summary: "记录平台首页、三端工作台、AI 助手和业务流程能力的近期更新。",
    sections: [
      {
        heading: "最近更新",
        body: "新增全局 AI 助手入口、企业端工作台优化、首页资源中心入口和文档式说明页面。",
      },
      {
        heading: "后续计划",
        body: "后续将持续发布政策文档、模板资源、功能优化和版本变更记录。",
      },
    ],
    steps: ["首页资源中心上线", "文档式详情页上线", "AI 助手三端可用", "角色权限说明完善", "业务模板持续更新"],
    table: [
      ["首页", "新增资源中心入口"],
      ["AI 助手", "三端页面全局可用"],
      ["文档", "新增产品说明、规范、FAQ、公告等页面"],
    ],
  },
];

export default function DocsPage() {
  const { slug = "product-usage" } = useParams();
  const activeIndex = docs.findIndex((item) => item.slug === slug);
  const activeDoc = docs[activeIndex];

  if (!activeDoc) {
    return <Navigate to="/docs/product-usage" replace />;
  }

  const previousDoc = docs[activeIndex - 1];
  const nextDoc = docs[activeIndex + 1];

  return (
    <div className="docs-page">
      <header className="docs-header">
        <Link to="/" className="docs-brand" aria-label="返回首页">
          <BrandLogo variant="mark" />
          <strong>孵化平台用户指南</strong>
        </Link>
        <label className="docs-search">
          <SearchOutlined />
          <span>搜索文档、规范、模板</span>
        </label>
        <Link to="/login" className="docs-login-link">
          进入平台
        </Link>
      </header>

      <div className="docs-shell">
        <aside className="docs-sidebar" aria-label="文档目录">
          <Link to="/" className="docs-back-home">
            <ArrowLeftOutlined />
            返回首页
          </Link>
          <strong>资源中心</strong>
          <nav>
            {docs.map((item) => (
              <Link key={item.slug} to={`/docs/${item.slug}`} className={item.slug === slug ? "is-active" : ""}>
                <i>{item.icon}</i>
                <span>{item.group}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="docs-content">
          <div className="docs-breadcrumb">
            <Link to="/">首页</Link>
            <span>/</span>
            <span>资源中心</span>
            <span>/</span>
            <strong>{activeDoc.group}</strong>
          </div>
          <article className="docs-article">
            <div className="docs-article-heading">
              <span>{activeDoc.group}</span>
              <h1>{activeDoc.title}</h1>
              <p>{activeDoc.summary}</p>
            </div>

            {activeDoc.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </section>
            ))}

            <section>
              <h2>操作流程</h2>
              <ol className="docs-step-list">
                {activeDoc.steps.map((step, index) => (
                  <li key={step}>
                    <em>{String(index + 1).padStart(2, "0")}</em>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h2>参考说明</h2>
              <div className="docs-table">
                {activeDoc.table.map(([name, value]) => (
                  <div key={name}>
                    <strong>{name}</strong>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="docs-callout">
              <strong>文档说明</strong>
              <span>本文档用于说明平台功能、业务规范与操作流程，具体执行口径以平台正式发布的政策文件和管理要求为准。</span>
            </div>
          </article>

          <nav className="docs-pagination" aria-label="文档翻页">
            {previousDoc ? (
              <Link to={`/docs/${previousDoc.slug}`}>
                <ArrowLeftOutlined />
                <span>
                  上一篇
                  <strong>{previousDoc.group}</strong>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {nextDoc && (
              <Link to={`/docs/${nextDoc.slug}`}>
                <span>
                  下一篇
                  <strong>{nextDoc.group}</strong>
                </span>
                <ArrowRightOutlined />
              </Link>
            )}
          </nav>
        </main>
      </div>
    </div>
  );
}
