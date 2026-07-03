import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Input,
  Layout,
  Modal,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  AuditOutlined,
  BankOutlined,
  BellOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  FormOutlined,
  HomeOutlined,
  IdcardOutlined,
  InboxOutlined,
  LogoutOutlined,
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
import Menu from "../components/StaggeredMenu";
import GlobalAiAssistant from "../components/GlobalAiAssistant";

const { Header, Content } = Layout;
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

const roleMenuMap: Record<UserRole, MenuItem[]> = {
  enterprise: [
    { key: "/enterprise/dashboard", icon: <DashboardOutlined />, label: "企业工作台" },
    { key: "/enterprise/info", icon: <IdcardOutlined />, label: "企业信息" },
    { key: "/enterprise/files", icon: <UploadOutlined />, label: "文件管理" },
    { key: "/enterprise/carriers", icon: <BankOutlined />, label: "载体浏览" },
    { key: "/enterprise/incubation", icon: <HomeOutlined />, label: "企业入驻" },
    { key: "/enterprise/changes", icon: <FormOutlined />, label: "重大事项变更" },
    { key: "/enterprise/policies", icon: <FileTextOutlined />, label: "政策申报" },
    { key: "/enterprise/ai-assist", icon: <BulbOutlined />, label: "智能辅助申报" },
    { key: "/enterprise/appeals", icon: <CustomerServiceOutlined />, label: "政策诉求" },
    { key: "/enterprise/account-deletion", icon: <UserDeleteOutlined />, label: "账号注销申请" },
    { key: "/enterprise/notifications", icon: <BellOutlined />, label: "通知中心" },
  ],
  carrier: [
    { key: "/carrier/dashboard", icon: <DashboardOutlined />, label: "载体工作台" },
    { key: "/carrier/incubation", icon: <AuditOutlined />, label: "入驻审核" },
    { key: "/carrier/enterprises", icon: <TeamOutlined />, label: "入驻企业" },
    { key: "/carrier/info", icon: <SettingOutlined />, label: "基础信息" },
    { key: "/carrier/changes", icon: <FormOutlined />, label: "变更审核" },
    { key: "/carrier/policies", icon: <FileTextOutlined />, label: "政策申报" },
    { key: "/carrier/applications", icon: <InboxOutlined />, label: "企业申报审核" },
    { key: "/carrier/performances", icon: <TrophyOutlined />, label: "绩效考核" },
    { key: "/carrier/appeals", icon: <CustomerServiceOutlined />, label: "政策诉求" },
    { key: "/carrier/account-deletion", icon: <UserDeleteOutlined />, label: "账号注销申请" },
    { key: "/carrier/notifications", icon: <BellOutlined />, label: "通知中心" },
  ],
  government: [
    { key: "/gov/dashboard", icon: <DashboardOutlined />, label: "政务工作台" },
    { key: "/gov/enterprises", icon: <TeamOutlined />, label: "企业查询" },
    { key: "/gov/carriers", icon: <BankOutlined />, label: "载体查询" },
    { key: "/gov/incubation", icon: <HomeOutlined />, label: "孵化毕业" },
    { key: "/gov/policies", icon: <FileProtectOutlined />, label: "政策管理" },
    { key: "/gov/applications", icon: <InboxOutlined />, label: "申报终审" },
    { key: "/gov/performances", icon: <TrophyOutlined />, label: "绩效考核" },
    { key: "/gov/account", icon: <UserDeleteOutlined />, label: "账号注销管理" },
    { key: "/gov/appeals", icon: <CustomerServiceOutlined />, label: "政策诉求" },
    { key: "/gov/notifications", icon: <BellOutlined />, label: "通知中心" },
  ],
};

const ROLE_META: Record<UserRole, { label: string; scope: string; primary: string }> = {
  enterprise: { label: "企业端", scope: "申报服务", primary: "#1f78d8" },
  carrier: { label: "载体端", scope: "审核协同", primary: "#11a992" },
  government: { label: "政务端", scope: "监督治理", primary: "#d63b5c" },
};

const ROLE_MENU_THEME: Record<UserRole, { accent: string; colors: string[]; spark: string }> = {
  enterprise: {
    accent: "#1f78d8",
    colors: ["#dceeff", "#8fc8ff", "#1f78d8"],
    spark: "#78bdff",
  },
  carrier: {
    accent: "#11a992",
    colors: ["#dcfaf5", "#7ee4d2", "#11a992"],
    spark: "#58dccb",
  },
  government: {
    accent: "#d63b5c",
    colors: ["#ffe4ea", "#ff93a8", "#d63b5c"],
    spark: "#ff8da4",
  },
};

const GOV_COMMANDS: CommandAction[] = [
  {
    key: "gov-dashboard",
    title: "政务工作台",
    description: "查看待办、风险提醒和流程态势",
    path: "/gov/dashboard",
    icon: <DashboardOutlined />,
    tag: "总览",
  },
  {
    key: "gov-policy",
    title: "政策管理",
    description: "发布和维护政策申报入口",
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
    key: "gov-incubation",
    title: "孵化毕业",
    description: "确认已完成孵化周期的入孵记录",
    path: "/gov/incubation",
    icon: <HomeOutlined />,
  },
  {
    key: "gov-performance",
    title: "绩效考核",
    description: "配置考核、查看提交并完成评分",
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
  {
    key: "gov-appeals",
    title: "政策诉求",
    description: "处理企业、载体提交的政策诉求",
    path: "/gov/appeals",
    icon: <CustomerServiceOutlined />,
    tag: "协同",
  },
];

export default function MainLayout() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  const role = (user?.role || "enterprise") as UserRole;
  const roleMeta = ROLE_META[role];
  const menus = roleMenuMap[role];
  const roleTheme = ROLE_MENU_THEME[role];
  const selectedKey = location.pathname;
  const activeMenu = menus.find(
    (item) => item.key === selectedKey || selectedKey.startsWith(item.key + "/")
  );
  const computedSelectedKey = activeMenu ? activeMenu.key : selectedKey;

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
    navigate(path);
    setCommandOpen(false);
    setCommandQuery("");
  };

  const notificationPath =
    role === "enterprise"
      ? "/enterprise/notifications"
      : role === "carrier"
        ? "/carrier/notifications"
        : "/gov/notifications";

  return (
    <Layout
      className="app-shell"
      data-role={role}
      style={
        {
          "--role-primary": roleTheme.accent,
          "--role-spark": roleTheme.spark,
          "--top-menu-progress": 1,
          "--top-menu-shift": "var(--top-menu-content-offset)",
        } as CSSProperties
      }
    >
      <a className="skip-link" href="#main-content">
        跳到主内容
      </a>

      <Layout>
        <Header className="app-header">
          <Space size={10} style={{ minWidth: 0 }}>
            <div className="header-menu-slot">
              <Menu
                className="top-staggered-menu"
                selectedKeys={[computedSelectedKey]}
                aria-label="role navigation"
                accentColor={roleTheme.accent}
                closeOnClickAway={false}
                closeOnItemClick={false}
                colors={roleTheme.colors}
                defaultOpen
                displayItemNumbering={false}
                displaySocials={false}
                logoText={roleMeta.scope}
                menuButtonColor={roleTheme.accent}
                openMenuButtonColor="#ffffff"
                onClick={({ key }) => goRoute(key)}
                items={menus.map((item) => ({
                  key: item.key,
                  icon: item.icon,
                  label: item.label,
                }))}
              />
            </div>
            <SafetyCertificateOutlined style={{ color: roleTheme.accent, fontSize: 20 }} />
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
                onClick={() => navigate(notificationPath)}
              />
            </Badge>
            <Dropdown
              menu={{
                items: [
                  { key: "role", label: `当前角色：${roleMeta.label}`, disabled: true },
                  { type: "divider" as const },
                  { key: "logout", icon: <LogoutOutlined />, label: "退出登录", danger: true },
                ],
                onClick: ({ key }) => {
                  if (key === "logout") {
                    logout();
                    navigate("/login");
                  }
                },
              }}
            >
              <Space className="user-entry">
                <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: roleTheme.accent }} />
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

      <GlobalAiAssistant />

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
