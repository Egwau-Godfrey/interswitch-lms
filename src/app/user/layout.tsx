"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PermissionsProvider } from "@/contexts/permissions-context";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionsProvider>
      <DashboardLayout basePath="/user">{children}</DashboardLayout>
    </PermissionsProvider>
  );
}
