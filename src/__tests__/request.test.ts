import { describe, it, expect, vi, beforeEach } from "vitest";
import { get } from "../utils/request";

describe("request 工具层", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("GET 请求应返回成功数据", async () => {
    const mockData = { status: "ok" };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 0, message: "success", data: mockData }), {
        status: 200,
      }),
    );

    const res = await get<{ status: string }>("/health");
    expect(res.code).toBe(0);
    expect(res.data).toEqual(mockData);
  });

  it("业务错误码应抛出异常", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 10101, message: "未登录" }), {
        status: 200,
      }),
    );

    await expect(get("/auth/me")).rejects.toThrow("未登录或Token已过期");
  });

  it("应自动注入 JWT Token", async () => {
    localStorage.setItem("token", "test.jwt.token");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 0, message: "ok", data: {} }), { status: 200 }),
    );

    await get("/auth/me");
    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test.jwt.token");
  });

  it("网络错误应提示连接失败", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Failed to fetch"));

    await expect(get("/health")).rejects.toThrow("网络连接失败");
  });
});