/**
 * HTTP 请求封装层
 *
 * 功能：
 * - 统一注入 JWT Token（Bearer 方式）
 * - 自动拼接查询参数为 URL query string
 * - 业务错误码映射为中文错误提示（参见 types/ERROR_CODE_MAP）
 * - 认证过期（10101）自动清除 token 并跳转登录页
 * - 请求超时控制（默认 15s，可配置）
 * - 网络异常统一提示
 *
 * 用法：
 *   import { get, post, put, patch, del, uploadFile } from "../utils/request";
 *   const res = await get<UserInfo>("/users/me");
 *   const res = await post<AuthData>("/auth/login", { credential, password, role });
 */

import { API_BASE_URL } from "../api/config";
import { ApiResponse, ERROR_CODE_MAP } from "../types";

/** 后端基础地址，后续通过环境变量或配置文件管理 */
/** 从 localStorage 获取 JWT Token */
function getToken(): string | null {
  return localStorage.getItem("token");
}

/** 请求配置 */
interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** 查询参数（自动拼接为 ?key=value） */
  params?: Record<string, string | number | undefined>;
  /** 超时时间（ms），默认 15000 */
  timeout?: number;
}

/**
 * 统一请求方法（内部使用，不直接导出）
 *
 * 自动处理：
 * - JWT Token 注入
 * - 查询参数拼接
 * - Content-Type 自动设置（JSON / FormData）
 * - 超时 AbortController
 * - 业务错误码 → 中文错误提示
 * - 401/10101 → 清除 token → 跳转登录
 */
export async function request<T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { body, params, timeout = 15000, ...restOptions } = options;

  // --- 拼接查询参数 ---
  let fullUrl = `${API_BASE_URL}${url}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) fullUrl += `?${qs}`;
  }

  // --- 构建请求头 ---
  const headers: Record<string, string> = {
    ...(restOptions.headers as Record<string, string>),
  };

  // JWT 认证
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // JSON 请求自动设置 Content-Type
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // --- 超时控制 ---
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(fullUrl, {
      ...restOptions,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    // 解析 JSON 响应
    const json: ApiResponse<T> = await response.json();

    // 业务错误码处理
    if (json.code !== 0) {
      const errorMsg =
        ERROR_CODE_MAP[json.code] || json.message || "未知错误";
      const error = new Error(errorMsg) as Error & {
        code: number;
        response: ApiResponse<T>;
      };
      error.code = json.code;
      error.response = json;

      // 认证过期 → 清除 token → 跳转登录
      if (json.code === 10101) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }

      throw error;
    }

    return json;
  } catch (err) {
    clearTimeout(timer);

    // 请求超时
    if (err instanceof DOMException && err.name === "AbortError") {
      const timeoutError = new Error("请求超时，请稍后重试") as Error & {
        code: number;
      };
      timeoutError.code = -1;
      throw timeoutError;
    }

    // 业务异常（上面抛出的带 code 的 Error）直接透传
    if ((err as Error & { code?: number }).code !== undefined) {
      throw err;
    }

    // 网络错误
    const networkError = new Error(
      "网络连接失败，请检查网络或后端服务状态",
    ) as Error & { code: number };
    networkError.code = -2;
    throw networkError;
  }
}

/** GET 请求 */
export function get<T = unknown>(
  url: string,
  params?: Record<string, string | number | undefined>,
): Promise<ApiResponse<T>> {
  return request<T>(url, { method: "GET", params });
}

/** POST 请求 */
export function post<T = unknown>(
  url: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  return request<T>(url, { method: "POST", body });
}

/** PUT 请求 */
export function put<T = unknown>(
  url: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  return request<T>(url, { method: "PUT", body });
}

/** PATCH 请求 */
export function patch<T = unknown>(
  url: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  return request<T>(url, { method: "PATCH", body });
}

/** DELETE 请求 */
export function del<T = unknown>(
  url: string,
): Promise<ApiResponse<T>> {
  return request<T>(url, { method: "DELETE" });
}

/** 文件上传（multipart/form-data） */
export function uploadFile<T = unknown>(
  file: File,
): Promise<ApiResponse<T>> {
  const formData = new FormData();
  formData.append("file", file);
  return request<T>("/files/upload", { method: "POST", body: formData });
}
