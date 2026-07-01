import { mockApi, mockApiFail } from "./mock";
import { isMockEnabled } from "./config";
import type { ApiResponse, AuthData, RegisterRequest, UserInfo, UserRole } from "../types";

type BackendUserInfo = Omit<UserInfo, "id"> & { id?: number; user_id?: number };

function normalizeUser(user: BackendUserInfo): UserInfo {
  return {
    ...user,
    id: user.id ?? user.user_id ?? 0,
  };
}

function buildLoginPayload(credential: string, password: string, role: string) {
  return role === "enterprise"
    ? { credit_code: credential, password, role }
    : { phone: credential, password, role };
}

const mockUser: UserInfo = {
  id: 1,
  role: "enterprise",
  phone: "13800138000",
  email: "company@example.com",
  credit_code: "91440101MA5XXXX",
  name: "Mock Enterprise",
};

const roleUserMap: Record<UserRole, Partial<UserInfo>> = {
  enterprise: { id: 1, name: "Mock Enterprise", credit_code: "91440101MA5XXXX" },
  carrier: { id: 2, name: "Mock Carrier", phone: "020-88880001", email: "carrier@example.com", credit_code: undefined },
  government: { id: 3, name: "Mock Government", phone: "010-88880000", email: "gov@example.com", department: "Industry Bureau" },
};

export async function loginAuth(
  credential: string,
  password: string,
  role: UserRole,
): Promise<ApiResponse<AuthData>> {
  if (isMockEnabled()) {
    const mockCredential = credential || "mock-user";
    const mockPassword = password && password.length >= 6 ? password : "mock-password";
    void mockCredential;
    void mockPassword;

    localStorage.setItem("mock_role", role);
    const roleInfo = roleUserMap[role] || roleUserMap.enterprise;
    return mockApi<AuthData>({
      token: "mock-jwt-token-" + Date.now(),
      user: {
        ...mockUser,
        ...roleInfo,
        role,
      },
    });
  }

  const { post } = await import("../utils/request");
  const res = await post<{ token: string; user: BackendUserInfo }>("/auth/login", buildLoginPayload(credential, password, role));
  return {
    ...res,
    data: {
      token: res.data.token,
      user: normalizeUser(res.data.user),
    },
  };
}

export async function registerAuth(params: RegisterRequest): Promise<ApiResponse<UserInfo>> {
  if (isMockEnabled()) {
    if (!params.phone || !params.password) {
      await mockApiFail(10001, "参数错误：手机号和密码不能为空");
      throw new Error("unreachable");
    }
    if (params.password.length < 6) {
      await mockApiFail(10001, "参数错误：密码至少 6 位");
      throw new Error("unreachable");
    }

    localStorage.setItem("mock_role", params.role);
    return mockApi<UserInfo>(
      normalizeUser({
        id: params.role === "enterprise" ? 1 : params.role === "carrier" ? 2 : 3,
        role: params.role,
        phone: params.phone,
        email: params.email,
        credit_code: params.enterprise_credit_code || undefined,
        name: params.enterprise_name || params.carrier_name || params.gov_name || "New User",
        department: params.gov_department,
      }),
    );
  }

  const { post } = await import("../utils/request");
  const res = await post<BackendUserInfo>("/auth/register", params);
  return { ...res, data: normalizeUser(res.data) };
}

export async function getMe(): Promise<ApiResponse<UserInfo>> {
  if (isMockEnabled()) {
    const storedRole = (localStorage.getItem("mock_role") || "enterprise") as UserRole;
    const roleInfo = roleUserMap[storedRole] || roleUserMap.enterprise;
    return mockApi<UserInfo>({
      ...mockUser,
      ...roleInfo,
      role: storedRole,
    });
  }

  const { get } = await import("../utils/request");
  const res = await get<BackendUserInfo>("/users/me");
  return { ...res, data: normalizeUser(res.data) };
}
