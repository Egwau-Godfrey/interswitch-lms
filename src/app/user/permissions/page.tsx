"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PermissionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const isSuperAdmin =
    (session?.user as any)?.role === "super_admin" || (session?.user as any)?.isAdmin;

  // Super admins manage permissions in their own portal.
  React.useEffect(() => {
    if (status === "authenticated" && isSuperAdmin) {
      router.replace("/super-admin/permissions");
    }
  }, [status, isSuperAdmin, router]);

  if (status === "loading" || (status === "authenticated" && isSuperAdmin)) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <Card className="w-full max-w-lg">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ShieldX className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Permissions unavailable</CardTitle>
          <CardDescription>
            Permission grants are managed by super admins. You don&apos;t have access to this
            page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            You currently have view-only access to the dashboard. If you need write access,
            contact a super admin.
          </p>
          <Button asChild className="bg-[#004B91] hover:bg-[#003B71] text-white">
            <Link href="/user">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
