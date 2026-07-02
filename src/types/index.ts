/**
 * 类型定义模块
 *
 * 本项目使用的所有 TypeScript 类型定义，按功能模块分组：
 * 1. 通用类型：ApiResponse、Pagination、PaginatedData
 * 2. 用户相关：UserRole、UserInfo、LoginRequest、RegisterRequest、AuthData
 * 3. 审核相关：AuditStatus、AuditAction、AuditRequestBody
 * 4. 企业相关：EnterpriseInfo
 * 5. 载体相关：CarrierInfo
 * 6. 入驻相关：IncubationApplyRequest、IncubationRecord
 * 7. 变更相关：ChangeType、ChangeRecord、ChangeApplyRequest
 * 8. 政策相关：PolicyTemplate、Policy、PolicyApplication
 * 9. 绩效考核：PerformanceTemplate、PerformanceCampaign、PerformanceSubmission
 * 10. 申诉相关：ProblemType、Appeal
 * 11. 账号注销：AccountDeletion
 * 12. 文件相关：FileInfo、FileLimit
 * 13. 通知相关：NotificationType、Notification
 * 14. 错误码：ERROR_CODE_MAP
 */

/** 通用 API 响应结构：所有 API 接口的返回类型统一包装 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/** 分页参数：页码和每页条数 */
export interface PaginationParams {
  page: number;
  page_size: number;
}

/** 分页数据：列表 + 总数 + 当前页码 + 每页条数 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}

/** 分页响应：通用 API 响应包装分页数据 */
export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

/** 用户角色：企业、载体、政务 */
export type UserRole = "enterprise" | "carrier" | "government";

/** 用户信息：登录后从 token 中解析的用户基本信息 */
export interface UserInfo {
  id: number;
  user_id?: number;
  role: UserRole;
  phone?: string;
  email?: string;
  credit_code?: string;
  name?: string;
  department?: string;
}

/** 登录请求：企业用信用代码，载体/政务用手机号 */
export interface LoginRequest {
  credential: string;
  password: string;
  role: UserRole;
}

/** 注册请求：区分企业/载体，字段不同 */
export interface RegisterRequest {
  password: string;
  role: UserRole;
  phone: string;
  email?: string;
  enterprise_name?: string;
  enterprise_credit_code?: string;
  enterprise_industry?: string;
  enterprise_scale?: string;
  enterprise_address?: string;
  carrier_name?: string;
  carrier_type?: string;
  carrier_area?: string;
  gov_name?: string;
  gov_department?: string;
}

/** 认证数据：登录成功后返回的 token 和用户信息 */
export interface AuthData {
  token: string;
  user: UserInfo;
}

/** 审核状态：贯穿入驻/变更/申报全流程 */
export type AuditStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "returned"
  | "carrier_review"
  | "gov_review";

/** 审核操作：通过、拒绝、退回 */
export type AuditAction = "approve" | "reject" | "return";

/** 审核请求体：操作 + 意见 */
export interface AuditRequestBody {
  action: AuditAction;
  comment: string;
}

/** 企业信息：企业端基本信息，政务端可查看/编辑 */
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

/** 载体信息：孵化器/众创空间基本信息 */
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

/** 入驻申请请求：企业申请入驻载体 */
export interface IncubationApplyRequest {
  carrier_id: number;
  incubate_start: string;
  incubate_end: string;
  agreement_file_id: number;
}

/** 入驻记录：企业入驻载体的全流程状态 */
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

/** 变更类型：企业信息可变更的项目 */
export type ChangeType =
  | "企业名称"
  | "统一社会信用代码"
  | "所属行业"
  | "企业规模"
  | "企业地址"
  | "法定代表人"
  | "入孵协议文件";

/** 变更记录：企业信息变更申请及审核状态 */
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

/** 变更申请请求：提交企业信息变更 */
export interface ChangeApplyRequest {
  change_type: ChangeType;
  change_content: string;
  new_value: Record<string, unknown>;
}

/** 政策模板：政务端创建的表单模板 */
export interface PolicyTemplate {
  id: number;
  name: string;
  description: string;
  form_schema: Record<string, unknown>;
  target_role: UserRole | "both";
}

/** 政策：发布的政策申报项目 */
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

/** 匹配度：政策与企业条件的匹配程度 */
export type MatchLevel = "high" | "partial" | "none" | "unknown";

/** 政策材料：申报所需材料清单 */
export interface PolicyMaterial {
  name: string;
  file_id: number;
  necessity: "necessary" | "optional" | string;
}

/** 政策申报：企业/载体提交的政策申请 */
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

/** 绩效考核模板：年度考核表单 */
export interface PerformanceTemplate {
  id: number;
  name: string;
  year: number;
  form_schema: Record<string, unknown>;
}

/** 绩效考核活动：年度考核批次 */
export interface PerformanceCampaign {
  id: number;
  template_id: number;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

/** 绩效考核提交：载体提交的年度考核数据 */
export interface PerformanceSubmission {
  id: number;
  campaign_id: number;
  carrier_id: number;
  form_data: Record<string, unknown>;
  score?: number;
  status: AuditStatus;
  comment?: string;
}

/** 问题类型：企业/载体反馈的问题分类 */
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

/** 申诉状态：待处理/已处理 */
export type AppealStatus = "pending" | "processed";

/** 申诉：企业/载体反馈的问题记录 */
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

/** 申诉请求：提交问题反馈 */
export interface AppealRequest {
  identifier: string;
  problem_type: ProblemType;
  department: string;
  content: string;
}

/** 账号注销状态：待审核/已通过/已拒绝 */
export type AccountDeletionStatus = "pending" | "approved" | "rejected";

/** 账号注销：企业/载体申请注销的记录 */
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

/** 文件信息：上传后的文件元数据 */
export interface FileInfo {
  file_id: number;
  name?: string;
  filename: string;
  mime_type: string;
  size: number;
  uploaded_at?: string;
  created_at?: string;
}

/** 文件限制：上传文件大小和类型限制 */
export interface FileLimit {
  max_size_mb: number;
  allowed_extensions: string[];
}

/** 通知类型：系统推送的通知分类 */
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

/** 通知：用户收到的系统消息 */
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
