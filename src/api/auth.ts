/**
 * 认证模块 Mock API
 * 
 * 后续对接真实后端时，只需将 mockApi 替换为 import { post, get } from "../utils/request"
 */

import { mockApi, mockApiFail } from "./mock";
import type { ApiResponse, AuthData, UserInfo } from "../types";

/** 当前是否使用 Mock 模式 */
const USE_MOCK = true;

// ============ Mock 用户数据 ============

const mockUser: UserInfo = {
  id: 1,
  role: "enterprise",
  phone: "13800138000",
  email: "company@example.com",
  credit_code: "91440101MA5XXXX",
  name: "测试企业",
};

/**
 * 登录
 */
export async function loginAuth(
  credential: string,
  password: string,
  role: string,
): Promise<ApiResponse<AuthData>> {
  if (USE_MOCK) {
    if (!credential) {
      await mockApiFail(10001, "参数错误：凭据不能为空");
      throw new Error("unreachable");
    }
    if (!password || password.length < 6) {
      await mockApiFail(10001, "参数错误：密码至少 6 位");
      throw new Error("unreachable");
    }
    return mockApi<AuthData>({
      token: "mock-jwt-token-" + Date.now(),
      user: { ...mockUser, role: role as UserInfo["role"] },
    });
  }

  const { post } = await import("../utils/request");
  return post<AuthData>("/auth/login", { credential, password, role });
}

/**
 * 注册
 */
export async function registerAuth(params: {
  password: string;
  role: "enterprise" | "carrier";
  phone: string;
  email?: string;
  enterprise_name?: string;
  enterprise_credit_code?: string;
  carrier_name?: string;
}): Promise<ApiResponse<AuthData>> {
  if (USE_MOCK) {
    if (!params.phone || !params.password) {
      await mockApiFail(10001, "参数错误：手机号和密码不能为空");
      throw new Error("unreachable");
    }
    if (params.password.length < 6) {
      await mockApiFail(10001, "参数错误：密码至少 6 位");
      throw new Error("unreachable");
    }
    return mockApi<AuthData>({
      token: "mock-jwt-token-" + Date.now(),
      user: {
        id: 2,
        role: params.role,
        phone: params.phone,
        email: params.email,
        credit_code:
          params.enterprise_credit_code || undefined,
        name:
          params.enterprise_name || params.carrier_name || "新用户",
      },
    });
  }

  const { post } = await import("../utils/request");
  return post<AuthData>("/auth/register", params);
}

/**
 * 获取当前用户信息
 */
export async function getMe(): Promise<ApiResponse<UserInfo>> {
  if (USE_MOCK) {
    return mockApi<UserInfo>(mockUser);
  }

  const { get } = await import("../utils/request");
  return get<UserInfo>("/auth/me");
}