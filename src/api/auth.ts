import type { ApiResponse, AuthData, RegisterRequest, UserInfo, UserRole } from "../types";

type BackendUserInfo = Omit<UserInfo, "id"> & { id?: number; user_id?: number };

function normalizeUser(user: BackendUserInfo): UserInfo {
  return {
    ...user,
    id: user.id ?? user.user_id ?? 0,
  };
}

// 新版后端登录参数：企业用 credit_code，载体/政府用 phone
function buildLoginPayload(credential: string, password: string, role: UserRole) {
  const base = { password, role };
  if (role === "enterprise") {
    return { ...base, credit_code: credential };
  }
  return { ...base, phone: credential };
}

export async function loginAuth(
  credential: string,
  password: string,
  role: UserRole,
): Promise<ApiResponse<AuthData>> {
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

export async function registerAuth(params: RegisterRequest): Promise<ApiResponse<AuthData>> {
  const { post } = await import("../utils/request");
  const res = await post<{ token: string; user: BackendUserInfo }>("/auth/register", params);
  return {
    ...res,
    data: {
      token: res.data.token,
      user: normalizeUser(res.data.user),
    },
  };
}

export async function getMe(): Promise<ApiResponse<UserInfo>> {
  const { get } = await import("../utils/request");
  const res = await get<BackendUserInfo>("/users/me");
  return { ...res, data: normalizeUser(res.data) };
}
