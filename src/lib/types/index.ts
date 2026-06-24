// ============================================
// Core Data Models for Loan Management System
// ============================================

// ============================================
// User Model (Super Admin/User/Agent)
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
  role: 'super_admin' | 'user' | 'agent' | string;
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
  role?: 'super_admin' | 'user' | 'agent' | string;
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
export type RiskLevel = 'high' | 'medium' | 'low' | 'rejected';

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
// Agent Loan Summary (for tabbed agents page)
// ============================================
export type LoanStatusFilter = 'defaulted' | 'overdue' | 'active' | 'no_loan' | 'all';

export interface AgentLoanSummary {
  // Agent identity
  id: string;
  agent_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  employer_name: string;
  employment_status: EmploymentStatus;
  monthly_income: number;
  status: AgentStatus;
  loan_limit: number | null;
  last_credit_score: number | null;
  credit_score_risk_level: RiskLevel | null;
  last_scored_at: string | null;
  created_at: string;
  updated_at: string;

  // Loan summary
  has_active_loan: boolean;
  active_loan_count: number;
  total_outstanding: number;
  total_principal: number;
  total_interest: number;
  total_penalty: number;
  total_paid: number;
  loan_status: LoanStatus | null;
  is_overdue: boolean;
  is_defaulted: boolean;
  days_overdue_max: number;
  due_date_nearest: string | null;
  disbursed_at_earliest: string | null;
}

export interface AgentLoanSummaryTotals {
  total_agents: number;
  total_outstanding: number;
  total_principal: number;
  total_interest: number;
  total_penalty: number;
  total_paid: number;
  defaulted_count: number;
  overdue_count: number;
  active_loan_count: number;
  no_loan_count: number;
}

export interface AgentLoanSummaryListResponse {
  data: AgentLoanSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  summary: AgentLoanSummaryTotals | null;
}

export interface AgentLoanSummaryParams extends ListParams {
  status?: AgentStatus;
  loan_status_filter?: LoanStatusFilter;
}

// ============================================
// Loan Product Model
// ============================================
export type LoanType = 'float' | 'pay_day';

export interface LoanProduct {
  id: string;
  name: string;
  description?: string;
  loan_type: LoanType;
  min_amount?: number;
  max_amount: number;
  interest_rate: number;
  penalty_rate: number;
  application_fee_rate?: number;
  application_fee_fixed?: number;
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
  loan_type: LoanType;
  min_amount?: number;
  max_amount: number;
  interest_rate: number;
  penalty_rate?: number;
  application_fee_rate?: number;
  application_fee_fixed?: number;
  tenure_days: number;
  grace_period_days?: number;
  requires_payroll?: boolean;
  is_default?: boolean;
  is_active?: boolean;
}

export interface LoanProductUpdate {
  name?: string;
  description?: string;
  loan_type?: LoanType;
  min_amount?: number;
  max_amount?: number;
  interest_rate?: number;
  penalty_rate?: number;
  application_fee_rate?: number;
  application_fee_fixed?: number;
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
  auto_strike_triggered: boolean;
  auto_strike_triggered_at: string | null;
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
  transaction_date?: string | null;
  credit_amount?: number | string | null;
  debit_amount?: number | string | null;
  terminal?: string | null;
  biller?: string | null;
  narration?: string | null;
  balance?: number | string | null;
  transaction_description?: string | null;
  status?: string | null;
  request_ref?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

// ============================================
// Loan Summary (for tabbed loans page)
// ============================================

/** Tab filter values for the loans page */
export type LoanStatusTab =
  | 'pending'
  | 'disbursed'
  | 'overdue'
  | 'defaulted'
  | 'cleared'
  | 'all';

/** Summary totals returned alongside paginated loan list */
export interface LoanSummaryTotals {
  total_loans: number;
  pending_count: number;
  disbursed_count: number;
  overdue_count: number;
  defaulted_count: number;
  cleared_count: number;
  total_outstanding: number;
  total_principal: number;
  total_overdue_amount: number;
}

/** Extended paginated response with summary */
export interface LoanSummaryListResponse {
  data: Loan[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  summary: LoanSummaryTotals | null;
}

/** Params for the loan summary list endpoint */
export interface LoanSummaryParams extends LoanListParams {
  search?: string;
  status_tab?: LoanStatusTab;
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
  agent_id?: string;
  timestamp: string;
}

// ============================================
// Redesigned Dashboard Types
// ============================================
export interface DashboardPeriodInfo {
  date_from: string;
  date_to: string;
  timezone: string;
  granularity: string;
}

export interface DashboardKPIs {
  total_disbursed: number;
  disbursement_count: number;
  total_collected: number;
  collection_count: number;
  active_loans_count: number;
  total_outstanding: number;
  overdue_loans_count: number;
  overdue_amount: number;
  defaulted_loans_count: number;
  defaulted_amount: number;
  default_rate: number;
  recovery_rate: number;
  collection_rate: number;
  average_loan_size: number;
}

export interface CollectionsBreakdown {
  total_collected: number;
  principal_collected: number;
  interest_collected: number;
  penalty_collected: number;
  application_fee_collected: number;
  surcharge_collected: number;
  overpayment_collected: number;
  collection_count: number;
  collection_rate: number;
  recovery_rate: number;
}

export interface DashboardRevenueSplit {
  gross_revenue: number;
  application_fee_revenue: number;
  interest_revenue: number;
  penalty_revenue: number;
  surcharge_revenue: number;
  interswitch_share_percent: number;
  qriscorp_share_percent: number;
  interswitch_amount: number;
  qriscorp_amount: number;
  accrued_revenue: number;
}

export interface LoanStatusBreakdown {
  status: string;
  count: number;
  principal_amount: number;
  outstanding_amount: number;
  percentage: number;
}

export interface DashboardTrendBucket {
  bucket: string;
  bucket_start: string;
  disbursed: number;
  collected: number;
  revenue: number;
  outstanding: number;
  active_loans: number;
  overdue_loans: number;
  defaulted_loans: number;
}

export interface DashboardOverdueAgingBucket {
  range: string;
  count: number;
  amount: number;
}

export interface DashboardPARMetrics {
  par_30: number;
  par_60: number;
  par_90: number;
  par_30_percent: number;
  par_60_percent: number;
  par_90_percent: number;
}

export interface DashboardProductPortfolio {
  product_id: string;
  product_name: string;
  total_disbursed: number;
  active_count: number;
  overdue_count: number;
  total_outstanding: number;
}

export interface DashboardPortfolioSummary {
  total_portfolio: number;
  active_loans_count: number;
  average_loan_size: number;
  by_product: DashboardProductPortfolio[];
}

export interface AtRiskAgent {
  agent_id: string;
  full_name: string;
  phone_number: string | null;
  risk_level: string | null;
  overdue_loans_count: number;
  total_outstanding: number;
  days_overdue_max: number;
  status: string;
  autostrike_attempts: number;
  autostrike_successful: number;
  autostrike_amount_recovered: number;
  last_autostrike_at: string | null;
}

export interface DashboardAutostrikeSummary {
  attempts: number;
  successful_attempts: number;
  failed_attempts: number;
  success_rate: number;
  amount_requested: number;
  amount_recovered: number;
}

export interface WalletInfo {
  balance: number;
  last_fetched_at: string | null;
  is_cached: boolean;
  error: string | null;
}

export interface DashboardOverviewResponse {
  period: DashboardPeriodInfo;
  kpis: DashboardKPIs;
  collections_breakdown: CollectionsBreakdown;
  revenue_split: DashboardRevenueSplit;
  loan_status_distribution: LoanStatusBreakdown[];
  disbursement_vs_collections: DashboardTrendBucket[];
  overdue_aging: DashboardOverdueAgingBucket[];
  par_metrics: DashboardPARMetrics;
  portfolio: DashboardPortfolioSummary;
  at_risk_agents: AtRiskAgent[];
  autostrike_summary: DashboardAutostrikeSummary;
  recent_activity: RecentActivityItem[];
}

export interface DashboardQueryParams {
  date_from?: string;
  date_to?: string;
  timezone?: string;
  granularity?: ReportGranularity;
  agent_id?: string;
  product_id?: string;
  loan_type?: string;
  status?: string;
  channel?: string;
  risk_level?: string;
}

// ============================================
// Report Summary Types
// ============================================
export type ReportGranularity = 'hour' | 'day' | '3_day' | 'week' | 'month' | 'quarter';
export type ReportExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ReportExportRequest {
  report_type: string;
  export_format: ReportExportFormat;
  date_from?: string;
  date_to?: string;
  timezone: string;
  granularity: ReportGranularity;
  filters?: Record<string, string | undefined>;
}

export interface ReportSummaryResponse {
  period: {
    date_from: string;
    date_to: string;
    timezone: string;
    granularity: ReportGranularity;
  };
  metrics: {
    total_disbursed: number;
    disbursement_count: number;
    total_collected: number;
    collection_count: number;
    total_principal_collected: number;
    total_application_fee_collected: number;
    total_interest_collected: number;
    total_penalty_collected: number;
    total_surcharge_collected: number;
    surcharge_equivalent_collected: number;
    total_revenue: number;
    interswitch_share: number;
    qriscorp_share: number;
    total_outstanding: number;
    active_loans_count: number;
    overdue_loans_count: number;
    defaulted_loans_count: number;
    overdue_amount: number;
    defaulted_amount: number;
    par_30: number;
    par_60: number;
    par_90: number;
    par_30_percent: number;
    par_60_percent: number;
    par_90_percent: number;
    collection_rate: number;
    recovery_rate: number;
    default_rate: number;
    isw_wallet_balance: number;
  };
  revenue_split: {
    gross_revenue: number;
    application_fee_revenue: number;
    interest_revenue: number;
    penalty_revenue: number;
    surcharge_revenue: number;
    surcharge_equivalent_revenue: number;
    interswitch_share_percent: number;
    qriscorp_share_percent: number;
    interswitch_amount: number;
    qriscorp_amount: number;
    accrued_revenue: number;
    accrued_interswitch_amount: number;
    accrued_qriscorp_amount: number;
  };
  portfolio: {
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
  };
  collections: {
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
  };
  risk: {
    overdue_aging: Array<{
      range: string;
      count: number;
      amount: number;
    }>;
    default_days: number;
    defaulted_count: number;
    defaulted_amount: number;
    write_off_amount: number;
    failed_autostrikes: unknown[];
  };
  autostrike: {
    attempts: number;
    successful_attempts: number;
    failed_attempts: number;
    amount_requested: number;
    amount_recovered: number;
    success_rate: number;
    failed_attempts_detail: unknown[];
  };
  agents: Array<{
    agent_id: string;
    name: string | null;
    email: string | null;
    phone_number: string | null;
    loan_count: number;
    total_disbursed: number;
    total_collected: number;
    outstanding_balance: number;
    risk_level: string | null;
    loan_limit: number;
  }>;
  buckets: Array<{
    bucket: string;
    bucket_start: string;
    disbursed: number;
    collected: number;
    revenue: number;
    outstanding: number;
    active_loans: number;
    overdue_loans: number;
    defaulted_loans: number;
  }>;
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
  rejected_count: number;
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

export interface RescoreAllResponse {
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: BulkScoreResult[];
}

// ============================================
// Bulk Agent Action Types
// ============================================

export interface BulkDeactivateRequest {
  agent_ids?: string[];
  all?: boolean;
}

export interface BulkDeactivateResult {
  agent_id: string;
  success: boolean;
  error?: string;
}

export interface BulkDeactivateResponse {
  total: number;
  deactivated: number;
  skipped: number;
  results: BulkDeactivateResult[];
}

export interface BulkActivateRequest {
  agent_ids?: string[];
  all?: boolean;
  skip_scoring?: boolean;
}

export interface BulkActivateResult {
  agent_id: string;
  success: boolean;
  scored?: boolean;
  credit_score?: number;
  risk_level?: string;
  loan_limit?: number;
  error?: string;
}

export interface BulkActivateResponse {
  total: number;
  activated: number;
  scored: number;
  skipped: number;
  results: BulkActivateResult[];
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

// ============================================
// Report Detail Types (per-tab)
// ============================================

export interface ReportPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ReportFilters {
  agent_id?: string;
  product_id?: string;
  loan_type?: string;
  status?: string;
  channel?: string;
  risk_level?: string;
  [key: string]: string | undefined;
}

export interface DisbursementDetailRow {
  loan_id: string;
  agent_id: string;
  product_id: string;
  loan_type: string;
  principal_amount: number;
  disbursed_amount: number;
  application_fee: number;
  interest_amount: number;
  penalty_amount: number;
  outstanding_balance: number;
  status: string;
  disbursed_at: string | null;
  due_date: string | null;
}

export interface DisbursementsDetailResponse {
  metrics: {
    total_disbursed: number;
    disbursement_count: number;
    average_loan_size: number;
  };
  by_product: Array<{
    product_id: string;
    product_name: string;
    total_disbursed: number;
    active_count: number;
    overdue_count: number;
    total_outstanding: number;
  }>;
  buckets: Array<{
    bucket: string;
    bucket_start: string;
    disbursed: number;
    collected: number;
    revenue: number;
    outstanding: number;
    active_loans: number;
    overdue_loans: number;
    defaulted_loans: number;
  }>;
  detail: DisbursementDetailRow[];
  pagination: ReportPagination;
}

export interface CollectionDetailRow {
  payment_id: string;
  loan_id: string;
  agent_id: string | null;
  amount: number;
  channel: string;
  payment_reference: string;
  payment_date: string | null;
  principal: number;
  application_fee: number;
  interest: number;
  penalty: number;
  surcharge: number;
}

export interface CollectionsDetailResponse {
  metrics: {
    total_collected: number;
    collection_count: number;
    total_principal_collected: number;
    total_application_fee_collected: number;
    total_interest_collected: number;
    total_penalty_collected: number;
    total_surcharge_collected: number;
    collection_rate: number;
    recovery_rate: number;
  };
  by_channel: Array<{
    channel: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  buckets: Array<{
    bucket: string;
    bucket_start: string;
    disbursed: number;
    collected: number;
    revenue: number;
    outstanding: number;
    active_loans: number;
    overdue_loans: number;
    defaulted_loans: number;
  }>;
  detail: CollectionDetailRow[];
  pagination: ReportPagination;
}

export interface RevenueDetailRow {
  payment_id: string;
  loan_id: string;
  agent_id: string;
  payment_date: string | null;
  application_fee: number;
  interest: number;
  penalty: number;
  surcharge: number;
  gross_revenue: number;
  interswitch_amount: number;
  qriscorp_amount: number;
}

export interface RevenueDetailResponse {
  metrics: ReportSummaryResponse['revenue_split'];
  buckets: Array<{
    bucket: string;
    bucket_start: string;
    disbursed: number;
    collected: number;
    revenue: number;
    outstanding: number;
    active_loans: number;
    overdue_loans: number;
    defaulted_loans: number;
  }>;
  detail: RevenueDetailRow[];
  pagination: ReportPagination;
}

export interface RiskDetailRow {
  loan_id: string;
  agent_id: string;
  loan_type: string;
  principal_amount: number;
  outstanding_balance: number;
  interest_amount: number;
  penalty_amount: number;
  status: string;
  is_overdue: boolean;
  days_overdue: number;
  disbursed_at: string | null;
  due_date: string | null;
}

export interface RiskDetailResponse {
  metrics: {
    overdue_loans_count: number;
    overdue_amount: number;
    defaulted_loans_count: number;
    defaulted_amount: number;
    par_30_percent: number;
    par_60_percent: number;
    par_90_percent: number;
    default_rate: number;
    default_days: number;
  };
  overdue_aging: Array<{ range: string; count: number; amount: number }>;
  default_events: unknown[];
  detail: RiskDetailRow[];
  pagination: ReportPagination;
}

export interface AutostrikeDetailRow {
  id: string;
  loan_id: string;
  agent_id: string;
  request_reference: string;
  requested_principal: number;
  requested_surcharge: number;
  external_response_code: string | null;
  external_response_message: string | null;
  payment_recorded: boolean;
  payment_reference: string | null;
  status: string;
  error: string | null;
  attempted_at: string | null;
}

export interface AutostrikeDetailResponse {
  metrics: {
    attempts: number;
    successful_attempts: number;
    failed_attempts: number;
    amount_requested: number;
    amount_recovered: number;
    success_rate: number;
  };
  detail: AutostrikeDetailRow[];
  pagination: ReportPagination;
}

export interface AgentsDetailResponse {
  metrics: {
    agent_count: number;
    total_disbursed: number;
    total_collected: number;
    total_outstanding: number;
  };
  detail: Array<{
    agent_id: string;
    name: string | null;
    email: string | null;
    phone_number: string | null;
    loan_count: number;
    total_disbursed: number;
    total_collected: number;
    outstanding_balance: number;
    risk_level: string | null;
    loan_limit: number;
  }>;
  pagination: ReportPagination;
}

export type ReportDetailType =
  | 'summary'
  | 'disbursements'
  | 'collections'
  | 'revenue'
  | 'risk'
  | 'autostrike'
  | 'agents';

// ============================================
// Agent Whitelist Types
// ============================================

export interface WhitelistEntry {
  id: string;
  agent_id: string;
  is_whitelisted: boolean;
  whitelisted_by: string | null;
  whitelisted_at: string | null;
  revoked_by: string | null;
  revoked_at: string | null;
  notes: string | null;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  status: string | null;
  loan_limit: string | null;
  last_credit_score: string | null;
  credit_score_risk_level: RiskLevel | null;
}

export interface WhitelistListResponse {
  data: WhitelistEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface NonWhitelistedAgent {
  agent_id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  status: string;
  loan_limit: string;
  last_credit_score: string | null;
  credit_score_risk_level: RiskLevel | null;
}

export interface NonWhitelistedListResponse {
  data: NonWhitelistedAgent[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface WhitelistStatus {
  agent_id: string;
  is_whitelisted: boolean;
  whitelist_mode_enabled: boolean;
  entry: WhitelistEntry | null;
}

export interface WhitelistAddRequest {
  agent_id: string;
  notes?: string;
}

export interface WhitelistBulkAddRequest {
  agent_ids: string[];
  notes?: string;
}

export interface WhitelistBulkRemoveRequest {
  agent_ids: string[];
}

export interface WhitelistBulkResult {
  agent_id: string;
  success: boolean;
  error?: string;
  id?: string;
}

export interface WhitelistBulkResponse {
  total: number;
  succeeded: number;
  failed: number;
  results: WhitelistBulkResult[];
}

export interface WhitelistListParams extends ListParams {
  // reuses search, page, page_size
}
