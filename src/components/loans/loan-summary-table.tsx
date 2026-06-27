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
import { ErrorState } from "@/components/shared/loading-states";
import type { Loan } from "@/lib/types";
import type { LoanColumnDef } from "./loan-summary-columns";
import { LoanRowActions } from "./loan-row-actions";

interface LoanSummaryTableProps {
  loans: Loan[];
  columns: LoanColumnDef[];
  isLoading: boolean;
  error: Error | null;
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  selectedLoanIds: Set<string>;
  onToggleSelection: (loanId: string) => void;
  onSelectAll: (loanIds: string[]) => void;
  onClearSelection: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefetch: () => void;
  onClearLoan?: (loan: Loan) => void;
  onWriteOffLoan?: (loan: Loan) => void;
  onRecordPayment?: (loan: Loan) => void;
  onTriggerAutostrike?: (loan: Loan) => void;
  basePath: string;
  emptyMessage?: string;
  canWrite?: boolean;
}

export function LoanSummaryTable({
  loans,
  columns,
  isLoading,
  error,
  page,
  totalPages,
  totalItems,
  pageSize,
  selectedLoanIds,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onPageChange,
  onPageSizeChange,
  onRefetch,
  onClearLoan,
  onWriteOffLoan,
  onRecordPayment,
  onTriggerAutostrike,
  basePath,
  emptyMessage = "No loans found.",
  canWrite = true,
}: LoanSummaryTableProps) {
  if (error) {
    return <ErrorState message={error.message || "Failed to load loans"} onRetry={onRefetch} />;
  }

  const allSelected = loans.length > 0 && selectedLoanIds.size === loans.length;
  const someSelected = selectedLoanIds.size > 0 && selectedLoanIds.size < loans.length;

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected ? "indeterminate" : undefined}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectAll(loans.map((l) => l.id));
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
              Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
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
            ) : loans.length > 0 ? (
              loans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLoanIds.has(loan.id)}
                      onCheckedChange={() => onToggleSelection(loan.id)}
                    />
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`${col.hidden === "md" ? "hidden md:table-cell" : ""} ${col.hidden === "lg" ? "hidden lg:table-cell" : ""} ${col.hidden === "sm" ? "hidden sm:table-cell" : ""}`}
                    >
                      {col.cell(loan)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <LoanRowActions
                      loan={loan}
                      basePath={basePath}
                      canWrite={canWrite}
                      onRefetch={onRefetch}
                      onClearLoan={onClearLoan}
                      onWriteOffLoan={onWriteOffLoan}
                      onRecordPayment={onRecordPayment}
                      onTriggerAutostrike={onTriggerAutostrike}
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
