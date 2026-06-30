/**
 * Mock 工具层
 *
 * 提供前端独立运行时所需的 API 模拟能力：
 * - mockApi()     模拟成功响应（自动网络延迟）
 * - mockApiFail() 模拟失败响应（抛出业务错误）
 * - mockSuccess() / mockFail() 同步版
 *
 * 所有 mock 函数默认 600ms 延迟，模拟真实网络环境。
 * 后续对接后端时，将 VITE_USE_MOCK 设为 false 即可切换。
 */

import type { ApiResponse } from "../types";

/** 模拟网络延迟 (ms) */
export const MOCK_DELAY = 600;

/**
 * 生成成功响应（同步版，无延迟）
 */
export function mockSuccess<T>(data: T, message = "success"): ApiResponse<T> {
  return { code: 0, message, data };
}

/**
 * 生成失败响应（同步版，无延迟）
 */
export function mockFail(code: number, message: string): ApiResponse<never> {
  return { code, message, data: undefined as never };
}

/**
 * 模拟 API 调用成功（带网络延迟）
 * @param data 返回的业务数据
 * @param delay 延迟毫秒数（默认 600ms）
 */
export async function mockApi<T>(
  data: T,
  delay = MOCK_DELAY,
): Promise<ApiResponse<T>> {
  await new Promise((r) => setTimeout(r, delay));
  return mockSuccess(data);
}

/**
 * 模拟 API 调用失败（带网络延迟）
 * @param code 错误码（对应全局错误码表）
 * @param message 错误描述
 * @param delay 延迟毫秒数（默认 600ms）
 */
export async function mockApiFail(
  code: number,
  message: string,
  delay = MOCK_DELAY,
): Promise<never> {
  await new Promise((r) => setTimeout(r, delay));
  const err = new Error(message) as Error & { code: number };
  err.code = code;
  throw err;
}
