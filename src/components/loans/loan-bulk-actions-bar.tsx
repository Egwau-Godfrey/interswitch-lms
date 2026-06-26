"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoanBulkActionsBarProps {
  selectedCount: number;
  onClearSelected: () => void;
  onWriteOffSelected: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

export function LoanBulkActionsBar({
  selectedCount,
  onClearSelected,
  onWriteOffSelected,
  onClearSelection,
  isLoading = false,
}: LoanBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border">
      <span className="text-sm font-medium">
        {selectedCount} loan{selectedCount > 1 ? "s" : ""} selected
      </span>
      <div className="flex-1" />
      <Button variant="outline" size="sm" onClick={onClearSelection} disabled={isLoading}>
        Clear
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onClearSelected}
        disabled={isLoading}
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <span className="hidden sm:inline ml-2">Clear Selected</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive"
        onClick={onWriteOffSelected}
        disabled={isLoading}
      >
        <XCircle className="w-4 h-4" />
        <span className="hidden sm:inline ml-2">Write Off Selected</span>
      </Button>
    </div>
  );
}
