/**
 * 通用与调试 API 层
 */

import { mockApi } from "./mock";
import { isMockEnabled } from "./config";
import type { ApiResponse } from "../types";

export interface HealthStatus {
  status: "ok" | string;
}

export async function getHealth(): Promise<ApiResponse<HealthStatus>> {
  if (isMockEnabled()) {
    return mockApi({ status: "ok" });
  }

  const { get } = await import("../utils/request");
  return get<HealthStatus>("/health");
}

export async function testLlm(data: {
  system: string;
  user: string;
}): Promise<ApiResponse<Record<string, unknown>>> {
  if (isMockEnabled()) {
    return mockApi({ content: `Mock LLM: ${data.user}` });
  }

  const { post } = await import("../utils/request");
  return post("/test/llm", data);
}

export async function testEmbedding(text: string): Promise<ApiResponse<Record<string, unknown>>> {
  if (isMockEnabled()) {
    return mockApi({ embedding: [0.12, 0.34, 0.56], text });
  }

  const { post } = await import("../utils/request");
  return post("/test/embedding", { text });
}

export async function testConvertFile(file: File): Promise<ApiResponse<{ markdown: string }>> {
  if (isMockEnabled()) {
    return mockApi({ markdown: `# ${file.name}\n\nMock converted markdown content.` });
  }

  const { request } = await import("../utils/request");
  const formData = new FormData();
  formData.append("file", file);
  return request<{ markdown: string }>("/test/convert", {
    method: "POST",
    body: formData,
  });
}
