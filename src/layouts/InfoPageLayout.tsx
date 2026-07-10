import type { CSSProperties, ReactNode } from "react";
import { Button, Layout, Space, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";

const { Header, Content } = Layout;
const { Text } = Typography;

interface InfoPageLayoutProps {
  title: string;
  subtitle: string;
  backPath: string;
  accent: string;
  children: ReactNode;
}

export default function InfoPageLayout({
  title,
  subtitle,
  backPath,
  accent,
  children,
}: InfoPageLayoutProps) {
  const navigate = useNavigate();

  return (
    <Layout className="info-page-shell" style={{ "--info-accent": accent } as CSSProperties}>
      <Header className="info-page-header">
        <Space size={12} className="info-page-brand">
          <Button
            type="text"
            shape="circle"
            icon={<ArrowLeftOutlined />}
            aria-label="返回工作台"
            onClick={() => navigate(backPath)}
          />
          <span className="info-page-logo">
            <BrandLogo />
          </span>
          <span>
            <strong>{title}</strong>
            <Text>{subtitle}</Text>
          </span>
        </Space>
      </Header>

      <Content className="info-page-content">
        <div className="info-page-card">{children}</div>
      </Content>
    </Layout>
  );
}
