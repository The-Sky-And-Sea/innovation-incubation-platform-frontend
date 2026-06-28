import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Badge, Button, Dropdown, Input, Layout, Menu, Modal, Space, Tag, Typography, message } from "antd";
import {
  AuditOutlined,
  BankOutlined,
  BellOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  FormOutlined,
  HomeOutlined,
  IdcardOutlined,
  InboxOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UploadOutlined,
  UserDeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import type { UserRole } from "../types";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MenuItem {
  key: string;
  icon: ReactNode;
  label: string;
}

interface CommandAction {
  key: string;
  title: string;
  description: string;
  path: string;
  icon: ReactNode;
  tag?: string;
}

const IMPLEMENTED_ROUTES = new Set([
  "/enterprise/dashboard",
  "/enterprise/info",
  "/enterprise/files",
  "/enterprise/carriers",
  "/enterprise/incubation",
  "/enterprise/changes",
  "/enterprise/policies",
  "/enterprise/ai-assist",
  "/enterprise/notifications",
  "/carrier/dashboard",
  "/carrier/incubation",
  "/carrier/changes",
  "/carrier/policies",
  "/carrier/performances",
  "/carrier/info",
  "/carrier/notifications",
  "/gov/dashboard",
  "/gov/enterprises",
  "/gov/carriers",
  "/gov/policies",
  "/gov/applications",
  "/gov/performances",
  "/gov/account",
  "/gov/notifications",
]);

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
    { key: "/carrier/policies", icon: <FileTextOutlined />, label: "政策申报审核" },
    { key: "/carrier/performances", icon: <TrophyOutlined />, label: "绩效考核" },
    { key: "/carrier/notifications", icon: <BellOutlined />, label: "通知中心" },
  ],
  government: [
    { key: "/gov/dashboard", icon: <DashboardOutlined />, label: "政务工作台" },
    { key: "/gov/enterprises", icon: <TeamOutlined />, label: "企业查询" },
    { key: "/gov/carriers", icon: <BankOutlined />, label: "载体查询" },
    { key: "/gov/policies", icon: <FileProtectOutlined />, label: "政策管理" },
    { key: "/gov/applications", icon: <InboxOutlined />, label: "申报终审" },
    { key: "/gov/performances", icon: <TrophyOutlined />, label: "绩效考核" },
    { key: "/gov/account", icon: <UserDeleteOutlined />, label: "账号注销管理" },
    { key: "/gov/notifications", icon: <BellOutlined />, label: "通知中心" },
  ],
};

const ROLE_META: Record<UserRole, { label: string; scope: string; primary: string }> = {
  enterprise: { label: "企业端", scope: "申报服务", primary: "#14508c" },
  carrier: { label: "载体端", scope: "审核协同", primary: "#0b7568" },
  government: { label: "政务端", scope: "监督治理", primary: "#9a5b12" },
};

const GOV_COMMANDS: CommandAction[] = [
  {
    key: "gov-dashboard",
    title: "政务驾驶舱",
    description: "查看待办、风险预警、流转态势",
    path: "/gov/dashboard",
    icon: <DashboardOutlined />,
    tag: "总览",
  },
  {
    key: "gov-policy",
    title: "发布政策",
    description: "进入政策管理，创建模板并发布政策",
    path: "/gov/policies",
    icon: <FileProtectOutlined />,
    tag: "常用",
  },
  {
    key: "gov-review",
    title: "申报终审",
    description: "处理载体初审后的政策申报",
    path: "/gov/applications",
    icon: <InboxOutlined />,
    tag: "待办",
  },
  {
    key: "gov-performance",
    title: "绩效考核",
    description: "启动考核、查看提交、完成评分",
    path: "/gov/performances",
    icon: <TrophyOutlined />,
  },
  {
    key: "gov-enterprise",
    title: "企业查询",
    description: "按名称、行业、信用代码检索企业",
    path: "/gov/enterprises",
    icon: <TeamOutlined />,
  },
  {
    key: "gov-notice",
    title: "通知中心",
    description: "查看审核提醒与系统通知",
    path: "/gov/notifications",
    icon: <BellOutlined />,
  },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const role = (user?.role || "enterprise") as UserRole;
  const roleMeta = ROLE_META[role];
  const menus = roleMenuMap[role] || [];
  const selectedKey = location.pathname;
  const activeMenu = menus.find((item) => item.key === selectedKey);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const commandActions = useMemo<CommandAction[]>(() => {
    if (role === "government") return GOV_COMMANDS;
    return menus.map((item) => ({
      key: item.key,
      title: item.label,
      description: `打开${item.label}`,
      path: item.key,
      icon: item.icon,
    }));
  }, [menus, role]);

  const filteredActions = commandActions.filter((item) => {
    const keyword = commandQuery.trim().toLowerCase();
    if (!keyword) return true;
    return `${item.title} ${item.description}`.toLowerCase().includes(keyword);
  });

  const goRoute = (path: string) => {
    if (IMPLEMENTED_ROUTES.has(path)) {
      navigate(path);
      setCommandOpen(false);
      setCommandQuery("");
    } else {
      message.info("功能开发中，敬请期待");
    }
  };

  const userMenuItems = [
    { key: "role", label: `当前角色：${roleMeta.label}`, disabled: true },
    { type: "divider" as const },
    { key: "logout", icon: <LogoutOutlined />, label: "退出登录", danger: true },
  ];

  return (
    <Layout className="app-shell">
      <a className="skip-link" href="#main-content">
        跳到主内容
      </a>
      <Sider
        className="app-sider"
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        width={238}
      >
        <div className="layout-brand">
          <span className="layout-brand-mark">孵</span>
          {!collapsed && (
            <div className="layout-brand-copy">
              <strong>孵化载体管理平台</strong>
              <span>{roleMeta.scope}</span>
            </div>
          )}
        </div>

        <Menu
          className="app-menu"
          mode="inline"
          selectedKeys={[selectedKey]}
          aria-label={`${roleMeta.label}导航`}
          onClick={({ key }) => goRoute(key)}
          items={menus.map((item) => ({ key: item.key, icon: item.icon, label: item.label }))}
        />
        {!collapsed && (
          <div className="sider-status-card">
            <span>今日工作状态</span>
            <strong>{unreadCount > 0 ? `${unreadCount} 条未读提醒` : "暂无未读提醒"}</strong>
            <small>使用 Ctrl K 可快速办理常用事项</small>
          </div>
        )}
      </Sider>

      <Layout>
        <Header className="app-header">
          <Space size={10} style={{ minWidth: 0 }}>
            <Button
              type="text"
              aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <SafetyCertificateOutlined style={{ color: roleMeta.primary, fontSize: 20 }} />
            <div className="header-title">
              <strong>{activeMenu?.label || `${roleMeta.label}工作空间`}</strong>
              <span>
                {roleMeta.label} / {roleMeta.scope} / {activeMenu?.label || "工作台"}
              </span>
            </div>
          </Space>

          <Space size={12} className="header-tools">
            <Button className="command-trigger" icon={<SearchOutlined />} onClick={() => setCommandOpen(true)}>
              快速办理
              <kbd>Ctrl K</kbd>
            </Button>
            <Tag className="sync-tag" icon={<ClockCircleOutlined />}>
              今日 20:30 已同步
            </Tag>
            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
              <Button
                type="text"
                shape="circle"
                aria-label="通知中心"
                icon={<BellOutlined style={{ color: "#334155" }} />}
                onClick={() => {
                  const prefix = role === "enterprise" ? "/enterprise" : role === "carrier" ? "/carrier" : "/gov";
                  navigate(`${prefix}/notifications`);
                }}
              />
            </Badge>
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
              <Space className="user-entry">
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: roleMeta.primary }} />
                <Text style={{ color: "#334155" }}>{user?.name || user?.phone || "用户"}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content className="app-content-wrap" id="main-content" tabIndex={-1}>
          <div className="app-content">
            <Outlet />
          </div>
        </Content>
      </Layout>

      <Modal
        open={commandOpen}
        onCancel={() => setCommandOpen(false)}
        footer={null}
        width={720}
        className="command-modal"
        title={
          <Space>
            <ThunderboltOutlined />
            <span>快速办理</span>
          </Space>
        }
      >
        <Input
          autoFocus
          size="large"
          allowClear
          value={commandQuery}
          prefix={<SearchOutlined />}
          placeholder="搜索政策、申报、企业、载体或通知"
          onChange={(event) => setCommandQuery(event.target.value)}
          onPressEnter={() => filteredActions[0] && goRoute(filteredActions[0].path)}
        />
        <div className="command-list">
          {filteredActions.map((item) => (
            <button className="command-item" key={item.key} type="button" onClick={() => goRoute(item.path)}>
              <span className="command-icon">{item.icon}</span>
              <span className="command-copy">
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              {item.tag && <Tag color="gold">{item.tag}</Tag>}
            </button>
          ))}
          {filteredActions.length === 0 && <div className="command-empty">没有匹配的功能入口</div>}
        </div>
      </Modal>
    </Layout>
  );
}
