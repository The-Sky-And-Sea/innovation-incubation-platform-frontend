import { beforeEach, describe, expect, it, vi } from "vitest";
import { loginAuth } from "../api/auth";
import { post } from "../utils/request";

vi.mock("../utils/request", () => ({
  post: vi.fn(),
  get: vi.fn(),
}));

const mockPost = vi.mocked(post);

describe("loginAuth payload", () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockPost.mockResolvedValue({
      code: 0,
      message: "success",
      data: {
        token: "token",
        user: { id: 1, role: "enterprise" },
      },
    });
  });

  it("sends enterprise credential as credit_code", async () => {
    await loginAuth("111", "111111", "enterprise");

    expect(mockPost).toHaveBeenCalledWith("/auth/login", {
      credit_code: "111",
      password: "111111",
      role: "enterprise",
    });
  });

  it("sends carrier and government credentials as phone", async () => {
    await loginAuth("111", "111111", "carrier");
    await loginAuth("111", "111111", "government");

    expect(mockPost).toHaveBeenNthCalledWith(1, "/auth/login", {
      phone: "111",
      password: "111111",
      role: "carrier",
    });
    expect(mockPost).toHaveBeenNthCalledWith(2, "/auth/login", {
      phone: "111",
      password: "111111",
      role: "government",
    });
  });
});
