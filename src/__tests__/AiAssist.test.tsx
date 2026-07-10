import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAiPrefill } from "../api/ai";
import { getFileList } from "../api/files";
import { getEnterprisePolicies } from "../api/policies";
import EnterpriseAiAssist from "../pages/enterprise/AiAssist";
import { loadPolicyPrefill } from "../utils/policyPrefill";

vi.mock("../api/policies", async () => {
  const actual = await vi.importActual<typeof import("../api/policies")>("../api/policies");
  return {
    ...actual,
    getEnterprisePolicies: vi.fn(),
  };
});

vi.mock("../api/ai", async () => {
  const actual = await vi.importActual<typeof import("../api/ai")>("../api/ai");
  return {
    ...actual,
    getAiPrefill: vi.fn(),
  };
});

vi.mock("../api/files", async () => {
  const actual = await vi.importActual<typeof import("../api/files")>("../api/files");
  return {
    ...actual,
    getFileList: vi.fn(),
  };
});

describe("EnterpriseAiAssist", () => {
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
            match_level: "unknown",
          },
        ],
        total: 1,
        page: 1,
        page_size: 100,
      },
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

  it("shows backend prefill notice when a policy has no application materials", async () => {
    vi.mocked(getAiPrefill).mockRejectedValueOnce(new Error("政策暂无申报材料要求"));

    render(
      <MemoryRouter>
        <EnterpriseAiAssist />
      </MemoryRouter>,
    );

    await screen.findByText("培育省级重点工业互联网平台");
    await userEvent.setup().click(screen.getByRole("button", { name: /AI 生成预填充数据/ }));

    await waitFor(() => {
      expect(screen.getByText("政策暂无申报材料要求")).toBeInTheDocument();
    });
  });

  it("shows matched file names instead of raw file ids", async () => {
    vi.mocked(getAiPrefill).mockResolvedValueOnce({
      code: 0,
      message: "success",
      data: [
        { name: "营业执照", file_ids: [1] },
        { name: "项目申报书", file_ids: [3] },
        { name: "财务报表", file_ids: [2] },
      ],
    });

    render(
      <MemoryRouter>
        <EnterpriseAiAssist />
      </MemoryRouter>,
    );

    await screen.findByText("培育省级重点工业互联网平台");
    await userEvent.setup().click(screen.getByRole("button", { name: /AI 生成预填充数据/ }));

    expect(await screen.findByText(/营业执照_样例\.txt/)).toBeInTheDocument();
    expect(screen.getByText(/项目申报书_样例\.txt/)).toBeInTheDocument();
    expect(screen.getByText(/财务报表_样例\.txt/)).toBeInTheDocument();
    expect(loadPolicyPrefill(5)?.materials).toEqual([
      { name: "营业执照", file_ids: [1] },
      { name: "项目申报书", file_ids: [3] },
      { name: "财务报表", file_ids: [2] },
    ]);
  });
});
