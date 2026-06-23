/**
 * 认证状态管理（zustand）
 *
 * 职责：
 * - 登录 / 注册流程
 * - Token 本地持久化（localStorage）
 * - 页面刷新时恢复登录态（initAuth）
 * - 退出登录
 *
 * 登录后自动存储 token 到 localStorage，
 * 页面刷新时自动调用 /auth/me 校验 token 有效性，
 * 校验失败则清除 token 并跳转登录页。
 */

import { create } from "zustand";
import type { UserInfo, UserRole } from "../types";
import { loginAuth, registerAuth, getMe } from "../api/auth";

/**
 * AuthStore 的状态和操作
 */
interface AuthState {
  /** JWT Token */
  token: string | null;
  /** 当前登录用户信息 */
  user: UserInfo | null;
  /** 是否正在加载认证状态（页面刷新时检查 token） */
  loading: boolean;

  /** 登录 */
  login: (credential: string, password: string, role: UserRole) => Promise<void>;
  /** 注册 */
  register: (params: {
    password: string;
    role: "enterprise" | "carrier";
    phone: string;
    email?: string;
    enterprise_name?: string;
    enterprise_credit_code?: string;
    enterprise_industry?: string;
    enterprise_scale?: string;
    enterprise_address?: string;
    carrier_name?: string;
    carrier_type?: string;
    carrier_area?: string;
  }) => Promise<void>;
  /** 初始化 - 从 localStorage 恢复登录态（页面刷新时调用） */
  initAuth: () => Promise<void>;
  /** 退出登录 */
  logout: () => void;
  /** 获取当前用户信息 */
  fetchUserInfo: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  loading: true,

  /**
   * 登录流程
   * 1. 调用认证 API
   * 2. 存储 token 到 localStorage
   * 3. 更新 zustand 状态
   */
  login: async (credential, password, role) => {
    const res = await loginAuth(credential, password, role);
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    set({ token, user });
  },

  /**
   * 注册流程
   * 1. 调用注册 API
   * 2. 自动登录（存储 token）
   */
  register: async (params) => {
    const res = await registerAuth(params);
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    set({ token, user });
  },

  /**
   * 页面刷新时恢复登录态
   * 1. 检查 localStorage 中是否有 token
   * 2. 有 token → 调 /auth/me 验证有效性
   * 3. 验证失败 → 清除 token，用户需重新登录
   */
  initAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ loading: false });
      return;
    }
    set({ token, loading: true });
    try {
      const res = await getMe();
      set({ user: res.data, loading: false });
    } catch {
      localStorage.removeItem("token");
      set({ token: null, user: null, loading: false });
    }
  },

  /** 退出登录：清除 token 和用户信息 */
  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },

  /** 获取当前用户信息（用于刷新用户数据） */
  fetchUserInfo: async () => {
    const res = await getMe();
    set({ user: res.data });
  },
}));