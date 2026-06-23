"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api/client";
import { WhitelistPageContent } from "@/components/whitelist/whitelist-page-content";

export default function SuperAdminWhitelistPage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (session?.user?.accessToken) {
      apiClient.setAccessToken(session.user.accessToken);
    } else {
      apiClient.clearAccessToken();
    }
  }, [session]);

  if (!mounted || status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <WhitelistPageContent
      isUser={false}
      canWrite={true}
      writeDisabled={false}
    />
  );
}
