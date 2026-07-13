"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Copy,
  Cpu,
} from "lucide-react";
import { MLFeatureReference } from "./ml-feature-reference";
import type { MLModelInfo } from "@/lib/types/scoring";

interface MLModelSettingsEditorProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
  mlModelInfo?: MLModelInfo | null;
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function MLModelSettingsEditor({
  values,
  onChange,
  disabled,
  mlModelInfo,
}: MLModelSettingsEditorProps) {
  const mlEnabled = (values["use_ml_model"] ?? "true").toLowerCase() === "true";
  const rulesEnabled = (values["enable_rule_based_scoring"] ?? "true").toLowerCase() === "true";
  const blend = parseFloat(values["ml_blend_weight"] ?? "0.5") || 0.5;
  const bothDisabled = !mlEnabled && !rulesEnabled;

  const info = mlModelInfo;

  return (
    <div className="space-y-6">
      {/* ── Model Controls (editable) ── */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Model Controls</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rule-based toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5 pr-4">
              <Label htmlFor="enable_rules" className="text-sm font-medium">
                Rule-Based Engine
              </Label>
              <p className="text-xs text-muted-foreground">
                Uses 7 weighted financial factors to compute a score.
              </p>
            </div>
            <Switch
              id="enable_rules"
              checked={rulesEnabled}
              onCheckedChange={(v) =>
                onChange("enable_rule_based_scoring", v ? "true" : "false")
              }
              disabled={disabled}
            />
          </div>

          {/* ML model toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5 pr-4">
              <Label htmlFor="enable_ml" className="text-sm font-medium">
                ML Model
              </Label>
              <p className="text-xs text-muted-foreground">
                Uses a trained RandomForest model to predict creditworthiness.
              </p>
            </div>
            <Switch
              id="enable_ml"
              checked={mlEnabled}
              onCheckedChange={(v) =>
                onChange("use_ml_model", v ? "true" : "false")
              }
              disabled={disabled}
            />
          </div>
        </div>

        {/* Blend weight slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Score Blend Weight</Label>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={blend.toFixed(2)}
              onChange={(e) => onChange("ml_blend_weight", e.target.value)}
              disabled={disabled || !mlEnabled || !rulesEnabled}
              className="w-20 h-8 text-right tabular-nums"
            />
          </div>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[blend]}
            onValueChange={([v]) => onChange("ml_blend_weight", v.toFixed(2))}
            disabled={disabled || !mlEnabled || !rulesEnabled}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Rule-Based ({Math.round((1 - blend) * 100)}%)</span>
            <span>ML Model ({Math.round(blend * 100)}%)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Controls how much each engine contributes to the final score.
            0.0 = 100% rules, 0.5 = equal blend, 1.0 = 100% ML.
          </p>
        </div>

        {/* Warnings */}
        {bothDisabled && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Both scoring engines are disabled. No scores will be computed.
              Enable at least one engine.
            </AlertDescription>
          </Alert>
        )}
        {!bothDisabled && mlEnabled && !rulesEnabled && (
          <Alert>
            <AlertDescription>
              Only the ML model is active. Scores will be 100% ML-based with no
              rule-based contribution.
            </AlertDescription>
          </Alert>
        )}
        {!bothDisabled && rulesEnabled && !mlEnabled && (
          <Alert>
            <AlertDescription>
              Only the rule-based engine is active. Scores will be 100%
              rule-based with no ML contribution.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Separator />

      {/* ── Model Details (read-only) ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Model Details</h4>
        </div>

        {!info ? (
          <p className="text-sm text-muted-foreground">
            Loading model information...
          </p>
        ) : (
          <>
            {/* Status badge */}
            <div className="flex items-center gap-2">
              {info.model_loaded ? (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Model Loaded
                </Badge>
              ) : info.model_exists ? (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  File Found — Load Error
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                  <XCircle className="h-3 w-3 mr-1" />
                  Model Not Found
                </Badge>
              )}
            </div>

            {info.load_error && (
              <Alert variant="destructive">
                <AlertDescription className="font-mono text-xs">
                  {info.load_error}
                </AlertDescription>
              </Alert>
            )}

            {/* Metadata grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <InfoCell label="Algorithm" value={info.algorithm} />
              <InfoCell label="Model Type" value={info.model_type} />
              <InfoCell
                label="Estimators"
                value={
                  info.n_estimators_actual
                    ? `${info.n_estimators_actual} trees`
                    : `${info.n_estimators} trees`
                }
              />
              <InfoCell label="Max Depth" value={String(info.max_depth)} />
              <InfoCell
                label="Min Samples Split"
                value={String(info.min_samples_split)}
              />
              <InfoCell
                label="Min Samples Leaf"
                value={String(info.min_samples_leaf)}
              />
              <InfoCell label="Scaler" value={info.scaler} />
              <InfoCell
                label="Prediction Method"
                value={info.prediction_method}
              />
              <InfoCell
                label="Feature Count"
                value={`${info.feature_count} features`}
              />
              <InfoCell
                label="Training Data"
                value={info.training_data_type}
              />
              <InfoCell
                label="Model File Size"
                value={formatBytes(info.model_size_bytes)}
              />
              <InfoCell
                label="Last Modified"
                value={formatDate(info.last_modified)}
              />
              {info.n_features_in_ != null && (
                <InfoCell
                  label="Features (actual)"
                  value={String(info.n_features_in_)}
                />
              )}
              {info.classes_ && (
                <InfoCell
                  label="Classes"
                  value={info.classes_.join(", ")}
                />
              )}
            </div>

            {/* Model file path */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Model File Path (read-only)
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-1.5 text-xs font-mono">
                  {info.model_path}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(info.model_path);
                  }}
                  className="shrink-0 rounded-md border p-1.5 hover:bg-muted transition-colors"
                  title="Copy path"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Feature reference (collapsible) */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
                <ChevronDown className="h-4 w-4" />
                ML Model Features ({info.features.length})
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <MLFeatureReference features={info.features} />
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}
