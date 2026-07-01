import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Typography,
  Space,
  Tag,
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
import { formatFileSize } from "../../utils/format";
import { triggerBrowserDownload } from "../../utils/download";
import type { FileInfo } from "../../types";

const { Title, Text } = Typography;

/**
 * 企业端文件管理页面
 *
 * 功能：
 * - 拖拽上传文件（Ant Design Dragger）
 * - 文件列表表格（文件名、大小、类型、上传时间）
 * - 下载文件到本地
 * - 删除文件（带 Popconfirm 二次确认）
 * - 分页（每页 5/10/20/50 条可选）
 */
export default function EnterpriseFileManagement() {
  const [fileList, setFileList] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const totalSize = fileList.reduce((sum, file) => sum + (file.size || 0), 0);

  /**
   * 加载文件列表
   * @param page 页码（默认 1）
   * @param pageSize 每页条数（默认 10）
   */
  const fetchList = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getFileList(page, pageSize);
      setFileList(res.data.list);
      setPagination(prev => ({
        ...prev,
        current: res.data.page,
        pageSize: res.data.page_size,
        total: res.data.total,
      }));
    } catch {
      message.error("加载文件列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 首次加载
  useEffect(() => {
    fetchList(1, 10);
  }, [fetchList]);

  /** 上传成功后刷新列表（回到第一页） */
  const handleUploaded = (_fileInfo: FileInfo) => {
    fetchList(1, pagination.pageSize);
  };

  /** 下载文件到本地 */
  const handleDownload = async (file: FileInfo) => {
    try {
      const url = await downloadFile(file.file_id);
      triggerBrowserDownload(url, file.filename);
      message.success(`开始下载 "${file.filename}"`);
    } catch (err) {
      message.error((err as Error).message || "下载失败");
    }
  };

  /** 删除文件（二次确认后执行） */
  const handleDelete = async (fileId: number) => {
    try {
      await deleteFileAction(fileId);
      message.success("文件已删除");
      fetchList(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error((err as Error).message || "删除失败");
    }
  };

  /** 表格列定义 */
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
      render: (size: number) => formatFileSize(size),
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
    <div className="enterprise-files-page">
      <div className="page-heading enterprise-files-heading">
        <div>
          <Title level={3}>
            <UploadOutlined style={{ marginRight: 8 }} />
            文件管理
          </Title>
          <Text type="secondary">上传、复用和管理企业申报材料，上传成功后可在业务表单中引用文件。</Text>
        </div>
      </div>

      <section className="enterprise-file-workspace">
        <Card className="enterprise-upload-card" title={<><FileOutlined /> 上传新文件</>}>
          <FileUpload onUploaded={handleUploaded} folderColor="#14508c" />
        </Card>

        <Card
          className="enterprise-file-guide-card"
          title={<><InfoCircleOutlined /> 文件使用说明</>}
        >
          <div className="enterprise-file-guide-copy">
            <Text strong>上传后系统会生成可复用的 <Tag>file_id</Tag></Text>
            <Text type="secondary">
              后续在入驻申请、政策申报、材料补充等场景中，可通过 file_id 关联已上传文件。
            </Text>
          </div>

          <div className="enterprise-file-metrics" aria-label="文件统计">
            <div className="enterprise-file-metric">
              <span>已上传文件</span>
              <strong>{pagination.total}</strong>
            </div>
            <div className="enterprise-file-metric">
              <span>当前页容量</span>
              <strong>{formatFileSize(totalSize)}</strong>
            </div>
          </div>

          <div className="enterprise-file-guide-list">
            <div>
              <span>支持格式</span>
              <strong>PDF、Office、图片、TXT</strong>
            </div>
            <div>
              <span>单文件限制</span>
              <strong>最大 20MB</strong>
            </div>
            <div>
              <span>推荐命名</span>
              <strong>企业简称_材料类型_日期</strong>
            </div>
          </div>
        </Card>
      </section>

      {/* 文件列表 */}
      <Card
        className="enterprise-file-table-card"
        title="我的文件"
        extra={
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => fetchList(pagination.current, pagination.pageSize)}
            loading={loading}
          >
            刷新
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={fileList}
          rowKey="file_id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50"],
            showTotal: (total, range) => `${range[0]}-${range[1]} / 共 ${total} 条`,
            onChange: (page, pageSize) => fetchList(page, pageSize),
          }}
          size="middle"
          locale={{ emptyText: <Empty description="暂无上传文件" /> }}
        />
      </Card>
    </div>
  );
}
