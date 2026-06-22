// ============================================
// Scoring Configuration & Breakdown Types
// ============================================

/** A single scoring config entry stored in the DB. */
export interface ScoringConfigEntry {
  id: string;
  key: string;
  value: string;
  description: string | null;
  help_text: string | null;
  category: string;
  is_sensitive: boolean;
  updated_at: string | null;
  updated_by: string | null;
}

/** Config entries grouped by category for the UI. */
export interface ScoringConfigGroup {
  category: string;
  label: string;
  description: string | null;
  entries: ScoringConfigEntry[];
}

/** Per-factor detail in the score breakdown. */
export interface FactorDetail {
  score: number;       // 0.0–1.0
  weight: number;      // 0.0–1.0
  contribution: number; // score * weight
}

/** Source breakdown: where the score came from. */
export interface SourceBreakdown {
  interswitch_data: number;   // percentage 0–100
  payment_behavior: number;   // percentage 0–100
}

/** Penalties applied to the score. */
export interface PenaltyBreakdown {
  overdue?: number;
  autostrike?: number;
  default?: number;
  negative_balance?: number;
  large_debit?: number;
  low_c2d_ratio?: number;
  [key: string]: number | undefined;
}

/** Loan repayment behavior for an agent. */
export interface AgentBehavior {
  agent_id: string;
  overdue_loan_count: number;
  autostrike_count: number;
  autostrike_successful: number;
  default_count: number;
  total_loans_taken: number;
  on_time_repayment_count: number;
  on_time_repayment_ratio: number;
}

/** Full score breakdown returned by /scoring/agents/{id}/breakdown. */
export interface ScoreBreakdown {
  agent_id: string;
  credit_score: number;
  risk_level: string;
  loan_limit: number;
  scoring_method: string;
  confidence: number;
  created_at: string;
  rule_score: number;
  ml_score: number;
  final_score: number;
  factors: Record<string, FactorDetail>;
  penalties: PenaltyBreakdown;
  penalty_total: number;
  source_breakdown: SourceBreakdown;
  behavior: AgentBehavior;
}

/** Response from resetting config. */
export interface ScoringConfigResetResponse {
  success: boolean;
  message: string;
  reset_count: number;
}

/** Factor display metadata for the UI. */
export const FACTOR_LABELS: Record<string, string> = {
  income_stability: 'Income Stability',
  credit_debit_ratio: 'Credit/Debit Ratio',
  balance_trend: 'Balance Trend',
  transaction_frequency: 'Transaction Frequency',
  avg_balance: 'Average Balance',
  max_transaction: 'Max Transaction',
  consistency: 'Consistency',
};

/** Category display labels. */
export const CONFIG_CATEGORY_LABELS: Record<string, string> = {
  weights: 'Factor Weights',
  thresholds: 'Risk Thresholds',
  limits: 'Loan Limits',
  penalties: 'Behavioral Penalties',
  extraction: 'Feature Extraction',
  ml: 'ML Model Settings',
  behavior: 'Loan Behavior Settings',
  general: 'General',
};
