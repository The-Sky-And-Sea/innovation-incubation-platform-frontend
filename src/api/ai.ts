import type { ApiResponse, Policy } from "../types";

export interface PolicySearchResult {
  list: Policy[];
  total: number;
  ai_analysis?: string;
  analysis?: string;
  summary?: string;
}

export async function searchEnterprisePolicies(query: string): Promise<ApiResponse<PolicySearchResult>> {
  const { request } = await import("../utils/request");
  return request("/enterprise/policies/search", {
    method: "POST",
    body: { query },
    timeout: 45000,
  });
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
  const { request } = await import("../utils/request");
  return request(`/enterprise/policies/${policyId}/recommend`, {
    method: "GET",
    timeout: 45000,
  });
}

export async function getAiPrefill(
  policyId: number,
  _formSchema?: Record<string, unknown>,
): Promise<ApiResponse<unknown>> {
  const { request } = await import("../utils/request");
  return request(`/enterprise/policies/${policyId}/prefill`, {
    method: "POST",
    timeout: 45000,
  });
}
