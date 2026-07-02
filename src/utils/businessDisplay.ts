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

