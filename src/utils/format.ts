/** 格式化工具函数 */

/**
 * 格式化文件大小为人类可读字符串
 * @param bytes 字节数
 * @returns 如 "1.5 MB"、"256 KB"、"42 B"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}