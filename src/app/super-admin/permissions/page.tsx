"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { apiClient, permissionsApi, usersApi } from "@/lib/api";
import { useApi, useMutation } from "@/hooks/use-api";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import type {
  AdminTab,
  AuditEventType,
  AuditLogEntry,
  CreateGrantRequest,
  GrantScope,
  PermissionGrant,
  User,
} from "@/lib/types";

const ADMIN_TABS: readonly AdminTab[] = [
  "agents",
  "loans",
  "scoring",
  "loan-products",
  "payments",
  "reports",
  "users",
  "settings",
  "api-management",
];

const EVENT_LABELS: Record<string, string> = {
  grant_created: "Grant Created",
  grant_revoked: "Grant Revoked",
  grant_expired: "Grant Expired",
  write_action: "Write Action",
  unauthorized_attempt: "Unauthorized Attempt",
  route_blocked: "Route Blocked",
};

type GrantUserSummary = NonNullable<PermissionGrant["granted_to_user"]>;
type GrantByUserSummary = NonNullable<PermissionGrant["granted_by_user"]>;

function getUserName(user: User | GrantUserSummary | GrantByUserSummary | null | undefined): string {
  if (!user) return "Unknown";
  return `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "Unknown";
}

function getUserEmail(user: User | GrantUserSummary | null | undefined): string | null {
  if (!user || !("email" in user)) return null;
  return user.email || null;
}

function parseDateAsUtc(dateString: string | null | undefined): number | null {
  if (!dateString) return null;
  const hasTimezone = dateString.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dateString);
  const normalized = hasTimezone ? dateString : `${dateString}Z`;
  const time = new Date(normalized).getTime();
  return Number.isNaN(time) ? null : time;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-US");
}

function getTabLabel(tab: AdminTab): string {
  return tab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getScopeLabel(grant: PermissionGrant): string {
  if (grant.scope === "system") return "System-wide";
  return grant.tab_name ? getTabLabel(grant.tab_name) : "Tab";
}

function getDurationLabel(grant: PermissionGrant): string {
  if (grant.is_permanent) return "Permanent";
  if (!grant.expires_at) return "Temporary";

  const expiresAt = parseDateAsUtc(grant.expires_at);
  if (expiresAt === null) return `Until ${formatDate(grant.expires_at)}`;

  const expired = !grant.is_active || expiresAt <= Date.now();
  return expired ? `Expired ${formatDate(grant.expires_at)}` : `Until ${formatDate(grant.expires_at)}`;
}

function isGrantEffectivelyActive(grant: PermissionGrant): boolean {
  const expiresAt = parseDateAsUtc(grant.expires_at);
  return (
    grant.is_active &&
    (grant.is_permanent || !grant.expires_at || expiresAt === null || expiresAt > Date.now())
  );
}

function getGrantStatusLabel(grant: PermissionGrant): "active" | "expired" | "inactive" {
  if (!grant.is_active) return "inactive";
  return isGrantEffectivelyActive(grant) ? "active" : "expired";
}

function getStatusBadgeVariant(status: "active" | "expired" | "inactive"): "default" | "secondary" | "outline" {
  if (status === "active") return "default";
  if (status === "expired") return "secondary";
  return "outline";
}

export default function PermissionsPage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = React.useState(false);
  const [grantUserId, setGrantUserId] = React.useState("");
  const [grantScope, setGrantScope] = React.useState<"system" | "tab">("tab");
  const [grantTabName, setGrantTabName] = React.useState<AdminTab>("agents");
  const [grantIsPermanent, setGrantIsPermanent] = React.useState(false);
  const [grantExpiresAt, setGrantExpiresAt] = React.useState("");
  const [grantNotes, setGrantNotes] = React.useState("");
  const [selectedUserSearch, setSelectedUserSearch] = React.useState("");
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [revokingGrant, setRevokingGrant] = React.useState<PermissionGrant | null>(null);
  const [grantPage, setGrantPage] = React.useState(1);
  const [grantPageSize, setGrantPageSize] = React.useState(10);
  const [grantUserFilter, setGrantUserFilter] = React.useState("");
  const [grantTabFilter, setGrantTabFilter] = React.useState("");
  const [grantScopeFilter, setGrantScopeFilter] = React.useState("");
  const [auditPage, setAuditPage] = React.useState(1);
  const [auditEventType, setAuditEventType] = React.useState("");
  const [auditTabName, setAuditTabName] = React.useState("");

  const isSuperAdmin =
    (session?.user as any)?.role === "super_admin" || (session?.user as any)?.isAdmin;

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

  const { data: usersData, refetch: refetchUsers } = useApi(
    () => usersApi.list({
      page: 1,
      page_size: 100,
      search: selectedUserSearch || undefined,
    }),
    [mounted, status === "authenticated", selectedUserSearch],
    {
      cacheKey: `permission-users-${selectedUserSearch}`,
      enabled: mounted && status === "authenticated" && isSuperAdmin,
    }
  );

  const userOptions = React.useMemo(() => {
    return (usersData?.data || []).filter((user) => user.role === "user");
  }, [usersData]);

  React.useEffect(() => {
    if (!selectedUserId && userOptions.length > 0) {
      const defaultUser =
        userOptions.find((user) => user.username === "user") || userOptions[0];
      setSelectedUserId(defaultUser.id);
    }
  }, [selectedUserId, userOptions]);

  const selectedUser = React.useMemo(() => {
    return (usersData?.data || []).find((user) => user.id === selectedUserId) || null;
  }, [usersData, selectedUserId]);

  const { data: selectedGrantsData, refetch: refetchSelectedGrants } = useApi(
    () => permissionsApi.listGrants({
      user_id: selectedUserId || undefined,
      page: 1,
      page_size: 50,
    }),
    [mounted, status === "authenticated", selectedUserId],
    {
      cacheKey: `selected-permission-grants-${selectedUserId}`,
      enabled: mounted && status === "authenticated" && isSuperAdmin && !!selectedUserId,
    }
  );

  const { data: grantsData, refetch: refetchGrants } = useApi(
    () => permissionsApi.listGrants({
      user_id: grantUserFilter || undefined,
      tab_name: grantTabFilter || undefined,
      scope: grantScopeFilter ? (grantScopeFilter as GrantScope) : undefined,
      page: grantPage,
      page_size: grantPageSize,
    }),
    [mounted, status === "authenticated", grantPage, grantPageSize, grantUserFilter, grantTabFilter, grantScopeFilter],
    {
      cacheKey: `all-permission-grants-${grantPage}-${grantPageSize}-${grantUserFilter}-${grantTabFilter}-${grantScopeFilter}`,
      enabled: mounted && status === "authenticated" && isSuperAdmin,
    }
  );

  const { data: auditData, refetch: refetchAudit } = useApi(
    () => permissionsApi.getAuditLog({
      page: auditPage,
      page_size: 20,
      event_type: auditEventType ? (auditEventType as AuditEventType) : undefined,
      tab_name: auditTabName || undefined,
    }),
    [mounted, status === "authenticated", auditPage, auditEventType, auditTabName],
    {
      cacheKey: `permission-audit-${auditPage}-${auditEventType}-${auditTabName}`,
      enabled: mounted && status === "authenticated" && isSuperAdmin,
    }
  );

  const createGrantMutation = useMutation(
    (data: CreateGrantRequest) => permissionsApi.createGrant(data),
    {
      onSuccess: () => {
        toast.success("Write access granted");
        setSelectedUserId(grantUserId);
        setSelectedUserSearch("");
        setGrantUserFilter("");
        setGrantTabFilter("");
        setGrantScopeFilter("");
        setGrantPage(1);
        setGrantUserId("");
        setGrantScope("tab");
        setGrantTabName("agents");
        setGrantIsPermanent(false);
        setGrantExpiresAt("");
        setGrantNotes("");
        refetchUsers();
        refetchGrants();
        refetchSelectedGrants();
        refetchAudit();
      },
      onError: (err) => {
        toast.error("Failed to grant write access", {
          description: err.message,
        });
      },
    }
  );

  const revokeGrantMutation = useMutation(
    (grantId: string) => permissionsApi.revokeGrant(grantId),
    {
      onSuccess: () => {
        toast.success("Grant revoked");
        setRevokingGrant(null);
        refetchGrants();
        refetchSelectedGrants();
        refetchAudit();
      },
      onError: (err) => {
        toast.error("Failed to revoke grant", {
          description: err.message,
        });
      },
    }
  );

  const handleCreateGrant = (event: React.FormEvent) => {
    event.preventDefault();
    if (!grantUserId) {
      toast.error("Select a user");
      return;
    }
    if (grantScope === "tab" && !grantTabName) {
      toast.error("Select a tab");
      return;
    }
    if (!grantIsPermanent && !grantExpiresAt) {
      toast.error("Set an expiry date for temporary grants");
      return;
    }

    createGrantMutation.mutate({
      granted_to_user_id: grantUserId,
      scope: grantScope,
      tab_name: grantScope === "tab" ? grantTabName : undefined,
      is_permanent: grantIsPermanent,
      expires_at: grantIsPermanent ? undefined : new Date(grantExpiresAt).toISOString(),
      notes: grantNotes || undefined,
    });
  };

  const selectedGrantCounts = React.useMemo(() => {
    const grants = selectedGrantsData?.data || [];
    return {
      active: grants.filter((grant) => isGrantEffectivelyActive(grant)).length,
      system: grants.filter((grant) => isGrantEffectivelyActive(grant) && grant.scope === "system").length,
      tab: grants.filter((grant) => isGrantEffectivelyActive(grant) && grant.scope === "tab").length,
    };
  }, [selectedGrantsData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
          <p className="text-muted-foreground">
            Manage write access for user-role accounts. Users keep view-only access to all admin pages until a grant is issued.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchUsers();
            refetchGrants();
            refetchSelectedGrants();
            refetchAudit();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {!isSuperAdmin && status === "authenticated" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Only super admins can manage permission grants.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="grant" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="grant">Grant Access</TabsTrigger>
          <TabsTrigger value="user-permissions">User Permissions</TabsTrigger>
          <TabsTrigger value="active-grants">Active Grants</TabsTrigger>
          <TabsTrigger value="audit-log">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="grant" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Grant Write Access
              </CardTitle>
              <CardDescription>
                Give a user-role account temporary, permanent, tab-specific, or system-wide write access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGrant} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>User</Label>
                  <Select
                    value={grantUserId || "__none__"}
                    onValueChange={(value) => {
                      const userId = value === "__none__" ? "" : value;
                      setGrantUserId(userId);
                      if (userId) {
                        setSelectedUserId(userId);
                        setSelectedUserSearch("");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {userOptions.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {getUserName(user)} ({user.username})
                        </SelectItem>
                      ))}
                      {userOptions.length === 0 && (
                        <SelectItem value="__none__" disabled>
                          No user-role accounts found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Scope</Label>
                  <Select value={grantScope} onValueChange={(value) => setGrantScope(value as "system" | "tab")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tab">Specific tab</SelectItem>
                      <SelectItem value="system">Entire system</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {grantScope === "tab" && (
                  <div className="space-y-2">
                    <Label>Tab</Label>
                    <Select value={grantTabName} onValueChange={(value) => setGrantTabName(value as AdminTab)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ADMIN_TABS.map((tab) => (
                          <SelectItem key={tab} value={tab}>
                            {getTabLabel(tab)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select
                    value={grantIsPermanent ? "permanent" : "temporary"}
                    onValueChange={(value) => setGrantIsPermanent(value === "permanent")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temporary">Temporary</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!grantIsPermanent && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Expires At</Label>
                    <Input
                      type="datetime-local"
                      value={grantExpiresAt}
                      onChange={(event) => setGrantExpiresAt(event.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label>Notes</Label>
                  <Input
                    placeholder="Reason for granting access..."
                    value={grantNotes}
                    onChange={(event) => setGrantNotes(event.target.value)}
                    maxLength={500}
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={createGrantMutation.isLoading || !isSuperAdmin}
                    className="bg-[#004B91] hover:bg-[#003B71]"
                  >
                    {createGrantMutation.isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Granting...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Grant Access
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Permission Review</CardTitle>
              <CardDescription>
                Search for the user account and review all grants that apply to it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search user, username, or email..."
                  className="pl-9"
                  value={selectedUserSearch}
                  onChange={(event) => {
                    setSelectedUserSearch(event.target.value);
                    setSelectedUserId("");
                  }}
                />
              </div>

              {!selectedUser && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Select a user-role account to view permissions.
                  </AlertDescription>
                </Alert>
              )}

              {selectedUser && (
                <>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">User</div>
                        <div className="text-lg font-semibold">{getUserName(selectedUser)}</div>
                        <div className="text-xs text-muted-foreground">{selectedUser.username}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Active Grants</div>
                        <div className="text-2xl font-semibold">{selectedGrantCounts.active}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">System Grants</div>
                        <div className="text-2xl font-semibold">{selectedGrantCounts.system}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Tab Grants</div>
                        <div className="text-2xl font-semibold">{selectedGrantCounts.tab}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="rounded-md border bg-card overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Scope</TableHead>
                          <TableHead>Tab</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Granted On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedGrantsData?.data?.length ? (
                          selectedGrantsData.data.map((grant) => (
                            <TableRow key={grant.id}>
                              <TableCell>
                                <Badge variant={grant.scope === "system" ? "default" : "secondary"}>
                                  {getScopeLabel(grant)}
                                </Badge>
                              </TableCell>
                              <TableCell>{grant.tab_name ? getTabLabel(grant.tab_name) : "—"}</TableCell>
                              <TableCell>{getDurationLabel(grant)}</TableCell>
                              <TableCell>
                                {(() => {
                                  const status = getGrantStatusLabel(grant);
                                  if (status === "active") {
                                    return (
                                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                        <ShieldCheck className="h-3 w-3" /> Active
                                      </span>
                                    );
                                  }
                                  if (status === "expired") {
                                    return (
                                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                        <Clock className="h-3 w-3" /> Expired
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                      <ShieldX className="h-3 w-3" /> Inactive
                                    </span>
                                  );
                                })()}
                              </TableCell>
                              <TableCell className="max-w-[240px] truncate">{grant.notes || "—"}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {formatDateTime(grant.created_at)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                              No grants found for this user.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active-grants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Permission Grants</CardTitle>
              <CardDescription>
                Review, filter, and revoke grants issued to user-role accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>User</Label>
                  <Select value={grantUserFilter || "__all__"} onValueChange={(value) => setGrantUserFilter(value === "__all__" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All users</SelectItem>
                      {userOptions.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {getUserName(user)} ({user.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tab</Label>
                  <Select value={grantTabFilter || "__all__"} onValueChange={(value) => setGrantTabFilter(value === "__all__" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All tabs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All tabs</SelectItem>
                      {ADMIN_TABS.map((tab) => (
                        <SelectItem key={tab} value={tab}>
                          {getTabLabel(tab)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Scope</Label>
                  <Select value={grantScopeFilter || "__all__"} onValueChange={(value) => setGrantScopeFilter(value === "__all__" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All scopes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All scopes</SelectItem>
                      <SelectItem value="system">System-wide</SelectItem>
                      <SelectItem value="tab">Specific tab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setGrantUserFilter("");
                      setGrantTabFilter("");
                      setGrantScopeFilter("");
                      setGrantPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>

              <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>User</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Tab</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Granted By</TableHead>
                      <TableHead>Granted On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grantsData?.data?.length ? (
                      grantsData.data.map((grant) => (
                        <TableRow key={grant.id}>
                          <TableCell className="font-medium">
                            <div>{getUserName(grant.granted_to_user)}</div>
                            <div className="text-xs text-muted-foreground">{getUserEmail(grant.granted_to_user)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={grant.scope === "system" ? "default" : "secondary"}>
                              {getScopeLabel(grant)}
                            </Badge>
                          </TableCell>
                          <TableCell>{grant.tab_name ? getTabLabel(grant.tab_name) : "—"}</TableCell>
                          <TableCell>{getDurationLabel(grant)}</TableCell>
                          <TableCell>
                            {(() => {
                              const status = getGrantStatusLabel(grant);
                              if (status === "active") {
                                return (
                                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                    <ShieldCheck className="h-3 w-3" /> Active
                                  </span>
                                );
                              }
                              if (status === "expired") {
                                return (
                                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                    <Clock className="h-3 w-3" /> Expired
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  <ShieldX className="h-3 w-3" /> Inactive
                                </span>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {getUserName(grant.granted_by_user)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDateTime(grant.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            {grant.is_active && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setRevokingGrant(grant)}
                              >
                                Revoke
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">
                          No grants found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {grantsData && grantsData.total > 0 && (
                <DataTablePagination
                  page={grantsData.page}
                  pageSize={grantsData.page_size}
                  totalItems={grantsData.total}
                  totalPages={grantsData.total_pages}
                  onPageChange={(page) => setGrantPage(page)}
                  onPageSizeChange={(pageSize) => {
                    setGrantPageSize(pageSize);
                    setGrantPage(1);
                  }}
                  pageSizeOptions={[10, 20, 50, 100]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-log" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>
                Review grant changes, expirations, write actions, and denied write attempts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Event</Label>
                  <Select value={auditEventType || "__all__"} onValueChange={(value) => setAuditEventType(value === "__all__" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All events</SelectItem>
                      {Object.entries(EVENT_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tab</Label>
                  <Select value={auditTabName || "__all__"} onValueChange={(value) => setAuditTabName(value === "__all__" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All tabs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All tabs</SelectItem>
                      {ADMIN_TABS.map((tab) => (
                        <SelectItem key={tab} value={tab}>
                          {getTabLabel(tab)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setAuditEventType("");
                      setAuditTabName("");
                      setAuditPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>

              <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Time</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Target User</TableHead>
                      <TableHead>Tab</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditData?.data?.length ? (
                      auditData.data.map((entry: AuditLogEntry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTime(entry.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              entry.event_type === "write_action"
                                ? "default"
                                : entry.event_type === "unauthorized_attempt"
                                  ? "destructive"
                                  : entry.event_type === "grant_created"
                                    ? "secondary"
                                    : "outline"
                            }>
                              {EVENT_LABELS[entry.event_type] || entry.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{entry.actor_name || entry.actor_user_id.slice(0, 8)}</div>
                            <div className="text-xs text-muted-foreground">{entry.actor_role}</div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {entry.target_user_id ? entry.target_user_id.slice(0, 8) : "—"}
                          </TableCell>
                          <TableCell>{entry.tab_name || "—"}</TableCell>
                          <TableCell className="max-w-[220px] truncate text-xs font-mono text-muted-foreground">
                            {entry.endpoint ? `${entry.http_method} ${entry.endpoint}` : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{entry.ip_address || "—"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                          No audit events found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {auditData && auditData.total > 0 && (
                <DataTablePagination
                  page={auditData.page}
                  pageSize={auditData.page_size}
                  totalItems={auditData.total}
                  totalPages={auditData.total_pages}
                  onPageChange={(page) => setAuditPage(page)}
                  onPageSizeChange={() => {}}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!revokingGrant} onOpenChange={() => setRevokingGrant(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Revoke Write Access</DialogTitle>
            <DialogDescription>
              This will immediately remove write access for{" "}
              <strong>{getUserName(revokingGrant?.granted_to_user)}</strong>
              {revokingGrant?.tab_name
                ? ` on the "${getTabLabel(revokingGrant.tab_name)}" tab`
                : " across the entire system"}
              . Existing audit records will remain in place.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRevokingGrant(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => revokingGrant && revokeGrantMutation.mutate(revokingGrant.id)}
              disabled={revokeGrantMutation.isLoading}
            >
              {revokeGrantMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke Access"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
