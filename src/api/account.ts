/**
 * 账号注销 API 层
 */

import { mockApi, mockApiFail } from "./mock";
import { isMockEnabled } from "./config";
import type {
  AccountDeletion,
  AccountDeletionStatus,
  ApiResponse,
  AuditRequestBody,
} from "../types";

let deletionIdCounter = 1200;

const mockAccountDeletions: AccountDeletion[] = [
  {
    id: 1,
    applicant_name: "测试科技有限公司",
    applicant_type: "enterprise",
    reason: "企业已停止运营",
    status: "pending",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    applicant_name: "深圳湾创业广场",
    applicant_type: "carrier",
    reason: "载体已停止运营",
    status: "pending",
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

export async function submitEnterpriseDeletion(reason: string): Promise<ApiResponse<AccountDeletion>> {
  if (isMockEnabled()) {
    const record: AccountDeletion = {
      id: ++deletionIdCounter,
      applicant_name: "测试科技有限公司",
      applicant_type: "enterprise",
      reason,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    mockAccountDeletions.unshift(record);
    return mockApi(record);
  }

  const { post } = await import("../utils/request");
  return post("/enterprise/account/deletion", { reason });
}

export async function submitCarrierDeletion(reason: string): Promise<ApiResponse<AccountDeletion>> {
  if (isMockEnabled()) {
    const record: AccountDeletion = {
      id: ++deletionIdCounter,
      applicant_name: "天河软件园孵化器",
      applicant_type: "carrier",
      reason,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    mockAccountDeletions.unshift(record);
    return mockApi(record);
  }

  const { post } = await import("../utils/request");
  return post("/carrier/account/deletion", { reason });
}

export async function getGovAccountDeletions(
  status: AccountDeletionStatus | "" = "pending",
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: AccountDeletion[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
    const filtered = status
      ? mockAccountDeletions.filter((item) => item.status === status)
      : mockAccountDeletions;
    const list = filtered.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: filtered.length, page, page_size });
  }

  const { get } = await import("../utils/request");
  return get("/gov/account/deletions", {
    status,
    page: String(page),
    page_size: String(page_size),
  });
}

export async function reviewGovAccountDeletion(
  id: number,
  body: AuditRequestBody,
): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    const record = mockAccountDeletions.find((item) => item.id === id);
    if (!record) {
      await mockApiFail(10002, "注销申请不存在");
      throw new Error("unreachable");
    }
    record.status = body.action === "approve" ? "approved" : "rejected";
    record.comment = body.comment;
    record.reviewed_at = new Date().toISOString();
    return mockApi(null);
  }

  const { post } = await import("../utils/request");
  return post(`/gov/account/deletions/${id}/review`, body);
}
