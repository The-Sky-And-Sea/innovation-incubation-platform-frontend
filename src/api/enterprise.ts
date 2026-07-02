/**
 * 企业端 API 层
 *
 * 对应后端接口：
 * - GET /enterprise/profile  获取当前企业信息
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