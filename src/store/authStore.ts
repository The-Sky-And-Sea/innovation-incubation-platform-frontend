import { create } from "zustand";
import type { UserInfo, UserRole, AuthData } from "../types";
import { post, get } from "../utils/request";

interface AuthState {
  /** JWT Token */
  token: string | null;
  /** 当前用户信息 */
  user: UserInfo | null;
  /** 是否正在加载认证状态（初始化检查） */
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
  /** 初始化 - 从 localStorage 恢复登录态 */
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

  login: async (credential, password, role) => {
    const res = await post<AuthData>("/auth/login", {
      credential,
      password,
      role,
    });

    const { token, user } = res.data;
    localStorage.setItem("token", token);
    set({ token, user });
  },

  register: async (params) => {
    const res = await post<AuthData>("/auth/register", params);
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    set({ token, user });
  },

  initAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ loading: false });
      return;
    }
    set({ token, loading: true });
    try {
      const res = await get<UserInfo>("/auth/me");
      set({ user: res.data, loading: false });
    } catch {
      // token 无效，清除
      localStorage.removeItem("token");
      set({ token: null, user: null, loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },

  fetchUserInfo: async () => {
    const res = await get<UserInfo>("/auth/me");
    set({ user: res.data });
  },
}));