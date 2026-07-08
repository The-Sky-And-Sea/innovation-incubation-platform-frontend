/**
 * 企业端 API 层
 *
 * 对应后端接口：
 * - GET /enterprise/profile  获取当前企业信息
 * - GET /enterprise/incubations  获取入驻记录列表
 *
 * 后续扩展：企业入驻、重大事项变更、政策申报等
 */

import type { ApiResponse, EnterpriseInfo } from "../types";

/**
 * 获取当前登录企业的详细信息
 */
export async function getMyEnterpriseInfo(): Promise<
  ApiResponse<EnterpriseInfo>
> {
  const { get } = await import("../utils/request");
  return get<EnterpriseInfo>("/enterprise/profile");
}

export async function updateMyEnterpriseInfo(
  data: Partial<EnterpriseInfo>,
): Promise<ApiResponse<EnterpriseInfo>> {
  const { put } = await import("../utils/request");
  return put<EnterpriseInfo>("/enterprise/profile", data);
}

/**
 * 获取当前企业的入驻记录列表
 */
export async function getMyIncubation(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: any[]; total: number }>> {
  const { get } = await import("../utils/request");
  return get<{ list: any[]; total: number }>("/enterprise/incubations", { page, page_size });
}
