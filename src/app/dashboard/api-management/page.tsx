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
  CheckCircle2
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const initialKeys = [
  { id: "1", name: "Mobile App Production", key: "sk_live_********************4a2b", created: "2024-01-15", last_used: "2 mins ago", status: "active" },
  { id: "2", name: "Agent Web Portal", key: "sk_live_********************9f8e", created: "2024-02-20", last_used: "1 hour ago", status: "active" },
  { id: "3", name: "Interswitch ERP Link", key: "sk_live_********************1c3d", created: "2024-03-05", last_used: "Never", status: "revoked" },
];

export default function ApiManagementPage() {
  const [keys, setKeys] = React.useState(initialKeys);
  const [isIssueOpen, setIsIssueOpen] = React.useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API Key copied to clipboard");
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
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input id="client_name" placeholder="e.g. Android Mobile App" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ips">Allowed IPs (Optional)</Label>
                <Input id="ips" placeholder="e.g. 192.168.1.1, 10.0.0.1" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsIssueOpen(false)}>Cancel</Button>
              <Button onClick={() => { toast.success("New API Key generated!"); setIsIssueOpen(false); }}>Generate Key</Button>
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
            <div className="text-2xl font-bold text-[#004B91]">8</div>
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
              {keys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.name}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-xs">{k.key}</code>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{k.created}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{k.last_used}</TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "border-none",
                      k.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {k.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(k.key)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
                <Input id="webhook_url" placeholder="https://api.yourdomain.com/webhooks/loans" defaultValue="https://callback.interswitch.com/loans" />
                <Button variant="outline">Test</Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">SSL Verification Enabled</span>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 pt-4">
            <Button size="sm">Save Webhook Settings</Button>
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
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Rate Limiting</Label>
                <p className="text-xs text-muted-foreground">Prevent abuse by limiting requests per minute.</p>
              </div>
              <Switch defaultChecked />
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
