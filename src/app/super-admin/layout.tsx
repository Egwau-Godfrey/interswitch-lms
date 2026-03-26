"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout basePath="/super-admin">{children}</DashboardLayout>;
}
