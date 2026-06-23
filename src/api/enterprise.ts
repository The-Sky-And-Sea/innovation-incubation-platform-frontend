/**
 * 企业端 Mock API
 *
 * 后续对接真实后端时，将 USE_MOCK 改为 false
 */

import { mockApi } from "./mock";
import type { ApiResponse, EnterpriseInfo } from "../types";

/** 当前是否使用 Mock 模式 */
const USE_MOCK = true;

// ============ Mock 数据 ============

const mockEnterprise: EnterpriseInfo = {
  id: 1,
  name: "测试科技有限公司",
  credit_code: "91440101MA5XXXX",
  industry: "信息技术",
  scale: "小型",
  address: "广东省广州市天河区XX路123号",
  legal_person: "张三",
  contact_name: "李四",
  contact_phone: "13800138000",
};

/**
 * 获取当前企业信息
 */
export async function getMyEnterpriseInfo(): Promise<
  ApiResponse<EnterpriseInfo>
> {
  if (USE_MOCK) {
    return mockApi<EnterpriseInfo>(mockEnterprise);
  }

  const { get } = await import("../utils/request");
  return get<EnterpriseInfo>("/enterprise/my-info");
}