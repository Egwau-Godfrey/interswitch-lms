"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExportButton } from "@/components/shared/export-button";

interface ScoringFiltersToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  riskLevel: "high" | "medium" | "low" | "all";
  onRiskLevelChange: (v: "high" | "medium" | "low" | "all") => void;
  scoreMin: number | undefined;
  scoreMax: number | undefined;
  onScoreRangeChange: (min: number | undefined, max: number | undefined) => void;
  scoredFrom: string | undefined;
  scoredTo: string | undefined;
  onDateRangeChange: (from: string | undefined, to: string | undefined) => void;
  onReset: () => void;
  onExportCsv: () => Promise<Blob>;
  onExportExcel: () => Promise<Blob>;
}

export function ScoringFiltersToolbar({
  search,
  onSearchChange,
  riskLevel,
  onRiskLevelChange,
  scoreMin,
  scoreMax,
  onScoreRangeChange,
  scoredFrom,
  scoredTo,
  onDateRangeChange,
  onReset,
  onExportCsv,
  onExportExcel,
}: ScoringFiltersToolbarProps) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Search input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search agents by name, ID, or email..."
          className="pl-10 h-10"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Risk level select */}
      <Select value={riskLevel} onValueChange={(v) => onRiskLevelChange(v as "high" | "medium" | "low" | "all")}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Risk Levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Risk Levels</SelectItem>
          <SelectItem value="low">Low Risk</SelectItem>
          <SelectItem value="medium">Medium Risk</SelectItem>
          <SelectItem value="high">High Risk</SelectItem>
        </SelectContent>
      </Select>

      {/* Score range inputs */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={100}
          placeholder="Min %"
          className="w-20 h-10"
          value={scoreMin ?? ""}
          onChange={(e) => {
            const v = e.target.value === "" ? undefined : Number(e.target.value);
            onScoreRangeChange(v, scoreMax);
          }}
        />
        <span className="text-muted-foreground text-sm">–</span>
        <Input
          type="number"
          min={0}
          max={100}
          placeholder="Max %"
          className="w-20 h-10"
          value={scoreMax ?? ""}
          onChange={(e) => {
            const v = e.target.value === "" ? undefined : Number(e.target.value);
            onScoreRangeChange(scoreMin, v);
          }}
        />
      </div>

      {/* Date range inputs */}
      <div className="flex items-center gap-2">
        <Input
          type="date"
          className="w-[150px] h-10"
          value={scoredFrom ?? ""}
          onChange={(e) => onDateRangeChange(e.target.value || undefined, scoredTo)}
        />
        <span className="text-muted-foreground text-sm">–</span>
        <Input
          type="date"
          className="w-[150px] h-10"
          value={scoredTo ?? ""}
          onChange={(e) => onDateRangeChange(scoredFrom, e.target.value || undefined)}
        />
      </div>

      {/* Reset button */}
      <Button variant="outline" size="sm" onClick={onReset}>
        <X className="h-4 w-4 mr-1" />
        Reset
      </Button>

      {/* Export button */}
      <ExportButton
        filename="scored-agents"
        onExportCsv={onExportCsv}
        onExportExcel={onExportExcel}
      />
    </div>
  );
}
