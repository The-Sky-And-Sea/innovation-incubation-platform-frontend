import { isMockEnabled } from "./config";
import { mockApi, mockApiFail } from "./mock";
import type {
  ApiResponse,
  AuditRequestBody,
  AuditStatus,
  ChangeRecord,
  ChangeType,
} from "../types";

const CHANGE_TYPES: ChangeType[] = [
  "企业名称",
  "统一社会信用代码",
  "所属行业",
  "企业规模",
  "企业地址",
  "法定代表人",
  "入孵协议文件",
];

let changeIdCounter = 302;
const mockChanges = new Map<number, ChangeRecord>();

function seedChanges() {
  if (mockChanges.size > 0) return;
  mockChanges.set(301, {
    id: 301,
    enterprise_id: 1,
    change_type: "企业名称",
    change_content: "企业完成股份制改造，申请同步更新主体名称。",
    old_value: { name: "测试科技有限公司" },
    new_value: { name: "新测试科技股份有限公司" },
    status: "pending",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  });
  mockChanges.set(302, {
    id: 302,
    enterprise_id: 1,
    change_type: "企业地址",
    change_content: "退回后待企业补充楼层和房间号。",
    old_value: { address: "广州市天河区科韵路 123 号" },
    new_value: { address: "广州市天河区科韵路 123 号" },
    status: "returned",
    created_at: new Date(Date.now() - 7200000).toISOString(),
  });
}

seedChanges();

function paginate<T>(items: T[], page: number, pageSize: number) {
  return {
    list: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    page_size: pageSize,
  };
}

export async function getChangeTypes(): Promise<ApiResponse<ChangeType[]>> {
  if (isMockEnabled()) {
    return mockApi(CHANGE_TYPES);
  }

  const { get } = await import("../utils/request");
  return get<ChangeType[]>("/enterprise/change-types");
}

export async function submitChange(
  changeType: ChangeType,
  changeContent: string,
  newValue: Record<string, unknown>,
): Promise<ApiResponse<ChangeRecord>> {
  if (isMockEnabled()) {
    if (!CHANGE_TYPES.includes(changeType)) {
      await mockApiFail(10001, `无效的变更类型：${changeType}`);
      throw new Error("unreachable");
    }

    const record: ChangeRecord = {
      id: ++changeIdCounter,
      enterprise_id: 1,
      change_type: changeType,
      change_content: changeContent,
      old_value: {},
      new_value: newValue,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    mockChanges.set(record.id, record);
    return mockApi(record);
  }

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
  if (isMockEnabled()) {
    return mockApi(paginate(Array.from(mockChanges.values()), page, page_size));
  }

  const { get } = await import("../utils/request");
  return get("/enterprise/changes", {
    page: String(page),
    page_size: String(page_size),
  });
}

export async function getChangeDetail(id: number): Promise<ApiResponse<ChangeRecord>> {
  if (isMockEnabled()) {
    const record = mockChanges.get(id);
    if (!record) {
      await mockApiFail(10002, "变更记录不存在");
      throw new Error("unreachable");
    }
    return mockApi(record);
  }

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
  if (isMockEnabled()) {
    const record = mockChanges.get(id);
    if (!record) {
      await mockApiFail(10002, "变更记录不存在");
      throw new Error("unreachable");
    }
    if (record.status !== "returned") {
      await mockApiFail(10201, "仅退回的变更记录可重新编辑");
      throw new Error("unreachable");
    }
    const next: ChangeRecord = {
      ...record,
      change_content: data.change_content,
      new_value: data.new_value,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    mockChanges.set(id, next);
    return mockApi(next);
  }

  const { put } = await import("../utils/request");
  return put(`/enterprise/changes/${id}`, data);
}

export async function getPendingChangeList(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: ChangeRecord[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
    const list = Array.from(mockChanges.values()).filter((item) => item.status === "pending");
    return mockApi(paginate(list, page, page_size), 300);
  }

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
  if (isMockEnabled()) {
    const record = mockChanges.get(id);
    if (!record) {
      await mockApiFail(10002, "变更记录不存在");
      throw new Error("unreachable");
    }
    if (record.status !== "pending") {
      await mockApiFail(10201, "该变更记录已被审核");
      throw new Error("unreachable");
    }

    const statusMap: Record<string, AuditStatus> = {
      approve: "approved",
      reject: "rejected",
      return: "returned",
    };
    record.status = statusMap[body.action];
    return mockApi(null);
  }

  const { post } = await import("../utils/request");
  return post(`/carrier/changes/${id}/review`, body);
}
