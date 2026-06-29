import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import { useAuthStore } from "../store/authStore";

vi.mock("../store/authStore", () => ({
  useAuthStore: vi.fn(),
}));

describe("LoginPage 组件", () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
    });
  });

  const renderLogin = () =>
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

  it("应渲染政务风登录表单", () => {
    renderLogin();
    expect(screen.getByText("创新创业孵化载体管理平台")).toBeInTheDocument();
    expect(screen.getByText("登录平台")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入手机号或账号")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入 6 位以上密码")).toBeInTheDocument();
  });

  it("应允许用户填写表单并显示政务端登录按钮", async () => {
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("请输入手机号或账号"), "01088880000");
    await user.type(screen.getByPlaceholderText("请输入 6 位以上密码"), "password123");

    expect(screen.getByPlaceholderText("请输入手机号或账号")).toHaveValue("01088880000");
    expect(screen.getByPlaceholderText("请输入 6 位以上密码")).toHaveValue("password123");
    expect(screen.getByRole("button", { name: /登录政务端/ })).toBeInTheDocument();
  });

  it("应有注册链接", () => {
    renderLogin();
    expect(screen.getByText("还没有账号？立即注册")).toBeInTheDocument();
  });
});
