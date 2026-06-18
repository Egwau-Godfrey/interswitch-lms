// ============================================
// Core Data Models for Loan Management System
// ============================================

// ============================================
// User Model (Admin/Staff)
// ============================================
export interface User {
  id: string;
  username: string;
  email: string;
  agent_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_active: boolean;
  is_admin: boolean;
  role: 'super_admin' | 'manager' | 'agent' | string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  agent_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  password: string;
  is_admin?: boolean;
  is_active?: boolean;
  role?: 'super_admin' | 'manager' | 'agent' | string;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_admin?: boolean;
  is_active?: boolean;
  role?: string;
  password?: string;
}

// ============================================
// Agent Model (Loan Applicants/Borrowers)
// ============================================
export type EmploymentStatus = 'full_time' | 'part_time' | 'contract' | 'self_employed' | 'unemployed';
export type AgentStatus = 'pending' | 'active' | 'inactive' | 'suspended' | 'blacklisted';
export type RiskLevel = 'high' | 'medium' | 'low';

export interface Agent {
  id: string;
  agent_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  national_id_number: string;
  employer_name: string;
  employment_status: EmploymentStatus;
  monthly_income: number;
  consents_to_credit_check: boolean;
  default_product_id: string | null;
  status: AgentStatus;
  created_at: string;
  updated_at: string;
  loan_limit?: number | null;
  last_credit_score?: number | null;
  credit_score_risk_level?: RiskLevel | null;
  last_scored_at?: string | null;
}

export interface AgentCreate {
  agent_id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  national_id_number?: string;
  employer_name?: string;
  employment_status?: EmploymentStatus;
  monthly_income?: number;
  consents_to_credit_check?: boolean;
}

export interface AgentUpdate {
  full_name?: string;
  email?: string;
  phone_number?: string;
  national_id_number?: string;
  employer_name?: string;
  employment_status?: EmploymentStatus;
  monthly_income?: number;
  consents_to_credit_check?: boolean;
  status?: AgentStatus;
  default_product_id?: string | null;
}

// ============================================
// Loan Product Model
// ============================================
export interface LoanProduct {
  id: string;
  name: string;
  description?: string;
  min_amount?: number;
  max_amount: number;
  interest_rate: number;
  penalty_rate: number;
  tenure_days: number;
  grace_period_days?: number;
  requires_payroll?: boolean;
  is_default?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoanProductCreate {
  name: string;
  description?: string;
  max_amount: number;
  interest_rate: number;
  penalty_rate?: number;
  tenure_days: number;
  grace_period_days?: number;
  requires_payroll?: boolean;
  is_default?: boolean;
  is_active?: boolean;
}

export interface LoanProductUpdate {
  name?: string;
  description?: string;
  max_amount?: number;
  interest_rate?: number;
  penalty_rate?: number;
  tenure_days?: number;
  grace_period_days?: number;
  requires_payroll?: boolean;
  is_default?: boolean;
  is_active?: boolean;
}

// ============================================
// Loan Model
// ============================================
export type LoanStatus = 'pending' | 'approved' | 'disbursed' | 'overdue' | 'defaulted' | 'cleared' | 'failed';

export interface Loan {
  id: string;
  applicant_id: string | null;
  agent_id: string;
  product_id: string | null;
  loan_type: string;
  principal_amount: number;
  disbursed_amount: number | null;
  application_fee: number;
  interest_rate: number;
  penalty_rate: number;
  interest_amount: number;
  penalty_amount: number;
  total_paid: number;
  outstanding_balance: number;
  tenure_days: number;
  due_date: string;
  disbursed_at: string | null;
  cleared_at: string | null;
  status: LoanStatus;
  is_overdue: boolean;
  days_overdue: number;
  disbursement_reference: string | null;
  penalty_applied: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoanCreate {
  agent_id: string;
  product_id: string;
  principal_amount: number;
}

export interface LoanApplication {
  agent_id: string;
  product_id: string;
  principal_amount: number;
}

// ============================================
// Loan Payment Model
// ============================================
export type PaymentStatus = 'posted' | 'pending' | 'failed' | 'reversed';
export type PaymentChannel = 'bank_transfer' | 'mobile_money' | 'card' | 'wallet' | 'cash' | 'auto_debit';

export interface LoanPayment {
  id: string;
  loan_id: string;
  amount: number;
  payment_reference: string;
  channel: PaymentChannel;
  status: PaymentStatus;
  payment_date: string;
  created_at: string;
}

export interface PaymentCreate {
  loan_id: string;
  amount: number;
  payment_reference: string;
  channel?: PaymentChannel;
}

// ============================================
// Agent Transaction Model (Historical)
// ============================================
export interface AgentTransaction {
  id: string;
  agent_id: string;
  transaction_date: string;
  credit_amount: number;
  debit_amount: number;
  terminal: string;
  biller: string;
  narration: string;
  balance: number;
  status: string;
  request_ref: string;
}

// ============================================
// API Client Model
// ============================================
export interface ApiClient {
  id: string;
  name: string;
  api_key: string;
  allowed_ips: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface ApiClientCreate {
  name: string;
  allowed_ips?: string[];
}

// ============================================
// Response Types
// ============================================
export interface LoanBalanceResponse {
  agent_id: string;
  has_loan: boolean;
  loan_id: string | null;
  status: LoanStatus | null;
  principal_amount: number;
  interest_rate: number;
  interest: number;
  penalty: number;
  surcharge: number;
  loan_balance: number;
  total_paid: number;
  disbursed_at: string | null;
  due_date: string | null;
  tenure_days: number;
  days_since_disbursement: number;
  is_overdue: boolean;
  days_overdue: number;
  is_cleared: boolean;
  product_id: string | null;
  product_name: string | null;
}

export interface LoanDetailResponse {
  loan: Loan;
  agent: Agent;
  product: LoanProduct;
  payments: LoanPayment[];
}

export interface LoanStatementEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
}

export interface LoanStatementResponse {
  loan_id: string;
  agent_id: string;
  entries: LoanStatementEntry[];
  opening_balance: number;
  closing_balance: number;
  debug_info?: any;
}

export interface EligibleProductsResponse {
  agent_id: string;
  eligible_products: LoanProduct[];
}

// ============================================
// Pagination & List Types
// ============================================
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ListParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: any;
}

export interface LoanListParams extends ListParams {
  status?: LoanStatus;
  product_id?: string;
  agent_id?: string;
  is_overdue?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface AgentListParams extends ListParams {
  status?: AgentStatus;
  has_active_loan?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface PaymentListParams extends ListParams {
  loan_id?: string;
  agent_id?: string;
  channel?: PaymentChannel;
  date_from?: string;
  date_to?: string;
}

// ============================================
// Dashboard/Analytics Types
// ============================================
export interface DashboardStats {
  total_active_loans: number;
  total_disbursed: number;
  total_collections: number;
  total_interest_earned: number;
  total_overdue: number;
  overdue_count: number;
  default_rate: number;
  recovery_rate: number;
  isw_wallet_balance: number;
  disbursement_trend: DisbursementTrendData[];
  loan_status_distribution: LoanStatusDistribution[];
  overdue_aging: OverdueAgingData[];
  recent_activity: RecentActivityItem[];
}

export interface DisbursementTrendData {
  month: string;
  disbursed: number;
  collected: number;
}

export interface CollectionTrendData {
  month: string;
  disbursed: number;
  collected: number;
}

export interface LoanStatusDistribution {
  status: string;
  count: number;
  amount: number;
}

export interface OverdueAgingData {
  range: string;
  count: number;
  amount: number;
}

export interface RecentActivityItem {
  id: string;
  type: string;
  description: string;
  amount?: number;
  timestamp: string;
}

// ============================================
// Report Types
// ============================================
export interface PortfolioReport {
  par_30: number;
  par_60: number;
  par_90: number;
  total_portfolio: number;
  active_loans_count: number;
  average_loan_size: number;
  by_product: Array<{
    product_id: string;
    product_name: string;
    total_disbursed: number;
    active_count: number;
    overdue_count: number;
    total_outstanding: number;
  }>;
}

export interface CollectionsReport {
  total_collected: number;
  collection_rate: number;
  by_channel: Array<{
    channel: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  by_period: Array<{
    period: string;
    amount: number;
    count: number;
  }>;
}

export interface DisbursementReport {
  total_disbursed: number;
  loan_count: number;
  average_amount: number;
  by_product: Array<{
    product_id: string;
    product_name: string;
    total_disbursed: number;
    active_count: number;
    overdue_count: number;
    total_outstanding: number;
  }>;
  by_period: Array<{
    period: string;
    amount: number;
    count: number;
  }>;
}

// ============================================
// Utility Types
// ============================================
export interface ApiError {
  message: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export type StatusColorMap = {
  [key in LoanStatus]: string;
};

export const LOAN_STATUS_COLORS: StatusColorMap = {
  pending: 'yellow',
  approved: 'blue',
  disbursed: 'green',
  cleared: 'emerald',
  overdue: 'orange',
  defaulted: 'red',
  failed: 'gray',
};

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  disbursed: 'Disbursed',
  cleared: 'Cleared',
  overdue: 'Overdue',
  defaulted: 'Defaulted',
  failed: 'Failed',
};

// ============================================
// Credit Scoring Dashboard Types
// ============================================

export interface ScoredAgent {
  id: string;
  agent_id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  status: AgentStatus;
  loan_limit: number;
  last_credit_score: number;      // 0.0–1.0
  score_percent: number;          // 0.0–100.0 (derived by backend)
  credit_score_risk_level: RiskLevel;
  last_scored_at: string;         // ISO datetime
}

export interface CreditScoreHistoryEntry {
  id: string;
  agent_id: string;
  credit_score: number;
  risk_level: RiskLevel;
  loan_limit: number;
  confidence: number;
  scoring_method: 'rules' | 'ml' | 'hybrid';
  trigger_type: 'manual' | 'webhook' | 'scheduled';
  transaction_count: number;
  created_at: string;
  component_scores?: {
    rule_score?: number;
    ml_score?: number;
  } | null;
}

export interface ScoringStats {
  total_scored: number;
  low_risk_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  avg_score: number;
  avg_loan_limit: number;
  total_loan_exposure: number;
}

export interface ScoredAgentListParams extends ListParams {
  risk_level?: RiskLevel;
  score_min?: number;
  score_max?: number;
  scored_from?: string;
  scored_to?: string;
}

export interface BulkScoreRequest {
  agent_ids: string[];
}

export interface BulkScoreResult {
  agent_id: string;
  success: boolean;
  score?: number;
  loan_limit?: number;
  risk_level?: RiskLevel;
  error?: string;
}

export interface BulkScoreResponse {
  total: number;
  succeeded: number;
  failed: number;
  results: BulkScoreResult[];
}

// ============================================
// RBAC — Permission Grants & Audit Log Types
// ============================================

export type GrantScope = 'system' | 'tab';

export type AuditEventType =
  | 'grant_created'
  | 'grant_revoked'
  | 'grant_expired'
  | 'write_action'
  | 'unauthorized_attempt'
  | 'route_blocked';

export const ADMIN_TABS = [
  'agents',
  'loans',
  'scoring',
  'loan-products',
  'payments',
  'reports',
  'users',
  'settings',
  'api-management',
] as const;
export type AdminTab = typeof ADMIN_TABS[number];

export interface PermissionGrant {
  id: string;
  granted_to_user_id: string;
  granted_to_user: {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  granted_by_user: {
    username: string;
    first_name: string;
    last_name: string;
  };
  scope: GrantScope;
  tab_name: AdminTab | null;
  is_permanent: boolean;
  expires_at: string | null;       // ISO datetime
  is_active: boolean;
  revoked_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  event_type: AuditEventType;
  actor_user_id: string;
  actor_role: string;
  actor_name?: string;             // joined from users table
  target_user_id: string | null;
  grant_id: string | null;
  tab_name: string | null;
  scope: string | null;
  http_method: string | null;
  endpoint: string | null;
  detail: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface CreateGrantRequest {
  granted_to_user_id: string;
  scope: GrantScope;
  tab_name?: AdminTab;
  is_permanent: boolean;
  expires_at?: string;             // ISO datetime, required when is_permanent=false
  notes?: string;
}

export interface GrantListParams extends ListParams {
  user_id?: string;
  tab_name?: string;
  is_active?: boolean;
  scope?: GrantScope;
}

export interface AuditLogParams extends ListParams {
  event_type?: AuditEventType;
  actor_user_id?: string;
  tab_name?: string;
  date_from?: string;
  date_to?: string;
}
