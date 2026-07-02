/**
 * 文件管理 API 层
 *
 * 对应后端接口：
 * - GET    /files/limit       获取上传限制
 * - POST   /files/upload      上传文件（multipart/form-data）
 * - GET    /files        文件列表（分页 + user_id 过滤）
 * - GET    /files/:id/download 下载文件（支持 Range 断点续传）
 * - DELETE /files/:id          删除文件（仅政务端）
 */

import { API_BASE_URL } from "./config";
import type { ApiResponse, FileInfo, FileLimit } from "../types";

function normalizeFileInfo(file: FileInfo): FileInfo {
  return {
    ...file,
    filename: file.filename || file.name || `file-${file.file_id}`,
    created_at: file.created_at || file.uploaded_at,
  };
}

/**
 * 获取文件上传限制（允许的扩展名和最大大小）
 */
export async function getFileLimit(): Promise<ApiResponse<FileLimit>> {
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
  const { uploadFile } = await import("../utils/request");
  const res = await uploadFile<FileInfo>(file);
  return { ...res, data: normalizeFileInfo(res.data) };
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
  const { get } = await import("../utils/request");
  const params: Record<string, string> = {
    page: String(page),
    page_size: String(page_size),
  };
  if (userId) params.user_id = String(userId);
  const res = await get<{ list: FileInfo[]; total: number; page: number; page_size: number }>("/files", params);
  return {
    ...res,
    data: {
      ...res.data,
      list: res.data.list.map(normalizeFileInfo),
    },
  };
}

/**
 * 下载文件
 * @param fileId 文件 ID
 * @returns Blob URL（浏览器可直接下载或预览）
 */
export async function downloadFile(fileId: number): Promise<string> {
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
  const { del } = await import("../utils/request");
  return del(`/files/${fileId}`);
}