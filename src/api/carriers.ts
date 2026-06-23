/**
 * 载体 API 层
 *
 * 对应后端接口（企业端视角）：
 * - GET /enterprise/carriers     载体列表（分页）
 * - GET /enterprise/carriers/:id  载体详情
 */

import { mockApi } from "./mock";
import type { ApiResponse, CarrierInfo } from "../types";

const USE_MOCK = true;

// ============ Mock 数据 ============

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
    description: "粤港澳大湾区知名众创空间，提供全要素创业孵化服务。",
  },
  {
    id: 3,
    name: "华南理工大学科技园",
    type: "大学科技园",
    address: "广州市番禺区大学城外环东路382号",
    area: "番禺区",
    manager_name: "李主任",
    contact_phone: "020-88880003",
    description: "依托高校科研资源，为师生创业项目提供孵化转化平台。",
  },
];

/**
 * 载体列表（分页）
 * @param page 页码
 * @param page_size 每页条数
 */
export async function getCarrierList(
  page = 1,
  page_size = 20,
): Promise<ApiResponse<{ list: CarrierInfo[]; total: number; page: number; page_size: number }>> {
  if (USE_MOCK) {
    const list = mockCarriers.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: mockCarriers.length, page, page_size });
  }

  const { get } = await import("../utils/request");
  return get("/enterprise/carriers", { page: String(page), page_size: String(page_size) });
}

/**
 * 载体详情
 * @param id 载体 ID
 */
export async function getCarrierDetail(
  id: number,
): Promise<ApiResponse<CarrierInfo>> {
  if (USE_MOCK) {
    const carrier = mockCarriers.find((c) => c.id === id);
    if (!carrier) {
      const { mockApiFail } = await import("./mock");
      await mockApiFail(10002, "载体不存在");
      throw new Error("unreachable");
    }
    return mockApi(carrier);
  }

  const { get } = await import("../utils/request");
  return get(`/enterprise/carriers/${id}`);
}