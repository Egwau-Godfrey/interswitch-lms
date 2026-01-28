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
}

export interface UserUpdate {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_admin?: boolean;
  is_active?: boolean;
  password?: string;
}

// ============================================
// Agent Model (Loan Applicants/Borrowers)
// ============================================
export type EmploymentStatus = 'full_time' | 'part_time' | 'contract' | 'self_employed' | 'unemployed';
export type AgentStatus = 'pending' | 'active' | 'inactive' | 'suspended' | 'blacklisted';

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
  agent_id: string;
  product_id: string;
  principal_amount: number;
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
  total_overdue: number;
  overdue_count: number;
  default_rate: number;
  recovery_rate: number;
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
  amount: number;
  timestamp: string;
}

// ============================================
// Report Types
// ============================================
export interface PortfolioReport {
  total_loans: number;
  total_disbursed: number;
  total_outstanding: number;
  total_collected: number;
  loans_by_status: Record<LoanStatus, { count: number; value: number }>;
  par_30: number;
  par_60: number;
  par_90: number;
  average_loan_size: number;
  average_tenure: number;
}

export interface CollectionsReport {
  period: string;
  total_collections: number;
  collection_count: number;
  collection_efficiency: number;
  top_performing_agents: Array<{
    agent_id: string;
    agent_name: string;
    total_collected: number;
    loans_cleared: number;
  }>;
}

export interface DisbursementReport {
  period: string;
  total_disbursed: number;
  disbursement_count: number;
  by_product: Array<{
    product_id: string;
    product_name: string;
    amount: number;
    count: number;
  }>;
  average_processing_time: number;
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
