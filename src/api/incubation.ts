/**
 * 入驻申请 API 层
 *
 * 对应后端接口：
 * - POST  /enterprise/incubation       企业提交入驻申请
 * - GET   /enterprise/incubation/list  我的入驻记录（分页）
 * - GET   /enterprise/incubation/:id   入驻详情
 */

import { mockApi, mockApiFail } from "./mock";
import type {
  ApiResponse,
  IncubationRecord,
  IncubationApplyRequest,
} from "../types";

const USE_MOCK = true;

// ============ Mock 数据 ============

let mockIncubationIdCounter = 200;
const mockIncubations: Map<number, IncubationRecord> = new Map();

/** 预置一条待审核的入驻记录，方便演示 */
const now = new Date().toISOString().slice(0, 10);
mockIncubations.set(201, {
  id: 201,
  enterprise_id: 1,
  carrier_id: 1,
  status: "pending",
  incubate_start: now,
  incubate_end: "2028-12-31",
  agreement_file_id: 101,
  created_at: now + "T10:00:00Z",
  updated_at: now + "T10:00:00Z",
});
mockIncubationIdCounter = 202;

/**
 * 企业提交入驻申请
 * @param data 入驻申请请求体
 * @returns 创建后的入驻记录
 */
export async function submitIncubation(
  data: IncubationApplyRequest,
): Promise<ApiResponse<IncubationRecord>> {
  if (USE_MOCK) {
    // 校验必填字段
    if (!data.carrier_id) {
      await mockApiFail(10001, "请选择入驻载体");
      throw new Error("unreachable");
    }
    if (!data.agreement_file_id) {
      await mockApiFail(10001, "请先上传入孵协议文件");
      throw new Error("unreachable");
    }

    const id = ++mockIncubationIdCounter;
    const record: IncubationRecord = {
      id,
      enterprise_id: 1,
      carrier_id: data.carrier_id,
      status: "pending",
      incubate_start: data.incubate_start,
      incubate_end: data.incubate_end,
      agreement_file_id: data.agreement_file_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockIncubations.set(id, record);
    return mockApi(record);
  }

  const { post } = await import("../utils/request");
  return post<IncubationRecord>("/enterprise/incubation", data);
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
  if (USE_MOCK) {
    const all = Array.from(mockIncubations.values());
    const list = all.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: all.length, page, page_size });
  }

  const { get } = await import("../utils/request");
  return get("/enterprise/incubation/list", {
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
  if (USE_MOCK) {
    const record = mockIncubations.get(id);
    if (!record) {
      await mockApiFail(10002, "入驻记录不存在");
      throw new Error("unreachable");
    }
    return mockApi(record);
  }

  const { get } = await import("../utils/request");
  return get(`/enterprise/incubation/${id}`);
}