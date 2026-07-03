import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { RouterProvider } from "react-router-dom";
import MouseTrailGrid from "./components/MouseTrailGrid";
import router from "./router";
import "./App.css";
import "./components/MouseTrailGrid.css";

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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
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
      <MouseTrailGrid />
      <RouterProvider router={router} />
    </ConfigProvider>,
);