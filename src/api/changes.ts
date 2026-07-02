import type {
  ApiResponse,
  AuditRequestBody,
  ChangeRecord,
  ChangeType,
} from "../types";

export async function getChangeTypes(): Promise<ApiResponse<ChangeType[]>> {
  const { get } = await import("../utils/request");
  return get<ChangeType[]>("/enterprise/change-types");
}

export async function submitChange(
  changeType: ChangeType,
  changeContent: string,
  newValue: Record<string, unknown>,
): Promise<ApiResponse<ChangeRecord>> {
  const { post } = await import("../utils/request");
  return post<ChangeRecord>("/enterprise/changes", {
    change_type: changeType,
    change_content: changeContent,
    new_value: newValue,
  });
}

export async function getChangeList(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: ChangeRecord[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/enterprise/changes", {
    page: String(page),
    page_size: String(page_size),
  });
}

export async function getChangeDetail(id: number): Promise<ApiResponse<ChangeRecord>> {
  const { get } = await import("../utils/request");
  return get(`/enterprise/changes/${id}`);
}

export async function updateChange(
  id: number,
  data: {
    change_content: string;
    new_value: Record<string, unknown>;
  },
): Promise<ApiResponse<ChangeRecord>> {
  const { put } = await import("../utils/request");
  return put(`/enterprise/changes/${id}`, data);
}

export async function getPendingChangeList(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: ChangeRecord[]; total: number; page: number; page_size: number }>> {
  const { get } = await import("../utils/request");
  return get("/carrier/changes", {
    page: String(page),
    page_size: String(page_size),
  });
}

export async function reviewChange(
  id: number,
  body: AuditRequestBody,
): Promise<ApiResponse<null>> {
  const { post } = await import("../utils/request");
  return post(`/carrier/changes/${id}/review`, body);
}
