"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle2, Info, AlertCircle, Settings } from "lucide-react";
import type { RecommendationItem } from "@/lib/types/scoring";

interface Props {
  recommendations: RecommendationItem[];
}

const SEVERITY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  critical: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 border-red-200" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
};

export function RecommendationsCard({ recommendations }: Props) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const handleActionClick = () => {
    // Find the Configuration tab trigger and click it
    const configTab = document.querySelector('[data-value="config"]') as HTMLElement | null;
    if (configTab) {
      configTab.click();
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-medium">Recommendations</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-xs">
                Auto-generated actionable insights based on the model&apos;s
                performance. Click an action to navigate to the relevant
                configuration section.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-2">
        {recommendations.map((r, i) => {
          const config = SEVERITY_CONFIG[r.severity] ?? SEVERITY_CONFIG.info;
          const Icon = config.icon;
          return (
            <div
              key={i}
              className={`rounded-lg border p-3 ${config.bg}`}
            >
              <div className="flex items-start gap-2">
                <Icon className={`h-4 w-4 ${config.color} shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${config.color}`}>{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.message}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={handleActionClick}
                  >
                    <Settings className="h-3 w-3" />
                    {r.action}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
