import { isMockEnabled } from "./config";
import { mockApi, mockApiFail } from "./mock";
import type { ApiResponse, EnterpriseInfo, MatchLevel, Policy } from "../types";

export interface PolicySearchResult {
  list: Policy[];
  total: number;
  ai_analysis?: string;
  analysis?: string;
  summary?: string;
}

const mockProfile: EnterpriseInfo & { field_match_rules?: Record<string, unknown> } = {
  id: 1,
  name: "测试科技有限公司",
  credit_code: "91440101MA5XXXX",
  industry: "信息技术",
  scale: "小型",
  address: "广东省广州市天河区 XX 路 123 号",
  legal_person: "张三",
  contact_name: "李四",
  contact_phone: "13800138000",
};

function mockPolicySearch(query: string): PolicySearchResult {
  const serviceQuery = /服务|补助|补贴|service/i.test(query);
  const list: Policy[] = [
    {
      id: 601,
      title: serviceQuery ? "餐饮企业、品牌便利店、老字号企业新设直营网店奖励" : "AI 行业创新创业补贴",
      department: "商务局",
      requirements: { application_condition: "符合行业方向，材料完整，按门店或服务能力核算补助。" },
      subsidy_amount: "不超过项目总投资 30% 且不超过 40 万元",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      target_role: "enterprise",
      match_level: "none",
    },
    {
      id: 602,
      title: "中小企业数字化转型服务券",
      department: "工信局",
      requirements: { application_condition: "采购数字化服务并完成验收。" },
      subsidy_amount: "最高 20 万元",
      start_date: "2026-02-01",
      end_date: "2026-11-30",
      target_role: "enterprise",
      match_level: "partial",
    },
    {
      id: 603,
      title: "国家服务业标准化试点奖励",
      department: "市场监管局",
      requirements: { application_condition: "服务业企业参与标准化试点建设。" },
      subsidy_amount: "50 万元",
      start_date: "2025-01-01",
      end_date: "2026-12-31",
      target_role: "enterprise",
      match_level: "partial",
    },
    {
      id: 604,
      title: "科技型小微企业研发费用补助",
      department: "科技局",
      requirements: { application_condition: "研发投入持续增长。" },
      subsidy_amount: "最高 15 万元",
      start_date: "2026-03-01",
      end_date: "2026-09-30",
      target_role: "enterprise",
      match_level: "none",
    },
    {
      id: 605,
      title: "制造业设备更新贴息项目",
      department: "发改委",
      requirements: { application_condition: "购置生产设备并完成备案。" },
      subsidy_amount: "按贷款利息比例补助",
      start_date: "2026-01-15",
      end_date: "2026-08-31",
      target_role: "enterprise",
      match_level: "unknown",
    },
    {
      id: 606,
      title: "设备融资租赁贴息",
      department: "金融办",
      requirements: { application_condition: "2 年以上设备融资租赁合同且用于技术改造。" },
      subsidy_amount: "实付利息 40%，最高 300 万元",
      start_date: "2026-01-01",
      end_date: "2026-03-12",
      target_role: "enterprise",
      match_level: "high",
    },
    {
      id: 607,
      title: "外贸企业拓市场支持",
      department: "商务局",
      requirements: { application_condition: "参加境内外重点展会。" },
      subsidy_amount: "展位费补贴",
      start_date: "2026-04-01",
      end_date: "2026-10-31",
      target_role: "enterprise",
      match_level: "none",
    },
    {
      id: 608,
      title: "服务业小微企业贷款贴息",
      department: "财政局",
      requirements: { application_condition: "服务业小微企业且贷款用于经营提升。" },
      subsidy_amount: "最高 30 万元",
      start_date: "2026-02-15",
      end_date: "2026-12-15",
      target_role: "enterprise",
      match_level: "none",
    },
    {
      id: 609,
      title: "绿色低碳改造奖励",
      department: "生态环境局",
      requirements: { application_condition: "完成节能减排改造并通过验收。" },
      subsidy_amount: "最高 80 万元",
      start_date: "2026-05-01",
      end_date: "2026-10-31",
      target_role: "enterprise",
      match_level: "unknown",
    },
    {
      id: 610,
      title: "企业品牌化发展扶持",
      department: "市场监管局",
      requirements: { application_condition: "获得品牌认定或开展品牌建设。" },
      subsidy_amount: "最高 25 万元",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      target_role: "enterprise",
      match_level: "unknown",
    },
  ];

  return {
    list,
    total: list.length,
    ai_analysis:
      "您的企业为信息技术服务业小型企业。在合肥，匹配政策中，[6]「设备融资租赁贴息」较适合；补贴实付利息的 40%，最高 300 万元，截止 2026-03-12 时间充裕，但需 2 年以上设备融资租赁合同且用于技术改造，建议考虑。其他政策如 [3] 国家服务业标准化试点奖补 50 万元；[1][2][4][8] 因行业或门槛不符，[5][7][9][10] 不适用或不明确。综合评估，仅部分满足需求。",
  };
}

export async function searchEnterprisePolicies(query: string): Promise<ApiResponse<PolicySearchResult>> {
  if (isMockEnabled()) {
    return mockApi(mockPolicySearch(query), 800);
  }

  const { post } = await import("../utils/request");
  return post("/enterprise/policies/search", { query });
}

export async function searchCarrierPolicies(query: string): Promise<ApiResponse<PolicySearchResult>> {
  if (isMockEnabled()) {
    return mockApi(mockPolicySearch(query), 800);
  }

  const { post } = await import("../utils/request");
  return post("/carrier/policies/search", { query });
}

function fieldMatchRule(policyConditions: Record<string, unknown>): {
  matchLevel: MatchLevel;
  reason: string;
} {
  const matched: string[] = [];
  const unmatched: string[] = [];

  Object.entries(policyConditions).forEach(([key, value]) => {
    const enterpriseValue = (mockProfile as unknown as Record<string, unknown>)[key];
    if (enterpriseValue !== undefined && String(enterpriseValue) === String(value)) {
      matched.push(`${key}: ${enterpriseValue}`);
    } else if (enterpriseValue !== undefined) {
      unmatched.push(`${key}: 政策要求「${value}」，企业为「${enterpriseValue}」`);
    }
  });

  const totalCount = Object.keys(policyConditions).length;
  const matchCount = matched.length;

  if (totalCount === 0) {
    return {
      matchLevel: "unknown",
      reason: "政策未设置筛选条件，无法自动匹配",
    };
  }

  if (matchCount === totalCount) {
    return {
      matchLevel: "high",
      reason: `企业画像与政策条件完全匹配（${matchCount}/${totalCount}）：${matched.join("；")}`,
    };
  }

  if (matchCount >= totalCount / 2) {
    return {
      matchLevel: "partial",
      reason: `部分匹配（${matchCount}/${totalCount}）：${matched.join("；")}。不匹配项：${unmatched.join("；")}`,
    };
  }

  return {
    matchLevel: "none",
    reason: `匹配度低（${matchCount}/${totalCount}）。不匹配项：${unmatched.join("；")}`,
  };
}

export async function getAiPolicyMatch(
  policyId: number,
  policyConditions?: Record<string, unknown>,
): Promise<
  ApiResponse<{
    match_level: MatchLevel;
    reason: string;
    policy_title: string;
    subsidy_amount: string;
  }>
> {
  if (isMockEnabled()) {
    try {
      await mockApiFail(10301, "AI服务暂不可用，正在使用规则匹配...");
      throw new Error("unreachable");
    } catch {
      const ruleResult = fieldMatchRule(policyConditions || {});
      return mockApi(
        {
          match_level: ruleResult.matchLevel,
          reason: ruleResult.reason,
          policy_title: `政策 #${policyId}`,
          subsidy_amount: "10万元",
        },
        1200,
      );
    }
  }

  const { get } = await import("../utils/request");
  return get(`/enterprise/policies/${policyId}/recommend`);
}

export async function getAiPrefill(
  _policyId: number,
  _formSchema?: Record<string, unknown>,
): Promise<ApiResponse<Record<string, unknown>>> {
  if (isMockEnabled()) {
    const prefillData: Record<string, unknown> = {
      enterprise_name: mockProfile.name,
      credit_code: mockProfile.credit_code,
      industry: mockProfile.industry,
      scale: mockProfile.scale,
      address: mockProfile.address,
      legal_person: mockProfile.legal_person,
      contact_name: mockProfile.contact_name,
      contact_phone: mockProfile.contact_phone,
    };

    return mockApi(prefillData, 1500);
  }

  const { post } = await import("../utils/request");
  return post(`/enterprise/policies/${_policyId}/prefill`);
}
