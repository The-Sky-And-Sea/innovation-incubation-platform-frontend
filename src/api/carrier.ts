/**
 * 载体端 API 层
 *
 * 对应后端接口：
 * - GET   /carrier/incubations/pending       待审核入驻列表（分页）
 * - GET   /carrier/incubations               本载体下已审核通过的入驻记录
 * - POST  /carrier/incubations/:id/review    审核通过/拒绝/退回
 * - POST  /carrier/incubations/:id/complete  孵化毕业
 * - POST  /carrier/incubations/:id/terminate 提前结束入驻
 */

import type {
  ApiResponse,
  IncubationRecord,
  AuditRequestBody,
  CarrierInfo,
} from "../types";

export async function getPendingIncubationList(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: IncubationRecord[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/carrier/incubations/pending", {
    page: String(page),
    page_size: String(page_size),
  });
}

// 列出本载体下已审核通过、正式入驻的记录
export async function getCarrierIncubationList(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: IncubationRecord[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/carrier/incubations", {
    page: String(page),
    page_size: String(page_size),
  });
}

export async function reviewIncubation(
  id: number,
  body: AuditRequestBody,
): Promise<ApiResponse<null>> {
  const { post } = await import("../utils/request");
  return post(`/carrier/incubations/${id}/review`, body);
}

export async function completeIncubation(
  id: number,
): Promise<ApiResponse<null>> {
  const { post } = await import("../utils/request");
  return post(`/carrier/incubations/${id}/complete`);
}

export async function terminateIncubation(
  id: number,
  reason: string,
): Promise<ApiResponse<null>> {
  const { post } = await import("../utils/request");
  return post(`/carrier/incubations/${id}/terminate`, { reason });
}

export async function getCarrierInfo(): Promise<ApiResponse<CarrierInfo>> {
  const { get } = await import("../utils/request");
  return get<CarrierInfo>("/carrier/info");
}

export async function updateCarrierInfo(
  data: Partial<CarrierInfo>,
): Promise<ApiResponse<CarrierInfo>> {
  const { put } = await import("../utils/request");
  return put<CarrierInfo>("/carrier/info", data);
}
