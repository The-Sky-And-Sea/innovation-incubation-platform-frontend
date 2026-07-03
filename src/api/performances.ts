import type {
  ApiResponse,
  PerformanceCampaign,
  PerformanceSubmission,
  PerformanceTemplate,
} from "../types";

export async function createPerformanceTemplate(
  name: string,
  year: number,
  formSchema: Record<string, unknown>,
): Promise<ApiResponse<PerformanceTemplate>> {
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
  const { post } = await import("../utils/request");
  return post("/gov/performances/campaigns", data);
}

export async function getPerformanceCampaigns(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: PerformanceCampaign[]; total: number; page: number; page_size: number }>> {
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
  const { post } = await import("../utils/request");
  return post(`/carrier/performances/${campaignId}/submit`, { form_data: formData });
}

export async function getPerformanceSubmissions(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: PerformanceSubmission[]; total: number; page: number; page_size: number }>> {
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
  const { post } = await import("../utils/request");
  return post(`/gov/performances/${id}/score`, { score, status, comment });
}