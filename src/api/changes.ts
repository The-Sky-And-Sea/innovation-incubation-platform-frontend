/**
 * 重大事项变更 API 层
 *
 * 对应后端接口：
 * - GET   /enterprise/changes/types       可变更指标列表
 * - POST  /enterprise/changes             发起变更申请
 * - GET   /enterprise/changes/list        变更记录列表（分页）
 * - GET   /enterprise/changes/:id         变更详情
 * - PUT   /enterprise/changes/:id         重新编辑被退回的变更
 * - GET   /carrier/changes/list           待审核变更列表（分页）
 * - POST  /carrier/changes/:id/{action}   载体审核变更
 */

import { mockApi, mockApiFail } from "./mock";
import type {
  ApiResponse,
  ChangeRecord,
  ChangeType,
  AuditRequestBody,
  AuditStatus,
} from "../types";

const USE_MOCK = true;

// ============ Mock 数据 ============

/** 可变更指标列表 */
const CHANGE_TYPES: ChangeType[] = [
  "企业名称",
  "统一社会信用代码",
  "所属行业",
  "企业规模",
  "企业地址",
  "法定代表人",
  "入孵协议文件",
];

let changeIdCounter = 300;
const mockChanges: Map<number, ChangeRecord> = new Map();

/** 预置一条待审核的变更记录 */
const now = new Date().toISOString().slice(0, 10);
mockChanges.set(301, {
  id: 301,
  enterprise_id: 1,
  change_type: "企业名称",
  change_content: "公司更名，申请将企业名称从「测试科技有限公司」变更为「新测试科技股份有限公司」",
  old_value: { name: "测试科技有限公司" },
  new_value: { new_name: "新测试科技股份有限公司" },
  status: "pending",
  created_at: now + "T09:00:00Z",
});

/**
 * 获取可变更指标列表
 */
export async function getChangeTypes(): Promise<ApiResponse<ChangeType[]>> {
  if (USE_MOCK) {
    return mockApi<ChangeType[]>(CHANGE_TYPES);
  }

  const { get } = await import("../utils/request");
  return get<ChangeType[]>("/enterprise/changes/types");
}

/**
 * 发起变更申请
 * @param changeType 变更类型
 * @param changeContent 变更说明
 * @param newValue 新值（JSON 对象）
 */
export async function submitChange(
  changeType: ChangeType,
  changeContent: string,
  newValue: Record<string, unknown>,
): Promise<ApiResponse<ChangeRecord>> {
  if (USE_MOCK) {
    if (!CHANGE_TYPES.includes(changeType)) {
      await mockApiFail(10001, `无效的变更类型: ${changeType}`);
      throw new Error("unreachable");
    }

    const id = ++changeIdCounter;
    const record: ChangeRecord = {
      id,
      enterprise_id: 1,
      change_type: changeType,
      change_content: changeContent,
      old_value: {},
      new_value: newValue,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    mockChanges.set(id, record);
    return mockApi(record);
  }

  const { post } = await import("../utils/request");
  return post<ChangeRecord>("/enterprise/changes", {
    change_type: changeType,
    change_content: changeContent,
    new_value: newValue,
  });
}

/**
 * 获取当前企业的变更记录列表
 */
export async function getChangeList(
  page = 1,
  page_size = 20,
): Promise<
  ApiResponse<{ list: ChangeRecord[]; total: number; page: number; page_size: number }>
> {
  if (USE_MOCK) {
    const all = Array.from(mockChanges.values());
    const list = all.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: all.length, page, page_size });
  }

  const { get } = await import("../utils/request");
  return get("/enterprise/changes/list", {
    page: String(page),
    page_size: String(page_size),
  });
}

/**
 * 查看变更详情
 */
export async function getChangeDetail(
  id: number,
): Promise<ApiResponse<ChangeRecord>> {
  if (USE_MOCK) {
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

// ============ 载体端 ============

/**
 * 获取待审核变更列表
 */
export async function getPendingChangeList(
  page = 1,
  page_size = 20,
): Promise<
  ApiResponse<{ list: ChangeRecord[]; total: number; page: number; page_size: number }>
> {
  if (USE_MOCK) {
    const all = Array.from(mockChanges.values()).filter((r) => r.status === "pending");
    const list = all.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: all.length, page, page_size }, 300);
  }

  const { get } = await import("../utils/request");
  return get("/carrier/changes/list", {
    page: String(page),
    page_size: String(page_size),
  });
}

/**
 * 载体审核变更
 */
export async function reviewChange(
  id: number,
  body: AuditRequestBody,
): Promise<ApiResponse<null>> {
  if (USE_MOCK) {
    const record = mockChanges.get(id);
    if (!record) {
      await mockApiFail(10002, "变更记录不存在");
      throw new Error("unreachable");
    }
    if (record.status !== "pending") {
      await mockApiFail(10201, "该变更记录已被审核");
      throw new Error("unreachable");
    }

    const validActions: AuditAction[] = ["approve", "reject", "return"];
    if (!validActions.includes(body.action)) {
      await mockApiFail(10001, "无效的审核操作");
      throw new Error("unreachable");
    }

    const statusMap: Record<string, AuditStatus> = {
      approve: "approved",
      reject: "rejected",
      return: "returned",
    };
    record.status = statusMap[body.action];
    console.log(`[Mock] 变更审核 #${id}: ${record.status}, 意见: ${body.comment}`);
    return mockApi(null);
  }

  const { post } = await import("../utils/request");
  return post(`/carrier/changes/${id}/${body.action}`, body);
}

type AuditAction = "approve" | "reject" | "return";