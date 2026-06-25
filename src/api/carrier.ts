/**
 * 载体端 API 层
 *
 * 对应后端接口：
 * - GET   /carrier/incubation/list           待审核入驻列表（分页）
 * - POST  /carrier/incubation/:id/approve    审核通过
 * - POST  /carrier/incubation/:id/reject     审核拒绝
 * - POST  /carrier/incubation/:id/return     审核退回
 * - POST  /carrier/incubation/:id/complete   孵化毕业
 */

import { mockApi, mockApiFail } from "./mock";
import type {
  ApiResponse,
  IncubationRecord,
  AuditRequestBody,
  AuditStatus,
  CarrierInfo,
} from "../types";

const USE_MOCK = true;

// ============ Mock 数据（与 incubation.ts 共享 demo 数据） ============

const now = new Date().toISOString().slice(0, 10);
const pendingRecords: IncubationRecord[] = [
  {
    id: 201,
    enterprise_id: 1,
    carrier_id: 1,
    status: "pending",
    incubate_start: now,
    incubate_end: "2028-12-31",
    agreement_file_id: 101,
    created_at: now + "T10:00:00Z",
    updated_at: now + "T10:00:00Z",
  },
  {
    id: 202,
    enterprise_id: 2,
    carrier_id: 1,
    status: "pending",
    incubate_start: "2026-02-01",
    incubate_end: "2029-01-31",
    agreement_file_id: 102,
    created_at: now + "T11:00:00Z",
    updated_at: now + "T11:00:00Z",
  },
];

/** 审核操作后更新状态 */
function updateRecordStatus(id: number, newStatus: AuditStatus, comment: string): boolean {
  const record = pendingRecords.find(r => r.id === id);
  if (!record) return false;
  record.status = newStatus;
  record.updated_at = new Date().toISOString();
  // 实际后端会写审核记录，mock 仅打印
  console.log(`[Mock] 入驻审核 #${id}: ${newStatus}, 意见: ${comment}`);
  return true;
}

/**
 * 获取待审核入驻列表（已过滤有 pending 协议文件变更的记录）
 */
export async function getPendingIncubationList(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: IncubationRecord[]; total: number; page: number; page_size: number }>> {
  if (USE_MOCK) {
    const all = pendingRecords.filter(r => r.status === "pending");
    const list = all.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: all.length, page, page_size }, 300);
  }

  const { get } = await import("../utils/request");
  return get("/carrier/incubation/list", {
    page: String(page),
    page_size: String(page_size),
  });
}

/**
 * 审核入驻申请（通过/拒绝/退回）
 */
export async function reviewIncubation(
  id: number,
  body: AuditRequestBody,
): Promise<ApiResponse<null>> {
  if (USE_MOCK) {
    const validActions: AuditRequestBody["action"][] = ["approve", "reject", "return"];
    if (!validActions.includes(body.action)) {
      await mockApiFail(10001, "无效的审核操作");
      throw new Error("unreachable");
    }

    const statusMap: Record<string, AuditStatus> = {
      approve: "approved",
      reject: "rejected",
      return: "returned",
    };
    const newStatus = statusMap[body.action];
    const updated = updateRecordStatus(id, newStatus, body.comment);
    if (!updated) {
      await mockApiFail(10002, "入驻记录不存在或已审核");
      throw new Error("unreachable");
    }
    return mockApi(null);
  }

  const { post } = await import("../utils/request");
  return post(`/carrier/incubation/${id}/${body.action}`, body);
}

/**
 * 孵化毕业
 */
export async function completeIncubation(
  id: number,
): Promise<ApiResponse<null>> {
  if (USE_MOCK) {
    const updated = updateRecordStatus(id, "approved", "孵化毕业");
    if (!updated) {
      await mockApiFail(10002, "入驻记录不存在");
      throw new Error("unreachable");
    }
    return mockApi(null);
  }

  const { post } = await import("../utils/request");
  return post(`/carrier/incubation/${id}/complete`);
}

// ============ 载体基础信息 ============

const mockCarrierInfo: CarrierInfo = {
  id: 1,
  name: "天河软件园孵化器",
  type: "科技企业孵化器",
  address: "广州市天河区科韵路16号",
  area: "天河区",
  manager_name: "王经理",
  contact_phone: "020-88880001",
  description: "国家级科技企业孵化器",
};

/**
 * 获取载体自身信息
 */
export async function getCarrierInfo(): Promise<ApiResponse<CarrierInfo>> {
  if (USE_MOCK) {
    return mockApi<CarrierInfo>(mockCarrierInfo);
  }
  const { get } = await import("../utils/request");
  return get<CarrierInfo>("/carrier/info");
}

/**
 * 更新载体自身信息
 */
export async function updateCarrierInfo(
  data: Partial<CarrierInfo>,
): Promise<ApiResponse<CarrierInfo>> {
  if (USE_MOCK) {
    Object.assign(mockCarrierInfo, data);
    return mockApi({ ...mockCarrierInfo });
  }
  const { put } = await import("../utils/request");
  return put<CarrierInfo>("/carrier/info", data);
}
