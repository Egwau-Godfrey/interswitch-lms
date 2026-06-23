"use client";

import type { AgentLoanSummary } from "@/lib/types";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";
import { LoanStatusBadge, RiskLevelBadge } from "@/components/shared/status-badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Calendar } from "lucide-react";

export interface ColumnDef {
  key: string;
  header: string;
  className?: string;
  hidden?: string; // 'md' | 'lg' | 'sm'
  cell: (agent: AgentLoanSummary) => React.ReactNode;
}

function AgentCell({ agent }: { agent: AgentLoanSummary }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
          {agent.full_name?.split(" ").map((n) => n[0]).join("") || "?"}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium">{agent.full_name}</span>
    </div>
  );
}

function ContactCell({ agent }: { agent: AgentLoanSummary }) {
  return (
    <div className="flex flex-col text-xs space-y-1">
      {agent.email && (
        <div className="flex items-center text-muted-foreground">
          <Mail className="w-3 h-3 mr-1" /> {agent.email}
        </div>
      )}
      {agent.phone_number && (
        <div className="flex items-center text-muted-foreground">
          <Phone className="w-3 h-3 mr-1" /> {agent.phone_number}
        </div>
      )}
    </div>
  );
}

// ============================================
// Defaulted Tab Columns
// ============================================
export const defaultedColumns: ColumnDef[] = [
  {
    key: "agent",
    header: "Agent",
    cell: (agent) => <AgentCell agent={agent} />,
  },
  {
    key: "agent_id",
    header: "Agent ID",
    className: "font-mono text-xs",
    cell: (agent) => <span className="font-mono text-xs font-semibold">{agent.agent_id}</span>,
  },
  {
    key: "phone",
    header: "Phone",
    hidden: "md",
    cell: (agent) => <span className="text-xs text-muted-foreground">{agent.phone_number || "—"}</span>,
  },
  {
    key: "outstanding",
    header: "Outstanding",
    cell: (agent) => <span className="font-semibold text-red-600">{formatCurrency(agent.total_outstanding)}</span>,
  },
  {
    key: "principal",
    header: "Principal",
    hidden: "lg",
    cell: (agent) => <span className="text-xs">{formatCurrency(agent.total_principal)}</span>,
  },
  {
    key: "interest_penalty",
    header: "Int. + Penalty",
    hidden: "lg",
    cell: (agent) => (
      <span className="text-xs text-muted-foreground">
        {formatCurrency(agent.total_interest + agent.total_penalty)}
      </span>
    ),
  },
  {
    key: "days_overdue",
    header: "Days Overdue",
    cell: (agent) => (
      <span className="font-semibold text-red-600">{agent.days_overdue_max} days</span>
    ),
  },
  {
    key: "risk_level",
    header: "Risk",
    hidden: "md",
    cell: (agent) => <RiskLevelBadge riskLevel={agent.credit_score_risk_level} />,
  },
  {
    key: "loan_limit",
    header: "Loan Limit",
    hidden: "lg",
    cell: (agent) => <span className="text-xs">{formatCurrency(agent.loan_limit || 0)}</span>,
  },
];

// ============================================
// Overdue Tab Columns
// ============================================
export const overdueColumns: ColumnDef[] = [
  {
    key: "agent",
    header: "Agent",
    cell: (agent) => <AgentCell agent={agent} />,
  },
  {
    key: "agent_id",
    header: "Agent ID",
    className: "font-mono text-xs",
    cell: (agent) => <span className="font-mono text-xs font-semibold">{agent.agent_id}</span>,
  },
  {
    key: "outstanding",
    header: "Outstanding",
    cell: (agent) => <span className="font-semibold text-orange-600">{formatCurrency(agent.total_outstanding)}</span>,
  },
  {
    key: "days_overdue",
    header: "Days Overdue",
    cell: (agent) => (
      <span className="font-semibold text-orange-600">{agent.days_overdue_max} days</span>
    ),
  },
  {
    key: "due_date",
    header: "Due Date",
    hidden: "md",
    cell: (agent) => (
      <div className="flex items-center text-xs text-muted-foreground">
        <Calendar className="w-3 h-3 mr-1" />
        {agent.due_date_nearest ? formatDate(agent.due_date_nearest) : "—"}
      </div>
    ),
  },
  {
    key: "risk_level",
    header: "Risk",
    hidden: "md",
    cell: (agent) => <RiskLevelBadge riskLevel={agent.credit_score_risk_level} />,
  },
  {
    key: "phone",
    header: "Phone",
    hidden: "lg",
    cell: (agent) => <span className="text-xs text-muted-foreground">{agent.phone_number || "—"}</span>,
  },
];

// ============================================
// Active Loans Tab Columns
// ============================================
export const activeLoansColumns: ColumnDef[] = [
  {
    key: "agent",
    header: "Agent",
    cell: (agent) => <AgentCell agent={agent} />,
  },
  {
    key: "agent_id",
    header: "Agent ID",
    className: "font-mono text-xs",
    cell: (agent) => <span className="font-mono text-xs font-semibold">{agent.agent_id}</span>,
  },
  {
    key: "outstanding",
    header: "Outstanding",
    cell: (agent) => <span className="font-semibold">{formatCurrency(agent.total_outstanding)}</span>,
  },
  {
    key: "loan_limit",
    header: "Loan Limit",
    hidden: "md",
    cell: (agent) => <span className="text-xs">{formatCurrency(agent.loan_limit || 0)}</span>,
  },
  {
    key: "available_limit",
    header: "Available",
    hidden: "lg",
    cell: (agent) => {
      const available = (agent.loan_limit || 0) - agent.total_principal;
      return <span className={`text-xs ${available < 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(available)}</span>;
    },
  },
  {
    key: "loan_count",
    header: "Loans",
    hidden: "md",
    cell: (agent) => <span className="text-xs">{agent.active_loan_count}</span>,
  },
  {
    key: "total_paid",
    header: "Total Paid",
    hidden: "lg",
    cell: (agent) => <span className="text-xs text-emerald-600">{formatCurrency(agent.total_paid)}</span>,
  },
  {
    key: "due_date",
    header: "Due Date",
    hidden: "md",
    cell: (agent) => (
      <div className="flex items-center text-xs text-muted-foreground">
        <Calendar className="w-3 h-3 mr-1" />
        {agent.due_date_nearest ? formatDate(agent.due_date_nearest) : "—"}
      </div>
    ),
  },
  {
    key: "risk_level",
    header: "Risk",
    hidden: "lg",
    cell: (agent) => <RiskLevelBadge riskLevel={agent.credit_score_risk_level} />,
  },
];

// ============================================
// No Loans Tab Columns
// ============================================
export const noLoansColumns: ColumnDef[] = [
  {
    key: "agent",
    header: "Agent",
    cell: (agent) => <AgentCell agent={agent} />,
  },
  {
    key: "agent_id",
    header: "Agent ID",
    className: "font-mono text-xs",
    cell: (agent) => <span className="font-mono text-xs font-semibold">{agent.agent_id}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (agent) => <span className="capitalize text-xs">{agent.status}</span>,
  },
  {
    key: "loan_limit",
    header: "Loan Limit",
    cell: (agent) => <span className="text-xs">{formatCurrency(agent.loan_limit || 0)}</span>,
  },
  {
    key: "credit_score",
    header: "Credit Score",
    hidden: "md",
    cell: (agent) => (
      <span className="text-xs">
        {agent.last_credit_score !== null ? `${(agent.last_credit_score * 100).toFixed(1)}%` : "—"}
      </span>
    ),
  },
  {
    key: "risk_level",
    header: "Risk",
    hidden: "md",
    cell: (agent) => <RiskLevelBadge riskLevel={agent.credit_score_risk_level} />,
  },
  {
    key: "income",
    header: "Monthly Income",
    hidden: "lg",
    cell: (agent) => <span className="text-xs">{formatCurrency(agent.monthly_income || 0)}</span>,
  },
  {
    key: "employer",
    header: "Employer",
    hidden: "lg",
    cell: (agent) => <span className="text-xs text-muted-foreground">{agent.employer_name || "—"}</span>,
  },
  {
    key: "joined",
    header: "Joined",
    hidden: "md",
    cell: (agent) => (
      <div className="flex items-center text-xs text-muted-foreground">
        <Calendar className="w-3 h-3 mr-1" />
        {formatDate(agent.created_at)}
      </div>
    ),
  },
];

// ============================================
// All Agents Tab Columns
// ============================================
export const allAgentsColumns: ColumnDef[] = [
  {
    key: "agent",
    header: "Agent",
    cell: (agent) => <AgentCell agent={agent} />,
  },
  {
    key: "agent_id",
    header: "Agent ID",
    className: "font-mono text-xs",
    cell: (agent) => <span className="font-mono text-xs font-semibold">{agent.agent_id}</span>,
  },
  {
    key: "contact",
    header: "Contact",
    hidden: "md",
    cell: (agent) => <ContactCell agent={agent} />,
  },
  {
    key: "status",
    header: "Status",
    cell: (agent) => <span className="capitalize text-xs">{agent.status}</span>,
  },
  {
    key: "loan_status",
    header: "Loan Status",
    cell: (agent) => (
      agent.loan_status ? <LoanStatusBadge status={agent.loan_status} /> : <span className="text-xs text-muted-foreground">No loan</span>
    ),
  },
  {
    key: "outstanding",
    header: "Outstanding",
    cell: (agent) => (
      <span className={`text-xs font-semibold ${agent.total_outstanding > 0 ? "text-red-600" : ""}`}>
        {agent.total_outstanding > 0 ? formatCurrency(agent.total_outstanding) : "—"}
      </span>
    ),
  },
  {
    key: "joined",
    header: "Joined",
    hidden: "lg",
    cell: (agent) => (
      <div className="flex items-center text-xs text-muted-foreground">
        <Calendar className="w-3 h-3 mr-1" />
        {formatDate(agent.created_at)}
      </div>
    ),
  },
];

export const tabColumnsMap = {
  defaulted: defaultedColumns,
  overdue: overdueColumns,
  active: activeLoansColumns,
  no_loan: noLoansColumns,
  all: allAgentsColumns,
};
