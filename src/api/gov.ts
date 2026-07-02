/**
 * 政务端 API 层
 *
 * 对应后端接口：
 * - GET /gov/enterprises?keyword=  企业检索（按名称/信用代码/行业）
 * - GET /gov/enterprises/:id       企业详情
 * - GET /gov/carriers?keyword=     载体检索（按名称/地址）
 *
 * 后续扩展：政策管理、申报审核、绩效考核、账号注销管理
 */

import type { ApiResponse, EnterpriseInfo, CarrierInfo } from "../types";

/**
 * 企业检索（按关键词搜索名称/信用代码/行业）
 * @param keyword 搜索关键词（传空字符串返回全部）
 * @param page 页码
 * @param page_size 每页条数
 */
export async function searchEnterprises(
  keyword: string,
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: EnterpriseInfo[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/gov/enterprises", { keyword, page: String(page), page_size: String(page_size) });
}

/**
 * 企业详情（政务端查看任意企业）
 * @param id 企业 ID
 */
export async function getEnterpriseDetail(
  id: number,
): Promise<ApiResponse<EnterpriseInfo>> {
  const { get } = await import("../utils/request");
  return get(`/gov/enterprises/${id}`);
}

export async function updateEnterpriseInfo(
  id: number,
  data: Partial<EnterpriseInfo>,
): Promise<ApiResponse<EnterpriseInfo>> {
  const { put } = await import("../utils/request");
  return put(`/gov/enterprises/${id}`, data);
}

export async function deleteEnterprise(id: number): Promise<ApiResponse<null>> {
  const { del } = await import("../utils/request");
  return del(`/gov/enterprises/${id}`);
}

/**
 * 载体检索（按关键词搜索名称/地址）
 * @param keyword 搜索关键词
 * @param page 页码
 * @param page_size 每页条数
 */
export async function searchCarriers(
  keyword: string,
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: CarrierInfo[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/gov/carriers", { keyword, page: String(page), page_size: String(page_size) });
}

export async function deleteCarrier(id: number): Promise<ApiResponse<null>> {
  const { del } = await import("../utils/request");
  return del(`/gov/carriers/${id}`);
}

export async function govCompleteIncubation(id: number): Promise<ApiResponse<null>> {
  const { post } = await import("../utils/request");
  return post(`/gov/incubations/${id}/complete`);
}