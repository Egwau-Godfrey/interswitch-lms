"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { LoanStatus, AgentStatus, PaymentStatus } from "@/lib/types";

// ============================================
// Loan Status Badge
// ============================================
interface LoanStatusBadgeProps {
  status: LoanStatus;
  className?: string;
}

const loanStatusConfig: Record<LoanStatus, { label: string; variant: string; className: string }> = {
  pending: { label: "Pending", variant: "secondary", className: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400" },
  approved: { label: "Approved", variant: "secondary", className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400" },
  disbursed: { label: "Disbursed", variant: "secondary", className: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400" },
  cleared: { label: "Cleared", variant: "secondary", className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400" },
  overdue: { label: "Overdue", variant: "secondary", className: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400" },
  defaulted: { label: "Defaulted", variant: "secondary", className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400" },
  failed: { label: "Failed", variant: "secondary", className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400" },
};

export function LoanStatusBadge({ status, className }: LoanStatusBadgeProps) {
  const config = loanStatusConfig[status] || loanStatusConfig.pending;
  
  return (
    <Badge variant="outline" className={cn("font-medium border", config.className, className)}>
      {config.label}
    </Badge>
  );
}

// ============================================
// Agent Status Badge
// ============================================
interface AgentStatusBadgeProps {
  status: AgentStatus;
  className?: string;
}

const agentStatusConfig: Record<AgentStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400" },
  active: { label: "Active", className: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400" },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400" },
  suspended: { label: "Suspended", className: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400" },
  blacklisted: { label: "Blacklisted", className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400" },
};

export function AgentStatusBadge({ status, className }: AgentStatusBadgeProps) {
  const config = agentStatusConfig[status] || agentStatusConfig.pending;
  
  return (
    <Badge variant="outline" className={cn("font-medium border", config.className, className)}>
      {config.label}
    </Badge>
  );
}

// ============================================
// Payment Status Badge
// ============================================
interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  posted: { label: "Posted", className: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400" },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400" },
  failed: { label: "Failed", className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400" },
  reversed: { label: "Reversed", className: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400" },
};

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const config = paymentStatusConfig[status] || paymentStatusConfig.pending;
  
  return (
    <Badge variant="outline" className={cn("font-medium border", config.className, className)}>
      {config.label}
    </Badge>
  );
}

// ============================================
// Active/Inactive Badge
// ============================================
interface ActiveBadgeProps {
  isActive: boolean;
  className?: string;
}

export function ActiveBadge({ isActive, className }: ActiveBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border",
        isActive
          ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400"
          : "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400",
        className
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

// ============================================
// Admin Badge
// ============================================
interface AdminBadgeProps {
  isAdmin: boolean;
  className?: string;
}

export function AdminBadge({ isAdmin, className }: AdminBadgeProps) {
  if (!isAdmin) return null;
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400",
        className
      )}
    >
      Admin
    </Badge>
  );
}
