/**
 * 应用入口文件
 *
 * 使用 React 18 + React Router v6 + Ant Design v5
 * - React.StrictMode: 开启开发模式严格检查
 * - ConfigProvider: 全局主题配置（颜色、字体、圆角等）
 * - RouterProvider: 注入路由配置
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import "./App.css";
import ClickSpark from "./components/ClickSpark";
import { useAuthStore } from "./store/authStore";
import type { UserRole } from "./types";

/** Antd 主题 tokens：统一视觉风格 */
const themeTokens = {
  colorPrimary: "#14508c",
  colorInfo: "#14508c",
  colorSuccess: "#0b7568",
  colorWarning: "#b7781f",
  colorError: "#a7352f",
  colorText: "#18263a",
  colorTextSecondary: "#52647a",
  colorTextTertiary: "#6d7f95",
  colorBgLayout: "#edf3f8",
  colorBgContainer: "#ffffff",
  colorBorder: "#d7e2ee",
  colorBorderSecondary: "#e6edf5",
  borderRadius: 10,
  controlHeight: 40,
  fontSize: 14,
  lineHeight: 1.6,
  boxShadow:
    "0 1px 2px rgba(16, 45, 77, 0.06), 0 8px 16px rgba(16, 45, 77, 0.06)",
  fontFamily:
    "'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const roleSparkColor: Record<UserRole, string> = {
  enterprise: "#64a8ef",
  carrier: "#47d8c2",
  government: "#ff8fa3",
};

function AppChrome() {
  const role = (useAuthStore((state) => state.user?.role) || "enterprise") as UserRole;

  return (
    <ClickSpark sparkColor={roleSparkColor[role]} sparkSize={10} sparkRadius={17} sparkCount={8} duration={420}>
      <RouterProvider router={router} />
    </ClickSpark>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: themeTokens,
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 40,
            fontWeight: 600,
            paddingInline: 14,
          },
          Card: {
            borderRadiusLG: 12,
            paddingLG: 20,
          },
          Drawer: {
            borderRadiusLG: 14,
          },
          Form: {
            labelColor: "#334155",
            labelFontSize: 13,
            itemMarginBottom: 18,
          },
          Input: {
            activeBorderColor: "#14508c",
            hoverBorderColor: "#9fb4ca",
          },
          Table: {
            headerBg: "#f6f9fc",
            headerColor: "#334155",
            rowHoverBg: "#f7fbff",
            borderColor: "#e6edf5",
          },
          Modal: {
            borderRadiusLG: 14,
          },
          Segmented: {
            itemSelectedBg: "#ffffff",
            itemSelectedColor: "#14508c",
          },
        },
      }}
    >
      <AppChrome />
    </ConfigProvider>
  </React.StrictMode>,
);
