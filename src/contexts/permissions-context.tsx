"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { permissionsApi } from "@/lib/api/permissions";
import { apiClient } from "@/lib/api/client";
import type { PermissionGrant } from "@/lib/types";

// ============================================
// Permissions Context
// ============================================
// Fetches the authenticated manager's active write grants and exposes
// hasWriteAccess(tab) for use by all manager page components.
// Safe default: if grants cannot be loaded, all write access returns false.
// Only fetches once the session is authenticated and the access token is ready.
// ============================================

interface PermissionsContextValue {
  grants: PermissionGrant[];
  isLoading: boolean;
  hasWriteAccess: (tabName: string) => boolean;
  refetch: () => void;
}

const PermissionsContext = React.createContext<PermissionsContextValue>({
  grants: [],
  isLoading: true,
  hasWriteAccess: () => false,
  refetch: () => {},
});

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [grants, setGrants] = React.useState<PermissionGrant[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const pathname = usePathname();

  // Keep apiClient in sync with the session token
  React.useEffect(() => {
    const token = (session?.user as any)?.accessToken as string | undefined;
    if (token) {
      apiClient.setAccessToken(token);
    } else if (session === null) {
      apiClient.clearAccessToken();
    }
  }, [session]);

  const fetchGrants = React.useCallback(async () => {
    // Only fetch when the session is fully authenticated
    if (status !== "authenticated") {
      setIsLoading(false);
      return;
    }
    const token = (session?.user as any)?.accessToken as string | undefined;
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await permissionsApi.getMyGrants();
      setGrants(data);
    } catch {
      // Silent safe default — write access defaults to false on any error
      setGrants([]);
    } finally {
      setIsLoading(false);
    }
  }, [session, status]);

  // Fetch when session becomes ready
  React.useEffect(() => {
    if (status === "authenticated") {
      fetchGrants();
    }
  }, [status, fetchGrants]);

  // Re-fetch on route change (only if already authenticated)
  React.useEffect(() => {
    if (status === "authenticated") {
      fetchGrants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Re-fetch on window focus
  React.useEffect(() => {
    const handleFocus = () => {
      if (status === "authenticated") {
        fetchGrants();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchGrants, status]);

  const hasWriteAccess = React.useCallback(
    (tabName: string): boolean => {
      return grants.some(
        (g) => g.is_active && (g.scope === "system" || g.tab_name === tabName)
      );
    },
    [grants]
  );

  const value = React.useMemo(
    () => ({ grants, isLoading, hasWriteAccess, refetch: fetchGrants }),
    [grants, isLoading, hasWriteAccess, fetchGrants]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  return React.useContext(PermissionsContext);
}
