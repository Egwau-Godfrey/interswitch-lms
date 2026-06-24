"use client";

import Link from "next/link";
import {
  MoreVertical,
  Eye,
  FileText,
  Banknote,
  CheckCircle2,
  XCircle,
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
import type { Loan } from "@/lib/types";

interface LoanRowActionsProps {
  loan: Loan;
  basePath: string;
  canWrite?: boolean;
  onRefetch: () => void;
  onClearLoan?: (loan: Loan) => void;
  onWriteOffLoan?: (loan: Loan) => void;
  onRecordPayment?: (loan: Loan) => void;
}

export function LoanRowActions({
  loan,
  basePath,
  canWrite = true,
  onClearLoan,
  onWriteOffLoan,
  onRecordPayment,
}: LoanRowActionsProps) {
  const canRecordPayment =
    canWrite && (loan.status === "disbursed" || loan.status === "overdue");
  const canClear =
    canWrite && (loan.status === "disbursed" || loan.status === "overdue");
  const canWriteOff =
    canWrite && (loan.status === "overdue" || loan.status === "defaulted");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <Link href={`${basePath}/loans/${loan.id}`}>
          <DropdownMenuItem>
            <Eye className="w-4 h-4 mr-2" /> View Details
          </DropdownMenuItem>
        </Link>
        <Link href={`${basePath}/loans/${loan.id}?tab=statement`}>
          <DropdownMenuItem>
            <FileText className="w-4 h-4 mr-2" /> Statement
          </DropdownMenuItem>
        </Link>
        {canRecordPayment && (
          <DropdownMenuItem onClick={() => onRecordPayment?.(loan)}>
            <Banknote className="w-4 h-4 mr-2" /> Record Payment
          </DropdownMenuItem>
        )}
        {canWrite && (
          <>
            <DropdownMenuSeparator />
            {canClear && (
              <DropdownMenuItem
                className="text-emerald-600"
                onClick={() => onClearLoan?.(loan)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Cleared
              </DropdownMenuItem>
            )}
            {canWriteOff && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onWriteOffLoan?.(loan)}
              >
                <XCircle className="w-4 h-4 mr-2" /> Write Off
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
