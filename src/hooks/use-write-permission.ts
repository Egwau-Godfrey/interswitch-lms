"use client";

import { toast } from "sonner";
import { usePermissions } from "@/contexts/permissions-context";

/**
 * Convenience hook that returns write-permission state for a given tab.
 * Used by user pages to disable write action buttons.
 */
export function useWritePermission(tabName: string) {
  const { hasWriteAccess, isLoading, refetch } = usePermissions();

  const canWrite = hasWriteAccess(tabName);
  const writeDisabled = isLoading || !canWrite;
  const writeTooltip = !canWrite
    ? "Write access requires a grant from a super admin"
    : undefined;

  /**
   * Call this before performing a write action.
   * Returns true if allowed, false if denied (and shows a toast).
   * Also triggers a refetch so the UI updates if the grant has expired.
   */
  const requireWrite = (): boolean => {
    if (!canWrite) {
      toast.error("Write access required", {
        description: "Contact a super admin to grant write access for this section.",
      });
      refetch();
      return false;
    }
    return true;
  };

  return { canWrite, writeDisabled, writeTooltip, requireWrite, isLoading };
}
