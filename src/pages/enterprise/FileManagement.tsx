import { useState } from "react";
import { Card, Typography, Divider, Space, Tag, Alert } from "antd";
import {
  FileOutlined,
  UploadOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import FileUpload from "../../components/FileUpload";
import type { FileInfo } from "../../types";

const { Title, Text, Paragraph } = Typography;

/** 格式化文件大小 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

export default function EnterpriseFileManagement() {
  const [lastUploaded, setLastUploaded] = useState<FileInfo | null>(null);

  const handleUploaded = (fileInfo: FileInfo) => {
    setLastUploaded(fileInfo);
  };

  const handleRemove = () => {
    setLastUploaded(null);
  };

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

      <Card title={<><FileOutlined /> 上传新文件</>} style={{ maxWidth: 600 }}>
        <FileUpload
          onUploaded={handleUploaded}
          currentFile={lastUploaded}
          onRemove={handleRemove}
        />
      </Card>

      {lastUploaded && (
        <>
          <Divider />
          <Card size="small" style={{ maxWidth: 600, background: "#f6ffed" }}>
            <Title level={5}>最近上传</Title>
            <Space direction="vertical">
              <Space>
                <FileOutlined />
                <Text strong>{lastUploaded.filename}</Text>
              </Space>
              <Space>
                <Tag color="blue">ID: {lastUploaded.file_id}</Tag>
                <Tag>{formatSize(lastUploaded.size)}</Tag>
                <Tag>{lastUploaded.mime_type}</Tag>
              </Space>
            </Space>
          </Card>
        </>
      )}
    </div>
  );
}