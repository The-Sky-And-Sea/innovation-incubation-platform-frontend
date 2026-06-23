import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Typography,
  Space,
  Tag,
  Alert,
  Table,
  Button,
  message,
  Popconfirm,
  Empty,
} from "antd";
import {
  FileOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import FileUpload from "../../components/FileUpload";
import {
  getFileList,
  downloadFile,
  deleteFileAction,
} from "../../api/files";
import type { FileInfo } from "../../types";

const { Title, Text, Paragraph } = Typography;

/** 格式化文件大小 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

/** 触发浏览器下载 */
function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 延迟释放 Blob URL，确保浏览器已开始下载
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function EnterpriseFileManagement() {
  const [fileList, setFileList] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);

  /** 加载文件列表 */
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFileList(1, 50);
      setFileList(res.data.list);
    } catch {
      message.error("加载文件列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  /** 上传成功后刷新列表 */
  const handleUploaded = (_fileInfo: FileInfo) => {
    fetchList();
  };

  /** 下载 */
  const handleDownload = async (file: FileInfo) => {
    try {
      const url = await downloadFile(file.file_id);
      triggerDownload(url, file.filename);
      message.success(`开始下载 "${file.filename}"`);
    } catch (err) {
      message.error((err as Error).message || "下载失败");
    }
  };

  /** 删除 */
  const handleDelete = async (fileId: number) => {
    try {
      await deleteFileAction(fileId);
      message.success("文件已删除");
      fetchList();
    } catch (err) {
      message.error((err as Error).message || "删除失败");
    }
  };

  const columns: ColumnsType<FileInfo> = [
    {
      title: "文件名",
      dataIndex: "filename",
      key: "filename",
      width: 280,
      render: (name: string) => (
        <Space>
          <FileOutlined />
          <Text>{name}</Text>
        </Space>
      ),
    },
    {
      title: "大小",
      dataIndex: "size",
      key: "size",
      width: 100,
      render: (size: number) => formatSize(size),
    },
    {
      title: "类型",
      dataIndex: "mime_type",
      key: "mime_type",
      width: 180,
      render: (mime: string) => <Tag>{mime}</Tag>,
    },
    {
      title: "上传时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date: string) =>
        date ? new Date(date).toLocaleString("zh-CN") : "-",
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            下载
          </Button>
          <Popconfirm
            title="确定删除此文件？"
            description="删除后不可恢复"
            onConfirm={() => handleDelete(record.file_id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>
        <UploadOutlined style={{ marginRight: 8 }} />
        文件管理
      </Title>

      <Alert
        message="提示"
        description={
          <Paragraph style={{ marginBottom: 0 }}>
            上传文件后可获得 <Tag>file_id</Tag>，后续在入驻申请、政策申报等场景中通过
            file_id 引用已上传的文件。支持 PDF、Office、图片等格式，单个文件最大 20MB。
          </Paragraph>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      {/* 上传区域 */}
      <Card title={<><FileOutlined /> 上传新文件</>} style={{ maxWidth: 600, marginBottom: 24 }}>
        <FileUpload onUploaded={handleUploaded} />
      </Card>

      {/* 文件列表 */}
      <Card
        title="我的文件"
        extra={
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={fetchList}
            loading={loading}
          >
            刷新
          </Button>
        }
      >
        {fileList.length === 0 && !loading ? (
          <Empty description="暂无上传文件" />
        ) : (
          <Table
            columns={columns}
            dataSource={fileList}
            rowKey="file_id"
            loading={loading}
            pagination={false}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
}