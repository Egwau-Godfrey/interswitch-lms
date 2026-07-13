"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowRight, GitBranch } from "lucide-react";
import type { MLModelInfo } from "@/lib/types/scoring";

interface PipelineInfoCardProps {
  configValues: Record<string, string>;
  mlModelInfo?: MLModelInfo | null;
}

interface StageProps {
  step: number;
  title: string;
  subtitle: string;
  params: { label: string; value: string }[];
  last?: boolean;
}

function PipelineStage({ step, title, subtitle, params, last }: StageProps) {
  return (
    <div className="flex gap-4">
      {/* Step indicator + connector */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
          {step}
        </div>
        {!last && (
          <div className="w-px flex-1 bg-border min-h-8" />
        )}
      </div>

      {/* Stage content */}
      <div className="flex-1 pb-6">
        <div className="rounded-lg border p-3 space-y-2">
          <div>
            <h4 className="text-sm font-medium">{title}</h4>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          {params.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {params.map((p) => (
                <Badge key={p.label} variant="secondary" className="text-xs">
                  {p.label}: <span className="font-mono ml-1">{p.value}</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PipelineInfoCard({
  configValues,
  mlModelInfo,
}: PipelineInfoCardProps) {
  const num = (key: string, fallback = "0") =>
    configValues[key] ?? fallback;

  const mlEnabled = num("use_ml_model", "true").toLowerCase() === "true";
  const rulesEnabled = num("enable_rule_based_scoring", "true").toLowerCase() === "true";
  const blend = parseFloat(num("ml_blend_weight", "0.5")) || 0.5;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Credit Scoring Pipeline</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          This diagram shows how an agent&apos;s credit score is computed from
          raw transaction data through to a final loan limit. Each stage uses
          parameters configurable in the other tabs.
        </p>
      </div>

      <div className="pl-1">
        {/* Stage 1: Feature Extraction */}
        <PipelineStage
          step={1}
          title="Feature Extraction"
          subtitle="Extracts 24 financial features from agent transactions"
          params={[
            { label: "Lookback", value: `${num("transaction_lookback_days", "90")}d` },
            { label: "Min Tx", value: num("min_transactions_for_scoring", "10") },
          ]}
        />

        {/* Stage 2: Dual Scoring */}
        <PipelineStage
          step={2}
          title="Dual Scoring Engine"
          subtitle="Rule-based and ML model compute scores in parallel"
          params={[
            { label: "Rules", value: rulesEnabled ? "ON" : "OFF" },
            { label: "ML", value: mlEnabled ? "ON" : "OFF" },
            { label: "Factors", value: "7" },
            { label: "ML Features", value: `${mlModelInfo?.feature_count ?? 24}` },
          ]}
        />

        {/* Stage 3: Score Combination */}
        <PipelineStage
          step={3}
          title="Score Combination"
          subtitle="Blends rule-based and ML scores using the blend weight"
          params={[
            { label: "Blend", value: `${Math.round((1 - blend) * 100)}%R / ${Math.round(blend * 100)}%ML` },
          ]}
        />

        {/* Stage 4: Behavioral Penalties */}
        <PipelineStage
          step={4}
          title="Behavioral Penalties"
          subtitle="Subtracts penalties for overdue loans, defaults, auto-strikes, etc."
          params={[
            { label: "Overdue", value: `-${num("overdue_penalty_per_loan", "0.05")}/loan` },
            { label: "Default", value: `-${num("default_penalty", "0.30")}` },
            { label: "Autostrike", value: `-${num("autostrike_penalty_per_attempt", "0.08")}` },
          ]}
        />

        {/* Stage 5: Risk Classification */}
        <PipelineStage
          step={5}
          title="Risk Classification"
          subtitle="Classifies the agent into a risk tier based on thresholds"
          params={[
            { label: "Rejected", value: `< ${num("threshold_rejected", "0.30")}` },
            { label: "High", value: `< ${num("threshold_high_risk", "0.60")}` },
            { label: "Medium", value: `< ${num("threshold_medium_risk", "0.80")}` },
            { label: "Low", value: `>= ${num("threshold_medium_risk", "0.80")}` },
          ]}
        />

        {/* Stage 6: Loan Limit */}
        <PipelineStage
          step={6}
          title="Loan Limit Calculation"
          subtitle="Determines the loan amount based on risk tier and income"
          params={[
            { label: "Step", value: `${num("loan_limit_step", "5000")} UGX` },
            { label: "Income Cap", value: "3x monthly" },
          ]}
          last
        />
      </div>

      {/* Summary */}
      <div className="rounded-lg border p-3 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          Pipeline Status
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={rulesEnabled ? "default" : "secondary"}
            className={rulesEnabled ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
          >
            Rule-Based: {rulesEnabled ? "Active" : "Disabled"}
          </Badge>
          <Badge
            variant={mlEnabled ? "default" : "secondary"}
            className={mlEnabled ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
          >
            ML Model: {mlEnabled ? "Active" : "Disabled"}
          </Badge>
          {mlModelInfo && (
            <Badge variant="secondary">
              Model: {mlModelInfo.model_loaded ? "Loaded" : "Not Loaded"}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
