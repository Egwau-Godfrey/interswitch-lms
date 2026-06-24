"use client";

import type { Loan, LoanStatusTab } from "@/lib/types";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";
import { LoanStatusBadge } from "@/components/shared/status-badges";
import { Calendar } from "lucide-react";

export interface LoanColumnDef {
  key: string;
  header: string;
  className?: string;
  hidden?: string; // 'md' | 'lg' | 'sm'
  cell: (loan: Loan) => React.ReactNode;
}

// ============================================
// Shared Cell Components
// ============================================

function LoanIdCell({ loan }: { loan: Loan }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[10px] font-semibold">
        {loan.id.substring(0, 8)}...
      </span>
      {loan.disbursement_reference && (
        <span className="text-muted-foreground font-normal text-[10px]">
          {loan.disbursement_reference}
        </span>
      )}
    </div>
  );
}

function AgentCell({ loan }: { loan: Loan }) {
  return (
    <span className="font-mono text-xs font-semibold">{loan.agent_id}</span>
  );
}

function DueDateCell({ loan }: { loan: Loan }) {
  return (
    <div className="flex items-center text-xs text-muted-foreground">
      <Calendar className="w-3 h-3 mr-1" />
      {loan.due_date ? formatDate(loan.due_date) : "—"}
    </div>
  );
}

// ============================================
// Pending Tab Columns
// ============================================
export const pendingColumns: LoanColumnDef[] = [
  {
    key: "loan_id",
    header: "Loan ID",
    cell: (loan) => <LoanIdCell loan={loan} />,
  },
  {
    key: "agent_id",
    header: "Agent ID",
    cell: (loan) => <AgentCell loan={loan} />,
  },
  {
    key: "principal",
    header: "Principal",
    cell: (loan) => <span className="text-xs">{formatCurrency(loan.principal_amount)}</span>,
  },
  {
    key: "loan_type",
    header: "Type",
    cell: (loan) => (
      <span className="text-xs capitalize">{loan.loan_type?.replace("_", " ") || "—"}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (loan) => <LoanStatusBadge status={loan.status} />,
  },
  {
    key: "created",
    header: "Created",
    hidden: "lg",
    cell: (loan) => (
      <div className="flex items-center text-xs text-muted-foreground">
        <Calendar className="w-3 h-3 mr-1" />
        {formatDate(loan.created_at)}
      </div>
    ),
  },
];

// ============================================
// Disbursed (Active) Tab Columns
// ============================================
export const disbursedColumns: LoanColumnDef[] = [
  {
    key: "loan_id",
    header: "Loan ID",
    cell: (loan) => <LoanIdCell loan={loan} />,
  },
  {
    key: "agent_id",
    header: "Agent ID",
    cell: (loan) => <AgentCell loan={loan} />,
  },
  {
    key: "principal",
    header: "Principal",
    cell: (loan) => <span className="text-xs">{formatCurrency(loan.principal_amount)}</span>,
  },
  {
    key: "outstanding",
    header: "Outstanding",
    cell: (loan) => (
      <span className={`font-semibold ${loan.outstanding_balance > 0 ? "text-[#E31C2D]" : "text-emerald-600"}`}>
        {formatCurrency(loan.outstanding_balance)}
      </span>
    ),
  },
  {
    key: "interest",
    header: "Interest",
    hidden: "lg",
    cell: (loan) => <span className="text-xs text-muted-foreground">{formatCurrency(loan.interest_amount)}</span>,
  },
  {
    key: "total_paid",
    header: "Total Paid",
    hidden: "lg",
    cell: (loan) => <span className="text-xs text-emerald-600">{formatCurrency(loan.total_paid)}</span>,
  },
  {
    key: "due_date",
    header: "Due Date",
    hidden: "md",
    cell: (loan) => <DueDateCell loan={loan} />,
  },
  {
    key: "status",
    header: "Status",
    cell: (loan) => <LoanStatusBadge status={loan.status} />,
  },
];

// ============================================
// Overdue Tab Columns
// ============================================
export const overdueColumns: LoanColumnDef[] = [
  {
    key: "loan_id",
    header: "Loan ID",
    cell: (loan) => <LoanIdCell loan={loan} />,
  },
  {
    key: "agent_id",
    header: "Agent ID",
    cell: (loan) => <AgentCell loan={loan} />,
  },
  {
    key: "outstanding",
    header: "Outstanding",
    cell: (loan) => <span className="font-semibold text-orange-600">{formatCurrency(loan.outstanding_balance)}</span>,
  },
  {
    key: "days_overdue",
    header: "Days Overdue",
    cell: (loan) => (
      <span className="font-semibold text-orange-600">{loan.days_overdue} days</span>
    ),
  },
  {
    key: "due_date",
    header: "Due Date",
    hidden: "md",
    cell: (loan) => <DueDateCell loan={loan} />,
  },
  {
    key: "penalty",
    header: "Penalty",
    hidden: "lg",
    cell: (loan) => <span className="text-xs text-muted-foreground">{formatCurrency(loan.penalty_amount)}</span>,
  },
  {
    key: "interest",
    header: "Interest",
    hidden: "lg",
    cell: (loan) => <span className="text-xs text-muted-foreground">{formatCurrency(loan.interest_amount)}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (loan) => <LoanStatusBadge status={loan.status} />,
  },
];

// ============================================
// Defaulted Tab Columns
// ============================================
export const defaultedColumns: LoanColumnDef[] = [
  {
    key: "loan_id",
    header: "Loan ID",
    cell: (loan) => <LoanIdCell loan={loan} />,
  },
  {
    key: "agent_id",
    header: "Agent ID",
    cell: (loan) => <AgentCell loan={loan} />,
  },
  {
    key: "outstanding",
    header: "Outstanding",
    cell: (loan) => <span className="font-semibold text-red-600">{formatCurrency(loan.outstanding_balance)}</span>,
  },
  {
    key: "days_overdue",
    header: "Days Overdue",
    cell: (loan) => (
      <span className="font-semibold text-red-600">{loan.days_overdue} days</span>
    ),
  },
  {
    key: "principal",
    header: "Principal",
    hidden: "lg",
    cell: (loan) => <span className="text-xs">{formatCurrency(loan.principal_amount)}</span>,
  },
  {
    key: "due_date",
    header: "Due Date",
    hidden: "md",
    cell: (loan) => <DueDateCell loan={loan} />,
  },
  {
    key: "status",
    header: "Status",
    cell: (loan) => <LoanStatusBadge status={loan.status} />,
  },
];

// ============================================
// Cleared Tab Columns
// ============================================
export const clearedColumns: LoanColumnDef[] = [
  {
    key: "loan_id",
    header: "Loan ID",
    cell: (loan) => <LoanIdCell loan={loan} />,
  },
  {
    key: "agent_id",
    header: "Agent ID",
    cell: (loan) => <AgentCell loan={loan} />,
  },
  {
    key: "principal",
    header: "Principal",
    cell: (loan) => <span className="text-xs">{formatCurrency(loan.principal_amount)}</span>,
  },
  {
    key: "total_paid",
    header: "Total Paid",
    cell: (loan) => <span className="text-xs text-emerald-600">{formatCurrency(loan.total_paid)}</span>,
  },
  {
    key: "interest",
    header: "Interest",
    hidden: "lg",
    cell: (loan) => <span className="text-xs text-muted-foreground">{formatCurrency(loan.interest_amount)}</span>,
  },
  {
    key: "cleared_at",
    header: "Cleared Date",
    hidden: "md",
    cell: (loan) => (
      <div className="flex items-center text-xs text-muted-foreground">
        <Calendar className="w-3 h-3 mr-1" />
        {loan.cleared_at ? formatDate(loan.cleared_at) : "—"}
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (loan) => <LoanStatusBadge status={loan.status} />,
  },
];

// ============================================
// All Loans Tab Columns
// ============================================
export const allLoansColumns: LoanColumnDef[] = [
  {
    key: "loan_id",
    header: "Loan ID",
    cell: (loan) => <LoanIdCell loan={loan} />,
  },
  {
    key: "agent_id",
    header: "Agent ID",
    cell: (loan) => <AgentCell loan={loan} />,
  },
  {
    key: "principal",
    header: "Principal",
    cell: (loan) => <span className="text-xs">{formatCurrency(loan.principal_amount)}</span>,
  },
  {
    key: "outstanding",
    header: "Outstanding",
    cell: (loan) => (
      <span className={`text-xs font-semibold ${loan.outstanding_balance > 0 ? "text-[#E31C2D]" : "text-emerald-600"}`}>
        {formatCurrency(loan.outstanding_balance)}
      </span>
    ),
  },
  {
    key: "loan_type",
    header: "Type",
    hidden: "md",
    cell: (loan) => (
      <span className="text-xs capitalize">{loan.loan_type?.replace("_", " ") || "—"}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (loan) => <LoanStatusBadge status={loan.status} />,
  },
  {
    key: "due_date",
    header: "Due Date",
    hidden: "lg",
    cell: (loan) => <DueDateCell loan={loan} />,
  },
  {
    key: "created",
    header: "Created",
    hidden: "lg",
    cell: (loan) => (
      <div className="flex items-center text-xs text-muted-foreground">
        <Calendar className="w-3 h-3 mr-1" />
        {formatDate(loan.created_at)}
      </div>
    ),
  },
];

// ============================================
// Tab → Columns Map
// ============================================
export const loanTabColumnsMap: Record<LoanStatusTab, LoanColumnDef[]> = {
  pending: pendingColumns,
  disbursed: disbursedColumns,
  overdue: overdueColumns,
  defaulted: defaultedColumns,
  cleared: clearedColumns,
  all: allLoansColumns,
};
