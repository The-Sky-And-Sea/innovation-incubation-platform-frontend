import { isMockEnabled } from "./config";
import { mockApi, mockApiFail } from "./mock";
import type {
  ApiResponse,
  AuditRequestBody,
  AuditStatus,
  MatchLevel,
  Policy,
  PolicyApplication,
  PolicyMaterial,
  PolicyTemplate,
} from "../types";

let templateIdCounter = 500;
let policyIdCounter = 603;
let applicationIdCounter = 703;

const mockTemplates = new Map<number, PolicyTemplate>();
const mockPolicies = new Map<number, Policy>();
const mockApplications = new Map<number, PolicyApplication>();
const mockFollowedPolicyIds = new Set<number>([601]);

function seedPolicies() {
  if (mockPolicies.size > 0) return;

  const defaults: Policy[] = [
    {
      id: 601,
      title: "2026 年高新技术企业研发补贴",
      department: "科技创新局",
      requirements: {
        fulfillment_criteria: "按研发投入和孵化状态综合核算补贴额度",
        application_condition: "已入驻孵化载体，具备有效统一社会信用代码",
        application_materials: [
          { name: "营业执照", file_id: 12, necessity: "necessary" },
          { name: "研发投入说明", file_id: 13, necessity: "optional" },
        ],
        process: "企业申报 - 载体初审 - 政务终审",
      },
      subsidy_amount: "最高 30 万元",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      target_role: "enterprise",
      match_level: "high",
      followed: true,
    },
    {
      id: 602,
      title: "孵化载体公共服务能力提升项目",
      department: "工信局",
      requirements: {
        fulfillment_criteria: "围绕服务企业数量、活动组织、成果转化进行综合评价",
        application_condition: "载体信息完整，近一年有企业服务记录",
        application_materials: [{ name: "载体服务报告", file_id: 21, necessity: "necessary" }],
      },
      subsidy_amount: "最高 50 万元",
      start_date: "2026-03-01",
      end_date: "2026-10-31",
      target_role: "carrier",
      match_level: "partial",
    },
    {
      id: 603,
      title: "创新创业联合培育奖励",
      department: "发展改革局",
      requirements: {
        application_condition: "企业与载体联合提交，材料经双方确认",
        application_materials: [
          { name: "联合培育协议", file_id: 31, necessity: "necessary" },
          { name: "成果证明", file_id: 32, necessity: "optional" },
        ],
      },
      subsidy_amount: "按项目评审结果确定",
      start_date: "2026-04-01",
      end_date: "2026-11-30",
      target_role: "both",
      match_level: "unknown",
    },
  ];

  defaults.forEach((policy) => mockPolicies.set(policy.id, policy));

  mockApplications.set(701, {
    id: 701,
    policy_id: 601,
    applicant_id: 1,
    applicant_type: "enterprise",
    materials: [{ name: "营业执照", file_id: 12, necessity: "necessary" }],
    form_data: { contact: "李四", amount: "200000" },
    status: "pending",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    policy: defaults[0],
  });

  mockApplications.set(702, {
    id: 702,
    policy_id: 603,
    applicant_id: 1,
    applicant_type: "enterprise",
    materials: [{ name: "联合培育协议", file_id: 31, necessity: "necessary" }],
    status: "carrier_review",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    policy: defaults[2],
  });

  mockApplications.set(703, {
    id: 703,
    policy_id: 602,
    applicant_id: 2,
    applicant_type: "carrier",
    materials: [{ name: "载体服务报告", file_id: 21, necessity: "necessary" }],
    status: "gov_review",
    created_at: new Date(Date.now() - 5400000).toISOString(),
    policy: defaults[1],
  });
}

seedPolicies();

function paginate<T>(items: T[], page: number, pageSize: number) {
  return {
    list: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    page_size: pageSize,
  };
}

export async function createPolicyTemplate(
  name: string,
  description: string,
  formSchema: Record<string, unknown>,
  targetRole: string,
): Promise<ApiResponse<PolicyTemplate>> {
  if (isMockEnabled()) {
    const template: PolicyTemplate = {
      id: ++templateIdCounter,
      name,
      description,
      form_schema: formSchema,
      target_role: targetRole as PolicyTemplate["target_role"],
    };
    mockTemplates.set(template.id, template);
    return mockApi(template);
  }

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
  if (isMockEnabled()) {
    const matchLevels: MatchLevel[] = ["high", "partial", "none", "unknown"];
    const policy: Policy = {
      id: ++policyIdCounter,
      template_id: data.template_id,
      title: data.title,
      department: data.department,
      requirements: data.requirements,
      conditions: data.conditions,
      subsidy_amount: data.subsidy_amount,
      start_date: data.start_date,
      end_date: data.end_date,
      target_role: data.target_role || "both",
      file_id: data.file_id,
      match_level: matchLevels[Math.floor(Math.random() * matchLevels.length)],
    };
    mockPolicies.set(policy.id, policy);
    return mockApi(policy);
  }

  const { post } = await import("../utils/request");
  return post("/gov/policies", data);
}

export async function getPolicyList(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: Policy[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
    return mockApi(paginate(Array.from(mockPolicies.values()), page, page_size));
  }

  const { get } = await import("../utils/request");
  return get("/gov/policies", { page: String(page), page_size: String(page_size) });
}

export async function updatePolicy(
  id: number,
  data: Partial<Policy>,
): Promise<ApiResponse<Policy>> {
  if (isMockEnabled()) {
    const policy = mockPolicies.get(id);
    if (!policy) {
      await mockApiFail(10002, "政策不存在");
      throw new Error("unreachable");
    }
    const next = { ...policy, ...data, id };
    mockPolicies.set(id, next);
    return mockApi(next);
  }

  const { put } = await import("../utils/request");
  return put(`/gov/policies/${id}`, data);
}

export async function getEnterprisePolicies(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: Policy[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
    const list = Array.from(mockPolicies.values())
      .filter((item) => item.target_role === "enterprise" || item.target_role === "both")
      .map((item) => ({ ...item, followed: mockFollowedPolicyIds.has(item.id) }));
    return mockApi(paginate(list, page, page_size));
  }

  const { get } = await import("../utils/request");
  return get("/enterprise/policies", { page: String(page), page_size: String(page_size) });
}

export async function followPolicy(policyId: number): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    mockFollowedPolicyIds.add(policyId);
    return mockApi(null);
  }

  const { post } = await import("../utils/request");
  return post(`/enterprise/policies/${policyId}/follow`);
}

export async function unfollowPolicy(policyId: number): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    mockFollowedPolicyIds.delete(policyId);
    return mockApi(null);
  }

  const { del } = await import("../utils/request");
  return del(`/enterprise/policies/${policyId}/follow`);
}

export async function getFollowedPolicies(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: Policy[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
    const list = Array.from(mockPolicies.values())
      .filter((item) => mockFollowedPolicyIds.has(item.id))
      .map((item) => ({ ...item, followed: true }));
    return mockApi(paginate(list, page, page_size));
  }

  const { get } = await import("../utils/request");
  return get("/enterprise/policies/follows", { page: String(page), page_size: String(page_size) });
}

export async function applyPolicy(
  policyId: number,
  formData: Record<string, unknown>,
): Promise<ApiResponse<PolicyApplication>> {
  if (isMockEnabled()) {
    const app: PolicyApplication = {
      id: ++applicationIdCounter,
      policy_id: policyId,
      applicant_id: 1,
      applicant_type: "enterprise",
      form_data: formData,
      materials: Array.isArray(formData.materials) ? (formData.materials as PolicyMaterial[]) : [],
      status: "pending",
      created_at: new Date().toISOString(),
      policy: mockPolicies.get(policyId),
    };
    mockApplications.set(app.id, app);
    return mockApi(app);
  }

  const { post } = await import("../utils/request");
  const materials = Array.isArray(formData.materials) ? formData.materials : [];
  return post(`/enterprise/policies/${policyId}/apply`, { materials });
}

export async function getCarrierPolicies(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: Policy[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
    const list = Array.from(mockPolicies.values()).filter(
      (item) => item.target_role === "carrier" || item.target_role === "both",
    );
    return mockApi(paginate(list, page, page_size));
  }

  const { get } = await import("../utils/request");
  return get("/carrier/policies", { page: String(page), page_size: String(page_size) });
}

export async function applyCarrierPolicy(
  policyId: number,
  materials: PolicyMaterial[],
): Promise<ApiResponse<PolicyApplication>> {
  if (isMockEnabled()) {
    const app: PolicyApplication = {
      id: ++applicationIdCounter,
      policy_id: policyId,
      applicant_id: 1,
      applicant_type: "carrier",
      materials,
      status: "gov_review",
      created_at: new Date().toISOString(),
      policy: mockPolicies.get(policyId),
    };
    mockApplications.set(app.id, app);
    return mockApi(app);
  }

  const { post } = await import("../utils/request");
  return post(`/carrier/policies/${policyId}/apply`, { materials });
}

export async function getMyApplications(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: PolicyApplication[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
    const list = Array.from(mockApplications.values()).filter((item) => item.applicant_type === "enterprise");
    return mockApi(paginate(list, page, page_size));
  }

  const { get } = await import("../utils/request");
  return get("/enterprise/applications", { page: String(page), page_size: String(page_size) });
}

export async function getCarrierPendingApplications(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: PolicyApplication[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
    const list = Array.from(mockApplications.values()).filter((item) => item.status === "pending");
    return mockApi(paginate(list, page, page_size), 300);
  }

  const { get } = await import("../utils/request");
  return get("/carrier/applications", { page: String(page), page_size: String(page_size) });
}

export async function reviewEnterpriseApplication(
  id: number,
  body: AuditRequestBody,
): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    const app = mockApplications.get(id);
    if (!app) {
      await mockApiFail(10002, "申报记录不存在");
      throw new Error("unreachable");
    }
    app.status = (body.action === "approve"
      ? "carrier_review"
      : body.action === "reject"
        ? "rejected"
        : "returned") as AuditStatus;
    return mockApi(null);
  }

  const { post } = await import("../utils/request");
  return post(`/carrier/applications/${id}/review`, body);
}

export async function getGovPendingApplications(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: PolicyApplication[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
    const list = Array.from(mockApplications.values()).filter(
      (item) => item.status === "carrier_review" || item.status === "gov_review",
    );
    return mockApi(paginate(list, page, page_size), 300);
  }

  const { get } = await import("../utils/request");
  return get("/gov/applications", { page: String(page), page_size: String(page_size) });
}

export async function govReviewApplication(
  id: number,
  body: AuditRequestBody,
): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    const app = mockApplications.get(id);
    if (!app) {
      await mockApiFail(10002, "申报记录不存在");
      throw new Error("unreachable");
    }
    app.status = (body.action === "approve"
      ? "approved"
      : body.action === "reject"
        ? "rejected"
        : "returned") as AuditStatus;
    return mockApi(null);
  }

  const { post } = await import("../utils/request");
  return post(`/gov/applications/${id}/review`, body);
}
