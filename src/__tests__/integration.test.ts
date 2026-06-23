/**
 * 综合集成测试
 *
 * 覆盖第 2-4 层 API mock 功能和 authStore 认证流程
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../store/authStore";

describe("authStore 认证流程", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ token: null, user: null, loading: true });
  });

  it("登录后应存储 token 和用户信息", async () => {
    await useAuthStore.getState().login("91440101MA5XXXX", "password123", "enterprise");

    const { token, user } = useAuthStore.getState();
    expect(token).toBeTruthy();
    expect(user).toBeTruthy();
    expect(user?.role).toBe("enterprise");
    expect(localStorage.getItem("token")).toBeTruthy();
  });

  it("登录不同角色应保存正确的角色", async () => {
    await useAuthStore.getState().login("13800138000", "password123", "carrier");
    expect(useAuthStore.getState().user?.role).toBe("carrier");
  });

  it("退出登录应清除 token 和用户信息", async () => {
    await useAuthStore.getState().login("test", "password123", "enterprise");
    useAuthStore.getState().logout();

    const { token, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("initAuth 无 token 时应将 loading 置为 false", async () => {
    await useAuthStore.getState().initAuth();
    expect(useAuthStore.getState().loading).toBe(false);
  });
});

describe("mock API 层集成测试", () => {
  it("载体列表 API 应返回 3 条 mock 数据", async () => {
    const { getCarrierList } = await import("../api/carriers");
    const res = await getCarrierList(1, 10);
    expect(res.code).toBe(0);
    expect(res.data.list.length).toBeGreaterThanOrEqual(3);
    expect(res.data.list[0]).toHaveProperty("name");
    expect(res.data.list[0]).toHaveProperty("type");
  });

  it("政务企业搜索 API 支持关键词过滤", async () => {
    const { searchEnterprises } = await import("../api/gov");
    const res = await searchEnterprises("科技", 1, 10);
    expect(res.code).toBe(0);
    expect(res.data.list.every((e) => e.name.includes("科技") || e.industry.includes("科技"))).toBe(true);
  });

  it("文件上传限制 API 返回正确配置", async () => {
    const { getFileLimit } = await import("../api/files");
    const res = await getFileLimit();
    expect(res.data.max_size_mb).toBe(20);
    expect(res.data.allowed_extensions).toContain(".pdf");
    expect(res.data.allowed_extensions).toContain(".jpg");
  });
});