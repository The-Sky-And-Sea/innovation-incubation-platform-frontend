import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { ChangeType, PolicyMaterial } from "../types";

function okResponse(data: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify({ code: 0, message: "ok", data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function setupRealApi() {
  vi.resetModules();
  vi.stubEnv("VITE_USE_MOCK", "false");
  vi.stubEnv("VITE_API_BASE_URL", "http://api.test/api/v1");
  localStorage.setItem("token", "token-for-test");
}

interface FetchSpyLike {
  mock: {
    calls: Array<[RequestInfo | URL, RequestInit?]>;
  };
}

function lastFetchCall(fetchSpy: FetchSpyLike) {
  const call = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
  if (!call) throw new Error("fetch was not called");
  return {
    url: String(call[0]),
    init: call[1] as RequestInit,
  };
}

describe("API documentation alignment - mock behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("supports enterprise policy follows and carrier policy application", async () => {
    const {
      publishPolicy,
      followPolicy,
      unfollowPolicy,
      getFollowedPolicies,
      getCarrierPolicies,
      applyCarrierPolicy,
    } = await import("../api/policies");

    const published = await publishPolicy({
      title: "Carrier and enterprise support policy",
      target_role: "both",
      department: "Science Bureau",
      requirements: { industry: "AI" },
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    });

    await followPolicy(published.data.id);
    const followed = await getFollowedPolicies(1, 20);
    expect(followed.data.list.some((item) => item.id === published.data.id)).toBe(true);

    await unfollowPolicy(published.data.id);
    const afterUnfollow = await getFollowedPolicies(1, 20);
    expect(afterUnfollow.data.list.some((item) => item.id === published.data.id)).toBe(false);

    const carrierPolicies = await getCarrierPolicies(1, 20);
    expect(carrierPolicies.data.list.some((item) => item.id === published.data.id)).toBe(true);

    const materials: PolicyMaterial[] = [
      { name: "application.pdf", file_id: 101, necessity: "necessary" },
    ];
    const application = await applyCarrierPolicy(published.data.id, materials);
    expect(application.data.applicant_type).toBe("carrier");
    expect(application.data.materials).toEqual(materials);
  });

  it("supports appeal submission, listing, and gov status update", async () => {
    const {
      submitEnterpriseAppeal,
      getEnterpriseAppeals,
      getGovAppeals,
      updateGovAppealStatus,
    } = await import("../api/appeals");

    const appeal = await submitEnterpriseAppeal({
      identifier: "91340000TEST9999",
      problem_type: "tax",
      department: "Tax Bureau",
      content: "Need policy clarification",
    });
    const myAppeals = await getEnterpriseAppeals(1, 20);
    expect(myAppeals.data.list.some((item) => item.id === appeal.data.id)).toBe(true);

    await updateGovAppealStatus(appeal.data.id, "processed");
    const processedAppeals = await getGovAppeals({ status: "processed", page: 1, page_size: 20 });
    expect(processedAppeals.data.list.some((item) => item.id === appeal.data.id)).toBe(true);
  });

  it("supports account deletion submission and gov review", async () => {
    const {
      submitEnterpriseDeletion,
      getGovAccountDeletions,
      reviewGovAccountDeletion,
    } = await import("../api/account");

    const deletion = await submitEnterpriseDeletion("Business adjustment");
    const deletions = await getGovAccountDeletions("pending", 1, 20);
    expect(deletions.data.list.some((item) => item.id === deletion.data.id)).toBe(true);

    await reviewGovAccountDeletion(deletion.data.id, { action: "approve", comment: "Approved" });
    const approvedDeletions = await getGovAccountDeletions("approved", 1, 20);
    expect(approvedDeletions.data.list.some((item) => item.id === deletion.data.id)).toBe(true);
  });

  it("supports returned change re-edit", async () => {
    const { submitChange, reviewChange, updateChange } = await import("../api/changes");

    const change = await submitChange(
      "企业名称" as ChangeType,
      "Original change content",
      { new_name: "Original Name" },
    );
    await reviewChange(change.data.id, { action: "return", comment: "Need more detail" });
    const updated = await updateChange(change.data.id, {
      change_content: "Revised change content",
      new_value: { new_name: "Revised Name" },
    });
    expect(updated.data.status).toBe("pending");
    expect(updated.data.change_content).toBe("Revised change content");
  });
});

describe("API documentation alignment - real request paths", () => {
  beforeEach(() => {
    setupRealApi();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("uses documented auth and debug endpoints", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.endsWith("/auth/login")) {
        return okResponse({
          token: "server-token",
          user: { user_id: 88, role: "enterprise", name: "Enterprise" },
        });
      }
      if (url.endsWith("/auth/register")) {
        return okResponse({ user_id: 89, role: "carrier", name: "Carrier" });
      }
      if (url.endsWith("/users/me")) {
        return okResponse({ user_id: 88, role: "enterprise", name: "Enterprise" });
      }
      if (url.endsWith("/health")) return okResponse({ status: "ok" });
      return okResponse({});
    });

    const { loginAuth, registerAuth, getMe } = await import("../api/auth");
    const { getHealth, testLlm, testEmbedding, testConvertFile } = await import("../api/common");

    const login = await loginAuth("credential", "password123", "enterprise");
    expect(login.data.user.id).toBe(88);
    expect(fetchSpy.mock.calls[0][0]).toBe("http://api.test/api/v1/auth/login");

    const registered = await registerAuth({
      role: "carrier",
      phone: "13800138000",
      password: "password123",
    });
    expect(registered.data.id).toBe(89);
    expect(fetchSpy.mock.calls[1][0]).toBe("http://api.test/api/v1/auth/register");

    const me = await getMe();
    expect(me.data.id).toBe(88);
    expect(fetchSpy.mock.calls[2][0]).toBe("http://api.test/api/v1/users/me");

    await getHealth();
    expect(fetchSpy.mock.calls[3][0]).toBe("http://api.test/api/v1/health");

    await testLlm({ system: "assistant", user: "hello" });
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/test/llm");

    await testEmbedding("hello");
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/test/embedding");

    await testConvertFile(new File(["doc"], "doc.pdf", { type: "application/pdf" }));
    const convertCall = lastFetchCall(fetchSpy);
    expect(convertCall.url).toBe("http://api.test/api/v1/test/convert");
    expect(convertCall.init.body).toBeInstanceOf(FormData);
  });

  it("uses documented policy, appeal, deletion, and gov endpoints", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("/policies") || url.includes("/applications")) {
        return okResponse({ list: [], total: 0, page: 1, page_size: 20 });
      }
      if (url.includes("/appeals")) {
        return okResponse({ list: [], total: 0, page: 1, page_size: 20 });
      }
      if (url.includes("/account/deletions")) {
        return okResponse({ list: [], total: 0, page: 1, page_size: 20 });
      }
      return okResponse(null);
    });

    const policies = await import("../api/policies");
    const ai = await import("../api/ai");
    const appeals = await import("../api/appeals");
    const account = await import("../api/account");
    const gov = await import("../api/gov");
    const changes = await import("../api/changes");

    await policies.getFollowedPolicies(1, 20);
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/enterprise/policies/follows?page=1&page_size=20");

    await policies.followPolicy(7);
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/enterprise/policies/7/follow");
    expect(lastFetchCall(fetchSpy).init.method).toBe("POST");

    await policies.unfollowPolicy(7);
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/enterprise/policies/7/follow");
    expect(lastFetchCall(fetchSpy).init.method).toBe("DELETE");

    await policies.applyCarrierPolicy(7, [{ name: "m.pdf", file_id: 1, necessity: "necessary" }]);
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/carrier/policies/7/apply");
    expect(lastFetchCall(fetchSpy).init.body).toBe(JSON.stringify({ materials: [{ name: "m.pdf", file_id: 1, necessity: "necessary" }] }));

    await ai.searchEnterprisePolicies("AI subsidy");
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/enterprise/policies/search");

    await ai.searchCarrierPolicies("workspace subsidy");
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/carrier/policies/search");

    await policies.updatePolicy(7, { title: "Updated title" });
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/gov/policies/7");
    expect(lastFetchCall(fetchSpy).init.method).toBe("PUT");

    await appeals.submitEnterpriseAppeal({
      identifier: "91340000TEST9999",
      problem_type: "tax",
      department: "Tax Bureau",
      content: "Need policy clarification",
    });
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/enterprise/appeals");

    await appeals.submitCarrierAppeal({
      identifier: "13800138000",
      problem_type: "financing",
      department: "Finance Bureau",
      content: "Need financing support",
    });
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/carrier/appeals");

    await appeals.updateGovAppealStatus(3, "processed");
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/gov/appeals/3/status");
    expect(lastFetchCall(fetchSpy).init.method).toBe("PATCH");

    await account.submitEnterpriseDeletion("Business adjustment");
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/enterprise/account/deletion");

    await account.submitCarrierDeletion("Business adjustment");
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/carrier/account/deletion");

    await account.reviewGovAccountDeletion(5, { action: "approve", comment: "Approved" });
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/gov/account/deletions/5/review");

    await gov.updateEnterpriseInfo(9, { name: "New enterprise" });
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/gov/enterprises/9");
    expect(lastFetchCall(fetchSpy).init.method).toBe("PUT");

    await gov.deleteCarrier(4);
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/gov/carriers/4");
    expect(lastFetchCall(fetchSpy).init.method).toBe("DELETE");

    await gov.govCompleteIncubation(6);
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/gov/incubations/6/complete");

    await changes.updateChange(8, {
      change_content: "Updated content",
      new_value: { name: "Updated" },
    });
    expect(lastFetchCall(fetchSpy).url).toBe("http://api.test/api/v1/enterprise/changes/8");
    expect(lastFetchCall(fetchSpy).init.method).toBe("PUT");
  });
});
