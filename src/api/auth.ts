/**
 * 认证模块 API 层
 *
 * 对应后端接口：
 * - POST /auth/login    登录
 * - POST /auth/register  注册
 * - GET  /auth/me        获取当前用户信息
 *
 * 切换模式：
 * - USE_MOCK = true  → 前端独立运行（默认）
 * - USE_MOCK = false → 对接真实后端 Gin 服务
 */

import { mockApi, mockApiFail } from "./mock";
import type { ApiResponse, AuthData, UserInfo } from "../types";

/** Mock 开关 */
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
 * @param credential 企业填信用代码，载体/政务填手机号
 * @param password 密码（≥6 位）
 * @param role 角色 enterprise | carrier | government
 */
export async function loginAuth(
  credential: string,
  password: string,
  role: string,
): Promise<ApiResponse<AuthData>> {
  if (USE_MOCK) {
    // 基本参数校验
    if (!credential) {
      await mockApiFail(10001, "参数错误：凭据不能为空");
      throw new Error("unreachable");
    }
    if (!password || password.length < 6) {
      await mockApiFail(10001, "参数错误：密码至少 6 位");
      throw new Error("unreachable");
    }
    // 模拟成功登录，并将角色持久化到 localStorage，避免 AuthGuard::initAuth() 覆盖
    localStorage.setItem("mock_role", role);
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
 * @param params 注册表单数据（角色区分企业/载体字段）
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
    // 持久化角色
    localStorage.setItem("mock_role", params.role);
    return mockApi<AuthData>({
      token: "mock-jwt-token-" + Date.now(),
      user: {
        id: 2,
        role: params.role,
        phone: params.phone,
        email: params.email,
        credit_code: params.enterprise_credit_code || undefined,
        name: params.enterprise_name || params.carrier_name || "新用户",
      },
    });
  }

  const { post } = await import("../utils/request");
  return post<AuthData>("/auth/register", params);
}

/**
 * 获取当前登录用户信息（用于 token 有效性校验和页面恢复登录态）
 *
 * Mock 模式下从 localStorage 读取登录时存储的角色，
 * 避免 AuthGuard::initAuth() 调用时把角色覆盖为默认 enterprise。
 */
export async function getMe(): Promise<ApiResponse<UserInfo>> {
  if (USE_MOCK) {
    const storedRole = localStorage.getItem("mock_role") || "enterprise";
    return mockApi<UserInfo>({ ...mockUser, role: storedRole as UserInfo["role"] });
  }

  const { get } = await import("../utils/request");
  return get<UserInfo>("/auth/me");
}