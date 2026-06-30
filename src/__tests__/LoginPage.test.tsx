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
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
      selector({ login: mockLogin }),
    );
  });

  const renderLogin = () =>
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

  it("默认渲染企业端登录表单", () => {
    renderLogin();
    expect(screen.getByText("创新创业孵化载体管理平台")).toBeInTheDocument();
    expect(screen.getByText("登录平台")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入统一社会信用代码")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入 6 位以上密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /登录企业端/ })).toBeInTheDocument();
  });

  it("允许用户填写默认企业端表单", async () => {
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("请输入统一社会信用代码"), "91440101MA5XXXX");
    await user.type(screen.getByPlaceholderText("请输入 6 位以上密码"), "password123");

    expect(screen.getByPlaceholderText("请输入统一社会信用代码")).toHaveValue("91440101MA5XXXX");
    expect(screen.getByPlaceholderText("请输入 6 位以上密码")).toHaveValue("password123");
  });

  it("切换到政务端后显示政务端登录按钮和账号占位符", async () => {
    renderLogin();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /政务端/ }));

    expect(screen.getByPlaceholderText("请输入手机号或账号")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /登录政务端/ })).toBeInTheDocument();
  });

  it("应有注册链接", () => {
    renderLogin();
    expect(screen.getByRole("link", { name: /立即注册/ })).toBeInTheDocument();
  });

  it("账号或密码错误时应显示行内错误且不触发过渡动画", async () => {
    mockLogin.mockRejectedValueOnce(new Error("invalid credentials"));
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("请输入统一社会信用代码"), "91440101MA5XXXX");
    await user.type(screen.getByPlaceholderText("请输入 6 位以上密码"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /登录企业端/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("账号或密码错误，请重新输入。");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("登录成功后才显示工作台跳转过渡动画", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("请输入统一社会信用代码"), "91440101MA5XXXX");
    await user.type(screen.getByPlaceholderText("请输入 6 位以上密码"), "password123");
    await user.click(screen.getByRole("button", { name: /登录企业端/ }));

    expect(await screen.findByRole("status", { name: "页面切换中" })).toBeInTheDocument();
  });
});
