/**
 * 政务端 API 层
 *
 * 对应后端接口：
 * - GET /gov/enterprises?keyword=  企业检索（按名称/信用代码/行业）
 * - GET /gov/enterprises/:id       企业详情
 * - GET /gov/carriers?keyword=     载体检索（按名称/地址）
 *
 * 后续扩展：政策管理、申报审核、绩效考核、账号注销管理
 */

import { mockApi, mockApiFail } from "./mock";
import { isMockEnabled } from "./config";
import type { ApiResponse, EnterpriseInfo, CarrierInfo } from "../types";



// ============ Mock 数据 ============

const mockEnterprises: EnterpriseInfo[] = [
  {
    id: 1,
    name: "测试科技有限公司",
    credit_code: "91440101MA5XXXX",
    industry: "信息技术",
    scale: "小型",
    address: "广东省广州市天河区XX路123号",
    legal_person: "张三",
    contact_name: "李四",
    contact_phone: "13800138000",
  },
  {
    id: 2,
    name: "创新科技有限公司",
    credit_code: "91440101MA6YYYY",
    industry: "人工智能",
    scale: "中型",
    address: "深圳市南山区科技园路456号",
    legal_person: "王五",
    contact_name: "赵六",
    contact_phone: "13900139000",
  },
  {
    id: 3,
    name: "绿源环保有限公司",
    credit_code: "91440101MA7ZZZZ",
    industry: "新能源",
    scale: "大型",
    address: "佛山市顺德区北滘镇工业大道88号",
    legal_person: "赵七",
    contact_name: "孙八",
    contact_phone: "13700137000",
  },
];

const mockCarriers: CarrierInfo[] = [
  {
    id: 1,
    name: "天河软件园孵化器",
    type: "科技企业孵化器",
    address: "广州市天河区科韵路16号",
    area: "天河区",
    manager_name: "王经理",
    contact_phone: "020-88880001",
    description: "国家级科技企业孵化器，专注信息技术领域创新创业。",
  },
  {
    id: 2,
    name: "深圳湾创业广场",
    type: "众创空间",
    address: "深圳市南山区高新南一道001号",
    area: "南山区",
    manager_name: "陈经理",
    contact_phone: "0755-88880002",
    description: "粤港澳大湾区知名众创空间。",
  },
];

// ============ 企业检索 ============

/**
 * 企业检索（按关键词搜索名称/信用代码/行业）
 * @param keyword 搜索关键词（传空字符串返回全部）
 * @param page 页码
 * @param page_size 每页条数
 */
export async function searchEnterprises(
  keyword: string,
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: EnterpriseInfo[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
    const filtered = keyword
      ? mockEnterprises.filter(
          (e) =>
            e.name.includes(keyword) ||
            e.credit_code.includes(keyword) ||
            e.industry.includes(keyword),
        )
      : mockEnterprises;
    const list = filtered.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: filtered.length, page, page_size });
  }

  const { get } = await import("../utils/request");
  return get("/gov/enterprises", { keyword, page: String(page), page_size: String(page_size) });
}

/**
 * 企业详情（政务端查看任意企业）
 * @param id 企业 ID
 */
export async function getEnterpriseDetail(
  id: number,
): Promise<ApiResponse<EnterpriseInfo>> {
  if (isMockEnabled()) {
    const ent = mockEnterprises.find((e) => e.id === id);
    if (!ent) {
      const { mockApiFail } = await import("./mock");
      await mockApiFail(10002, "企业不存在");
      throw new Error("unreachable");
    }
    return mockApi(ent);
  }

  const { get } = await import("../utils/request");
  return get(`/gov/enterprises/${id}`);
}

export async function updateEnterpriseInfo(
  id: number,
  data: Partial<EnterpriseInfo>,
): Promise<ApiResponse<EnterpriseInfo>> {
  if (isMockEnabled()) {
    const index = mockEnterprises.findIndex((item) => item.id === id);
    if (index === -1) {
      await mockApiFail(10002, "企业不存在");
      throw new Error("unreachable");
    }
    mockEnterprises[index] = { ...mockEnterprises[index], ...data, id };
    return mockApi(mockEnterprises[index]);
  }

  const { put } = await import("../utils/request");
  return put(`/gov/enterprises/${id}`, data);
}

export async function deleteEnterprise(id: number): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    const index = mockEnterprises.findIndex((item) => item.id === id);
    if (index === -1) {
      await mockApiFail(10002, "企业不存在");
      throw new Error("unreachable");
    }
    mockEnterprises.splice(index, 1);
    return mockApi(null);
  }

  const { del } = await import("../utils/request");
  return del(`/gov/enterprises/${id}`);
}

// ============ 载体检索 ============

/**
 * 载体检索（按关键词搜索名称/地址）
 * @param keyword 搜索关键词
 * @param page 页码
 * @param page_size 每页条数
 */
export async function searchCarriers(
  keyword: string,
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: CarrierInfo[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
    const filtered = keyword
      ? mockCarriers.filter(
          (c) => c.name.includes(keyword) || c.address.includes(keyword),
        )
      : mockCarriers;
    const list = filtered.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: filtered.length, page, page_size });
  }

  const { get } = await import("../utils/request");
  return get("/gov/carriers", { keyword, page: String(page), page_size: String(page_size) });
}

export async function deleteCarrier(id: number): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    const index = mockCarriers.findIndex((item) => item.id === id);
    if (index === -1) {
      await mockApiFail(10002, "载体不存在");
      throw new Error("unreachable");
    }
    mockCarriers.splice(index, 1);
    return mockApi(null);
  }

  const { del } = await import("../utils/request");
  return del(`/gov/carriers/${id}`);
}

export async function govCompleteIncubation(id: number): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
    return mockApi(null);
  }

  const { post } = await import("../utils/request");
  return post(`/gov/incubations/${id}/complete`);
}
