"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { LoanProduct } from "@/lib/types";

interface ProductDeleteDialogProps {
  product: LoanProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ProductDeleteDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: ProductDeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Product"
      description={`Are you sure you want to delete "${product?.name}"? This action cannot be undone.`}
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}
