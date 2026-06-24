/**
 * 绩效考核 API 层
 *
 * 对应后端接口：
 * 政务端：
 * - POST /gov/performances/templates      创建考核模板
 * - POST /gov/performances/campaigns       启动考核活动
 * - GET  /gov/performances/submissions     考核申报列表（分页）
 * - POST /gov/performances/:id/score       评分审核
 * 载体端：
 * - GET  /carrier/performances             考核活动列表
 * - POST /carrier/performances/:id/submit  提交考核申报
 */

import { mockApi, mockApiFail } from "./mock";
import type {
  ApiResponse,
  PerformanceTemplate,
  PerformanceCampaign,
  PerformanceSubmission,
} from "../types";

const USE_MOCK = true;

// ============ Mock 数据 ============

let templateIdCounter = 800;
let campaignIdCounter = 900;
let submissionIdCounter = 1000;

const mockTemplates: Map<number, PerformanceTemplate> = new Map();
const mockCampaigns: Map<number, PerformanceCampaign> = new Map();
const mockSubmissions: Map<number, PerformanceSubmission> = new Map();

// ============ 政务端 — 模板 ============

/**
 * 创建考核模板
 */
export async function createPerformanceTemplate(
  name: string,
  year: number,
  formSchema: Record<string, unknown>,
): Promise<ApiResponse<PerformanceTemplate>> {
  if (USE_MOCK) {
    const id = ++templateIdCounter;
    const template: PerformanceTemplate = {
      id,
      name,
      year,
      form_schema: formSchema,
    };
    mockTemplates.set(id, template);
    return mockApi(template);
  }

  const { post } = await import("../utils/request");
  return post("/gov/performances/templates", { name, year, form_schema: formSchema });
}

// ============ 政务端 — 启动考核 ============

/**
 * 启动考核活动
 */
export async function launchPerformanceCampaign(data: {
  template_id: number;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
}): Promise<ApiResponse<PerformanceCampaign>> {
  if (USE_MOCK) {
    const id = ++campaignIdCounter;
    const campaign: PerformanceCampaign = {
      id,
      template_id: data.template_id,
      name: data.name,
      year: data.year,
      start_date: data.start_date,
      end_date: data.end_date,
      is_active: true,
    };
    mockCampaigns.set(id, campaign);
    return mockApi(campaign);
  }

  const { post } = await import("../utils/request");
  return post("/gov/performances/campaigns", data);
}

// ============ 载体端 — 考核活动列表 ============

/**
 * 载体端查看已启动的考核活动
 */
export async function getPerformanceCampaigns(
  page = 1,
  page_size = 20,
): Promise<
  ApiResponse<{ list: PerformanceCampaign[]; total: number; page: number; page_size: number }>
> {
  if (USE_MOCK) {
    const all = Array.from(mockCampaigns.values()).filter((c) => c.is_active);
    const list = all.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: all.length, page, page_size });
  }

  const { get } = await import("../utils/request");
  return get("/carrier/performances", {
    page: String(page),
    page_size: String(page_size),
  });
}

// ============ 载体端 — 提交考核申报 ============

/**
 * 载体提交考核申报
 */
export async function submitPerformance(
  campaignId: number,
  formData: Record<string, unknown>,
): Promise<ApiResponse<PerformanceSubmission>> {
  if (USE_MOCK) {
    const id = ++submissionIdCounter;
    const submission: PerformanceSubmission = {
      id,
      campaign_id: campaignId,
      carrier_id: 1,
      form_data: formData,
      status: "pending",
    };
    mockSubmissions.set(id, submission);
    return mockApi(submission);
  }

  const { post } = await import("../utils/request");
  return post(`/carrier/performances/${campaignId}/submit`, { form_data: formData });
}

// ============ 政务端 — 考核申报列表 ============

/**
 * 政务端查看考核申报列表
 */
export async function getPerformanceSubmissions(
  page = 1,
  page_size = 20,
): Promise<
  ApiResponse<{ list: PerformanceSubmission[]; total: number; page: number; page_size: number }>
> {
  if (USE_MOCK) {
    const all = Array.from(mockSubmissions.values());
    const list = all.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: all.length, page, page_size }, 300);
  }

  const { get } = await import("../utils/request");
  return get("/gov/performances/submissions", {
    page: String(page),
    page_size: String(page_size),
  });
}

// ============ 政务端 — 评分审核 ============

/**
 * 政务端评分审核
 */
export async function scorePerformance(
  id: number,
  score: number,
  status: "approved" | "rejected",
  comment: string,
): Promise<ApiResponse<null>> {
  if (USE_MOCK) {
    const submission = mockSubmissions.get(id);
    if (!submission) {
      await mockApiFail(10002, "考核申报不存在");
      throw new Error("unreachable");
    }
    submission.score = score;
    submission.status = status;
    submission.comment = comment;
    return mockApi(null);
  }

  const { post } = await import("../utils/request");
  return post(`/gov/performances/${id}/score`, { score, status, comment });
}