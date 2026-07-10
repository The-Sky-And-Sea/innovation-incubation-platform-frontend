/**
 * 路由配置模块
 *
 * 使用 react-router-dom v6 的 createBrowserRouter 方式
 * 采用 Guard（守卫）模式进行权限控制：
 * - GuestGuard: 仅未登录用户可访问（如登录页、注册页）
 * - AuthGuard: 需要登录才能访问
 * - RoleGuard: 需要特定角色才能访问
 *
 * 路由结构：
 * - /login, /register         → 公开路由（GuestGuard）
 * - /dashboard               → 登录后跳转（AuthGuard）
 * - /enterprise/*            → 企业端路由（RoleGuard: enterprise）
 * - /carrier/*              → 载体端路由（RoleGuard: carrier）
 * - /gov/*                 → 政务端路由（RoleGuard: government）
 */

import { useEffect, useState } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import InfoPageLayout from "../layouts/InfoPageLayout";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/HomePage";
import DocsPage from "../pages/DocsPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import AccountDeletionRequestPage from "../pages/AccountDeletionRequest";
import AppealsPage from "../pages/Appeals";
import NotificationCenter from "../pages/Notifications";
import CarrierApplicationReview from "../pages/carrier/ApplicationReview";
import CarrierChangeReview from "../pages/carrier/ChangeReview";
import CarrierEnterprises from "../pages/carrier/Enterprises";
import CarrierDashboard from "../pages/carrier/Dashboard";
import CarrierInfoPage from "../pages/carrier/CarrierInfo";
import CarrierIncubationReview from "../pages/carrier/IncubationReview";
import CarrierPerformanceSubmit from "../pages/carrier/PerformanceSubmit";
import CarrierPolicyList from "../pages/carrier/PolicyList";
import EnterpriseAiAssist from "../pages/enterprise/AiAssist";
import EnterpriseCarrierList from "../pages/enterprise/CarrierList";
import EnterpriseChangeManagement from "../pages/enterprise/ChangeManagement";
import EnterpriseDashboard from "../pages/enterprise/Dashboard";
import EnterpriseFileManagement from "../pages/enterprise/FileManagement";
import IncubationApplyPage from "../pages/enterprise/IncubationApplyPage";
import IncubationWizardPage from "../pages/enterprise/IncubationWizardPage";
import EnterpriseMyInfo from "../pages/enterprise/MyInfo";
import EnterprisePolicyList from "../pages/enterprise/PolicyList";
import GovAccountDeletion from "../pages/gov/AccountDeletion";
import GovApplicationReview from "../pages/gov/ApplicationReview";
import GovCarrierSearch from "../pages/gov/CarrierSearch";
import GovDashboard from "../pages/gov/Dashboard";
import GovEnterpriseSearch from "../pages/gov/EnterpriseSearch";
import GovIncubationCompletion from "../pages/gov/IncubationCompletion";
import GovInfoPage from "../pages/gov/GovInfo";
import GovPerformanceManagement from "../pages/gov/PerformanceManagement";
import GovPolicyManagement from "../pages/gov/PolicyManagement";
import { useAuthStore } from "../store/authStore";
import type { UserRole } from "../types";
import BrandLogo from "../components/BrandLogo";

/** 路由加载中组件（Auth 初始化时显示） */
function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <div className="route-loading-mark">
        <BrandLogo />
      </div>
      <div>
        <strong>正在恢复工作空间</strong>
        <span>正在校验登录状态与角色权限</span>
      </div>
      <div className="route-loading-bar" />
    </div>
  );
}

/** 游客守卫：未登录用户可访问登录/注册页，登录后跳转到仪表盘 */
function GuestGuard() {
  const { token, loading, initAuth } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      initAuth().finally(() => setInitialized(true));
    }
  }, [initAuth, initialized]);

  if (!initialized || loading) return null;
  if (token) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/** 登录守卫：需要 token 才能访问，受保护路由 */
function AuthGuard() {
  const { token, user, loading, initAuth } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      initAuth().finally(() => setInitialized(true));
    }
  }, [initAuth, initialized]);

  if (token && user && !loading) return <Outlet />;
  if (!initialized || loading) return <RouteLoading />;
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** 角色守卫：检查用户角色是否符合要求 */
function RoleGuard({ roles }: { roles: UserRole[] }) {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role as UserRole)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/** 仪表盘跳转：根据用户角色跳转到对应的仪表盘 */
function DashboardRedirect() {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;

  const roleDashboardMap: Record<UserRole, string> = {
    enterprise: "/enterprise/dashboard",
    carrier: "/carrier/dashboard",
    government: "/gov/dashboard",
  };

  return <Navigate to={roleDashboardMap[user.role] || "/login"} replace />;
}

// 路由配置数组：按「守卫 → 角色 → 布局 → 页面」层次组织
const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/docs/:slug", element: <DocsPage /> },
  {
    element: <GuestGuard />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <AuthGuard />,
    children: [{ path: "/dashboard", element: <DashboardRedirect /> }],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleGuard roles={["enterprise"]} />,
        children: [
          {
            path: "/enterprise/info",
            element: (
              <InfoPageLayout
                title="企业信息"
                subtitle="查看和维护当前企业资料"
                backPath="/enterprise/dashboard"
                accent="#1f78d8"
              >
                <EnterpriseMyInfo />
              </InfoPageLayout>
            ),
          },
          {
            element: <MainLayout />,
            children: [
              { path: "/enterprise/dashboard", element: <EnterpriseDashboard /> },
              { path: "/enterprise/files", element: <EnterpriseFileManagement /> },
              { path: "/enterprise/carriers", element: <EnterpriseCarrierList /> },
              { path: "/enterprise/incubation", element: <IncubationApplyPage /> },
              { path: "/enterprise/incubation/apply", element: <IncubationWizardPage /> },
              { path: "/enterprise/changes", element: <EnterpriseChangeManagement /> },
              { path: "/enterprise/policies", element: <EnterprisePolicyList /> },
              { path: "/enterprise/ai-assist", element: <EnterpriseAiAssist /> },
              { path: "/enterprise/appeals", element: <AppealsPage /> },
              { path: "/enterprise/account-deletion", element: <AccountDeletionRequestPage /> },
              { path: "/enterprise/notifications", element: <NotificationCenter /> },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleGuard roles={["carrier"]} />,
        children: [
          {
            path: "/carrier/info",
            element: (
              <InfoPageLayout
                title="载体信息"
                subtitle="查看和维护当前载体资料"
                backPath="/carrier/dashboard"
                accent="#11a992"
              >
                <CarrierInfoPage />
              </InfoPageLayout>
            ),
          },
          {
            element: <MainLayout />,
            children: [
              { path: "/carrier/dashboard", element: <CarrierDashboard /> },
              { path: "/carrier/incubation", element: <CarrierIncubationReview /> },
              { path: "/carrier/enterprises", element: <CarrierEnterprises /> },
              { path: "/carrier/changes", element: <CarrierChangeReview /> },
              { path: "/carrier/policies", element: <CarrierPolicyList /> },
              { path: "/carrier/applications", element: <CarrierApplicationReview /> },
              { path: "/carrier/performances", element: <CarrierPerformanceSubmit /> },
              { path: "/carrier/appeals", element: <AppealsPage /> },
              { path: "/carrier/account-deletion", element: <AccountDeletionRequestPage /> },
              { path: "/carrier/notifications", element: <NotificationCenter /> },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleGuard roles={["government"]} />,
        children: [
          {
            path: "/gov/info",
            element: (
              <InfoPageLayout
                title="政务信息"
                subtitle="查看当前政务账号资料"
                backPath="/gov/dashboard"
                accent="#d63b5c"
              >
                <GovInfoPage />
              </InfoPageLayout>
            ),
          },
          {
            element: <MainLayout />,
            children: [
              { path: "/gov/dashboard", element: <GovDashboard /> },
              { path: "/gov/enterprises", element: <GovEnterpriseSearch /> },
              { path: "/gov/carriers", element: <GovCarrierSearch /> },
              { path: "/gov/incubation", element: <GovIncubationCompletion /> },
              { path: "/gov/policies", element: <GovPolicyManagement /> },
              { path: "/gov/applications", element: <GovApplicationReview /> },
              { path: "/gov/performances", element: <GovPerformanceManagement /> },
              { path: "/gov/account", element: <GovAccountDeletion /> },
              { path: "/gov/appeals", element: <AppealsPage /> },
              { path: "/gov/notifications", element: <NotificationCenter /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export default router;
