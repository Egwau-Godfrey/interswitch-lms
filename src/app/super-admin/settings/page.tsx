"use client";

import * as React from "react";
import { 
  Bell, 
  Smartphone,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useApi, useMutation } from "@/hooks/use-api";
import { settingsApi } from "@/lib/api/settings";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { status } = useSession();
  const [mounted, setMounted] = React.useState(false);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: settings, isLoading, refetch } = useApi(
    () => settingsApi.list(),
    [mounted, status === 'authenticated'],
    { 
      cacheKey: "system-settings",
      enabled: mounted && status === 'authenticated'
    }
  );

  const updateSettingMutation = useMutation(
    ({ key, value }: { key: string; value: string }) => settingsApi.update(key, value),
    {
      onSuccess: () => {
        toast.success("Setting updated");
        refetch();
        setSavingKey(null);
      },
      onError: (err) => {
        toast.error("Failed to update setting");
        setSavingKey(null);
      }
    }
  );

  const getSetting = (key: string) => settings?.find(s => s.key === key)?.value;
  
  const handleToggle = (key: string, currentValue: string) => {
    const newValue = currentValue === "true" ? "false" : "true";
    setSavingKey(key);
    updateSettingMutation.mutate({ key, value: newValue });
  };

  const handleInputChange = (key: string, value: string) => {
    setSavingKey(key);
    updateSettingMutation.mutate({ key, value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure system behavior, notifications, and security policies.</p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="recovery">Debt Recovery</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>Choose how you want to be notified about system events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-500" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Email Alerts</p>
                    <p className="text-xs text-muted-foreground">Receive daily summaries and high-priority alerts via email.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {savingKey === "email_alerts_enabled" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  <Switch 
                    checked={getSetting("email_alerts_enabled") === "true"} 
                    onCheckedChange={() => handleToggle("email_alerts_enabled", getSetting("email_alerts_enabled") || "false")}
                    disabled={isLoading || savingKey === "email_alerts_enabled"}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-emerald-500" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">SMS Notifications</p>
                    <p className="text-xs text-muted-foreground">Send SMS reminders to agents before loan due dates.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {savingKey === "sms_notifications_enabled" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  <Switch 
                    checked={getSetting("sms_notifications_enabled") === "true"} 
                    onCheckedChange={() => handleToggle("sms_notifications_enabled", getSetting("sms_notifications_enabled") || "false")}
                    disabled={isLoading || savingKey === "sms_notifications_enabled"}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">System Logs</p>
                    <p className="text-xs text-muted-foreground">Enable verbose logging for all financial transactions.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {savingKey === "system_logs_enabled" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  <Switch 
                    checked={getSetting("system_logs_enabled") === "true"} 
                    onCheckedChange={() => handleToggle("system_logs_enabled", getSetting("system_logs_enabled") || "false")}
                    disabled={isLoading || savingKey === "system_logs_enabled"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recovery">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Strike & Recovery Logic</CardTitle>
              <CardDescription>Configure rules for automated debt recovery from agent wallets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Auto-Strike</Label>
                    <p className="text-xs text-muted-foreground">Automatically attempt recovery for overdue loans.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {savingKey === "auto_strike_enabled" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    <Switch 
                      checked={getSetting("auto_strike_enabled") === "true"} 
                      onCheckedChange={() => handleToggle("auto_strike_enabled", getSetting("auto_strike_enabled") || "false")}
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
                      {savingKey === "auto_strike_days" && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />}
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
                      {savingKey === "auto_strike_percentage" && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold">Compliance Note</p>
                  <p>Auto-strike requires explicit agent consent during enrollment. Ensure all legal disclosures are updated.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>Manage password requirements and access controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication (2FA)</Label>
                    <p className="text-xs text-muted-foreground">Require 2FA for all admin logins.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {savingKey === "two_factor_auth_enabled" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    <Switch 
                      checked={getSetting("two_factor_auth_enabled") === "true"} 
                      onCheckedChange={() => handleToggle("two_factor_auth_enabled", getSetting("two_factor_auth_enabled") || "false")}
                      disabled={isLoading || savingKey === "two_factor_auth_enabled"}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
