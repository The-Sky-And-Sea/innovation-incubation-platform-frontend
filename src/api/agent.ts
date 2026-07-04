import { API_BASE_URL } from "./config";
import type { UserRole } from "../types";

export type AgentToolName =
  | "search_policy"
  | "query_policy_detail"
  | "query_enterprise_info"
  | "query_appeal"
  | "query_policy_follow"
  | "query_incubation_records"
  | "query_change_history"
  | "query_my_policy_applications"
  | "query_my_files"
  | "query_my_carrier_info"
  | "query_pending_incubations"
  | "query_pending_changes"
  | "query_enterprise_applications"
  | "query_applications_by_status"
  | "query_performance_campaigns";

export interface AgentToolDefinition {
  name: AgentToolName;
  label: string;
  description: string;
  roles: UserRole[];
  path?: string;
}

export interface AgentChatSession {
  id: number;
  title: string;
  message_count: number;
  last_message_at: string;
}

export interface AgentChatMessage {
  id: number;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls?: string;
  created_at?: string;
}

export interface AgentSSEEvent {
  type: "thinking" | "reply" | "tool_call" | "tool_result" | "error" | "done";
  data: unknown;
}

export interface AgentStreamCallbacks {
  onThinking?: (text: string) => void;
  onReply?: (text: string) => void;
  onError?: (message: string) => void;
  onDone?: () => void;
  onEvent?: (event: AgentSSEEvent) => void;
}

const TOOL_CATALOG: AgentToolDefinition[] = [
  {
    name: "search_policy",
    label: "政策检索",
    description: "根据关键词、行业、企业规模等条件检索匹配政策。",
    roles: ["enterprise", "carrier"],
    path: "/enterprise/policies",
  },
  {
    name: "query_policy_detail",
    label: "政策详情",
    description: "根据政策 ID 获取申报条件、补贴详情、材料和办理流程。",
    roles: ["enterprise", "carrier"],
  },
  {
    name: "query_enterprise_info",
    label: "企业画像",
    description: "查询当前企业入驻信息、入驻状态和申报进度。",
    roles: ["enterprise"],
    path: "/enterprise/info",
  },
  {
    name: "query_appeal",
    label: "诉求查询",
    description: "查询当前用户提交的诉求处理状态和结果。",
    roles: ["enterprise", "carrier"],
  },
  {
    name: "query_policy_follow",
    label: "关注政策",
    description: "查询当前用户关注的政策列表。",
    roles: ["enterprise", "carrier"],
  },
  {
    name: "query_incubation_records",
    label: "入驻记录",
    description: "查询当前企业入驻申请记录，支持分页。",
    roles: ["enterprise"],
    path: "/enterprise/incubation",
  },
  {
    name: "query_change_history",
    label: "变更记录",
    description: "查询当前企业重大事项变更记录，支持分页。",
    roles: ["enterprise"],
    path: "/enterprise/changes",
  },
  {
    name: "query_my_policy_applications",
    label: "政策申报记录",
    description: "查询当前企业政策申报记录，支持分页。",
    roles: ["enterprise"],
    path: "/enterprise/policies",
  },
  {
    name: "query_my_files",
    label: "我的文件",
    description: "查询当前用户上传的文件列表，支持分页。",
    roles: ["enterprise", "carrier"],
    path: "/enterprise/files",
  },
  {
    name: "query_my_carrier_info",
    label: "载体信息",
    description: "查询当前载体用户的名称、类型、地址等基础信息。",
    roles: ["carrier"],
    path: "/carrier/info",
  },
  {
    name: "query_pending_incubations",
    label: "待审入驻",
    description: "查询待审核的企业入驻申请列表。",
    roles: ["carrier"],
    path: "/carrier/incubation",
  },
  {
    name: "query_pending_changes",
    label: "待审变更",
    description: "查询待审核的企业变更申请列表。",
    roles: ["carrier"],
    path: "/carrier/changes",
  },
  {
    name: "query_enterprise_applications",
    label: "企业申报审核",
    description: "查询待审核的企业政策申报记录。",
    roles: ["carrier"],
    path: "/carrier/applications",
  },
  {
    name: "query_applications_by_status",
    label: "按状态查申报",
    description: "根据 pending、approved、rejected 查询企业政策申报。",
    roles: ["carrier"],
    path: "/carrier/applications",
  },
  {
    name: "query_performance_campaigns",
    label: "绩效活动",
    description: "查询当前可参与的绩效评估活动列表。",
    roles: ["carrier"],
    path: "/carrier/performances",
  },
];

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json();
  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.message || "AI 助手接口请求失败");
  }
  return payload.data as T;
}

export function getAgentToolCatalog(role: UserRole): AgentToolDefinition[] {
  return TOOL_CATALOG.filter((tool) => tool.roles.includes(role));
}

export function getAgentQuickPrompts(role: UserRole): string[] {
  if (role === "carrier") {
    return ["今天有哪些待审核事项", "帮我整理企业申报材料", "查看绩效考核任务"];
  }
  if (role === "government") {
    return ["汇总今天的终审待办", "检查近期政策发布", "查看诉求处理进展"];
  }
  return ["帮我找适合申报的政策", "我的材料还缺什么", "查看申报进度"];
}

export async function listAgentSessions(): Promise<AgentChatSession[]> {
  const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
    headers: authHeaders(),
  });
  return parseJsonResponse<AgentChatSession[]>(response);
}

export async function createAgentSession(title: string): Promise<AgentChatSession> {
  const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  });
  return parseJsonResponse<AgentChatSession>(response);
}

export async function getAgentSession(
  sessionId: number,
): Promise<{ session: AgentChatSession; messages: AgentChatMessage[] }> {
  const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
    headers: authHeaders(),
  });
  return parseJsonResponse<{ session: AgentChatSession; messages: AgentChatMessage[] }>(response);
}

export async function deleteAgentSession(sessionId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await parseJsonResponse(response);
}

function normalizeEventData(event: AgentSSEEvent): string {
  if (typeof event.data === "string") return event.data;
  if (event.data && typeof event.data === "object" && "message" in event.data) {
    return String((event.data as { message?: unknown }).message || "");
  }
  return "";
}

function sanitizeAgentErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("authentication") ||
    lower.includes("unauthorized") ||
    lower.includes("status code: 401") ||
    lower.includes("status: 401")
  ) {
    return "AI 服务鉴权失败，请联系管理员检查模型 API Key。";
  }
  if (lower.includes("invalid character") && lower.includes("looking for beginning of value")) {
    return "AI 服务返回异常，请稍后重试或联系管理员检查模型配置。";
  }
  return message || "AI 助手暂时不可用";
}

export function parseAgentSSEBuffer(
  buffer: string,
  onEvent: (event: AgentSSEEvent) => void,
): string {
  const frames = buffer.split(/\n\n/);
  const rest = frames.pop() || "";
  for (const frame of frames) {
    const data = frame
      .split(/\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");
    if (!data) continue;
    onEvent(JSON.parse(data) as AgentSSEEvent);
  }
  return rest;
}

export async function sendAgentMessageStream(
  sessionId: number,
  content: string,
  state: Record<string, unknown>,
  callbacks: AgentStreamCallbacks = {},
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ content, state }),
  });

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => null);
    throw new Error(sanitizeAgentErrorMessage(payload?.message || "AI 助手暂时不可用"));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const dispatch = (event: AgentSSEEvent) => {
    callbacks.onEvent?.(event);
    if (event.type === "thinking") callbacks.onThinking?.(normalizeEventData(event));
    if (event.type === "reply") callbacks.onReply?.(normalizeEventData(event));
    if (event.type === "error") callbacks.onError?.(sanitizeAgentErrorMessage(normalizeEventData(event)));
    if (event.type === "done") callbacks.onDone?.();
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = parseAgentSSEBuffer(buffer, dispatch);
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    parseAgentSSEBuffer(`${buffer}\n\n`, dispatch);
  }
}
