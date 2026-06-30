/**
 * 企业端 API 层
 *
 * 对应后端接口：
 * - GET /enterprise/profile  获取当前企业信息
 *
 * 后续扩展：企业入驻、重大事项变更、政策申报等
 */

import { mockApi } from "./mock";
import { isMockEnabled } from "./config";
import type { ApiResponse, EnterpriseInfo } from "../types";



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
 * 获取当前登录企业的详细信息
 */
export async function getMyEnterpriseInfo(): Promise<
  ApiResponse<EnterpriseInfo>
> {
  if (isMockEnabled()) {
    return mockApi<EnterpriseInfo>(mockEnterprise);
  }

  const { get } = await import("../utils/request");
  return get<EnterpriseInfo>("/enterprise/profile");
}
