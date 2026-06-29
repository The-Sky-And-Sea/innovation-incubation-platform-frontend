import { isMockEnabled } from "./config";
import { mockApi, mockApiFail } from "./mock";
import type {
  ApiResponse,
  PerformanceCampaign,
  PerformanceSubmission,
  PerformanceTemplate,
} from "../types";

let templateIdCounter = 801;
let campaignIdCounter = 901;
let submissionIdCounter = 1001;

const mockTemplates = new Map<number, PerformanceTemplate>();
const mockCampaigns = new Map<number, PerformanceCampaign>();
const mockSubmissions = new Map<number, PerformanceSubmission>();

function seedPerformances() {
  if (mockTemplates.size > 0) return;

  mockTemplates.set(801, {
    id: 801,
    name: "年度孵化服务绩效模板",
    year: 2026,
    form_schema: {
      service_enterprises: "服务企业数量",
      incubation_results: "孵化成果说明",
      events: "创业活动数量",
    },
  });

  mockCampaigns.set(901, {
    id: 901,
    template_id: 801,
    name: "2026 年度孵化载体绩效考核",
    year: 2026,
    start_date: "2026-06-01",
    end_date: "2026-09-30",
    is_active: true,
  });

  mockSubmissions.set(1001, {
    id: 1001,
    campaign_id: 901,
    carrier_id: 1,
    form_data: {
      service_enterprises: 42,
      incubation_results: "完成 8 个创新项目孵化",
      events: 12,
    },
    status: "pending",
  });
}

seedPerformances();

function paginate<T>(items: T[], page: number, pageSize: number) {
  return {
    list: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    page_size: pageSize,
  };
}

export async function createPerformanceTemplate(
  name: string,
  year: number,
  formSchema: Record<string, unknown>,
): Promise<ApiResponse<PerformanceTemplate>> {
  if (isMockEnabled()) {
    const template: PerformanceTemplate = {
      id: ++templateIdCounter,
      name,
      year,
      form_schema: formSchema,
    };
    mockTemplates.set(template.id, template);
    return mockApi(template);
  }

  const { post } = await import("../utils/request");
  return post("/gov/performances/templates", { name, year, form_schema: formSchema });
}

export async function launchPerformanceCampaign(data: {
  template_id: number;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
}): Promise<ApiResponse<PerformanceCampaign>> {
  if (isMockEnabled()) {
    const campaign: PerformanceCampaign = {
      id: ++campaignIdCounter,
      template_id: data.template_id,
      name: data.name,
      year: data.year,
      start_date: data.start_date,
      end_date: data.end_date,
      is_active: true,
    };
    mockCampaigns.set(campaign.id, campaign);
    return mockApi(campaign);
  }

  const { post } = await import("../utils/request");
  return post("/gov/performances/campaigns", data);
}

export async function getPerformanceCampaigns(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: PerformanceCampaign[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
    const list = Array.from(mockCampaigns.values()).filter((item) => item.is_active);
    return mockApi(paginate(list, page, page_size));
  }

  const { get } = await import("../utils/request");
  return get("/carrier/performances", {
    page: String(page),
    page_size: String(page_size),
  });
}

export async function submitPerformance(
  campaignId: number,
  formData: Record<string, unknown>,
): Promise<ApiResponse<PerformanceSubmission>> {
  if (isMockEnabled()) {
    const submission: PerformanceSubmission = {
      id: ++submissionIdCounter,
      campaign_id: campaignId,
      carrier_id: 1,
      form_data: formData,
      status: "pending",
    };
    mockSubmissions.set(submission.id, submission);
    return mockApi(submission);
  }

  const { post } = await import("../utils/request");
  return post(`/carrier/performances/${campaignId}/submit`, { form_data: formData });
}

export async function getPerformanceSubmissions(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: PerformanceSubmission[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
    return mockApi(paginate(Array.from(mockSubmissions.values()), page, page_size), 300);
  }

  const { get } = await import("../utils/request");
  return get("/gov/performances/submissions", {
    page: String(page),
    page_size: String(page_size),
  });
}

export async function scorePerformance(
  id: number,
  score: number,
  status: "approved" | "rejected",
  comment: string,
): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
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
