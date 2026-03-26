"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useApi, useMutation } from "@/hooks/use-api";
import { agentsApi } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/shared/loading-states";

export default function AgentEditPage() {
  const params = useParams();
  const { status } = useSession();
  const router = useRouter();
  const agentId = params.agentId as string;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: agent, isLoading, error, refetch } = useApi(
    () => agentsApi.get(agentId),
    [agentId, mounted, status === 'authenticated'],
    { 
      cacheKey: `agent-edit-${agentId}`,
      enabled: mounted && status === 'authenticated'
    }
  );

  const updateMutation = useMutation(
    (data: any) => agentsApi.update(agentId, data),
    {
      onSuccess: () => {
        toast.success("Agent updated successfully!");
        router.push(`/super-admin/agents/${agentId}`);
        router.refresh();
      },
      onError: (err) => {
        toast.error("Update failed", {
          description: err.message || "Failed to update agent details."
        });
      },
    }
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    updateMutation.mutate({
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone_number: formData.get("phone") as string,
      national_id_number: formData.get("national_id") as string,
      monthly_income: Number(formData.get("income")),
      employment_status: formData.get("employment") as any,
      employer_name: formData.get("employer") as string,
    });
  };

  if (!mounted) return null;

  if (isLoading) return <LoadingState message="Loading agent details..." />;
  if (error) return <ErrorState message={error.message || "Failed to load agent"} onRetry={refetch} />;
  if (!agent) return <ErrorState message="Agent not found" onRetry={refetch} />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/super-admin/agents/${agentId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Agent</h1>
          <p className="text-muted-foreground">Update details for {agent.full_name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Information</CardTitle>
          <CardDescription>
            Update the agent's personal and employment information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agent_id">Agent ID (Read-only)</Label>
                <Input id="agent_id" value={agent.agent_id} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" defaultValue={agent.full_name} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" defaultValue={agent.email || ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" defaultValue={agent.phone_number || ""} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="national_id">National ID (NIN)</Label>
                <Input id="national_id" name="national_id" defaultValue={agent.national_id_number || ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income">Monthly Income (UGX)</Label>
                <Input id="income" name="income" type="number" defaultValue={Number(agent.monthly_income) || 0} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employment">Employment Status</Label>
                <Select name="employment" defaultValue={agent.employment_status || "full_time"}>
                  <SelectTrigger id="employment">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="self_employed">Self Employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employer">Employer Name</Label>
                <Input id="employer" name="employer" defaultValue={agent.employer_name || ""} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href={`/super-admin/agents/${agentId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={updateMutation.isLoading} className="bg-[#004B91] hover:bg-[#003B71]">
                {updateMutation.isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
