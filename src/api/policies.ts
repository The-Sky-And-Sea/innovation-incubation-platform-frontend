/**
 * 政策兑现 API 层
 *
 * 对应后端接口：
 * 政务端：
 * - POST  /gov/policies/templates      创建政策模板
 * - POST  /gov/policies                 发布政策（自动 AI 提取结构化字段）
 * - GET   /gov/policies/list            政策列表（分页）
 * - PUT   /gov/policies/:id             更新政策（通知关注者）
 * 企业/载体端：
 * - GET   /enterprise/policies          可申报政策列表（含 AI 匹配度 match_level）
 * - POST  /enterprise/policies/:id/apply 申报政策
 * - GET   /enterprise/applications/list  我的申报记录
 * - POST  /enterprise/policies/:id/follow  关注政策
 * - DELETE /enterprise/policies/:id/follow 取消关注
 * - GET   /enterprise/policies/followed    已关注政策列表
 * 载体端：
 * - GET   /carrier/policies             可申报政策列表
 * - POST  /carrier/policies/:id/apply   载体申报政策（直接到政务）
 * - GET   /carrier/applications/enterprise  待审核企业申报列表
 * - POST  /carrier/applications/:id/review  审核企业申报
 * 政务终审：
 * - GET   /gov/applications/list         待审核申报列表
 * - POST  /gov/applications/:id/review   最终审核
 */

import { mockApi, mockApiFail } from "./mock";
import type {
  ApiResponse,
  PolicyTemplate,
  Policy,
  PolicyApplication,
  MatchLevel,
  AuditRequestBody,
  AuditStatus,
} from "../types";

const USE_MOCK = true;

// ============ Mock 数据 ============

let templateIdCounter = 500;
let policyIdCounter = 600;
let applicationIdCounter = 700;

const mockTemplates: Map<number, PolicyTemplate> = new Map();
const mockPolicies: Map<number, Policy> = new Map();
const mockApplications: Map<number, PolicyApplication> = new Map();

// ============ 政务端 — 政策模板 ============

/**
 * 创建政策模板
 */
export async function createPolicyTemplate(
  name: string,
  description: string,
  formSchema: Record<string, unknown>,
  targetRole: string,
): Promise<ApiResponse<PolicyTemplate>> {
  if (USE_MOCK) {
    const id = ++templateIdCounter;
    const template: PolicyTemplate = {
      id,
      name,
      description,
      form_schema: formSchema,
      target_role: targetRole as PolicyTemplate["target_role"],
    };
    mockTemplates.set(id, template);
    return mockApi(template);
  }

  const { post } = await import("../utils/request");
  return post("/gov/policies/templates", { name, description, form_schema: formSchema, target_role: targetRole });
}

// ============ 政务端 — 政策发布 ============

/**
 * 发布政策
 */
export async function publishPolicy(data: {
  template_id: number;
  title: string;
  conditions: Record<string, unknown>;
  subsidy_amount: string;
  start_date: string;
  end_date: string;
  file_id?: number;
}): Promise<ApiResponse<Policy>> {
  if (USE_MOCK) {
    const id = ++policyIdCounter;
    // AI 匹配度模拟 — 随机生成
    const matchLevels: MatchLevel[] = ["high", "partial", "none", "unknown"];
    const policy: Policy = {
      id,
      template_id: data.template_id,
      title: data.title,
      conditions: data.conditions,
      subsidy_amount: data.subsidy_amount,
      start_date: data.start_date,
      end_date: data.end_date,
      target_role: "both",
      file_id: data.file_id,
      match_level: matchLevels[Math.floor(Math.random() * matchLevels.length)],
    };
    mockPolicies.set(id, policy);
    return mockApi(policy);
  }

  const { post } = await import("../utils/request");
  return post("/gov/policies", data);
}

/**
 * 政策列表
 */
export async function getPolicyList(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: Policy[]; total: number; page: number; page_size: number }>> {
  if (USE_MOCK) {
    const all = Array.from(mockPolicies.values());
    const list = all.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: all.length, page, page_size });
  }

  const { get } = await import("../utils/request");
  return get("/gov/policies/list", { page: String(page), page_size: String(page_size) });
}

// ============ 企业端 — 可申报政策列表 ============

/**
 * 企业端可申报政策列表（含 AI 匹配度字段）
 */
export async function getEnterprisePolicies(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: Policy[]; total: number; page: number; page_size: number }>> {
  if (USE_MOCK) {
    const all = Array.from(mockPolicies.values());
    // 为每条政策生成随机匹配度
    const matchLevels: MatchLevel[] = ["high", "partial", "none", "unknown"];
    const enriched = all.map((p) => ({
      ...p,
      match_level: matchLevels[Math.floor(Math.random() * matchLevels.length)],
    }));
    const list = enriched.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: enriched.length, page, page_size });
  }

  const { get } = await import("../utils/request");
  return get("/enterprise/policies", { page: String(page), page_size: String(page_size) });
}

/**
 * 企业申报政策
 */
export async function applyPolicy(
  policyId: number,
  formData: Record<string, unknown>,
): Promise<ApiResponse<PolicyApplication>> {
  if (USE_MOCK) {
    const id = ++applicationIdCounter;
    const app: PolicyApplication = {
      id,
      policy_id: policyId,
      applicant_id: 1,
      applicant_type: "enterprise",
      form_data: formData,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    mockApplications.set(id, app);
    return mockApi(app);
  }

  const { post } = await import("../utils/request");
  return post(`/enterprise/policies/${policyId}/apply`, { form_data: formData });
}

/**
 * 我的申报记录
 */
export async function getMyApplications(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: PolicyApplication[]; total: number; page: number; page_size: number }>> {
  if (USE_MOCK) {
    const all = Array.from(mockApplications.values());
    const list = all.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: all.length, page, page_size });
  }

  const { get } = await import("../utils/request");
  return get("/enterprise/applications/list", { page: String(page), page_size: String(page_size) });
}

// ============ 载体端 — 待审核企业申报 ============

/**
 * 载体端 — 待审核企业申报列表
 */
export async function getCarrierPendingApplications(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: PolicyApplication[]; total: number; page: number; page_size: number }>> {
  if (USE_MOCK) {
    const all = Array.from(mockApplications.values()).filter((a) => a.status === "pending");
    const list = all.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: all.length, page, page_size }, 300);
  }

  const { get } = await import("../utils/request");
  return get("/carrier/applications/enterprise", { page: String(page), page_size: String(page_size) });
}

/**
 * 载体审核企业申报
 */
export async function reviewEnterpriseApplication(
  id: number,
  body: AuditRequestBody,
): Promise<ApiResponse<null>> {
  if (USE_MOCK) {
    const app = mockApplications.get(id);
    if (!app) {
      await mockApiFail(10002, "申报记录不存在");
      throw new Error("unreachable");
    }
    if (body.action === "approve") {
      app.status = "carrier_review" as AuditStatus;
    } else {
      app.status = (body.action === "reject" ? "rejected" : "returned") as AuditStatus;
    }
    return mockApi(null);
  }

  const { post } = await import("../utils/request");
  return post(`/carrier/applications/${id}/review`, body);
}

// ============ 政务端 — 最终审核 ============

/**
 * 政务端 — 待审核申报列表
 */
export async function getGovPendingApplications(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: PolicyApplication[]; total: number; page: number; page_size: number }>> {
  if (USE_MOCK) {
    const all = Array.from(mockApplications.values()).filter((a) => a.status === "carrier_review");
    const list = all.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: all.length, page, page_size }, 300);
  }

  const { get } = await import("../utils/request");
  return get("/gov/applications/list", { page: String(page), page_size: String(page_size) });
}

/**
 * 政务终审
 */
export async function govReviewApplication(
  id: number,
  body: AuditRequestBody,
): Promise<ApiResponse<null>> {
  if (USE_MOCK) {
    const app = mockApplications.get(id);
    if (!app) {
      await mockApiFail(10002, "申报记录不存在");
      throw new Error("unreachable");
    }
    app.status = (body.action === "approve" ? "approved" : body.action === "reject" ? "rejected" : "returned") as AuditStatus;
    return mockApi(null);
  }

  const { post } = await import("../utils/request");
  return post(`/gov/applications/${id}/review`, body);
}