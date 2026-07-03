import type { ApiResponse, Policy } from "../types";

export interface PolicySearchResult {
  list: Policy[];
  total: number;
  ai_analysis?: string;
  analysis?: string;
  summary?: string;
}

export async function searchEnterprisePolicies(query: string): Promise<ApiResponse<PolicySearchResult>> {
  const { post } = await import("../utils/request");
  return post("/enterprise/policies/search", { query });
}

export async function searchCarrierPolicies(query: string): Promise<ApiResponse<PolicySearchResult>> {
  const { post } = await import("../utils/request");
  return post("/carrier/policies/search", { query });
}

export async function getAiPolicyMatch(
  policyId: number,
  _policyConditions?: Record<string, unknown>,
): Promise<
  ApiResponse<{
    match_level: string;
    reason: string;
    policy_title: string;
    subsidy_amount: string;
  }>
> {
  const { get } = await import("../utils/request");
  return get(`/enterprise/policies/${policyId}/recommend`);
}

export async function getAiPrefill(
  policyId: number,
  _formSchema?: Record<string, unknown>,
): Promise<ApiResponse<Record<string, unknown>>> {
  const { post } = await import("../utils/request");
  return post(`/enterprise/policies/${policyId}/prefill`);
}
