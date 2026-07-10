import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAiPrefill } from "../api/ai";
import { getFileList } from "../api/files";
import { getEnterprisePolicies, getFollowedPolicies, getMyApplications } from "../api/policies";
import EnterprisePolicyList from "../pages/enterprise/PolicyList";
import { savePolicyPrefill } from "../utils/policyPrefill";

vi.mock("../components/FileUpload", () => ({
  default: ({ currentFile }: { currentFile?: { filename?: string } | null }) => (
    <div>{currentFile?.filename ? `已选择：${currentFile.filename}` : "未选择文件"}</div>
  ),
}));

vi.mock("../api/files", async () => {
  const actual = await vi.importActual<typeof import("../api/files")>("../api/files");
  return {
    ...actual,
    getFileList: vi.fn(),
  };
});

vi.mock("../api/ai", async () => {
  const actual = await vi.importActual<typeof import("../api/ai")>("../api/ai");
  return {
    ...actual,
    getAiPrefill: vi.fn(),
  };
});

vi.mock("../api/policies", async () => {
  const actual = await vi.importActual<typeof import("../api/policies")>("../api/policies");
  return {
    ...actual,
    getEnterprisePolicies: vi.fn(),
    getFollowedPolicies: vi.fn(),
    getMyApplications: vi.fn(),
  };
});

describe("EnterprisePolicyList AI prefill handoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.mocked(getEnterprisePolicies).mockResolvedValue({
      code: 0,
      message: "success",
      data: {
        list: [
          {
            id: 5,
            title: "培育省级重点工业互联网平台",
            department: "工信部门",
            start_date: "2026-06-23",
            end_date: "2026-07-23",
            target_role: "enterprise",
            match_level: "high",
            requirements: {
              application_materials: [
                { name: "营业执照", necessity: "necessary" },
                { name: "项目申报书", necessity: "necessary" },
                { name: "财务报表", necessity: "unnecessary" },
              ],
            },
          },
        ],
        total: 1,
        page: 1,
        page_size: 10,
      },
    });
    vi.mocked(getMyApplications).mockResolvedValue({
      code: 0,
      message: "success",
      data: { list: [], total: 0, page: 1, page_size: 20 },
    });
    vi.mocked(getFollowedPolicies).mockResolvedValue({
      code: 0,
      message: "success",
      data: { list: [], total: 0, page: 1, page_size: 20 },
    });
    vi.mocked(getAiPrefill).mockResolvedValue({
      code: 0,
      message: "success",
      data: [
        { name: "营业执照", file_ids: [1] },
        { name: "项目申报书", file_ids: [3] },
        { name: "财务报表", file_ids: [2] },
      ],
    });
    vi.mocked(getFileList).mockResolvedValue({
      code: 0,
      message: "success",
      data: {
        list: [
          { file_id: 1, filename: "营业执照_样例.txt", mime_type: "text/plain", size: 742 },
          { file_id: 2, filename: "财务报表_样例.txt", mime_type: "text/plain", size: 823 },
          { file_id: 3, filename: "项目申报书_样例.txt", mime_type: "text/plain", size: 1100 },
        ],
        total: 3,
        page: 1,
        page_size: 1000,
      },
    });
  });

  it("fills the application modal with files saved by AI prefill", async () => {
    savePolicyPrefill(5, [
      { name: "营业执照", file_ids: [1] },
      { name: "项目申报书", file_ids: [3] },
      { name: "财务报表", file_ids: [2] },
    ]);

    render(
      <MemoryRouter initialEntries={["/enterprise/policies?prefillPolicyId=5"]}>
        <EnterprisePolicyList />
      </MemoryRouter>,
    );

    await screen.findByText("培育省级重点工业互联网平台");
    expect(screen.getByText("AI 预填充已准备好")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: /申报/ }));

    await waitFor(() => {
      expect(screen.getByText("已选择：营业执照_样例.txt")).toBeInTheDocument();
      expect(screen.getByText("已选择：项目申报书_样例.txt")).toBeInTheDocument();
      expect(screen.getByText("已选择：财务报表_样例.txt")).toBeInTheDocument();
    });
  });

  it("uses AI prefill ids even when the file list cannot resolve names", async () => {
    vi.mocked(getFileList).mockResolvedValueOnce({
      code: 0,
      message: "success",
      data: {
        list: [],
        total: 0,
        page: 1,
        page_size: 1000,
      },
    });

    savePolicyPrefill(5, [
      { name: "营业执照", file_ids: [1] },
      { name: "项目申报书", file_ids: [3] },
      { name: "财务报表", file_ids: [2] },
    ]);

    render(
      <MemoryRouter initialEntries={["/enterprise/policies?prefillPolicyId=5"]}>
        <EnterprisePolicyList />
      </MemoryRouter>,
    );

    await screen.findByText("培育省级重点工业互联网平台");
    await userEvent.setup().click(screen.getByRole("button", { name: /申报/ }));

    await waitFor(() => {
      expect(screen.getByText("已选择：营业执照（AI预填充文件 ID 1）")).toBeInTheDocument();
      expect(screen.getByText("已选择：项目申报书（AI预填充文件 ID 3）")).toBeInTheDocument();
      expect(screen.getByText("已选择：财务报表（AI预填充文件 ID 2）")).toBeInTheDocument();
    });
  });

  it("reloads AI prefill when the page was refreshed after redirect", async () => {
    render(
      <MemoryRouter initialEntries={["/enterprise/policies?prefillPolicyId=5"]}>
        <EnterprisePolicyList />
      </MemoryRouter>,
    );

    await screen.findByText("培育省级重点工业互联网平台");
    await userEvent.setup().click(screen.getByRole("button", { name: /申报/ }));

    await waitFor(() => {
      expect(getAiPrefill).toHaveBeenCalledWith(5);
      expect(screen.getByText("已选择：营业执照_样例.txt")).toBeInTheDocument();
    });
  });
});
