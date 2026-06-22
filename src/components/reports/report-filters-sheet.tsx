"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ReportFilters } from "@/lib/types";

interface ReportFiltersSheetProps {
  filters: ReportFilters;
  onApply: (filters: ReportFilters) => void;
  disabled?: boolean;
}

const LOAN_TYPES = ["float", "pay_day"];
const LOAN_STATUSES = ["pending", "disbursed", "overdue", "cleared", "defaulted"];
const RISK_LEVELS = ["low", "medium", "high"];
const CHANNELS = ["wallet", "cash", "bank", "card", "unknown"];

export function ReportFiltersSheet({ filters, onApply, disabled }: ReportFiltersSheetProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<ReportFilters>(filters);

  React.useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const update = (key: keyof ReportFilters, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleApply = () => {
    onApply(draft);
    setOpen(false);
  };

  const handleClear = () => {
    const cleared: ReportFilters = {};
    setDraft(cleared);
    onApply(cleared);
    setOpen(false);
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Report Filters</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="agent_id">Agent ID</Label>
            <Input
              id="agent_id"
              value={draft.agent_id || ""}
              onChange={(e) => update("agent_id", e.target.value)}
              placeholder="e.g. 4QUL0002"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product_id">Product ID</Label>
            <Input
              id="product_id"
              value={draft.product_id || ""}
              onChange={(e) => update("product_id", e.target.value)}
              placeholder="Product UUID"
            />
          </div>
          <div className="space-y-2">
            <Label>Loan Type</Label>
            <div className="flex flex-wrap gap-2">
              {LOAN_TYPES.map((type) => (
                <Button
                  key={type}
                  variant={draft.loan_type === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => update("loan_type", draft.loan_type === type ? "" : type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {LOAN_STATUSES.map((status) => (
                <Button
                  key={status}
                  variant={draft.status === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => update("status", draft.status === status ? "" : status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Channel</Label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((channel) => (
                <Button
                  key={channel}
                  variant={draft.channel === channel ? "default" : "outline"}
                  size="sm"
                  onClick={() => update("channel", draft.channel === channel ? "" : channel)}
                >
                  {channel}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Risk Level</Label>
            <div className="flex flex-wrap gap-2">
              {RISK_LEVELS.map((level) => (
                <Button
                  key={level}
                  variant={draft.risk_level === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => update("risk_level", draft.risk_level === level ? "" : level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleApply} className="flex-1">Apply Filters</Button>
            <Button variant="outline" onClick={handleClear}>
              <X className="mr-1 h-4 w-4" /> Clear
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
