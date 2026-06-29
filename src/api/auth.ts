/**
 * 认证模块 API 层
 *
 * 对应后端接口：
 * - POST /auth/login    登录
 * - POST /auth/register  注册
 * - GET  /users/me       获取当前用户信息
 *
 * 切换模式：
 * - VITE_USE_MOCK 未设置或不为 false → 前端独立运行（默认）
 * - VITE_USE_MOCK=false              → 对接真实后端 Gin 服务
 */

import { mockApi, mockApiFail } from "./mock";
import { isMockEnabled } from "./config";
import type { ApiResponse, AuthData, RegisterRequest, UserInfo } from "../types";

type BackendUserInfo = Omit<UserInfo, "id"> & { id?: number; user_id?: number };

function normalizeUser(user: BackendUserInfo): UserInfo {
  return {
    ...user,
    id: user.id ?? user.user_id ?? 0,
  };
}

// ============ Mock 用户数据 ============

const mockUser: UserInfo = {
  id: 1,
  role: "enterprise",
  phone: "13800138000",
  email: "company@example.com",
  credit_code: "91440101MA5XXXX",
  name: "测试企业",
};

/** 按角色区分用户名 */
const roleUserMap: Record<string, Partial<UserInfo>> = {
  enterprise: { id: 1, name: "测试企业", credit_code: "91440101MA5XXXX" },
  carrier: { id: 2, name: "天河软件园孵化器", phone: "020-88880001", email: "carrier@example.com", credit_code: undefined },
  government: { id: 3, name: "政务管理员", phone: "010-88880000", email: "gov@example.com", credit_code: undefined },
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
  if (isMockEnabled()) {
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
    const roleInfo = roleUserMap[role] || roleUserMap.enterprise;
    return mockApi<AuthData>({
      token: "mock-jwt-token-" + Date.now(),
      user: {
        ...mockUser,
        ...roleInfo,
        role: role as UserInfo["role"],
      },
    });
  }

  const { post } = await import("../utils/request");
  const res = await post<{ token: string; user: BackendUserInfo }>("/auth/login", { credential, password, role });
  return {
    ...res,
    data: {
      token: res.data.token,
      user: normalizeUser(res.data.user),
    },
  };
}

/**
 * 注册
 * @param params 注册表单数据（角色区分企业/载体字段）
 */
export async function registerAuth(params: RegisterRequest): Promise<ApiResponse<UserInfo>> {
  if (isMockEnabled()) {
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
    return mockApi<UserInfo>(
      normalizeUser({
        id: 2,
        role: params.role,
        phone: params.phone,
        email: params.email,
        credit_code: params.enterprise_credit_code || undefined,
        name: params.enterprise_name || params.carrier_name || "New User",
      }),
    );
  }

  const { post } = await import("../utils/request");
  const res = await post<BackendUserInfo>("/auth/register", params);
  return { ...res, data: normalizeUser(res.data) };
}

/**
 * 获取当前登录用户信息（用于 token 有效性校验和页面恢复登录态）
 *
 * Mock 模式下从 localStorage 读取登录时存储的角色，
 * 避免 AuthGuard::initAuth() 调用时把角色覆盖为默认 enterprise。
 */
export async function getMe(): Promise<ApiResponse<UserInfo>> {
  if (isMockEnabled()) {
    const storedRole = localStorage.getItem("mock_role") || "enterprise";
    const roleInfo = roleUserMap[storedRole] || roleUserMap.enterprise;
    return mockApi<UserInfo>({
      ...mockUser,
      ...roleInfo,
      role: storedRole as UserInfo["role"],
    });
  }

  const { get } = await import("../utils/request");
  const res = await get<BackendUserInfo>("/users/me");
  return { ...res, data: normalizeUser(res.data) };
}
