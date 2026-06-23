/** Mock 工具：模拟网络延迟和成功/失败 */

import type { ApiResponse } from "../types";

/** 模拟网络延迟 (ms) */
export const MOCK_DELAY = 600;

/**
 * 生成成功响应
 */
export function mockSuccess<T>(data: T, message = "success"): ApiResponse<T> {
  return { code: 0, message, data };
}

/**
 * 生成失败响应
 */
export function mockFail(code: number, message: string): ApiResponse<never> {
  return { code, message, data: undefined as never };
}

/**
 * 模拟 API 调用（自动延迟，模拟成功响应）
 */
export async function mockApi<T>(
  data: T,
  delay = MOCK_DELAY,
): Promise<ApiResponse<T>> {
  await new Promise((r) => setTimeout(r, delay));
  return mockSuccess(data);
}

/**
 * 模拟 API 调用失败（自动延迟）
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