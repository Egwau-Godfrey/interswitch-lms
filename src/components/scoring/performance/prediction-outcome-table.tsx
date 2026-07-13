"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RiskLevelBadge } from "@/components/shared/status-badges";
import { CheckCircle2, XCircle, Search } from "lucide-react";
import type { AgentPredictionOutcome } from "@/lib/types/scoring";

interface Props {
  data: AgentPredictionOutcome[];
}

const OUTCOME_BADGES: Record<string, string> = {
  repaid: "bg-green-100 text-green-700",
  overdue: "bg-amber-100 text-amber-700",
  defaulted: "bg-red-100 text-red-700",
  in_progress: "bg-blue-100 text-blue-700",
};

export function PredictionOutcomeTable({ data }: Props) {
  const [search, setSearch] = React.useState("");
  const [outcomeFilter, setOutcomeFilter] = React.useState<string>("all");

  const filtered = React.useMemo(() => {
    let result = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.agent_id.toLowerCase().includes(q));
    }
    if (outcomeFilter !== "all") {
      result = result.filter((p) => p.actual_outcome === outcomeFilter);
    }
    return result;
  }, [data, search, outcomeFilter]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">Agent-Level Predictions vs Outcomes</h4>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search agent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-40 pl-8 text-xs"
            />
          </div>
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          >
            <option value="all">All Outcomes</option>
            <option value="repaid">Repaid</option>
            <option value="overdue">Overdue</option>
            <option value="defaulted">Defaulted</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Agent</th>
              <th className="text-left px-3 py-2 font-medium">Predicted</th>
              <th className="text-right px-3 py-2 font-medium">Score</th>
              <th className="text-left px-3 py-2 font-medium">Method</th>
              <th className="text-left px-3 py-2 font-medium">Outcome</th>
              <th className="text-right px-3 py-2 font-medium">Loan Amount</th>
              <th className="text-center px-3 py-2 font-medium">Correct?</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((p, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-xs">{p.agent_id}</td>
                <td className="px-3 py-2">
                  <RiskLevelBadge riskLevel={p.predicted_risk} />
                </td>
                <td className="text-right px-3 py-2 tabular-nums">
                  {(p.predicted_score * 100).toFixed(0)}%
                </td>
                <td className="px-3 py-2 capitalize text-xs">{p.scoring_method}</td>
                <td className="px-3 py-2">
                  <Badge
                    variant="secondary"
                    className={OUTCOME_BADGES[p.actual_outcome] ?? ""}
                  >
                    {p.actual_outcome}
                  </Badge>
                </td>
                <td className="text-right px-3 py-2 tabular-nums text-xs">
                  {p.loan_amount.toLocaleString()}
                </td>
                <td className="text-center px-3 py-2">
                  {p.correct_prediction ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 inline" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          No records match your filters.
        </p>
      )}

      {filtered.length > 50 && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          Showing 50 of {filtered.length} records
        </p>
      )}
    </Card>
  );
}
