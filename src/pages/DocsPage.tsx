import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BulbOutlined,
  CodeOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Link, Navigate, useParams } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";

const docs = [
  {
    slug: "product-usage",
    group: "产品使用说明",
    title: "平台使用总览",
    icon: <FileDoneOutlined />,
    summary:
      "本说明面向首次使用平台的企业、孵化载体及政务管理用户，概述账号登录、角色入口、资料维护、业务办理、审核协同与通知跟踪等核心使用方式。",
    sections: [
      {
        heading: "适用角色",
        body:
          "平台按照企业端、载体端、政务端三类角色组织业务权限。企业端主要负责企业资料维护、材料上传、入驻申请及政策申报；载体端主要负责入驻初审、企业服务、变更审核和绩效填报；政务端主要负责企业与载体监管、政策发布、申报终审、通知管理和账号治理。不同角色登录后将进入各自工作台，页面菜单、待办事项和数据范围均依据账号权限进行展示。",
      },
      {
        heading: "推荐使用路径",
        body:
          "首次使用时，建议先完成账号登录与身份确认，再进入对应角色工作台查看待办事项。企业用户应优先完善企业基础信息和联系人信息，并上传可复用的证明材料；载体用户应优先处理待审核企业、变更事项和绩效任务；政务用户应优先查看申报终审、政策发布、通知触达和监管数据。日常使用中，可通过工作台入口进入具体业务页面，并通过通知中心持续跟踪处理进度。",
      },
    ],
    steps: [
      "完成账号开通、身份确认与登录校验",
      "进入与账号权限匹配的角色工作台",
      "完善基础资料并核对关键联系人信息",
      "按业务要求提交申请、材料或审核意见",
      "通过工作台和通知中心跟踪办理进度",
    ],
    table: [
      ["企业端", "企业资料维护、文件管理、载体浏览、入驻申请、政策申报及办理进度查询"],
      ["载体端", "入驻初审、企业档案核验、变更审核、绩效填报、政策申报协同及企业服务管理"],
      ["政务端", "企业查询、载体查询、政策管理、申报终审、通知发布、账号治理及监管数据查看"],
    ],
  },
  {
    slug: "feature-docs",
    group: "功能文档",
    title: "功能模块说明",
    icon: <CodeOutlined />,
    summary:
      "本部分按业务模块说明平台主要页面能力、操作入口、使用对象和数据边界，帮助用户快速理解各模块在业务流程中的定位。",
    sections: [
      {
        heading: "工作台",
        body:
          "工作台是各角色进入系统后的统一业务入口，集中展示当前账号可处理的待办事项、关键指标、常用功能、通知提醒和流程进度。企业端侧重资料完整度、入驻状态和申报入口；载体端侧重审核队列、企业服务和绩效事项；政务端侧重终审事项、政策运行、监管数据和账号治理。用户应优先通过工作台判断当前业务优先级，再进入具体页面办理。",
      },
      {
        heading: "材料与申报",
        body:
          "材料模块用于上传、查看、复用和管理企业或业务办理所需文件，申报模块用于发起入驻、政策、绩效、变更等事项。系统会围绕材料完整度、业务状态、处理节点和通知结果进行展示，帮助用户减少重复提交，并确保每一次申报均能关联到明确的材料依据、处理意见和办理记录。",
      },
    ],
    steps: [
      "确认当前登录角色及可见功能范围",
      "在工作台查看待办事项与关键业务入口",
      "进入对应业务列表核对数据状态",
      "按页面要求新增、提交、审核或归档业务事项",
      "返回工作台查看状态变化和后续待办",
    ],
    table: [
      ["工作台模块", "展示待办事项、业务入口、通知提醒、进度指标和角色专属操作入口"],
      ["文件管理模块", "支持材料上传、资料复用、状态展示、附件查看和申报材料关联"],
      ["审核管理模块", "覆盖待办列表、审核意见、处理结果、流程追踪和通知同步"],
    ],
  },
  {
    slug: "policy-rules",
    group: "政策规范",
    title: "政策与审核规范",
    icon: <SafetyCertificateOutlined />,
    summary:
      "本部分说明政策发布、政策申报、材料校验、审核流转和账号权限管理的基本规范，作为平台业务办理和审核协同的操作参考。",
    sections: [
      {
        heading: "申报规范",
        body:
          "政策申报应以正式发布的政策内容为依据，重点核对适用对象、申报条件、受理时间、必填材料、附件格式和补充说明。企业提交前应保证基础信息真实完整、材料与申报事项一致、联系人可正常接收通知；载体或政务人员审核时应重点关注资质条件、材料完整度、申报时限和重复申报风险。",
      },
      {
        heading: "审核规范",
        body:
          "审核流程应保留受理、初审、复核、终审、退回、通过和通知等关键节点。审核人员填写意见时，应明确处理结论、依据说明、补正要求和处理时间，避免使用无法追溯的笼统描述。涉及退回或补正的事项，应在通知中说明缺失内容、修改要求和再次提交路径，确保企业能够按要求完成后续处理。",
      },
    ],
    steps: [
      "核对政策适用范围、申报条件和受理时限",
      "校验企业资质、基础信息和联系人信息",
      "检查必填材料、附件格式和内容一致性",
      "填写明确的审核结论、依据说明和处理意见",
      "同步通知结果并保留流程记录以便追溯",
    ],
    table: [
      ["材料完整", "企业基础信息、证明文件、协议材料、申报附件和补充说明均应按要求提交"],
      ["流程清晰", "每个审核节点应记录处理状态、处理人员、处理时间、处理意见和通知结果"],
      ["结果可追踪", "申报状态、审核意见、退回原因、通过结果和通知回执均应可在工作台查询"],
    ],
  },
  {
    slug: "templates",
    group: "模板资源",
    title: "业务模板资源",
    icon: <DatabaseOutlined />,
    summary:
      "本部分整理平台常用业务模板的适用场景、填报要求和复用建议，覆盖入驻协议、政策申报、绩效填报、通知公告和账号治理等材料。",
    sections: [
      {
        heading: "模板分类",
        body:
          "模板资源按照业务场景分为企业入驻、政策申报、载体绩效、通知公告、变更申请和账号治理等类别。不同模板用于统一材料格式、减少重复沟通、规范字段口径，并帮助审核人员快速判断材料是否满足办理要求。用户下载或引用模板前，应先确认当前业务事项、角色权限和提交页面要求。",
      },
      {
        heading: "使用建议",
        body:
          "填写模板时，应保持单位名称、统一社会信用代码、联系人、日期、附件名称等关键字段一致。已上传且通过审核的材料可作为后续申报的复用依据，但当企业信息、政策要求或材料有效期发生变化时，应及时更新文件。模板仅作为填报参考，最终提交内容仍应以具体业务页面和正式政策要求为准。",
      },
    ],
    steps: [
      "根据办理事项选择对应业务场景",
      "查看模板说明并确认适用对象和必填字段",
      "按要求补充企业、载体或政策相关信息",
      "上传至文件管理并关联到具体申报事项",
      "在后续业务中复用已审核通过的有效材料",
    ],
    table: [
      ["入驻协议", "适用于企业入驻、载体对接、服务确认和入驻期限说明等场景"],
      ["申报附件", "适用于政策申报、资格证明、补贴申请、材料补正和专项说明等场景"],
      ["通知公告", "适用于政务发布、审核结果告知、业务提醒、补正通知和版本更新说明等场景"],
    ],
  },
  {
    slug: "faq-support",
    group: "FAQ与支持",
    title: "常见问题与支持",
    icon: <BulbOutlined />,
    summary:
      "本部分汇总账号登录、权限入口、资料提交、申报流转、通知接收和问题反馈等高频事项，帮助用户快速定位并处理常见使用问题。",
    sections: [
      {
        heading: "登录失败怎么办",
        body:
          "请先确认账号已由管理员开通，并使用与账号角色一致的登录入口。若提示账号或密码错误，应核对手机号、用户名、密码和角色选择是否正确；若提示权限不足或账号不可用，应联系平台管理员核验账号状态、所属组织、角色授权和启用情况。为保障账号安全，请勿将登录凭据转交他人使用。",
      },
      {
        heading: "看不到业务入口怎么办",
        body:
          "平台菜单和业务入口均受角色权限控制。企业端、载体端、政务端拥有不同的数据范围和操作能力，登录后系统会自动进入对应工作台。若确认账号角色正确但仍无法看到相关入口，可先刷新页面并重新登录；如问题仍存在，应提供账号名称、所属组织、期望访问的功能入口和问题截图，由管理员核验权限配置。",
      },
    ],
    steps: [
      "确认登录账号、角色身份和所属组织",
      "核验账号启用状态、权限范围和登录入口",
      "刷新当前页面或重新登录后再次访问",
      "查阅资源中心说明并确认业务操作路径",
      "向管理员反馈账号信息、问题页面和操作截图",
    ],
    table: [
      ["账号开通", "由平台管理员按照组织、角色、岗位职责和数据范围统一配置"],
      ["权限范围", "企业端、载体端、政务端根据业务分工分别授予菜单入口和操作权限"],
      ["服务支持", "覆盖登录异常、材料提交、申报流转、审核反馈、通知接收和页面操作等问题"],
    ],
  },
  {
    slug: "release-notes",
    group: "更新公告",
    title: "更新公告",
    icon: <AppstoreOutlined />,
    summary:
      "本部分记录平台首页、资源中心、三端工作台、AI 助手和业务流程能力的近期更新，便于用户了解功能变化和使用影响。",
    sections: [
      {
        heading: "最近更新",
        body:
          "近期版本围绕平台门户、资源中心、三端工作台和 AI 助手进行了集中优化。首页新增资源中心入口，方便用户查看产品说明、功能文档、政策规范、模板资源、常见问题和更新公告；企业、载体、政务三端持续完善信息页、业务入口和通知提示；AI 助手在多角色页面提供辅助咨询和操作引导能力。",
      },
      {
        heading: "后续计划",
        body:
          "后续将持续补充政策文件、模板资源、流程说明、版本记录和常见问题内容，并根据用户反馈优化工作台数据呈现、申报材料复用、审核意见追踪和通知触达体验。涉及业务规则、权限范围或流程节点变化的更新，将通过更新公告和通知中心同步说明。",
      },
    ],
    steps: [
      "首页资源中心入口上线并接入用户指南",
      "文档式详情页覆盖六类常用说明内容",
      "AI 助手在企业端、载体端和政务端可用",
      "角色权限、信息页和业务入口说明持续完善",
      "政策规范、模板资源和更新记录按版本补充",
    ],
    table: [
      ["首页", "新增资源中心入口，集中承载产品说明、功能文档、政策规范、模板资源和支持内容"],
      ["AI 助手", "在三端页面提供全局咨询入口，支持围绕业务流程和平台操作进行辅助说明"],
      ["文档", "新增并完善产品说明、功能模块、政策规则、模板资源、FAQ 支持和更新公告页面"],
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
