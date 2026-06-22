"use client";

import * as React from "react";
import { Save, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useApi, useMutation } from "@/hooks/use-api";
import { scoringConfigApi } from "@/lib/api/scoring-config";
import { CONFIG_CATEGORY_LABELS } from "@/lib/types/scoring";
import { ScoringWeightsEditor } from "./scoring-weights-editor";
import { RiskThresholdsEditor } from "./risk-thresholds-editor";
import { LoanLimitConfig } from "./loan-limit-config";
import { PenaltyRulesEditor } from "./penalty-rules-editor";

interface ScoringConfigPanelProps {
  hasWriteAccess: boolean;
  writeTooltip?: string;
}

export function ScoringConfigPanel({
  hasWriteAccess,
  writeTooltip = "Write access requires a grant from a super admin",
}: ScoringConfigPanelProps) {
  const { data: configEntries, isLoading, refetch } = useApi(
    () => scoringConfigApi.getAll(),
    ["scoring-config"],
    { cacheKey: "scoring-config" }
  );

  // Local working copy of values
  const [localValues, setLocalValues] = React.useState<Record<string, string>>({});
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (configEntries && Array.isArray(configEntries)) {
      const map: Record<string, string> = {};
      for (const entry of configEntries) {
        map[entry.key] = entry.value;
      }
      setLocalValues(map);
      setDirty(false);
    }
  }, [configEntries]);

  const handleChange = (key: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const saveMutation = useMutation(
    (updates: { key: string; value: string }[]) =>
      scoringConfigApi.bulkUpdate(updates),
    {
      onSuccess: () => {
        toast.success("Configuration saved successfully");
        setDirty(false);
        refetch();
      },
      onError: (e) => toast.error(e.message || "Failed to save configuration"),
    }
  );

  const resetMutation = useMutation(
    () => scoringConfigApi.reset(),
    {
      onSuccess: (res) => {
        toast.success(res.message || "Configuration reset to defaults");
        refetch();
      },
      onError: (e) => toast.error(e.message || "Failed to reset configuration"),
    }
  );

  const handleSave = () => {
    if (!configEntries || !Array.isArray(configEntries)) return;
    const updates: { key: string; value: string }[] = [];
    for (const entry of configEntries) {
      const newVal = localValues[entry.key];
      if (newVal !== undefined && newVal !== entry.value) {
        updates.push({ key: entry.key, value: newVal });
      }
    }
    if (updates.length === 0) {
      toast.info("No changes to save");
      return;
    }
    saveMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!configEntries) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load scoring configuration.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {!hasWriteAccess && (
        <Alert>
          <AlertDescription>
            You have view-only access. {writeTooltip}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="weights">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="weights">
            {CONFIG_CATEGORY_LABELS.weights}
          </TabsTrigger>
          <TabsTrigger value="thresholds">
            {CONFIG_CATEGORY_LABELS.thresholds}
          </TabsTrigger>
          <TabsTrigger value="limits">
            {CONFIG_CATEGORY_LABELS.limits}
          </TabsTrigger>
          <TabsTrigger value="penalties">
            {CONFIG_CATEGORY_LABELS.penalties}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weights" className="mt-4">
          <ScoringWeightsEditor
            values={localValues}
            onChange={handleChange}
            disabled={!hasWriteAccess}
          />
        </TabsContent>

        <TabsContent value="thresholds" className="mt-4">
          <RiskThresholdsEditor
            values={localValues}
            onChange={handleChange}
            disabled={!hasWriteAccess}
          />
        </TabsContent>

        <TabsContent value="limits" className="mt-4">
          <LoanLimitConfig
            values={localValues}
            onChange={handleChange}
            disabled={!hasWriteAccess}
          />
        </TabsContent>

        <TabsContent value="penalties" className="mt-4">
          <PenaltyRulesEditor
            values={localValues}
            onChange={handleChange}
            disabled={!hasWriteAccess}
          />
        </TabsContent>
      </Tabs>

      {hasWriteAccess && (
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={resetMutation.isLoading}
              >
                {resetMutation.isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all configuration?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset every scoring configuration value to its
                  system default. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => resetMutation.mutate(undefined as any)}>
                  Yes, Reset All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            onClick={handleSave}
            disabled={!dirty || saveMutation.isLoading}
          >
            {saveMutation.isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
