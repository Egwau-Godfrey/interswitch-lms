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

// ============================================
// ML Model Info Types
// ============================================

/** A single feature consumed by the ML model. */
export interface MLModelFeature {
  name: string;
  description: string;
  category: string;
}

/** ML model metadata returned by /scoring/config/ml-model-info. */
export interface MLModelInfo {
  model_path: string;
  model_exists: boolean;
  model_type: string;
  algorithm: string;
  n_estimators: number;
  max_depth: number;
  min_samples_split: number;
  min_samples_leaf: number;
  scaler: string;
  prediction_method: string;
  feature_count: number;
  features: MLModelFeature[];
  training_data_type: string;
  model_loaded: boolean;
  model_size_bytes: number | null;
  last_modified: string | null;
  n_estimators_actual?: number;
  classes_?: number[];
  n_features_in_?: number;
  load_error?: string;
}

/** Feature extraction config keys with display labels. */
export const FEATURE_EXTRACTION_KEYS: { key: string; label: string; help: string }[] = [
  {
    key: 'min_transactions_for_scoring',
    label: 'Minimum Transactions for Scoring',
    help: 'Agents with fewer transactions than this cannot be scored. Higher = requires more history before scoring.',
  },
  {
    key: 'transaction_lookback_days',
    label: 'Transaction Lookback (Days)',
    help: 'How far back the engine looks at transactions. Higher = more historical data but slower scoring.',
  },
  {
    key: 'min_monthly_income_threshold',
    label: 'Minimum Monthly Income (UGX)',
    help: 'Agents below this monthly income are flagged. Higher = stricter income requirements.',
  },
  {
    key: 'min_avg_balance_ratio',
    label: 'Minimum Avg Balance Ratio',
    help: 'Agents whose average balance is below this fraction of income are penalized. Higher = requires keeping more money. Range 0–1.',
  },
];

/** ML model setting keys with display labels. */
export const ML_SETTING_KEYS: { key: string; label: string; help: string }[] = [
  {
    key: 'use_ml_model',
    label: 'Enable ML Model',
    help: 'When true, the trained ML model contributes to the score. Disable to use rules only.',
  },
  {
    key: 'enable_rule_based_scoring',
    label: 'Enable Rule-Based Scoring',
    help: 'When true, the rule-based engine contributes to the score. Disable to use ML only.',
  },
  {
    key: 'ml_blend_weight',
    label: 'ML Blend Weight',
    help: '0.0 = 100% rule-based, 0.5 = 50/50 blend, 1.0 = 100% ML. Higher = ML model has more influence. Range 0–1.',
  },
  {
    key: 'ml_model_path',
    label: 'ML Model File Path',
    help: 'Filesystem path to the pickled ML model. Change if you deploy a new model.',
  },
];

/** Loan behavior setting keys with display labels. */
export const BEHAVIOR_SETTING_KEYS: { key: string; label: string; help: string }[] = [
  {
    key: 'auto_strike_days',
    label: 'Auto-Strike Delay (Days)',
    help: 'After this many days post-penalty, the system attempts to auto-deduct from the agent\'s wallet. 0 = immediate.',
  },
  {
    key: 'auto_strike_percentage',
    label: 'Auto-Strike Recovery (%)',
    help: 'What portion of the outstanding balance to attempt recovering via auto-strike. 100 = full amount.',
  },
  {
    key: 'default_days',
    label: 'Default Threshold (Days Overdue)',
    help: 'After this many days overdue, the loan is marked as defaulted and the agent receives a severe score penalty. Lower = faster default.',
  },
];

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
