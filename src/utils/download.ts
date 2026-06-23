/** 浏览器下载工具 */

/**
 * 使用 Blob URL 触发浏览器文件下载
 * @param url Blob URL（或任何可下载的 URL）
 * @param filename 保存的文件名
 */
export function triggerBrowserDownload(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 延迟释放 Blob URL，确保浏览器已开始下载
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}