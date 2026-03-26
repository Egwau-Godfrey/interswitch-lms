"use client";

import * as React from "react";
import {
  Key,
  Plus,
  Copy,
  RefreshCw,
  Trash2,
  MoreVertical,
  ShieldCheck,
  Globe,
  Clock,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useApiClients, useIssueApiKey, useRevokeApiKey } from "@/hooks/use-api-clients";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { useApi, useMutation } from "@/hooks/use-api";
import { settingsApi } from "@/lib/api/settings";

export default function ApiManagementPage() {
  const { status } = useSession();
  const [isIssueOpen, setIsIssueOpen] = React.useState(false);
  const [newClientName, setNewClientName] = React.useState("");
  const [newClientIps, setNewClientIps] = React.useState("");
  const [newlyIssuedKey, setNewlyIssuedKey] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);


  const { data: clientsData, isLoading, refetch } = useApiClients(
    { page: 1, page_size: 100 },
    { enabled: mounted && status === 'authenticated' }
  );
  const { mutateAsync: issueKey, isLoading: isIssuing } = useIssueApiKey();
  const { mutateAsync: revokeKey } = useRevokeApiKey();

  // Settings State
  const [webhookUrl, setWebhookUrl] = React.useState("");
  const [isIpWhitelisting, setIsIpWhitelisting] = React.useState(false);
  const [isRateLimiting, setIsRateLimiting] = React.useState(false);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);

  const { data: settings, isLoading: settingsLoading, refetch: refetchSettings } = useApi(
    () => settingsApi.list(),
    [mounted, status === 'authenticated'],
    { 
      cacheKey: "system-settings",
      enabled: mounted && status === 'authenticated'
    }
  );

  React.useEffect(() => {
    if (settings) {
      const webhook = settings.find(s => s.key === "webhook_url")?.value || "";
      const ipWhitelisting = settings.find(s => s.key === "ip_whitelisting_enabled")?.value === "true";
      const rateLimit = settings.find(s => s.key === "rate_limiting_enabled")?.value === "true";
      
      setWebhookUrl(webhook);
      setIsIpWhitelisting(ipWhitelisting);
      setIsRateLimiting(rateLimit);
    }
  }, [settings]);

  const updateSettingMutation = useMutation(
    ({ key, value }: { key: string; value: string }) => settingsApi.update(key, value),
    {
      onSuccess: () => {
        toast.success("Setting updated");
        refetchSettings();
        setSavingKey(null);
      },
      onError: (err) => {
        toast.error("Failed to update setting", { description: err.message });
        setSavingKey(null);
      }
    }
  );

  const testWebhookMutation = useMutation(
    () => settingsApi.testWebhook(),
    {
      onSuccess: (res) => {
        if (res.status === "success") {
          toast.success("Webhook test successful", { description: `Response Code: ${res.status_code}` });
        } else {
          toast.error("Webhook test failed", { description: res.message });
        }
      },
      onError: (err) => {
        toast.error("Webhook test failed", { description: err.message });
      }
    }
  );

  const handleSaveWebhook = () => {
    setSavingKey("webhook_url");
    updateSettingMutation.mutate({ key: "webhook_url", value: webhookUrl });
  };



  const handleIssueKey = async () => {
    if (!newClientName.trim()) {
      toast.error("Client name is required");
      return;
    }
    try {
      const ips = newClientIps.trim() ? newClientIps.split(',').map(ip => ip.trim()) : undefined;
      const result = await issueKey({ name: newClientName, allowed_ips: ips });
      setNewlyIssuedKey(result.api_key);
      toast.success("New API Key generated!");
      setNewClientName("");
      setNewClientIps("");
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) return;
    try {
      await revokeKey(id);
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API Key copied to clipboard");
  };

  const closeDialog = () => {
    setIsIssueOpen(false);
    setNewlyIssuedKey(null);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Management</h1>
          <p className="text-muted-foreground">Manage API clients and secure access tokens.</p>
        </div>
        <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#004B91] hover:bg-[#003B71]">
              <Plus className="w-4 h-4 mr-2" />
              Issue New API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Issue New API Key</DialogTitle>
              <DialogDescription>
                Provide a descriptive name for this client. The key will only be shown once.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {newlyIssuedKey ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted border rounded-md">
                    <p className="text-sm font-medium mb-2">Please copy this key immediately. You will not be able to see it again.</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-background border rounded font-mono text-sm break-all">
                        {newlyIssuedKey}
                      </code>
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(newlyIssuedKey)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="client_name">Client Name</Label>
                    <Input id="client_name" value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="e.g. Android Mobile App" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ips">Allowed IPs (Optional)</Label>
                    <Input id="ips" value={newClientIps} onChange={e => setNewClientIps(e.target.value)} placeholder="e.g. 192.168.1.1, 10.0.0.1" />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              {newlyIssuedKey ? (
                <Button type="button" onClick={closeDialog}>Close</Button>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button onClick={handleIssueKey} disabled={isIssuing}>
                    {isIssuing ? "Generating..." : "Generate Key"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-blue-50/30 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#004B91]">
              {isLoading ? "-" : clientsData?.data.filter(c => c.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/30 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">API Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">99.9%</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/30 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">124ms</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>Secret keys for authenticating with the Interswitch Loans API.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading API clients...</TableCell>
                </TableRow>
              ) : clientsData?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No API clients found.</TableCell>
                </TableRow>
              ) : (
                clientsData?.data.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-xs">********************{k.id.substring(k.id.length - 4)}</code>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(k.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{k.last_used_at ? format(new Date(k.last_used_at), "MMM d, yyyy") : "Never"}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "border-none",
                        k.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {k.is_active ? "active" : "revoked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => handleRevokeKey(k.id)} disabled={!k.is_active}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#004B91]" />
              <CardTitle>Webhook Configuration</CardTitle>
            </div>
            <CardDescription>Configure URLs for real-time repayment notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook_url">Endpoint URL</Label>
              <div className="flex gap-2">
                <Input 
                  id="webhook_url" 
                  placeholder="https://api.yourdomain.com/webhooks/loans" 
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  onClick={() => testWebhookMutation.mutate()}
                  disabled={testWebhookMutation.isLoading}
                >
                  {testWebhookMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test"}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">SSL Verification Enabled</span>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 pt-4">
            <Button 
              size="sm" 
              onClick={handleSaveWebhook}
              disabled={updateSettingMutation.isLoading && savingKey === "webhook_url"}
            >
              {updateSettingMutation.isLoading && savingKey === "webhook_url" ? "Saving..." : "Save Webhook Settings"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#E31C2D]" />
              <CardTitle>API Security</CardTitle>
            </div>
            <CardDescription>Global security policies for all API clients.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>IP Whitelisting</Label>
                <p className="text-xs text-muted-foreground">Restrict API access to known IP addresses only.</p>
              </div>
              <Switch 
                checked={isIpWhitelisting} 
                onCheckedChange={(checked) => {
                  setIsIpWhitelisting(checked);
                  updateSettingMutation.mutate({ key: "ip_whitelisting_enabled", value: checked ? "true" : "false" });
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Rate Limiting</Label>
                <p className="text-xs text-muted-foreground">Prevent abuse by limiting requests per minute.</p>
              </div>
              <Switch 
                checked={isRateLimiting} 
                onCheckedChange={(checked) => {
                  setIsRateLimiting(checked);
                  updateSettingMutation.mutate({ key: "rate_limiting_enabled", value: checked ? "true" : "false" });
                }}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 pt-4">
            <Button variant="outline" size="sm">View Security Logs</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
