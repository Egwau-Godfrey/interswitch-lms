"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api/client";
import { ScoringOverviewTab } from "@/components/scoring/scoring-overview-tab";
import { ScoringConfigPanel } from "@/components/scoring/config/scoring-config-panel";
import { ScoringAnalyticsTab } from "@/components/scoring/scoring-analytics-tab";

// Try to load permissions context — only available when rendered under /user layout
let usePermissionsHook: (() => { hasWriteAccess: (tab: string) => boolean; isLoading: boolean; refetch: () => void }) | null = null;
try {
  const ctx = require("@/contexts/permissions-context");
  usePermissionsHook = ctx.usePermissions;
} catch {
  usePermissionsHook = null;
}

export default function ScoringPage() {
  const { data: session, status: authStatus } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const isUser = role === "user";
  const permCtx = usePermissionsHook ? usePermissionsHook() : null;
  const hasWriteAccess = role === "super_admin" || (session?.user as any)?.isAdmin
    ? true
    : (permCtx ? permCtx.hasWriteAccess("scoring") : !isUser);
  const permLoading = permCtx ? permCtx.isLoading : false;
  const writeDisabled = permLoading || !hasWriteAccess;
  const writeTooltip = "Write access requires a grant from a super admin";
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    if (session?.user?.accessToken) {
      apiClient.setAccessToken(session.user.accessToken);
    } else {
      apiClient.clearAccessToken();
    }
  }, [session]);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Credit Scoring</h1>
        <p className="text-muted-foreground">
          View and manage credit scores for all agents.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <ScoringOverviewTab
            hasWriteAccess={hasWriteAccess}
            writeTooltip={writeTooltip}
            isUser={isUser}
            basePath={isUser ? "/user" : "/super-admin"}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <ScoringAnalyticsTab />
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <ScoringConfigPanel
            hasWriteAccess={hasWriteAccess}
            writeTooltip={writeTooltip}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
