/**
 * 政策诉求 API 层
 */

import { mockApi, mockApiFail } from "./mock";
import { isMockEnabled } from "./config";
import type {
  Appeal,
  AppealRequest,
  AppealStatus,
  ApiResponse,
  ProblemType,
} from "../types";

let appealIdCounter = 1300;

const mockAppeals: Appeal[] = [
  {
    id: 1,
    identifier: "91340000TEST0001",
    applicant_type: "enterprise",
    problem_type: "tax",
    department: "税务局",
    content: "希望明确税收优惠政策细则",
    status: "pending",
    created_at: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: 2,
    identifier: "13900000901",
    applicant_type: "carrier",
    problem_type: "financing",
    department: "财政局",
    content: "希望拓宽融资渠道",
    status: "processed",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

function createMockAppeal(applicantType: "enterprise" | "carrier", data: AppealRequest): Appeal {
  return {
    id: ++appealIdCounter,
    applicant_type: applicantType,
    identifier: data.identifier,
    problem_type: data.problem_type,
    department: data.department,
    content: data.content,
    status: "pending",
    created_at: new Date().toISOString(),
  };
}

function paginateAppeals(
  list: Appeal[],
  page: number,
  page_size: number,
): { list: Appeal[]; total: number; page: number; page_size: number } {
  return {
    list: list.slice((page - 1) * page_size, page * page_size),
    total: list.length,
    page,
    page_size,
  };
}

export async function submitEnterpriseAppeal(data: AppealRequest): Promise<ApiResponse<Appeal>> {
  if (isMockEnabled()) {
    const appeal = createMockAppeal("enterprise", data);
    mockAppeals.unshift(appeal);
    return mockApi(appeal);
  }

  const { post } = await import("../utils/request");
  return post("/enterprise/appeals", data);
}

export async function getEnterpriseAppeals(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: Appeal[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
    return mockApi(paginateAppeals(mockAppeals.filter((item) => item.applicant_type === "enterprise"), page, page_size));
  }

  const { get } = await import("../utils/request");
  return get("/enterprise/appeals", { page: String(page), page_size: String(page_size) });
}

export async function submitCarrierAppeal(data: AppealRequest): Promise<ApiResponse<Appeal>> {
  if (isMockEnabled()) {
    const appeal = createMockAppeal("carrier", data);
    mockAppeals.unshift(appeal);
    return mockApi(appeal);
  }

  const { post } = await import("../utils/request");
  return post("/carrier/appeals", data);
}

export async function getCarrierAppeals(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: Appeal[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
    return mockApi(paginateAppeals(mockAppeals.filter((item) => item.applicant_type === "carrier"), page, page_size));
  }

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

  if (isMockEnabled()) {
    const filtered = mockAppeals.filter((item) => {
      if (params.status && item.status !== params.status) return false;
      if (params.problem_type && item.problem_type !== params.problem_type) return false;
      return true;
    });
    return mockApi(paginateAppeals(filtered, page, pageSize));
  }

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
  if (isMockEnabled()) {
    const appeal = mockAppeals.find((item) => item.id === id);
    if (!appeal) {
      await mockApiFail(10002, "诉求不存在");
      throw new Error("unreachable");
    }
    appeal.status = status;
    appeal.updated_at = new Date().toISOString();
    return mockApi(appeal);
  }

  const { patch } = await import("../utils/request");
  return patch(`/gov/appeals/${id}/status`, { status });
}
