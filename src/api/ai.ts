/**
 * AI 智能辅助 API 层
 *
 * 对应后端接口：
 * - GET  /enterprise/policies/:id/recommend  AI 政策匹配度分析
 * - POST /enterprise/policies/:id/prefill        AI 表单预填充
 *
 * 降级机制：
 * - LLM 不可用时 → 字段级规则匹配（FieldMatchRule）
 * - 规则匹配器在企业端和载体端的 AI API 中均有实现
 */

import { mockApi, mockApiFail } from "./mock";
import { isMockEnabled } from "./config";
import type { ApiResponse, MatchLevel, EnterpriseInfo, Policy } from "../types";



// ============ 企业画像 ============

const mockProfile: EnterpriseInfo & { field_match_rules?: Record<string, unknown> } = {
  id: 1,
  name: "测试科技有限公司",
  credit_code: "91440101MA5XXXX",
  industry: "信息技术",
  scale: "小型",
  address: "广东省广州市天河区XX路123号",
  legal_person: "张三",
  contact_name: "李四",
  contact_phone: "13800138000",
};

function mockPolicySearch(query: string): ApiResponse<{ list: Policy[]; total: number }>["data"] {
  const list: Policy[] = [
    {
      id: 601,
      title: query.includes("AI") ? "AI 行业创新创业补贴" : "创新创业载体发展扶持政策",
      department: "科技局",
      requirements: {
        application_condition: "符合产业方向且材料完整",
      },
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      target_role: "both",
      match_level: "partial",
    },
  ];
  return { list, total: list.length };
}

export async function searchEnterprisePolicies(
  query: string,
): Promise<ApiResponse<{ list: Policy[]; total: number }>> {
  if (isMockEnabled()) {
    return mockApi(mockPolicySearch(query), 800);
  }

  const { post } = await import("../utils/request");
  return post("/enterprise/policies/search", { query });
}

export async function searchCarrierPolicies(
  query: string,
): Promise<ApiResponse<{ list: Policy[]; total: number }>> {
  if (isMockEnabled()) {
    return mockApi(mockPolicySearch(query), 800);
  }

  const { post } = await import("../utils/request");
  return post("/carrier/policies/search", { query });
}

/** 字段级规则匹配器（LLM 不可用时的降级方案） */
function fieldMatchRule(policyConditions: Record<string, unknown>): {
  matchLevel: MatchLevel;
  reason: string;
} {
  const matched: string[] = [];
  const unmatched: string[] = [];

  Object.entries(policyConditions).forEach(([key, value]) => {
    const entVal = (mockProfile as unknown as Record<string, unknown>)[key];
    if (entVal !== undefined && String(entVal) === String(value)) {
      matched.push(`${key}: ${entVal}`);
    } else if (entVal !== undefined) {
      unmatched.push(`${key}: 政策要求「${value}」，企业为「${entVal}」`);
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

/**
 * AI 政策匹配度分析
 * @param policyId 政策 ID
 * @param policyConditions 政策筛选条件（用于规则匹配降级）
 */
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
    // 尝试 LLM 分析（mock 中不可用，降级为规则匹配）
    try {
      await mockApiFail(10301, "AI服务暂不可用，正在使用规则匹配...");
      throw new Error("unreachable");
    } catch {
      // 降级到规则匹配
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

/**
 * AI 表单预填充
 * @param policyId 政策 ID
 * @param formSchema 目标表单 Schema（用于规则匹配降级填充）
 */
export async function getAiPrefill(
  policyId: number,
  _formSchema?: Record<string, unknown>,
): Promise<ApiResponse<Record<string, unknown>>> {
  if (isMockEnabled()) {
    // 降级为基于企业画像和历史数据的规则填充
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

    // 模拟 AI 分析动画延迟
    return mockApi(prefillData, 1500);
  }

  const { post } = await import("../utils/request");
  return post(`/enterprise/policies/${policyId}/prefill`);
}
