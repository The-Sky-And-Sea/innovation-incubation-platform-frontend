/**
 * 文件管理 API 层
 *
 * 对应后端接口：
 * - GET    /files/limit       获取上传限制
 * - POST   /files/upload      上传文件（multipart/form-data）
 * - GET    /files        文件列表（分页 + user_id 过滤）
 * - GET    /files/:id/download 下载文件（支持 Range 断点续传）
 * - DELETE /files/:id          删除文件（仅政务端）
 *
 * Mock 模式下使用内存 Map 存储上传的文件，重启丢失。
 */

import { mockApi, mockApiFail } from "./mock";
import { API_BASE_URL, isMockEnabled } from "./config";
import type { ApiResponse, FileInfo, FileLimit } from "../types";



// ============ Mock 数据存储 ============

let mockFileIdCounter = 100;
const mockFiles: Map<number, FileInfo> = new Map();

/**
 * 获取文件上传限制（允许的扩展名和最大大小）
 */
export async function getFileLimit(): Promise<ApiResponse<FileLimit>> {
  if (isMockEnabled()) {
    return mockApi<FileLimit>({
      max_size_mb: 20,
      allowed_extensions: [
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".png",
      ],
    });
  }

  const { get } = await import("../utils/request");
  return get<FileLimit>("/files/limit");
}

/**
 * 上传文件
 * @param file 浏览器 File 对象
 * @returns 上传成功后的 FileInfo（包含 file_id）
 */
export async function uploadFileAction(
  file: File,
): Promise<ApiResponse<FileInfo>> {
  if (isMockEnabled()) {
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      await mockApiFail(10001, "文件大小超过限制（最大 20MB）");
      throw new Error("unreachable");
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const allowed = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".png"];
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
 * 文件列表（分页）
 * @param page 页码
 * @param page_size 每页条数
 * @param userId 可选：按上传者 ID 过滤（政务端查看指定用户文件）
 */
export async function getFileList(
  page = 1,
  page_size = 20,
  userId?: number,
): Promise<ApiResponse<{ list: FileInfo[]; total: number; page: number; page_size: number }>> {
  if (isMockEnabled()) {
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
  return get("/files", params);
}

/**
 * 下载文件
 * @param fileId 文件 ID
 * @returns Blob URL（浏览器可直接下载或预览）
 */
export async function downloadFile(fileId: number): Promise<string> {
  if (isMockEnabled()) {
    const info = mockFiles.get(fileId);
    if (!info) {
      await mockApiFail(10002, "文件不存在");
      throw new Error("unreachable");
    }

    // 生成模拟内容
    const content = `[Mock file content] File: ${info.filename}\nSize: ${info.size}\nMime: ${info.mime_type}`;
    const blob = new Blob([content], { type: info.mime_type });
    const url = URL.createObjectURL(blob);

    await new Promise((r) => setTimeout(r, 300));
    return url;
  }

  // 真实后端：fetch 二进制文件并创建 Blob URL
  const token = localStorage.getItem("token");
  const res = await fetch(
    `${API_BASE_URL}/files/${fileId}/download`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error("下载失败");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * 删除文件（仅政务端有权调用，被引用的文件无法删除）
 * @param fileId 文件 ID
 */
export async function deleteFileAction(fileId: number): Promise<ApiResponse<null>> {
  if (isMockEnabled()) {
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
