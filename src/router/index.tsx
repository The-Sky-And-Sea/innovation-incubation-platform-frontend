import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import type { UserRole } from "../types";
import { useEffect, useState } from "react";

// 布局
import MainLayout from "../layouts/MainLayout";

// 页面（目前先占位，后续逐步实现）
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import EnterpriseDashboard from "../pages/enterprise/Dashboard";
import EnterpriseFileManagement from "../pages/enterprise/FileManagement";
import EnterpriseMyInfo from "../pages/enterprise/MyInfo";
import EnterpriseCarrierList from "../pages/enterprise/CarrierList";
import EnterpriseIncubationManagement from "../pages/enterprise/IncubationManagement";
import EnterpriseChangeManagement from "../pages/enterprise/ChangeManagement";
import EnterprisePolicyList from "../pages/enterprise/PolicyList";
import EnterpriseAiAssist from "../pages/enterprise/AiAssist";
import CarrierDashboard from "../pages/carrier/Dashboard";
import CarrierIncubationReview from "../pages/carrier/IncubationReview";
import CarrierChangeReview from "../pages/carrier/ChangeReview";
import CarrierApplicationReview from "../pages/carrier/ApplicationReview";
import CarrierPerformanceSubmit from "../pages/carrier/PerformanceSubmit";
import CarrierInfoPage from "../pages/carrier/CarrierInfo";
import GovDashboard from "../pages/gov/Dashboard";
import GovEnterpriseSearch from "../pages/gov/EnterpriseSearch";
import GovCarrierSearch from "../pages/gov/CarrierSearch";
import GovPolicyManagement from "../pages/gov/PolicyManagement";
import GovApplicationReview from "../pages/gov/ApplicationReview";
import GovPerformanceManagement from "../pages/gov/PerformanceManagement";
import NotificationCenter from "../pages/Notifications";

/** 未登录 → 跳转登录 */
function GuestGuard() {
  const { token, loading, initAuth } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      initAuth().finally(() => setInitialized(true));
    }
  }, [initAuth, initialized]);

  if (!initialized || loading) {
    return <div style={{ padding: 48, textAlign: "center" }}>加载中...</div>;
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

/** 已登录 → 允许访问，未登录 → 跳转登录 */
function AuthGuard() {
  const { token, loading, initAuth } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      initAuth().finally(() => setInitialized(true));
    }
  }, [initAuth, initialized]);

  if (!initialized || loading) {
    return <div style={{ padding: 48, textAlign: "center" }}>加载中...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/** 角色守卫 - 限制特定角色访问 */
function RoleGuard({ roles }: { roles: UserRole[] }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role as UserRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

/** 登录后根据角色自动跳转 */
function DashboardRedirect() {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleDashboardMap: Record<UserRole, string> = {
    enterprise: "/enterprise/dashboard",
    carrier: "/carrier/dashboard",
    government: "/gov/dashboard",
  };

  return <Navigate to={roleDashboardMap[user.role] || "/login"} replace />;
}

const router = createBrowserRouter([
  // 公开路由（未登录可访问）
  {
    element: <GuestGuard />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
    ],
  },

  // 通用受保护路由
  {
    element: <AuthGuard />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardRedirect />,
      },
    ],
  },

  // 企业端受保护路由
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleGuard roles={["enterprise"]} />,
        children: [
          {
            element: <MainLayout />,
            children: [
              {
                path: "/enterprise/dashboard",
                element: <EnterpriseDashboard />,
              },
              {
                path: "/enterprise/info",
                element: <EnterpriseMyInfo />,
              },
              {
                path: "/enterprise/files",
                element: <EnterpriseFileManagement />,
              },
              {
                path: "/enterprise/carriers",
                element: <EnterpriseCarrierList />,
              },
              {
                path: "/enterprise/incubation",
                element: <EnterpriseIncubationManagement />,
              },
              {
                path: "/enterprise/changes",
                element: <EnterpriseChangeManagement />,
              },
              {
                path: "/enterprise/policies",
                element: <EnterprisePolicyList />,
              },
              {
                path: "/enterprise/ai-assist",
                element: <EnterpriseAiAssist />,
              },
              {
                path: "/enterprise/notifications",
                element: <NotificationCenter />,
              },
              // TODO: 后续按层级逐步添加
              // /enterprise/applications/*
            ],
          },
        ],
      },
    ],
  },

  // 载体端受保护路由
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleGuard roles={["carrier"]} />,
        children: [
          {
            element: <MainLayout />,
            children: [
              {
                path: "/carrier/dashboard",
                element: <CarrierDashboard />,
              },
              {
                path: "/carrier/incubation",
                element: <CarrierIncubationReview />,
              },
              {
                path: "/carrier/changes",
                element: <CarrierChangeReview />,
              },
              {
                path: "/carrier/policies",
                element: <CarrierApplicationReview />,
              },
              {
                path: "/carrier/performances",
                element: <CarrierPerformanceSubmit />,
              },
              {
                path: "/carrier/info",
                element: <CarrierInfoPage />,
              },
              {
                path: "/carrier/notifications",
                element: <NotificationCenter />,
              },
              // TODO: 后续按层级逐步添加
            ],
          },
        ],
      },
    ],
  },

  // 政务端受保护路由
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleGuard roles={["government"]} />,
        children: [
          {
            element: <MainLayout />,
            children: [
              {
                path: "/gov/dashboard",
                element: <GovDashboard />,
              },
              {
                path: "/gov/enterprises",
                element: <GovEnterpriseSearch />,
              },
              {
                path: "/gov/carriers",
                element: <GovCarrierSearch />,
              },
              {
                path: "/gov/policies",
                element: <GovPolicyManagement />,
              },
              {
                path: "/gov/applications",
                element: <GovApplicationReview />,
              },
              {
                path: "/gov/performances",
                element: <GovPerformanceManagement />,
              },
              {
                path: "/gov/notifications",
                element: <NotificationCenter />,
              },
              // TODO: 后续按层级逐步添加
              // /gov/incubation/*
              // /gov/account/*
            ],
          },
        ],
      },
    ],
  },

  // 兜底：未匹配路由 → 登录
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

export default router;