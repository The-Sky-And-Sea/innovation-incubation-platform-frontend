import { describe, expect, it } from "vitest";
import { loginAuth } from "../api/auth";

describe("auth mock API", () => {
  it("allows any credential and password in mock mode", async () => {
    import.meta.env.VITE_USE_MOCK = "true";

    const res = await loginAuth("", "1", "enterprise");

    expect(res.code).toBe(0);
    expect(res.data.token).toMatch(/^mock-jwt-token-/);
    expect(res.data.user.role).toBe("enterprise");
  });
});
