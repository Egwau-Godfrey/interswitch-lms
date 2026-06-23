"use client";

import * as React from "react";
import { useApiAuth } from "@/hooks/use-api-auth";
import { useWritePermission } from "@/hooks/use-write-permission";
import { WhitelistPageContent } from "@/components/whitelist/whitelist-page-content";

export default function UserWhitelistPage() {
  const { isReady } = useApiAuth();
  const { canWrite, writeDisabled } = useWritePermission("agents");

  if (!isReady) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <WhitelistPageContent
      isUser={true}
      canWrite={canWrite}
      writeDisabled={writeDisabled}
    />
  );
}
