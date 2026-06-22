"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit2,
  Trash2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Star,
} from "lucide-react";
import type { LoanProduct } from "@/lib/types";
import { formatCurrency } from "@/components/shared/stat-card";
import { ActiveBadge } from "@/components/shared/status-badges";

interface ProductTableProps {
  products: LoanProduct[];
  onEdit: (product: LoanProduct) => void;
  onDelete: (product: LoanProduct) => void;
  onToggleActive: (product: LoanProduct) => void;
  onSetDefault: (product: LoanProduct) => void;
  writeDisabled?: boolean;
  writeTooltip?: string;
}

export function ProductTable({
  products,
  onEdit,
  onDelete,
  onToggleActive,
  onSetDefault,
  writeDisabled,
  writeTooltip,
}: ProductTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Interest</TableHead>
            <TableHead>Penalty</TableHead>
            <TableHead>Tenure</TableHead>
            <TableHead>Range (UGX)</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12.5"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              className={!product.is_active ? "opacity-60" : ""}
            >
              <TableCell className="font-medium">
                {product.name}
                {product.is_default && (
                  <Star className="inline w-3 h-3 ml-1 text-amber-500 fill-amber-500" />
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={product.loan_type === "float" ? "default" : "secondary"}
                >
                  {product.loan_type === "float" ? "Float" : "Pay Day"}
                </Badge>
              </TableCell>
              <TableCell>{product.interest_rate}%</TableCell>
              <TableCell>{product.penalty_rate}%</TableCell>
              <TableCell>{product.tenure_days} days</TableCell>
              <TableCell>
                {formatCurrency(Number(product.min_amount || 0), "UGX")} –{" "}
                {formatCurrency(Number(product.max_amount), "UGX")}
              </TableCell>
              <TableCell>
                {product.loan_type === "float"
                  ? `${formatCurrency(Number(product.application_fee_fixed || 0), "UGX")} (fixed)`
                  : `${product.application_fee_rate || 0}% (rate)`}
              </TableCell>
              <TableCell>
                <ActiveBadge isActive={product.is_active} />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onEdit(product)}
                      disabled={writeDisabled}
                      title={writeTooltip}
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onToggleActive(product)}
                      disabled={writeDisabled}
                      title={writeTooltip}
                    >
                      {product.is_active ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" /> Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    {!product.is_default && (
                      <DropdownMenuItem
                        onClick={() => onSetDefault(product)}
                        disabled={writeDisabled}
                        title={writeTooltip}
                      >
                        <Star className="w-4 h-4 mr-2" /> Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(product)}
                      disabled={writeDisabled}
                      title={writeTooltip}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
