import { useState, useEffect } from "react";
import {
  Upload,
  Button,
  message,
  Space,
  Typography,
  Tag,
  Card,
} from "antd";
import {
  InboxOutlined,
  FileOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { UploadProps, UploadFile } from "antd";
import { getFileLimit, uploadFileAction } from "../api/files";
import type { FileInfo, FileLimit } from "../types";

const { Text } = Typography;
const { Dragger } = Upload;

interface FileUploadProps {
  /** 上传成功的回调，返回 file_id */
  onUploaded?: (fileInfo: FileInfo) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 已上传的文件（用于回显） */
  currentFile?: FileInfo | null;
  /** 移除文件的回调 */
  onRemove?: () => void;
}

/** 格式化文件大小 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

export default function FileUpload({
  onUploaded,
  disabled = false,
  currentFile,
  onRemove,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileLimit, setFileLimit] = useState<FileLimit | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 加载上传限制配置
  useEffect(() => {
    getFileLimit()
      .then((res) => setFileLimit(res.data))
      .catch(() => {
        // 降级默认值
        setFileLimit({
          max_size_mb: 20,
          allowed_extensions: [
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".png",
          ],
        });
      });
  }, []);

  // 当前已有文件时回显
  useEffect(() => {
    if (currentFile) {
      setFileList([
        {
          uid: String(currentFile.file_id),
          name: currentFile.filename,
          status: "done",
          size: currentFile.size,
        },
      ]);
    } else {
      setFileList([]);
    }
  }, [currentFile]);

  /** 自定义上传逻辑 */
  const customUpload: UploadProps["customRequest"] = async (options) => {
    const { file, onSuccess, onError } = options;

    setUploading(true);
    try {
      const res = await uploadFileAction(file as File);
      onSuccess?.(res.data);
      message.success(`文件 "${(file as File).name}" 上传成功`);
      onUploaded?.(res.data);
    } catch (err) {
      const errorMsg = (err as Error).message || "上传失败";
      onError?.(new Error(errorMsg));
      message.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  /** 上传前校验 */
  const beforeUpload = (file: File): boolean => {
    if (!fileLimit) return false;

    // 校验文件大小
    const maxBytes = fileLimit.max_size_mb * 1024 * 1024;
    if (file.size > maxBytes) {
      message.error(
        `文件 "${file.name}" 超过大小限制（最大 ${fileLimit.max_size_mb}MB）`,
      );
      return false;
    }

    // 校验扩展名
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!fileLimit.allowed_extensions.includes(ext)) {
      message.error(
        `不支持的文件类型: ${ext}。支持的格式: ${fileLimit.allowed_extensions.join(", ")}`,
      );
      return false;
    }

    return true;
  };

  const handleRemove = () => {
    setFileList([]);
    onRemove?.();
  };

  // 已有文件时展示已上传状态
  if (currentFile) {
    return (
      <Card size="small" style={{ background: "#f6ffed" }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space>
            <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 18 }} />
            <Text strong>已上传文件</Text>
          </Space>
          <Space>
            <FileOutlined />
            <Text>{currentFile.filename}</Text>
            <Tag color="blue">{formatSize(currentFile.size)}</Tag>
          </Space>
          {!disabled && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={handleRemove}
            >
              移除并重新上传
            </Button>
          )}
        </Space>
      </Card>
    );
  }

  return (
    <div>
      <Dragger
        name="file"
        multiple={false}
        maxCount={1}
        disabled={disabled || uploading}
        fileList={fileList}
        customRequest={customUpload}
        beforeUpload={beforeUpload}
        onRemove={handleRemove}
        showUploadList={{
          showPreviewIcon: false,
          showDownloadIcon: false,
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          {uploading ? "上传中..." : "点击或拖拽文件到此区域上传"}
        </p>
        {fileLimit && (
          <p className="ant-upload-hint">
            支持格式: {fileLimit.allowed_extensions.join(", ")}
            {" | "}
            最大 {fileLimit.max_size_mb}MB
          </p>
        )}
      </Dragger>
    </div>
  );
}