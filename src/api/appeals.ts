/**
 * 政策诉求 API 层
 */

import type {
  Appeal,
  AppealRequest,
  AppealStatus,
  ApiResponse,
  ProblemType,
} from "../types";

export async function submitEnterpriseAppeal(data: AppealRequest): Promise<ApiResponse<Appeal>> {
  const { post } = await import("../utils/request");
  return post("/enterprise/appeals", data);
}

export async function getEnterpriseAppeals(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: Appeal[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/enterprise/appeals", { page: String(page), page_size: String(page_size) });
}

export async function submitCarrierAppeal(data: AppealRequest): Promise<ApiResponse<Appeal>> {
  const { post } = await import("../utils/request");
  return post("/carrier/appeals", data);
}

export async function getCarrierAppeals(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: Appeal[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/carrier/appeals", { page: String(page), page_size: String(page_size) });
}

export async function getGovAppeals(params: {
  status?: AppealStatus | "";
  problem_type?: ProblemType | "";
  page?: number;
  page_size?: number;
}): Promise<ApiResponse<{ list: Appeal[]; total: number; page: number; page_size: number }>> {
  const page = params.page ?? 1;
  const pageSize = params.page_size ?? 20;

  const { get } = await import("../utils/request");
  return get("/gov/appeals", {
    status: params.status,
    problem_type: params.problem_type,
    page: String(page),
    page_size: String(pageSize),
  });
}

export async function updateGovAppealStatus(
  id: number,
  status: AppealStatus,
): Promise<ApiResponse<Appeal>> {
  const { patch } = await import("../utils/request");
  return patch(`/gov/appeals/${id}/status`, { status });
}
