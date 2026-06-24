"use client";

import * as React from "react";
import { toast } from "sonner";
import { loansApi } from "@/lib/api";
import { useMutation } from "@/hooks/use-api";

interface UseLoanBulkActionsOptions {
  onSuccess?: () => void;
}

/**
 * Manages row selection state and bulk clear / bulk write-off operations.
 *
 * Since the backend does not yet have dedicated bulk endpoints, bulk actions
 * are implemented as sequential single-loan calls with progress feedback.
 */
export function useLoanBulkActions(options?: UseLoanBulkActionsOptions) {
  const [selectedLoanIds, setSelectedLoanIds] = React.useState<Set<string>>(new Set());

  const toggleSelection = (loanId: string) => {
    setSelectedLoanIds((prev) => {
      const next = new Set(prev);
      if (next.has(loanId)) {
        next.delete(loanId);
      } else {
        next.add(loanId);
      }
      return next;
    });
  };

  const selectAll = (loanIds: string[]) => {
    setSelectedLoanIds(new Set(loanIds));
  };

  const clearSelection = () => {
    setSelectedLoanIds(new Set());
  };

  const bulkClear = useMutation(
    async (loanIds: string[]) => {
      let succeeded = 0;
      let failed = 0;
      for (const id of loanIds) {
        try {
          await loansApi.clearLoan(id);
          succeeded++;
        } catch {
          failed++;
        }
      }
      return { succeeded, failed, total: loanIds.length };
    },
    {
      onSuccess: (data) => {
        toast.success(`Cleared ${data.succeeded} of ${data.total} loans`);
        if (data.failed > 0) {
          toast.warning(`${data.failed} loans could not be cleared`);
        }
        clearSelection();
        options?.onSuccess?.();
      },
      onError: (err: Error) => {
        toast.error("Bulk clear failed", { description: err.message });
      },
    }
  );

  const bulkWriteOff = useMutation(
    async (loanIds: string[]) => {
      let succeeded = 0;
      let failed = 0;
      for (const id of loanIds) {
        try {
          await loansApi.writeOff(id);
          succeeded++;
        } catch {
          failed++;
        }
      }
      return { succeeded, failed, total: loanIds.length };
    },
    {
      onSuccess: (data) => {
        toast.success(`Wrote off ${data.succeeded} of ${data.total} loans`);
        if (data.failed > 0) {
          toast.warning(`${data.failed} loans could not be written off`);
        }
        clearSelection();
        options?.onSuccess?.();
      },
      onError: (err: Error) => {
        toast.error("Bulk write-off failed", { description: err.message });
      },
    }
  );

  return {
    selectedLoanIds,
    selectedCount: selectedLoanIds.size,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkClear,
    bulkWriteOff,
    isLoading: bulkClear.isLoading || bulkWriteOff.isLoading,
  };
}
