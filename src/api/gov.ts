/**
 * 政务端 Mock API
 *
 * 后续对接真实后端时，将 USE_MOCK 改为 false
 */

import { mockApi } from "./mock";
import type { ApiResponse, EnterpriseInfo, CarrierInfo } from "../types";

/** 当前是否使用 Mock 模式 */
const USE_MOCK = true;

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

// ============ 企业查询 ============

/**
 * 企业搜索
 */
export async function searchEnterprises(
  keyword: string,
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: EnterpriseInfo[]; total: number; page: number; page_size: number }>> {
  if (USE_MOCK) {
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
 * 企业详情
 */
export async function getEnterpriseDetail(
  id: number,
): Promise<ApiResponse<EnterpriseInfo>> {
  if (USE_MOCK) {
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

// ============ 载体查询 ============

/**
 * 载体搜索
 */
export async function searchCarriers(
  keyword: string,
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: CarrierInfo[]; total: number; page: number; page_size: number }>> {
  if (USE_MOCK) {
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