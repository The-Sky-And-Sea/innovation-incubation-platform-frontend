import type {
  ApiResponse,
  AuditRequestBody,
  Policy,
  PolicyApplication,
  PolicyMaterial,
  PolicyTemplate,
} from "../types";

export async function createPolicyTemplate(
  name: string,
  description: string,
  formSchema: Record<string, unknown>,
  targetRole: string,
): Promise<ApiResponse<PolicyTemplate>> {
  const { post } = await import("../utils/request");
  return post("/gov/policies/templates", {
    name,
    description,
    form_schema: formSchema,
    target_role: targetRole,
  });
}

export async function publishPolicy(data: {
  template_id?: number;
  target_role?: "enterprise" | "carrier" | "both";
  title: string;
  department?: string;
  requirements?: Record<string, unknown>;
  conditions?: Record<string, unknown>;
  subsidy_amount?: string;
  start_date: string;
  end_date: string;
  file_id?: number;
}): Promise<ApiResponse<Policy>> {
  const { post } = await import("../utils/request");
  return post("/gov/policies", data);
}

export async function getPolicyList(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: Policy[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/gov/policies", { page: String(page), page_size: String(page_size) });
}

export async function updatePolicy(
  id: number,
  data: Partial<Policy>,
): Promise<ApiResponse<Policy>> {
  const { put } = await import("../utils/request");
  return put(`/gov/policies/${id}`, data);
}

export async function getEnterprisePolicies(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: Policy[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/enterprise/policies", { page: String(page), page_size: String(page_size) });
}

export async function followPolicy(policyId: number): Promise<ApiResponse<null>> {
  const { post } = await import("../utils/request");
  return post(`/enterprise/policies/${policyId}/follow`);
}

export async function unfollowPolicy(policyId: number): Promise<ApiResponse<null>> {
  const { del } = await import("../utils/request");
  return del(`/enterprise/policies/${policyId}/follow`);
}

export async function getFollowedPolicies(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: Policy[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/enterprise/policies/follows", { page: String(page), page_size: String(page_size) });
}

export async function applyPolicy(
  policyId: number,
  formData: Record<string, unknown>,
): Promise<ApiResponse<PolicyApplication>> {
  const { post } = await import("../utils/request");
  const rawMaterials = Array.isArray(formData.materials) ? formData.materials : [];
  const materials = rawMaterials.map((item) => {
    const material = item as PolicyMaterial;
    return {
      name: material.name,
      file_ids: Array.isArray(material.file_ids)
        ? material.file_ids
        : material.file_id
          ? [material.file_id]
          : [],
    };
  });
  return post(`/enterprise/policies/${policyId}/apply`, { materials });
}

export async function getCarrierPolicies(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: Policy[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/carrier/policies", { page: String(page), page_size: String(page_size) });
}

export async function applyCarrierPolicy(
  policyId: number,
  materials: PolicyMaterial[],
): Promise<ApiResponse<PolicyApplication>> {
  const { post } = await import("../utils/request");
  const normalizedMaterials = materials.map((material) => ({
    name: material.name,
    file_ids: Array.isArray(material.file_ids)
      ? material.file_ids
      : material.file_id
        ? [material.file_id]
        : [],
  }));
  return post(`/carrier/policies/${policyId}/apply`, { materials: normalizedMaterials });
}

export async function getMyApplications(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: PolicyApplication[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/enterprise/applications", { page: String(page), page_size: String(page_size) });
}

export async function getCarrierPendingApplications(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: PolicyApplication[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/carrier/applications", { page: String(page), page_size: String(page_size) });
}

export async function reviewEnterpriseApplication(
  id: number,
  body: AuditRequestBody,
): Promise<ApiResponse<null>> {
  const { post } = await import("../utils/request");
  return post(`/carrier/applications/${id}/review`, body);
}

export async function getGovPendingApplications(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: PolicyApplication[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/gov/applications", { page: String(page), page_size: String(page_size) });
}

export async function govReviewApplication(
  id: number,
  body: AuditRequestBody,
): Promise<ApiResponse<null>> {
  const { post } = await import("../utils/request");
  return post(`/gov/applications/${id}/review`, body);
}
