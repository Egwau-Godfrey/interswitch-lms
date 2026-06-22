"use client";

import * as React from "react";
import { toast } from "sonner";
import { agentsApi } from "@/lib/api";
import type { BulkActivateResponse, BulkDeactivateResponse } from "@/lib/types";
import { useMutation } from "@/hooks/use-api";

interface UseAgentBulkActionsOptions {
  onSuccess?: () => void;
}

export function useAgentBulkActions(options?: UseAgentBulkActionsOptions) {
  const [selectedAgentIds, setSelectedAgentIds] = React.useState<Set<string>>(new Set());

  const toggleSelection = (agentId: string) => {
    setSelectedAgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  const selectAll = (agentIds: string[]) => {
    setSelectedAgentIds(new Set(agentIds));
  };

  const clearSelection = () => {
    setSelectedAgentIds(new Set());
  };

  const bulkDeactivate = useMutation(
    (params: { agent_ids?: string[]; all?: boolean }) =>
      agentsApi.bulkDeactivate(params),
    {
      onSuccess: (data: BulkDeactivateResponse) => {
        toast.success(`Deactivated ${data.deactivated} of ${data.total} agents`);
        if (data.skipped > 0) {
          toast.warning(`${data.skipped} agents skipped (have active loans)`);
        }
        clearSelection();
        options?.onSuccess?.();
      },
      onError: (err: Error) => {
        toast.error("Bulk deactivation failed", { description: err.message });
      },
    }
  );

  const bulkActivate = useMutation(
    (params: { agent_ids?: string[]; all?: boolean }) =>
      agentsApi.bulkActivate(params),
    {
      onSuccess: (data: BulkActivateResponse) => {
        toast.success(`Activated ${data.activated} of ${data.total} agents`);
        if (data.skipped > 0) {
          toast.warning(
            `${data.skipped} agents skipped (rejected by scoring or failed)`
          );
        }
        clearSelection();
        options?.onSuccess?.();
      },
      onError: (err: Error) => {
        toast.error("Bulk activation failed", { description: err.message });
      },
    }
  );

  return {
    selectedAgentIds,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkDeactivate,
    bulkActivate,
    isLoading: bulkDeactivate.isLoading || bulkActivate.isLoading,
  };
}
