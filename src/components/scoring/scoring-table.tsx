"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MoreVertical,
  RefreshCw,
  Loader2,
  ExternalLink,
  Eye,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreValueMeter } from "./score-value-meter";
import { RiskLevelBadge } from "@/components/shared/status-badges";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";
import type { ScoredAgent } from "@/lib/types";

// ============================================
// Types
// ============================================

interface ScoringTableProps {
  agents: ScoredAgent[];
  isLoading: boolean;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (column: string) => void;
  onRowClick: (agent: ScoredAgent) => void;
  onReScore: (agentId: string) => void;
  reScoringAgentId: string | null;
  basePath?: string;
}

// ============================================
// Sortable column config
// ============================================

const SORTABLE_COLUMNS: { label: string; key: string }[] = [
  { label: "Credit Score", key: "last_credit_score" },
  { label: "Loan Limit",   key: "loan_limit" },
  { label: "Last Scored",  key: "last_scored_at" },
];

function SortIcon({
  column,
  sortBy,
  sortOrder,
}: {
  column: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}) {
  if (sortBy !== column) {
    return <ChevronsUpDown className="ml-1 h-4 w-4 text-muted-foreground" />;
  }
  return sortOrder === "asc" ? (
    <ChevronUp className="ml-1 h-4 w-4" />
  ) : (
    <ChevronDown className="ml-1 h-4 w-4" />
  );
}

// ============================================
// ScoringTable component
// ============================================

export function ScoringTable({
  agents,
  isLoading,
  pageSize,
  sortBy,
  sortOrder,
  onSortChange,
  onRowClick,
  onReScore,
  reScoringAgentId,
  basePath = "/super-admin",
}: ScoringTableProps) {
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {/* Agent */}
            <TableHead>Agent</TableHead>

            {/* Credit Score — sortable */}
            <TableHead>
              <button
                className="flex items-center font-medium hover:text-foreground transition-colors"
                onClick={() => onSortChange("last_credit_score")}
              >
                Credit Score
                <SortIcon
                  column="last_credit_score"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                />
              </button>
            </TableHead>

            {/* Risk Level */}
            <TableHead>Risk Level</TableHead>

            {/* Loan Limit — sortable */}
            <TableHead>
              <button
                className="flex items-center font-medium hover:text-foreground transition-colors"
                onClick={() => onSortChange("loan_limit")}
              >
                Loan Limit
                <SortIcon
                  column="loan_limit"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                />
              </button>
            </TableHead>

            {/* Last Scored — sortable */}
            <TableHead>
              <button
                className="flex items-center font-medium hover:text-foreground transition-colors"
                onClick={() => onSortChange("last_scored_at")}
              >
                Last Scored
                <SortIcon
                  column="last_scored_at"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                />
              </button>
            </TableHead>

            {/* Actions */}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            // Skeleton loading rows
            Array.from({ length: pageSize }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell className="flex justify-end">
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))
          ) : agents.length > 0 ? (
            agents.map((agent) => {
              const isReScoring = reScoringAgentId === agent.agent_id;
              const initials =
                agent.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() ?? "?";

              return (
                <TableRow
                  key={agent.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRowClick(agent)}
                >
                  {/* Agent */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold leading-none">
                          {agent.full_name ?? "—"}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground mt-0.5">
                          {agent.agent_id}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Credit Score */}
                  <TableCell>
                    <ScoreValueMeter
                      score={agent.last_credit_score}
                      riskLevel={agent.credit_score_risk_level}
                    />
                  </TableCell>

                  {/* Risk Level */}
                  <TableCell>
                    <RiskLevelBadge riskLevel={agent.credit_score_risk_level} />
                  </TableCell>

                  {/* Loan Limit */}
                  <TableCell>
                    {formatCurrency(agent.loan_limit, "UGX")}
                  </TableCell>

                  {/* Last Scored */}
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(agent.last_scored_at, "relative")}
                  </TableCell>

                  {/* Actions — stop propagation so row click doesn't fire */}
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>

                        {/* View Details */}
                        <DropdownMenuItem onClick={() => onRowClick(agent)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>

                        {/* Re-score */}
                        <DropdownMenuItem
                          onClick={() => onReScore(agent.agent_id)}
                          disabled={isReScoring}
                        >
                          {isReScoring ? (
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Re-score
                        </DropdownMenuItem>

                        {/* View Agent Profile */}
                        <Link href={`${basePath}/agents/${agent.agent_id}`}>
                          <DropdownMenuItem>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Agent Profile
                          </DropdownMenuItem>
                        </Link>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            // Empty state
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                No scored agents found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
