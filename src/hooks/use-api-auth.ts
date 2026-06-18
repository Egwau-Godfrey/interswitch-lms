"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api/client";

/**
 * Ensures the API client has the session token before data fetching.
 * Use `isReady` as the `enabled` flag for useApi hooks.
 */
export function useApiAuth() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const token = session?.user?.accessToken;
    if (token) {
      apiClient.setAccessToken(token);
    } else if (session === null) {
      apiClient.clearAccessToken();
    }
  }, [session]);

  const accessToken = session?.user?.accessToken;
  const isReady = mounted && status === "authenticated" && !!accessToken;

  return {
    session,
    status,
    mounted,
    accessToken,
    isReady,
  };
}
