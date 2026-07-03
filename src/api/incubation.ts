/**
 * 入驻申请 API 层
 *
 * 对应后端接口：
 * - POST  /enterprise/incubations       企业提交入驻申请
 * - GET   /enterprise/incubations  我的入驻记录（分页）
 * - GET   /enterprise/incubations/:id   入驻详情
 */

import type {
  ApiResponse,
  IncubationRecord,
  IncubationApplyRequest,
} from "../types";

/**
 * 企业提交入驻申请
 * @param data 入驻申请请求体
 * @returns 创建后的入驻记录
 */
export async function submitIncubation(
  data: IncubationApplyRequest,
): Promise<ApiResponse<IncubationRecord>> {
  const { post } = await import("../utils/request");
  return post<IncubationRecord>("/enterprise/incubations", data);
}

/**
 * 获取当前企业的入驻记录列表
 */
export async function getIncubationList(
  page = 1,
  page_size = 20,
): Promise<
  ApiResponse<{ list: IncubationRecord[]; total: number; page: number; page_size: number }>
> {
  const { get } = await import("../utils/request");
  return get("/enterprise/incubations", {
    page: String(page),
    page_size: String(page_size),
  });
}

/**
 * 查看入驻详情
 */
export async function getIncubationDetail(
  id: number,
): Promise<ApiResponse<IncubationRecord>> {
  const { get } = await import("../utils/request");
  return get(`/enterprise/incubations/${id}`);
}