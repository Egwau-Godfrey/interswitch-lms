"use client";

import * as React from "react";
import Link from "next/link";
import {
  MoreVertical,
  Eye,
  Banknote,
  Clock,
  ListChecks,
  XCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "@/hooks/use-api";
import { whitelistApi } from "@/lib/api";
import type { AgentLoanSummary } from "@/lib/types";
import { toast } from "sonner";

interface AgentRowActionsProps {
  agent: AgentLoanSummary;
  basePath: string;
  canWrite?: boolean;
  onRefetch: () => void;
  onActivate?: (agent: AgentLoanSummary) => void;
  onDeactivate?: (agent: AgentLoanSummary) => void;
  whitelistModeEnabled?: boolean;
}

export function AgentRowActions({
  agent,
  basePath,
  canWrite = true,
  onRefetch,
  onActivate,
  onDeactivate,
  whitelistModeEnabled = false,
}: AgentRowActionsProps) {
  // Track this agent's whitelist status locally
  const [isWhitelisted, setIsWhitelisted] = React.useState<boolean | null>(null);

  // Only fetch whitelist status if whitelist mode is enabled
  React.useEffect(() => {
    if (!whitelistModeEnabled) {
      setIsWhitelisted(null);
      return;
    }
    let cancelled = false;
    whitelistApi
      .getStatus(agent.agent_id)
      .then((status) => {
        if (!cancelled) setIsWhitelisted(status.is_whitelisted);
      })
      .catch(() => {
        if (!cancelled) setIsWhitelisted(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agent.agent_id, whitelistModeEnabled]);

  const whitelistAddMutation = useMutation(
    (agentId: string) => whitelistApi.add({ agent_id: agentId }),
    {
      onSuccess: () => {
        toast.success("Agent added to whitelist");
        setIsWhitelisted(true);
        onRefetch();
      },
      onError: (err) => toast.error("Failed to add to whitelist", { description: err.message }),
    }
  );

  const whitelistRemoveMutation = useMutation(
    (agentId: string) => whitelistApi.remove(agentId),
    {
      onSuccess: () => {
        toast.success("Agent removed from whitelist");
        setIsWhitelisted(false);
        onRefetch();
      },
      onError: (err) => toast.error("Failed to remove from whitelist", { description: err.message }),
    }
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <Link href={`${basePath}/agents/${agent.agent_id}`}>
          <DropdownMenuItem>
            <Eye className="w-4 h-4 mr-2" /> View Details
          </DropdownMenuItem>
        </Link>
        <Link href={`${basePath}/loans/new?agent_id=${agent.agent_id}`}>
          <DropdownMenuItem>
            <Banknote className="w-4 h-4 mr-2" /> New Loan
          </DropdownMenuItem>
        </Link>
        <Link href={`${basePath}/agents/${agent.agent_id}?tab=transactions`}>
          <DropdownMenuItem>
            <Clock className="w-4 h-4 mr-2" /> History
          </DropdownMenuItem>
        </Link>
        {canWrite && (
          <>
            <DropdownMenuSeparator />
            {/* Whitelist actions: only show when whitelist mode is enabled */}
            {whitelistModeEnabled && isWhitelisted !== null && (
              isWhitelisted ? (
                <DropdownMenuItem
                  className="text-orange-600"
                  onClick={() => whitelistRemoveMutation.mutate(agent.agent_id)}
                  disabled={whitelistRemoveMutation.isLoading}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Remove from Whitelist
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-blue-600"
                  onClick={() => whitelistAddMutation.mutate(agent.agent_id)}
                  disabled={whitelistAddMutation.isLoading}
                >
                  <ListChecks className="w-4 h-4 mr-2" /> Add to Whitelist
                </DropdownMenuItem>
              )
            )}
            {whitelistModeEnabled && isWhitelisted !== null && <DropdownMenuSeparator />}
            {agent.status === "inactive" ? (
              <DropdownMenuItem
                className="text-emerald-600"
                onClick={() => onActivate?.(agent)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Activate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDeactivate?.(agent)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Deactivate
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
