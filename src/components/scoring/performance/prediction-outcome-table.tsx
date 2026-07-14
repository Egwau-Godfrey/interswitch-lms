"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { RiskLevelBadge } from "@/components/shared/status-badges";
import { CheckCircle2, XCircle, Search, ArrowUpDown } from "lucide-react";
import type { AgentPredictionOutcome } from "@/lib/types/scoring";

interface Props {
  data: AgentPredictionOutcome[];
}

const OUTCOME_BADGES: Record<string, string> = {
  repaid: "bg-green-100 text-green-700",
  overdue: "bg-amber-100 text-amber-700",
  defaulted: "bg-red-100 text-red-700",
  recovered_via_autostrike: "bg-purple-100 text-purple-700",
  in_progress: "bg-blue-100 text-blue-700",
};

type SortField = "predicted_score" | "loan_amount" | "days_to_repay" | "agent_id";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

export function PredictionOutcomeTable({ data }: Props) {
  const [search, setSearch] = React.useState("");
  const [outcomeFilter, setOutcomeFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [sortField, setSortField] = React.useState<SortField>("agent_id");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  const filtered = React.useMemo(() => {
    let result = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.agent_id.toLowerCase().includes(q));
    }
    if (outcomeFilter !== "all") {
      result = result.filter((p) => p.actual_outcome === outcomeFilter);
    }
    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "agent_id") {
        cmp = a.agent_id.localeCompare(b.agent_id);
      } else if (sortField === "predicted_score") {
        cmp = a.predicted_score - b.predicted_score;
      } else if (sortField === "loan_amount") {
        cmp = a.loan_amount - b.loan_amount;
      } else if (sortField === "days_to_repay") {
        cmp = (a.days_to_repay ?? 0) - (b.days_to_repay ?? 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [data, search, outcomeFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageData = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // Reset to page 1 when filters change
  React.useEffect(() => { setPage(1); }, [search, outcomeFilter]);

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
          <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="All Outcomes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="repaid">Repaid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="defaulted">Defaulted</SelectItem>
              <SelectItem value="recovered_via_autostrike">Recovered (Auto-Strike)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">
                <button onClick={() => toggleSort("agent_id")} className="flex items-center gap-1 hover:text-foreground">
                  Agent <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-left px-3 py-2 font-medium">Predicted</th>
              <th className="text-right px-3 py-2 font-medium">
                <button onClick={() => toggleSort("predicted_score")} className="flex items-center gap-1 ml-auto hover:text-foreground">
                  Score <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-left px-3 py-2 font-medium">Method</th>
              <th className="text-left px-3 py-2 font-medium">Outcome</th>
              <th className="text-right px-3 py-2 font-medium">
                <button onClick={() => toggleSort("loan_amount")} className="flex items-center gap-1 ml-auto hover:text-foreground">
                  Loan Amount <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-center px-3 py-2 font-medium">Auto-Strike</th>
              <th className="text-center px-3 py-2 font-medium">Correct?</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((p) => (
              <tr key={`${p.agent_id}-${p.loan_id}`} className="border-t hover:bg-muted/30">
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
                  {p.had_autostrike ? (
                    <span className="text-xs">
                      {p.had_successful_autostrike ? "✅" : "❌"}
                      {p.autostrike_attempt_count > 0 && ` (${p.autostrike_attempt_count})`}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
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

      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} records
          </p>
          {totalPages > 1 && (
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={currentPage === pageNum}
                        onClick={() => setPage(pageNum)}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </Card>
  );
}
