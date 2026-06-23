"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/loading-states";
import type { AgentLoanSummary } from "@/lib/types";
import type { ColumnDef } from "./agent-loan-summary-columns";
import { AgentRowActions } from "./agent-row-actions";

interface AgentLoanSummaryTableProps {
  agents: AgentLoanSummary[];
  columns: ColumnDef[];
  isLoading: boolean;
  error: Error | null;
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  selectedAgentIds: Set<string>;
  onToggleSelection: (agentId: string) => void;
  onSelectAll: (agentIds: string[]) => void;
  onClearSelection: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefetch: () => void;
  onActivateAgent?: (agent: AgentLoanSummary) => void;
  onDeactivateAgent?: (agent: AgentLoanSummary) => void;
  basePath: string;
  emptyMessage?: string;
  canWrite?: boolean;
  whitelistModeEnabled?: boolean;
}

export function AgentLoanSummaryTable({
  agents,
  columns,
  isLoading,
  error,
  page,
  totalPages,
  totalItems,
  pageSize,
  selectedAgentIds,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onPageChange,
  onPageSizeChange,
  onRefetch,
  onActivateAgent,
  onDeactivateAgent,
  basePath,
  emptyMessage = "No agents found matching your search.",
  canWrite = true,
  whitelistModeEnabled = false,
}: AgentLoanSummaryTableProps) {
  if (error) {
    return <ErrorState message={error.message || "Failed to load agents"} onRetry={onRefetch} />;
  }

  const allSelected = agents.length > 0 && selectedAgentIds.size === agents.length;
  const someSelected = selectedAgentIds.size > 0 && selectedAgentIds.size < agents.length;

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected ? "indeterminate" : undefined}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectAll(agents.map((a) => a.agent_id));
                    } else {
                      onClearSelection();
                    }
                  }}
                />
              </TableHead>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`${col.className || ""} ${col.hidden === "md" ? "hidden md:table-cell" : ""} ${col.hidden === "lg" ? "hidden lg:table-cell" : ""} ${col.hidden === "sm" ? "hidden sm:table-cell" : ""}`}
                >
                  {col.header}
                </TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`${col.hidden === "md" ? "hidden md:table-cell" : ""} ${col.hidden === "lg" ? "hidden lg:table-cell" : ""}`}
                    >
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : agents.length > 0 ? (
              agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedAgentIds.has(agent.agent_id)}
                      onCheckedChange={() => onToggleSelection(agent.agent_id)}
                    />
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`${col.hidden === "md" ? "hidden md:table-cell" : ""} ${col.hidden === "lg" ? "hidden lg:table-cell" : ""} ${col.hidden === "sm" ? "hidden sm:table-cell" : ""}`}
                    >
                      {col.cell(agent)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <AgentRowActions
                      agent={agent}
                      basePath={basePath}
                      canWrite={canWrite}
                      onRefetch={onRefetch}
                      onActivate={onActivateAgent}
                      onDeactivate={onDeactivateAgent}
                      whitelistModeEnabled={whitelistModeEnabled}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
