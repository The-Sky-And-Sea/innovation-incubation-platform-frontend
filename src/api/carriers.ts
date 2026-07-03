/**
 * 载体 API 层
 *
 * 对应后端接口（企业端视角）：
 * - GET /enterprise/carriers     载体列表（分页）
 * - GET /enterprise/carriers/:id  载体详情
 */

import type { ApiResponse, CarrierInfo } from "../types";

/**
 * 载体列表（分页）
 * @param page 页码
 * @param page_size 每页条数
 */
export async function getCarrierList(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: CarrierInfo[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/enterprise/carriers", { page: String(page), page_size: String(page_size) });
}

/**
 * 载体详情
 * @param id 载体 ID
 */
export async function getCarrierDetail(
  id: number,
): Promise<ApiResponse<CarrierInfo>> {
  const { get } = await import("../utils/request");
  return get(`/enterprise/carriers/${id}`);
}