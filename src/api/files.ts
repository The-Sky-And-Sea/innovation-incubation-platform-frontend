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

/**
 * 文件列表
 * @param page 页码
 * @param page_size 每页条数
 * @param userId 可选：按上传者ID过滤（政务端用）
 */
export async function getFileList(
  page = 1,
  page_size = 20,
  userId?: number,
): Promise<ApiResponse<{ list: FileInfo[]; total: number; page: number; page_size: number }>> {
  if (USE_MOCK) {
    const all = Array.from(mockFiles.values());
    const list = all.slice((page - 1) * page_size, page * page_size);
    return mockApi({ list, total: all.length, page, page_size }, 300);
  }

  const { get } = await import("../utils/request");
  const params: Record<string, string> = {
    page: String(page),
    page_size: String(page_size),
  };
  if (userId) params.user_id = String(userId);
  return get("/files/list", params);
}

/**
 * 下载文件（返回 Blob URL 用于浏览器下载）
 */
export async function downloadFile(fileId: number): Promise<string> {
  if (USE_MOCK) {
    const info = mockFiles.get(fileId);
    if (!info) {
      await mockApiFail(10002, "文件不存在");
      throw new Error("unreachable");
    }

    // 生成一个假的文件内容 blob 用于下载
    const content = `[Mock file content] File: ${info.filename}\nSize: ${info.size}\nMime: ${info.mime_type}`;
    const blob = new Blob([content], { type: info.mime_type });
    const url = URL.createObjectURL(blob);

    // 模拟延时
    await new Promise((r) => setTimeout(r, 300));
    return url;
  }

  // 真实后端：fetch 二进制并创建 Blob URL
  const token = localStorage.getItem("token");
  const res = await fetch(`http://localhost:8080/api/v1/files/${fileId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("下载失败");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * 删除文件
 */
export async function deleteFileAction(fileId: number): Promise<ApiResponse<null>> {
  if (USE_MOCK) {
    if (!mockFiles.has(fileId)) {
      await mockApiFail(10002, "文件不存在");
      throw new Error("unreachable");
    }
    mockFiles.delete(fileId);
    return mockApi(null, 200);
  }

  const { del } = await import("../utils/request");
  return del(`/files/${fileId}`);
}
