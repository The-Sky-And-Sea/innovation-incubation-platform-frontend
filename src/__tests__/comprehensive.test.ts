/**
 * 全层综合测试
 *
 * 覆盖第 0-8 层所有 API mock 和核心业务流程
 */

import { describe, it, expect, beforeEach } from "vitest";

// ============ 第 1 层：认证 ============
describe("认证模块", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("企业登录返回角色为 enterprise", async () => {
    const { loginAuth } = await import("../api/auth");
    const res = await loginAuth("91440101MA5XXXX", "password123", "enterprise");
    expect(res.data.user.role).toBe("enterprise");
  });

  it("载体登录返回角色为 carrier", async () => {
    const { loginAuth } = await import("../api/auth");
    const res = await loginAuth("13800138000", "password123", "carrier");
    expect(res.data.user.role).toBe("carrier");
  });

  it("getMe 应从 localStorage 恢复角色", async () => {
    localStorage.setItem("mock_role", "government");
    const { getMe } = await import("../api/auth");
    const res = await getMe();
    expect(res.data.role).toBe("government");
  });
});

// ============ 第 2 层：基础信息 ============
describe("基础信息展示", () => {
  it("企业信息 API 返回完整字段", async () => {
    const { getMyEnterpriseInfo } = await import("../api/enterprise");
    const res = await getMyEnterpriseInfo();
    expect(res.data).toHaveProperty("name");
    expect(res.data).toHaveProperty("credit_code");
    expect(res.data).toHaveProperty("industry");
    expect(res.data).toHaveProperty("scale");
  });

  it("载体列表 API 返回 ≥3 条数据", async () => {
    const { getCarrierList } = await import("../api/carriers");
    const res = await getCarrierList(1, 10);
    expect(res.data.list.length).toBeGreaterThanOrEqual(3);
  });

  it("载体详情 API 返回有效载体", async () => {
    const { getCarrierDetail } = await import("../api/carriers");
    const res = await getCarrierDetail(1);
    expect(res.data.name).toBeTruthy();
  });

  it("政务企业检索支持关键词过滤", async () => {
    const { searchEnterprises } = await import("../api/gov");
    const res = await searchEnterprises("科技", 1, 10);
    expect(res.data.list.every(e => e.name.includes("科技") || e.industry.includes("科技"))).toBe(true);
  });

  it("政务载体检索支持关键词过滤", async () => {
    const { searchCarriers } = await import("../api/gov");
    const res = await searchCarriers("天河", 1, 10);
    expect(res.data.list.length).toBeGreaterThan(0);
  });
});

// ============ 第 3 层：文件管理 ============
describe("文件管理", () => {
  it("文件上传限制返回正确配置", async () => {
    const { getFileLimit } = await import("../api/files");
    const res = await getFileLimit();
    expect(res.data.max_size_mb).toBe(20);
    expect(res.data.allowed_extensions).toContain(".pdf");
  });

  it("上传文件应返回 file_id", async () => {
    const { uploadFileAction } = await import("../api/files");
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    const res = await uploadFileAction(file);
    expect(res.data.file_id).toBeGreaterThan(0);
    expect(res.data.filename).toBe("test.pdf");
  });

  it("文件列表应包含刚上传的文件", async () => {
    const { uploadFileAction, getFileList } = await import("../api/files");
    const file = new File(["test2"], "doc.pdf", { type: "application/pdf" });
    await uploadFileAction(file);
    const listRes = await getFileList(1, 20);
    expect(listRes.data.total).toBeGreaterThan(0);
  });

  it("下载文件应返回 Blob URL", async () => {
    const { uploadFileAction, downloadFile } = await import("../api/files");
    const file = new File(["download"], "dl.pdf", { type: "application/pdf" });
    const uploadRes = await uploadFileAction(file);
    const url = await downloadFile(uploadRes.data.file_id);
    expect(url).toContain("blob:");
    URL.revokeObjectURL(url);
  });

  it("删除文件后列表应更新", async () => {
    const { uploadFileAction, deleteFileAction, getFileList } = await import("../api/files");
    const file = new File(["del"], "del.pdf", { type: "application/pdf" });
    const uploadRes = await uploadFileAction(file);
    const fileId = uploadRes.data.file_id;
    const before = await getFileList(1, 100);
    const beforeTotal = before.data.total;
    await deleteFileAction(fileId);
    const after = await getFileList(1, 100);
    expect(after.data.total).toBe(beforeTotal - 1);
  });
});

// ============ 第 4 层：企业入驻 ============
describe("企业入驻", () => {
  it("提交入驻申请应返回 pending 状态", async () => {
    const { submitIncubation } = await import("../api/incubation");
    const res = await submitIncubation({
      carrier_id: 1,
      incubate_start: "2026-06-01",
      incubate_end: "2028-05-31",
      agreement_file_id: 101,
    });
    expect(res.data.status).toBe("pending");
    expect(res.data.carrier_id).toBe(1);
  });

  it("入驻记录列表应包含预置数据", async () => {
    const { getIncubationList } = await import("../api/incubation");
    const res = await getIncubationList(1, 10);
    expect(res.data.total).toBeGreaterThan(0);
  });

  it("载体可以审核入驻申请", async () => {
    const { reviewIncubation, getPendingIncubationList } = await import("../api/carrier");
    const listRes = await getPendingIncubationList(1, 10);
    if (listRes.data.list.length > 0) {
      const id = listRes.data.list[0].id;
      await reviewIncubation(id, { action: "approve", comment: "审核通过" });
      const afterRes = await getPendingIncubationList(1, 10);
      const stillExists = afterRes.data.list.some(r => r.id === id);
      expect(stillExists).toBe(false);
    }
  });
});

// ============ 第 5 层：重大事项变更 ============
describe("重大事项变更", () => {
  it("可变更指标列表包含 7 种类型", async () => {
    const { getChangeTypes } = await import("../api/changes");
    const res = await getChangeTypes();
    expect(res.data.length).toBe(7);
    expect(res.data).toContain("企业名称");
    expect(res.data).toContain("入孵协议文件");
  });

  it("发起变更申请返回 pending 状态", async () => {
    const { submitChange } = await import("../api/changes");
    const res = await submitChange(
      "企业名称",
      "公司更名",
      { new_name: "新名称" },
    );
    expect(res.data.status).toBe("pending");
    expect(res.data.change_type).toBe("企业名称");
  });

  it("变更记录列表包含预置数据", async () => {
    const { getChangeList } = await import("../api/changes");
    const res = await getChangeList(1, 10);
    expect(res.data.total).toBeGreaterThan(0);
  });

  it("载体可以审核变更申请", async () => {
    const { reviewChange, getPendingChangeList } = await import("../api/changes");
    const listRes = await getPendingChangeList(1, 10);
    if (listRes.data.list.length > 0) {
      const id = listRes.data.list[0].id;
      await reviewChange(id, { action: "approve", comment: "审核通过" });
      const afterRes = await getPendingChangeList(1, 10);
      const stillExists = afterRes.data.list.some(r => r.id === id);
      expect(stillExists).toBe(false);
    }
  });
});

// ============ 第 6 层：政策兑现管理 ============
describe("政策兑现管理", () => {
  it("政务发布政策后列表可查", async () => {
    const { publishPolicy, getPolicyList } = await import("../api/policies");
    await publishPolicy({
      template_id: 501,
      title: "测试政策",
      conditions: { industry: "IT" },
      subsidy_amount: "10万元",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    });
    const res = await getPolicyList(1, 10);
    expect(res.data.total).toBeGreaterThan(0);
  });

  it("企业端可申报政策列表含匹配度", async () => {
    const { getEnterprisePolicies } = await import("../api/policies");
    const res = await getEnterprisePolicies(1, 10);
    expect(res.data.list.length).toBeGreaterThan(0);
    const levels = ["high", "partial", "none", "unknown"];
    expect(levels).toContain(res.data.list[0].match_level);
  });

  it("企业提交申报后可在我的申报中查看", async () => {
    const { applyPolicy, getMyApplications } = await import("../api/policies");
    await applyPolicy(601, { project: "test" });
    const res = await getMyApplications(1, 10);
    expect(res.data.total).toBeGreaterThan(0);
  });
});

// ============ 第 7 层：智能辅助申报 ============
describe("智能辅助申报", () => {
  it("AI 政策匹配返回四个等级之一", async () => {
    const { getAiPolicyMatch } = await import("../api/ai");
    const res = await getAiPolicyMatch(601, { industry: "信息技术", scale: "小型" });
    const levels = ["high", "partial", "none", "unknown"];
    expect(levels).toContain(res.data.match_level);
    expect(res.data.reason).toBeTruthy();
  });

  it("AI 表单预填充返回企业画像数据", async () => {
    const { getAiPrefill } = await import("../api/ai");
    const res = await getAiPrefill(601);
    expect(res.data).toHaveProperty("enterprise_name");
    expect(res.data).toHaveProperty("credit_code");
    expect(res.data).toHaveProperty("industry");
  });

  it("规则匹配器对完全匹配返回 high", async () => {
    const { getAiPolicyMatch } = await import("../api/ai");
    const res = await getAiPolicyMatch(601, { industry: "信息技术", scale: "小型" });
    expect(res.data.match_level).toBe("high");
  });

  it("规则匹配器对不匹配返回 none 或 partial", async () => {
    const { getAiPolicyMatch } = await import("../api/ai");
    const res = await getAiPolicyMatch(601, { industry: "金融", scale: "大型" });
    expect(["none", "partial"]).toContain(res.data.match_level);
  });
});

// ============ 第 8 层：绩效考核 ============
describe("绩效考核", () => {
  it("政务启动考核活动后载体可见", async () => {
    const { launchPerformanceCampaign, getPerformanceCampaigns } = await import("../api/performances");
    await launchPerformanceCampaign({
      template_id: 801,
      name: "2026 年度考核",
      year: 2026,
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    });
    const res = await getPerformanceCampaigns(1, 10);
    expect(res.data.total).toBeGreaterThan(0);
    expect(res.data.list[0].is_active).toBe(true);
  });

  it("载体提交申报后政务可评分", async () => {
    const { launchPerformanceCampaign, submitPerformance, getPerformanceSubmissions, scorePerformance } = await import("../api/performances");
    // 启动考核
    const campaignRes = await launchPerformanceCampaign({
      template_id: 801,
      name: "评分测试考核",
      year: 2026,
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    });
    // 载体提交
    const submitRes = await submitPerformance(campaignRes.data.id, { revenue: "5000万" });
    expect(submitRes.data.status).toBe("pending");
    // 政务评分
    await scorePerformance(submitRes.data.id, 85.5, "approved", "表现优秀");
    const listRes = await getPerformanceSubmissions(1, 10);
    const scored = listRes.data.list.find(s => s.id === submitRes.data.id);
    expect(scored?.score).toBe(85.5);
    expect(scored?.status).toBe("approved");
    expect(scored?.comment).toBe("表现优秀");
  });
});