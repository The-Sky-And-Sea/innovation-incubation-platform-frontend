/**
 * 账号注销 API 层
 */

import type {
  AccountDeletion,
  AccountDeletionStatus,
  ApiResponse,
  AuditRequestBody,
} from "../types";

export async function submitEnterpriseDeletion(reason: string): Promise<ApiResponse<AccountDeletion>> {
  const { post } = await import("../utils/request");
  return post("/enterprise/account/deletion", { reason });
}

export async function submitCarrierDeletion(reason: string): Promise<ApiResponse<AccountDeletion>> {
  const { post } = await import("../utils/request");
  return post("/carrier/account/deletion", { reason });
}

export async function getGovAccountDeletions(
  status: AccountDeletionStatus | "" = "pending",
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: AccountDeletion[]; total: number; page: number; page_size: number }>> {
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
  const { post } = await import("../utils/request");
  return post(`/gov/account/deletions/${id}/review`, body);
}
