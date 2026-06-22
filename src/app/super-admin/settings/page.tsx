"use client";

import * as React from "react";
import {
  Bell,
  Smartphone,
  AlertCircle,
  Shield,
  Plus,
  ShieldCheck,
  ShieldX,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useApi, useMutation } from "@/hooks/use-api";
import { settingsApi } from "@/lib/api/settings";
import { permissionsApi } from "@/lib/api/permissions";
import { usersApi } from "@/lib/api";
import { useApiAuth } from "@/hooks/use-api-auth";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import type { AuditEventType, PermissionGrant } from "@/lib/types";

const ADMIN_TAB_LIST = [
  "agents",
  "loans",
  "scoring",
  "loan-products",
  "payments",
  "reports",
  "users",
  "settings",
  "api-management",
] as const;

export default function SettingsPage() {
  const { session, isReady } = useApiAuth();
  const [mounted, setMounted] = React.useState(false);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);

  // Access Control state
  const [isGrantOpen, setIsGrantOpen] = React.useState(false);
  const [revokingGrant, setRevokingGrant] = React.useState<PermissionGrant | null>(null);
  const [grantUserId, setGrantUserId] = React.useState("");
  const [grantScope, setGrantScope] = React.useState<"system" | "tab">("tab");
  const [grantTabName, setGrantTabName] = React.useState<string>("agents");
  const [grantIsPermanent, setGrantIsPermanent] = React.useState(false);
  const [grantExpiresAt, setGrantExpiresAt] = React.useState("");
  const [grantNotes, setGrantNotes] = React.useState("");
  const [auditPage, setAuditPage] = React.useState(1);
  const [auditEventType, setAuditEventType] = React.useState("");

  const isSuperAdmin =
    (session?.user as any)?.role === "super_admin" || (session?.user as any)?.isAdmin;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // System settings
  const { data: settings, isLoading, refetch } = useApi(
    () => settingsApi.list(),
    [mounted, isReady],
    { cacheKey: "system-settings", enabled: mounted && isReady }
  );

  // Users list (for grant dialog — users only)
  const { data: usersData } = useApi(
    () => usersApi.list({ page: 1, page_size: 100 }),
    [mounted, isReady],
    {
      cacheKey: "all-users-grants",
      enabled: mounted && isReady && isSuperAdmin,
    }
  );

  // Grants list
  const { data: grantsData, refetch: refetchGrants } = useApi(
    () => permissionsApi.listGrants({ page: 1, page_size: 50 }),
    [mounted, isReady],
    {
      cacheKey: "permission-grants",
      enabled: mounted && isReady && isSuperAdmin,
    }
  );

  // Audit log
  const { data: auditData } = useApi(
    () =>
      permissionsApi.getAuditLog({
        page: auditPage,
        page_size: 20,
        event_type: auditEventType ? (auditEventType as AuditEventType) : undefined,
      }),
    [auditPage, auditEventType, mounted, isReady],
    {
      cacheKey: `audit-log-${auditPage}-${auditEventType}`,
      enabled: mounted && isReady && isSuperAdmin,
    }
  );

  // Settings mutation
  const updateSettingMutation = useMutation(
    ({ key, value }: { key: string; value: string }) => settingsApi.update(key, value),
    {
      onSuccess: () => {
        toast.success("Setting updated");
        refetch();
        setSavingKey(null);
      },
      onError: () => {
        toast.error("Failed to update setting");
        setSavingKey(null);
      },
    }
  );

  // Grant mutation
  const createGrantMutation = useMutation(
    (data: any) => permissionsApi.createGrant(data),
    {
      onSuccess: () => {
        toast.success("Write access granted successfully");
        setIsGrantOpen(false);
        setGrantUserId("");
        setGrantNotes("");
        setGrantExpiresAt("");
        refetchGrants();
      },
      onError: (err) => {
        toast.error("Failed to create grant", { description: err.message });
      },
    }
  );

  // Revoke mutation
  const revokeGrantMutation = useMutation(
    (grantId: string) => permissionsApi.revokeGrant(grantId),
    {
      onSuccess: () => {
        toast.success("Grant revoked successfully");
        setRevokingGrant(null);
        refetchGrants();
      },
      onError: (err) => {
        toast.error("Failed to revoke grant", { description: err.message });
        setRevokingGrant(null);
      },
    }
  );

  const getSetting = (key: string) => settings?.find((s) => s.key === key)?.value;

  const handleToggle = (key: string, currentValue: string) => {
    const newValue = currentValue === "true" ? "false" : "true";
    setSavingKey(key);
    updateSettingMutation.mutate({ key, value: newValue });
  };

  const handleInputChange = (key: string, value: string) => {
    setSavingKey(key);
    updateSettingMutation.mutate({ key, value });
  };

  const handleCreateGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUserId) { toast.error("Please select a user"); return; }
    if (grantScope === "tab" && !grantTabName) { toast.error("Please select a tab"); return; }
    if (!grantIsPermanent && !grantExpiresAt) { toast.error("Please set an expiry date/time"); return; }
    createGrantMutation.mutate({
      granted_to_user_id: grantUserId,
      scope: grantScope,
      tab_name: grantScope === "tab" ? grantTabName : undefined,
      is_permanent: grantIsPermanent,
      expires_at: grantIsPermanent ? undefined : new Date(grantExpiresAt).toISOString(),
      notes: grantNotes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure system behavior, notifications, and security policies.
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="recovery">Debt Recovery</TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="access-control">
              <Shield className="w-4 h-4 mr-1" />
              Access Control
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Notifications ── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>
                Choose how you want to be notified about system events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: "email_alerts_enabled",
                  icon: <Bell className="w-5 h-5 text-blue-500" />,
                  label: "Email Alerts",
                  desc: "Receive daily summaries and high-priority alerts via email.",
                },
                {
                  key: "sms_notifications_enabled",
                  icon: <Smartphone className="w-5 h-5 text-emerald-500" />,
                  label: "SMS Notifications",
                  desc: "Send SMS reminders to agents before loan due dates.",
                },
                {
                  key: "system_logs_enabled",
                  icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
                  label: "System Logs",
                  desc: "Enable verbose logging for all financial transactions.",
                },
              ].map(({ key, icon, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {icon}
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {savingKey === key && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                    <Switch
                      checked={getSetting(key) === "true"}
                      onCheckedChange={() => handleToggle(key, getSetting(key) || "false")}
                      disabled={isLoading || savingKey === key}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security ── */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>Manage password requirements and access controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication (2FA)</Label>
                  <p className="text-xs text-muted-foreground">Require 2FA for all admin logins.</p>
                </div>
                <div className="flex items-center gap-3">
                  {savingKey === "two_factor_auth_enabled" && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  <Switch
                    checked={getSetting("two_factor_auth_enabled") === "true"}
                    onCheckedChange={() =>
                      handleToggle("two_factor_auth_enabled", getSetting("two_factor_auth_enabled") || "false")
                    }
                    disabled={isLoading || savingKey === "two_factor_auth_enabled"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Debt Recovery ── */}
        <TabsContent value="recovery">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Strike &amp; Recovery Logic</CardTitle>
              <CardDescription>
                Configure rules for automated debt recovery from agent wallets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Auto-Strike</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically attempt recovery for overdue loans.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {savingKey === "auto_strike_enabled" && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                    <Switch
                      checked={getSetting("auto_strike_enabled") === "true"}
                      onCheckedChange={() =>
                        handleToggle("auto_strike_enabled", getSetting("auto_strike_enabled") || "false")
                      }
                      disabled={isLoading || savingKey === "auto_strike_enabled"}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="strike_days">Trigger After (Days Overdue)</Label>
                    <div className="relative">
                      <Input
                        id="strike_days"
                        type="number"
                        defaultValue={getSetting("auto_strike_days") || "7"}
                        onBlur={(e) => handleInputChange("auto_strike_days", e.target.value)}
                        disabled={isLoading || savingKey === "auto_strike_days"}
                      />
                      {savingKey === "auto_strike_days" && (
                        <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="strike_percentage">Recovery Percentage (%)</Label>
                    <div className="relative">
                      <Input
                        id="strike_percentage"
                        type="number"
                        defaultValue={getSetting("auto_strike_percentage") || "100"}
                        onBlur={(e) => handleInputChange("auto_strike_percentage", e.target.value)}
                        disabled={isLoading || savingKey === "auto_strike_percentage"}
                      />
                      {savingKey === "auto_strike_percentage" && (
                        <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_days">Default After (Days Overdue)</Label>
                    <div className="relative">
                      <Input
                        id="default_days"
                        type="number"
                        defaultValue={getSetting("default_days") || "90"}
                        onBlur={(e) => handleInputChange("default_days", e.target.value)}
                        disabled={isLoading || savingKey === "default_days"}
                      />
                      {savingKey === "default_days" && (
                        <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Official default rule used in reports and risk analytics.</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold">Compliance Note</p>
                  <p>
                    Auto-strike requires explicit agent consent during enrollment. Ensure all
                    legal disclosures are updated.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Access Control (super_admin only) ── */}
        {isSuperAdmin && (
          <TabsContent value="access-control" className="space-y-6">
            {/* Grants header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Permission Grants</h2>
                <p className="text-sm text-muted-foreground">
                  Manage write-access grants for user-role users.
                </p>
              </div>
              <Button
                onClick={() => setIsGrantOpen(true)}
                className="bg-[#004B91] hover:bg-[#003B71]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Grant Write Access
              </Button>
            </div>

            {/* Grants table */}
            <div className="rounded-md border bg-card">
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
                  {!grantsData?.data?.length ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground h-20">
                        No grants yet. Click &quot;Grant Write Access&quot; to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    grantsData.data.map((grant) => (
                      <TableRow key={grant.id}>
                        <TableCell className="font-medium">
                          {grant.granted_to_user?.first_name} {grant.granted_to_user?.last_name}
                          <div className="text-xs text-muted-foreground">
                            {grant.granted_to_user?.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              grant.scope === "system"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {grant.scope === "system" ? "System-wide" : "Tab"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{grant.tab_name || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {grant.is_permanent ? (
                            <span className="text-emerald-600 font-medium">Permanent</span>
                          ) : (
                            <span className="text-amber-600">
                              Until{" "}
                              {grant.expires_at
                                ? new Date(grant.expires_at).toLocaleDateString()
                                : "—"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {grant.is_active ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              <ShieldCheck className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              <ShieldX className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {grant.granted_by_user?.first_name} {grant.granted_by_user?.last_name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(grant.created_at).toLocaleDateString()}
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
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Audit Log */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Audit Log</h2>
                <Select value={auditEventType} onValueChange={setAuditEventType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All events</SelectItem>
                    <SelectItem value="grant_created">Grant Created</SelectItem>
                    <SelectItem value="grant_revoked">Grant Revoked</SelectItem>
                    <SelectItem value="grant_expired">Grant Expired</SelectItem>
                    <SelectItem value="write_action">Write Action</SelectItem>
                    <SelectItem value="unauthorized_attempt">Unauthorized Attempt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Time</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Tab</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!auditData?.data?.length ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground h-20"
                        >
                          No audit events yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditData.data.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(entry.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                entry.event_type === "write_action"
                                  ? "bg-blue-100 text-blue-700"
                                  : entry.event_type === "unauthorized_attempt"
                                  ? "bg-red-100 text-red-700"
                                  : entry.event_type === "grant_created"
                                  ? "bg-green-100 text-green-700"
                                  : entry.event_type === "grant_revoked"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {entry.event_type.replace(/_/g, " ")}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {entry.actor_name || entry.actor_user_id.slice(0, 8)}
                            <div className="text-xs text-muted-foreground">{entry.actor_role}</div>
                          </TableCell>
                          <TableCell className="text-sm">{entry.tab_name || "—"}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {entry.endpoint
                              ? `${entry.http_method} ${entry.endpoint}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {entry.ip_address || "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {auditData && auditData.total > 20 && (
                <DataTablePagination
                  page={auditPage}
                  pageSize={20}
                  totalItems={auditData.total}
                  totalPages={auditData.total_pages}
                  onPageChange={setAuditPage}
                  onPageSizeChange={() => {}}
                />
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* ── Grant Write Access Dialog ── */}
      <Dialog open={isGrantOpen} onOpenChange={setIsGrantOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Grant Write Access</DialogTitle>
            <DialogDescription>
              Grant a user write access to a specific tab or the entire system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGrant} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>User</Label>
              <Select value={grantUserId} onValueChange={setGrantUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent>
                  {(usersData?.data || [])
                    .filter((u: any) => u.role === "user")
                    .map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.first_name} {u.last_name} ({u.username})
                      </SelectItem>
                    ))}
                  {(usersData?.data || []).filter((u: any) => u.role === "user").length ===
                    0 && (
                    <SelectItem value="__none__" disabled>
                      No users found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select
                value={grantScope}
                onValueChange={(v) => setGrantScope(v as "system" | "tab")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tab">Specific Tab</SelectItem>
                  <SelectItem value="system">System-wide (all tabs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {grantScope === "tab" && (
              <div className="space-y-2">
                <Label>Tab</Label>
                <Select value={grantTabName} onValueChange={setGrantTabName}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_TAB_LIST.map((tab) => (
                      <SelectItem key={tab} value={tab}>
                        {tab}
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
                onValueChange={(v) => setGrantIsPermanent(v === "permanent")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Temporary (with expiry)</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!grantIsPermanent && (
              <div className="space-y-2">
                <Label>Expires At</Label>
                <Input
                  type="datetime-local"
                  value={grantExpiresAt}
                  onChange={(e) => setGrantExpiresAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Reason for granting access..."
                value={grantNotes}
                onChange={(e) => setGrantNotes(e.target.value)}
                maxLength={500}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGrantOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createGrantMutation.isLoading}
                className="bg-[#004B91] hover:bg-[#003B71]"
              >
                {createGrantMutation.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Granting...
                  </>
                ) : (
                  "Grant Access"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Revoke Confirmation ── */}
      <AlertDialog open={!!revokingGrant} onOpenChange={() => setRevokingGrant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Write Access</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately remove write access for{" "}
              <strong>
                {revokingGrant?.granted_to_user?.first_name}{" "}
                {revokingGrant?.granted_to_user?.last_name}
              </strong>
              {revokingGrant?.tab_name
                ? ` on the &quot;${revokingGrant.tab_name}&quot; tab`
                : " (system-wide)"}
              . Any in-progress operations will complete, but no further writes will be
              permitted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                revokingGrant && revokeGrantMutation.mutate(revokingGrant.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeGrantMutation.isLoading ? "Revoking..." : "Revoke Access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
