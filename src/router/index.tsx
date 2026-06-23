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
import CarrierDashboard from "../pages/carrier/Dashboard";
import GovDashboard from "../pages/gov/Dashboard";

/** 未登录 → 跳转登录 */
function GuestGuard() {
  const { token, loading } = useAuthStore();

  if (loading) {
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
              // TODO: 后续按层级逐步添加
              // /enterprise/carriers
              // /enterprise/incubation/*
              // /enterprise/changes/*
              // /enterprise/policies/*
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
              // TODO: 后续按层级逐步添加
              // /carrier/incubation/*
              // /carrier/info
              // /carrier/changes/*
              // /carrier/policies/*
              // /carrier/applications/*
              // /carrier/performances/*
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
              // TODO: 后续按层级逐步添加
              // /gov/enterprises/*
              // /gov/carriers/*
              // /gov/policies/*
              // /gov/applications/*
              // /gov/incubation/*
              // /gov/performances/*
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