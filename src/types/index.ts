export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page: number;
  page_size: number;
}

export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

export type UserRole = "enterprise" | "carrier" | "government";
export type RegisterableRole = Exclude<UserRole, "government">;

export interface UserInfo {
  id: number;
  user_id?: number;
  role: UserRole;
  phone?: string;
  email?: string;
  credit_code?: string;
  name?: string;
}

export interface LoginRequest {
  credential: string;
  password: string;
  role: UserRole;
}

export interface RegisterRequest {
  password: string;
  role: RegisterableRole;
  phone: string;
  email?: string;
  enterprise_name?: string;
  enterprise_credit_code?: string;
  enterprise_industry?: string;
  enterprise_scale?: string;
  enterprise_address?: string;
  enterprise_legal_person?: string;
  enterprise_contact_name?: string;
  carrier_name?: string;
  carrier_type?: string;
  carrier_area?: string;
}

export interface AuthData {
  token: string;
  user: UserInfo;
}

export type AuditStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "returned"
  | "carrier_review"
  | "gov_review";

export type AuditAction = "approve" | "reject" | "return";

export interface AuditRequestBody {
  action: AuditAction;
  comment: string;
}

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
  office_phone?: string;
  mobile_phone?: string;
  operating_unit_name?: string;
  bank_name?: string;
  bank_account?: string;
  fixed_asset_investment?: number;
  nature?: string;
  type?: string;
  level?: string;
  certification_date?: string;
  establishment_date?: string;
  total_area?: number;
  functional_area?: number;
  incubation_area?: number;
  rent_area?: number;
  rent_price?: number;
  workstation_count?: number;
  workstation_standard?: string;
  managers_count?: number;
  technical_staff_count?: number;
  bachelor_above_count?: number;
  trained_staff_count?: number;
  seed_fund_amount?: number;
  site_proof_material?: string;
  seed_fund_material?: string;
}

export interface CarrierInfo {
  id: number;
  name: string;
  type: string;
  address: string;
  area: string;
  manager_name: string;
  contact_phone: string;
  description: string;
  scale?: "small" | "medium" | "large" | string;
  specialty_fields?: string[];
}

export interface IncubationApplyRequest {
  carrier_id: number;
  incubate_start: string;
  incubate_end: string;
  agreement_file_id: number;
  credit_code?: string;
  enterprise_name?: string;
}

export interface IncubationRecord {
  id: number;
  enterprise_id: number;
  carrier_id: number;
  status: AuditStatus;
  incubate_status?: "in_incubation" | "graduated" | "exited" | string;
  incubate_start: string;
  incubate_end: string;
  agreement_file_id: number;
  created_at: string;
  updated_at: string;
  enterprise?: EnterpriseInfo;
  carrier?: CarrierInfo;
}

export type ChangeType =
  | "企业名称"
  | "统一社会信用代码"
  | "所属行业"
  | "企业规模"
  | "企业地址"
  | "法定代表人"
  | "入孵协议文件";

export interface ChangeRecord {
  id: number;
  enterprise_id: number;
  enterprise_name?: string;
  change_type: ChangeType;
  change_content: string;
  old_value: Record<string, unknown>;
  new_value: Record<string, unknown>;
  status: AuditStatus;
  created_at: string;
}

export interface ChangeApplyRequest {
  change_type: ChangeType;
  change_content: string;
  new_value: Record<string, unknown>;
}

export interface PolicyTemplate {
  id: number;
  name: string;
  description: string;
  form_schema: Record<string, unknown>;
  target_role: UserRole | "both";
}

export interface Policy {
  id: number;
  template_id?: number;
  title: string;
  department?: string;
  requirements?: Record<string, unknown>;
  conditions?: Record<string, unknown>;
  subsidy_amount?: string;
  start_date: string;
  end_date: string;
  target_role: UserRole | "both";
  file_id?: number;
  match_level?: MatchLevel;
  followed?: boolean;
}

export type MatchLevel = "high" | "partial" | "none" | "unknown";

export interface PolicyMaterial {
  name: string;
  file_id: number;
  necessity: "necessary" | "optional" | string;
}

export interface PolicyApplication {
  id: number;
  policy_id: number;
  applicant_id: number;
  applicant_type: UserRole;
  form_data?: Record<string, unknown>;
  materials?: PolicyMaterial[];
  status: AuditStatus;
  created_at: string;
  policy?: Policy;
}

export interface PerformanceTemplate {
  id: number;
  name: string;
  year: number;
  form_schema: Record<string, unknown>;
}

export interface PerformanceCampaign {
  id: number;
  template_id: number;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface PerformanceSubmission {
  id: number;
  campaign_id: number;
  carrier_id: number;
  form_data: Record<string, unknown>;
  document_file_id?: number;
  score?: number;
  status: AuditStatus;
  comment?: string;
}

export type ProblemType =
  | "tax"
  | "financing"
  | "property"
  | "utility"
  | "registration"
  | "labor"
  | "construction"
  | "supervision"
  | "reward"
  | "other";

export type AppealStatus = "pending" | "processed";

export interface Appeal {
  id: number;
  identifier: string;
  problem_type: ProblemType;
  department: string;
  content: string;
  status: AppealStatus;
  applicant_type?: "enterprise" | "carrier";
  created_at: string;
  updated_at?: string;
}

export interface AppealRequest {
  identifier: string;
  problem_type: ProblemType;
  department: string;
  content: string;
}

export type AccountDeletionStatus = "pending" | "approved" | "rejected";

export interface AccountDeletion {
  id: number;
  applicant_id?: number;
  applicant_name: string;
  applicant_type: "enterprise" | "carrier";
  reason: string;
  status: AccountDeletionStatus;
  created_at: string;
  reviewed_at?: string;
  comment?: string;
}

export interface FileInfo {
  file_id: number;
  filename: string;
  mime_type: string;
  size: number;
  created_at?: string;
}

export interface FileLimit {
  max_size_mb: number;
  allowed_extensions: string[];
}

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
  | "account_deleted"
  | "appeal_submitted"
  | "appeal_processed";

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

export const ERROR_CODE_MAP: Record<number, string> = {
  10001: "请求参数校验失败",
  10002: "请求的资源未找到",
  10003: "数据已存在",
  10101: "未登录或Token已过期",
  10102: "无权限访问",
  10103: "请求过于频繁，请稍后重试",
  10201: "当前状态不允许此操作",
  10202: "审核操作失败",
  10301: "AI 服务暂不可用",
  10302: "AI 请求超时",
  50000: "服务器内部错误",
};
