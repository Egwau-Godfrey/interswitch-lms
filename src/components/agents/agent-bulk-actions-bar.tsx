"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentBulkActionsBarProps {
  selectedCount: number;
  onActivateSelected: () => void;
  onDeactivateSelected: () => void;
  onClearSelection: () => void;
}

export function AgentBulkActionsBar({
  selectedCount,
  onActivateSelected,
  onDeactivateSelected,
  onClearSelection,
}: AgentBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border">
      <span className="text-sm font-medium">
        {selectedCount} agent{selectedCount > 1 ? "s" : ""} selected
      </span>
      <div className="flex-1" />
      <Button variant="outline" size="sm" onClick={onClearSelection}>
        Clear
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onActivateSelected}
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <span className="hidden sm:inline ml-2">Activate Selected</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive"
        onClick={onDeactivateSelected}
      >
        <XCircle className="w-4 h-4" />
        <span className="hidden sm:inline ml-2">Deactivate Selected</span>
      </Button>
    </div>
  );
}
