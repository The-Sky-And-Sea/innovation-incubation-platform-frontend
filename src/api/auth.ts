import type { ApiResponse, AuthData, RegisterRequest, UserInfo, UserRole } from "../types";

type BackendUserInfo = Omit<UserInfo, "id"> & { id?: number; user_id?: number };

function normalizeUser(user: BackendUserInfo): UserInfo {
  return {
    ...user,
    id: user.id ?? user.user_id ?? 0,
  };
}

function buildLoginPayload(credential: string, password: string, role: UserRole) {
  if (role === "enterprise") {
    return { credit_code: credential, password, role };
  }
  return { phone: credential, password, role };
}

export async function loginAuth(
  credential: string,
  password: string,
  role: UserRole,
): Promise<ApiResponse<AuthData>> {
  const { post } = await import("../utils/request");
  const res = await post<{ token: string; user: BackendUserInfo }>(
    "/auth/login",
    buildLoginPayload(credential, password, role),
  );
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
