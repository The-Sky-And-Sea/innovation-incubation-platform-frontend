/**
 * 文件管理 Mock API
 *
 * 后续对接真实后端时，将 USE_MOCK 改为 false
 */

import { mockApi, mockApiFail } from "./mock";
import type { ApiResponse, FileInfo, FileLimit } from "../types";

/** 当前是否使用 Mock 模式 */
const USE_MOCK = true;

// ============ Mock 文件数据 ============

let mockFileIdCounter = 100;
const mockFiles: Map<number, FileInfo> = new Map();

/**
 * 获取文件上传限制
 */
export async function getFileLimit(): Promise<ApiResponse<FileLimit>> {
  if (USE_MOCK) {
    return mockApi<FileLimit>({
      max_size_mb: 20,
      allowed_extensions: [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".jpg",
        ".png",
      ],
    });
  }

  const { get } = await import("../utils/request");
  return get<FileLimit>("/files/limit");
}

/**
 * 上传文件
 * @param file 要上传的 File 对象
 */
export async function uploadFileAction(
  file: File,
): Promise<ApiResponse<FileInfo>> {
  if (USE_MOCK) {
    // 模拟文件大小校验
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      await mockApiFail(10001, `文件大小超过限制（最大 20MB）`);
      throw new Error("unreachable");
    }

    // 模拟扩展名校验
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const allowed = [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".jpg",
      ".png",
    ];
    if (!allowed.includes(ext)) {
      await mockApiFail(10001, `不支持的文件类型: ${ext}`);
      throw new Error("unreachable");
    }

    const id = ++mockFileIdCounter;
    const info: FileInfo = {
      file_id: id,
      filename: file.name,
      mime_type: file.type || "application/octet-stream",
      size: file.size,
      created_at: new Date().toISOString(),
    };
    mockFiles.set(id, info);
    return mockApi<FileInfo>(info);
  }

  const { uploadFile } = await import("../utils/request");
  return uploadFile<FileInfo>(file);
}