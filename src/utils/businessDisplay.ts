const fieldLabels: Record<string, string> = {
  application_condition: "申报条件",
  fulfillment_criteria: "兑现标准",
  application_materials: "申报材料",
  process: "办理流程",
  contact: "联系人",
  project: "项目名称",
  amount: "申请金额",
  requested_amount: "申请金额",
  service_enterprises: "服务企业数量",
  incubation_results: "孵化成果说明",
  events: "创业活动数量",
  revenue: "年度营收",
  total_area: "可自主支配场地总面积",
  incubation_area: "孵化面积",
  site_proof_material: "场地证明材料",
  public_service_platforms: "公共服务场地/平台数量",
  service_team_average: "专业孵化人员配备",
  mentor_service_institutions: "导师服务机构数",
  seed_fund_amount: "自有孵化种子基金金额",
  invested_enterprises: "已投资企业数",
  invested_amount: "已投资金额",
  listed_enterprises: "挂牌/上市服务企业数",
  financing_enterprises: "获得融资企业数",
  financing_amount: "获得融资总金额",
  hefei_events: "主题活动数量",
  regional_events: "培训活动数量",
  mentor_enterprises: "导师服务覆盖企业数",
  media_reports: "媒体宣传报道数量",
  incubating_enterprises: "年末在孵企业数",
  new_incubating_enterprises: "当年新增在孵企业数",
  graduated_enterprises: "年度培育毕业企业数",
  high_growth_enterprises: "高成长企业数",
  listed_or_planned_enterprises: "挂牌/上市/股改培育企业数",
  ip_total: "知识产权授权总数",
  ip_invention_patent: "发明专利授权量",
  ip_software_copyright: "软件著作权数量",
  competition_enterprises: "创新创业大赛获奖企业数",
  new_high_tech_enterprises: "新增高新技术企业数",
  tech_sme_enterprises: "新增科技型中小企业数",
  tech_sme_ratio: "科技型中小企业占比",
  safety_production_summary: "安全生产年度总结",
  annual_service_report: "年度服务报告",
  annual_work_summary: "年度工作总结",
  high_level_platforms: "省级以上研发平台",
  document_file_id: "佐证材料",
  employee_count: "从业人数",
  patent_count: "知识产权数量",
  value: "变更后内容",
  new_file_id: "新协议文件",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (isRecord(item)) {
          return String(item.name || item.title || Object.values(item).filter(Boolean).join(" "));
        }
        return String(item);
      })
      .filter(Boolean)
      .join("、") || "-";
  }
  if (isRecord(value)) {
    return Object.entries(value)
      .map(([key, item]) => `${fieldLabels[key] || key}：${stringifyValue(item)}`)
      .join("；");
  }
  return String(value);
}

export function describeBusinessData(value?: Record<string, unknown> | null): string {
  if (!value || Object.keys(value).length === 0) return "未填写补充信息";
  return Object.entries(value)
    .filter(([, item]) => item !== undefined && item !== null && item !== "")
    .map(([key, item]) => `${fieldLabels[key] || key}：${stringifyValue(item)}`)
    .join("；") || "未填写补充信息";
}

export function toDescriptionItems(value?: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) {
    return [{ label: "补充信息", value: "未填写" }];
  }

  return Object.entries(value)
    .filter(([, item]) => item !== undefined && item !== null && item !== "")
    .map(([key, item]) => ({
      label: fieldLabels[key] || key,
      value: stringifyValue(item),
    }));
}

