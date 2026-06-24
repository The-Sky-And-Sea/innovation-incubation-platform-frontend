import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  Menu,
  Button,
  theme,
  Dropdown,
  Avatar,
  Space,
  Typography,
} from "antd";
import { message } from "antd";
import {
  DashboardOutlined,
  IdcardOutlined,
  BankOutlined,
  UploadOutlined,
  FileProtectOutlined,
  FormOutlined,
  FileTextOutlined,
  BellOutlined,
  SettingOutlined,
  TeamOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AuditOutlined,
  TrophyOutlined,
  UserDeleteOutlined,
  UserOutlined,
  AppstoreOutlined,
  HomeOutlined,
  InboxOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import type { UserRole } from "../types";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

/** 菜单配置 */
interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path?: string;
}

/** 已实现的路由集合 */
const IMPLEMENTED_ROUTES = new Set([
  "/enterprise/dashboard",
  "/enterprise/info",
  "/enterprise/files",
  "/enterprise/carriers",
  "/enterprise/incubation",
  "/enterprise/changes",
  "/enterprise/policies",
  "/carrier/dashboard",
  "/carrier/incubation",
  "/carrier/changes",
  "/carrier/policies",
  "/gov/dashboard",
  "/gov/enterprises",
  "/gov/carriers",
  "/gov/policies",
  "/gov/applications",
]);

/** 各角色菜单配置 */
const roleMenuMap: Record<UserRole, MenuItem[]> = {
  enterprise: [
    { key: "/enterprise/dashboard", icon: <DashboardOutlined />, label: "工作台" },
    { key: "/enterprise/info", icon: <IdcardOutlined />, label: "企业信息" },
    { key: "/enterprise/files", icon: <UploadOutlined />, label: "文件管理" },
    { key: "/enterprise/carriers", icon: <BankOutlined />, label: "载体浏览" },
    { key: "/enterprise/incubation", icon: <HomeOutlined />, label: "企业入驻" },
    { key: "/enterprise/changes", icon: <FormOutlined />, label: "重大事项变更" },
    { key: "/enterprise/policies", icon: <FileTextOutlined />, label: "政策申报" },
    { key: "/enterprise/ai-assist", icon: <BulbOutlined />, label: "智能辅助申报" },
    { key: "/enterprise/notifications", icon: <BellOutlined />, label: "通知中心" },
  ],
  carrier: [
    { key: "/carrier/dashboard", icon: <DashboardOutlined />, label: "工作台" },
    { key: "/carrier/incubation", icon: <AuditOutlined />, label: "入驻审核" },
    { key: "/carrier/info", icon: <SettingOutlined />, label: "基础信息" },
    { key: "/carrier/changes", icon: <FormOutlined />, label: "变更审核" },
    { key: "/carrier/policies", icon: <FileTextOutlined />, label: "政策申报" },
    { key: "/carrier/performances", icon: <TrophyOutlined />, label: "绩效考核" },
    { key: "/carrier/notifications", icon: <BellOutlined />, label: "通知中心" },
  ],
  government: [
    { key: "/gov/dashboard", icon: <DashboardOutlined />, label: "工作台" },
    { key: "/gov/enterprises", icon: <TeamOutlined />, label: "企业查询" },
    { key: "/gov/carriers", icon: <BankOutlined />, label: "载体查询" },
    { key: "/gov/policies", icon: <FileProtectOutlined />, label: "政策管理" },
    { key: "/gov/applications", icon: <InboxOutlined />, label: "申报审核" },
    { key: "/gov/performances", icon: <TrophyOutlined />, label: "绩效考核" },
    { key: "/gov/account", icon: <UserDeleteOutlined />, label: "账号注销管理" },
    { key: "/gov/notifications", icon: <BellOutlined />, label: "通知中心" },
  ],
};

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const role = user?.role as UserRole;
  const menus = roleMenuMap[role] || [];

  /** 当前选中菜单 */
  const selectedKey = location.pathname;

  /** 用户下拉菜单 */
  const userMenuItems = [
    {
      key: "role",
      label: `角色：${role === "enterprise" ? "企业" : role === "carrier" ? "载体" : "政务"}`,
      disabled: true,
    },
    { type: "divider" as const },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      danger: true,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        style={{ background: colorBgContainer }}
      >
        {/* Logo 区域 */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <AppstoreOutlined
            style={{ fontSize: collapsed ? 20 : 24, color: "#1677ff" }}
          />
          {!collapsed && (
            <Text
              strong
              style={{ marginLeft: 8, fontSize: 16, whiteSpace: "nowrap" }}
            >
              孵化管理平台
            </Text>
          )}
        </div>

        {/* 菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => {
            if (IMPLEMENTED_ROUTES.has(key)) {
              navigate(key);
            } else {
              message.info("功能开发中，敬请期待");
            }
          }}
          items={menus.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
          style={{ borderInlineEnd: "none" }}
        />
      </Sider>

      {/* 右侧内容区 */}
      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          {/* 折叠按钮 */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />

          {/* 用户区域 */}
          <Space>
            <BellOutlined
              style={{ fontSize: 18, cursor: "pointer" }}
              onClick={() => {
                const prefix =
                  role === "enterprise"
                    ? "/enterprise"
                    : role === "carrier"
                      ? "/carrier"
                      : "/gov";
                navigate(`${prefix}/notifications`);
              }}
            />
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === "logout") {
                    logout();
                    navigate("/login");
                  }
                },
              }}
            >
              <Space style={{ cursor: "pointer" }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <Text>{user?.name || user?.phone || "用户"}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区 */}
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 360,
            overflow: "auto",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}