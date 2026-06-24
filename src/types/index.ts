// ============ 通用类型 ============

/** API 统一响应格式 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/** 分页请求参数 */
export interface PaginationParams {
  page: number;
  page_size: number;
}

/** 分页响应 data */
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}

/** 分页响应 */
export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

// ============ 用户与认证 ============

/** 用户角色 */
export type UserRole = "enterprise" | "carrier" | "government";

/** 当前用户信息 */
export interface UserInfo {
  id: number;
  role: UserRole;
  phone?: string;
  email?: string;
  credit_code?: string;
  name?: string;
}

/** 登录请求 */
export interface LoginRequest {
  credential: string;
  password: string;
  role: UserRole;
}

/** 注册请求 */
export interface RegisterRequest {
  password: string;
  role: "enterprise" | "carrier";
  phone: string;
  email?: string;
  // 企业字段
  enterprise_name?: string;
  enterprise_credit_code?: string;
  enterprise_industry?: string;
  enterprise_scale?: string;
  enterprise_address?: string;
  // 载体字段
  carrier_name?: string;
  carrier_type?: string;
  carrier_area?: string;
}

/** 认证响应 */
export interface AuthData {
  token: string;
  user: UserInfo;
}

// ============ 审核状态 ============

/** 审核状态 */
export type AuditStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "returned"
  /** 多级审核中间态 */
  | "carrier_review"
  | "gov_review";

/** 审核操作 */
export type AuditAction = "approve" | "reject" | "return";

/** 审核请求体 */
export interface AuditRequestBody {
  action: AuditAction;
  comment: string;
}

// ============ 企业 ============

/** 企业信息 */
export interface EnterpriseInfo {
  id: number;
  name: string;
  credit_code: string;
  industry: string;
  scale: string;
  address: string;
  legal_person: string;
  contact_name: string;
  contact_phone: string;
}

// ============ 载体 ============

/** 载体信息 */
export interface CarrierInfo {
  id: number;
  name: string;
  type: string;
  address: string;
  area: string;
  manager_name: string;
  contact_phone: string;
  description: string;
}

// ============ 入驻 ============

/** 入驻申请请求 */
export interface IncubationApplyRequest {
  carrier_id: number;
  incubate_start: string;
  incubate_end: string;
  agreement_file_id: number;
}

/** 入驻记录 */
export interface IncubationRecord {
  id: number;
  enterprise_id: number;
  carrier_id: number;
  status: AuditStatus;
  incubate_start: string;
  incubate_end: string;
  agreement_file_id: number;
  created_at: string;
  updated_at: string;
  enterprise?: EnterpriseInfo;
  carrier?: CarrierInfo;
}

// ============ 重大事项变更 ============

/** 变更类型 */
export type ChangeType =
  | "企业名称"
  | "统一社会信用代码"
  | "所属行业"
  | "企业规模"
  | "企业地址"
  | "法定代表人"
  | "入孵协议文件";

/** 变更记录 */
export interface ChangeRecord {
  id: number;
  enterprise_id: number;
  change_type: ChangeType;
  change_content: string;
  old_value: Record<string, unknown>;
  new_value: Record<string, unknown>;
  status: AuditStatus;
  created_at: string;
}

/** 发起变更请求 */
export interface ChangeApplyRequest {
  change_type: ChangeType;
  change_content: string;
  new_value: Record<string, unknown>;
}

// ============ 政策 ============

/** 政策模板 */
export interface PolicyTemplate {
  id: number;
  name: string;
  description: string;
  form_schema: Record<string, unknown>;
  target_role: UserRole | "both";
}

/** 政策 */
export interface Policy {
  id: number;
  template_id: number;
  title: string;
  conditions: Record<string, unknown>;
  subsidy_amount: string;
  start_date: string;
  end_date: string;
  target_role: UserRole | "both";
  file_id?: number;
  match_level?: MatchLevel;
}

/** AI 匹配度等级 */
export type MatchLevel = "high" | "partial" | "none" | "unknown";

/** 政策申报记录 */
export interface PolicyApplication {
  id: number;
  policy_id: number;
  applicant_id: number;
  applicant_type: UserRole;
  form_data: Record<string, unknown>;
  status: AuditStatus;
  created_at: string;
  policy?: Policy;
}

// ============ 绩效考核 ============

/** 考核模板 */
export interface PerformanceTemplate {
  id: number;
  name: string;
  year: number;
  form_schema: Record<string, unknown>;
}

/** 考核活动 */
export interface PerformanceCampaign {
  id: number;
  template_id: number;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

/** 考核申报 */
export interface PerformanceSubmission {
  id: number;
  campaign_id: number;
  carrier_id: number;
  form_data: Record<string, unknown>;
  score?: number;
  status: AuditStatus;
  comment?: string;
}

// ============ 文件 ============

/** 文件信息 */
export interface FileInfo {
  file_id: number;
  filename: string;
  mime_type: string;
  size: number;
  created_at?: string;
}

/** 文件上传限制 */
export interface FileLimit {
  max_size_mb: number;
  allowed_extensions: string[];
}

// ============ 通知 ============

/** 通知类型 */
export type NotificationType =
  | "incubation_pending"
  | "incubation_reviewed"
  | "change_pending"
  | "change_reviewed"
  | "application_pending"
  | "application_carrier_approved"
  | "application_reviewed"
  | "performance_submitted"
  | "performance_scored"
  | "policy_published"
  | "policy_updated"
  | "incubation_graduated"
  | "deletion_applied"
  | "deletion_approved"
  | "deletion_rejected"
  | "account_deleted";

/** 通知 */
export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  content: string;
  target_type: string;
  target_id: number;
  is_read: boolean;
  created_at: string;
}

// ============ 错误码映射 ============

export const ERROR_CODE_MAP: Record<number, string> = {
  10001: "请求参数校验失败",
  10002: "请求的资源未找到",
  10003: "数据已存在",
  10101: "未登录或Token已过期，请重新登录",
  10102: "无权限访问",
  10103: "请求过于频繁，请稍后重试",
  10201: "当前状态不允许此操作",
  10202: "审核操作失败",
  10301: "AI服务暂不可用",
  10302: "AI请求超时",
  50000: "服务器内部错误",
};