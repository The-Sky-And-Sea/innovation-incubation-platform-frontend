import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "../pages/auth/RegisterPage";
import { useAuthStore } from "../store/authStore";

vi.mock("../store/authStore", () => ({
  useAuthStore: vi.fn(),
}));

describe("RegisterPage", () => {
  it("does not offer government self-registration", () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
      selector({ register: vi.fn() }),
    );

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /企业注册/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /载体注册/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /政务注册/ })).not.toBeInTheDocument();
  });
});
