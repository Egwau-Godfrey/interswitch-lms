"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProductFormFields,
  getProductFormDefaults,
  productFormSchema,
  type ProductFormValues,
} from "./product-form-fields";
import type { LoanProduct, LoanProductCreate, LoanProductUpdate } from "@/lib/types";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: LoanProduct | null;
  onSubmit: (data: LoanProductCreate | LoanProductUpdate) => void;
  isLoading?: boolean;
  writeDisabled?: boolean;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
  isLoading = false,
  writeDisabled = false,
}: ProductFormDialogProps) {
  const isEdit = !!product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: getProductFormDefaults(product),
  });

  // Reset form whenever the dialog opens or the product changes
  React.useEffect(() => {
    if (open) {
      form.reset(getProductFormDefaults(product));
    }
  }, [open, product, form]);

  const handleSubmit = (values: ProductFormValues) => {
    // Clean up optional fields based on loan_type
    const payload: Record<string, unknown> = { ...values };
    if (values.loan_type === "float") {
      payload.application_fee_rate = 0;
    } else {
      payload.application_fee_fixed = 0;
    }
    onSubmit(payload as LoanProductCreate | LoanProductUpdate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-137.5 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Loan Product" : "Create Loan Product"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the loan product settings."
              : "Define a new loan product with interest and tenure settings."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <ProductFormFields form={form} writeDisabled={writeDisabled} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || writeDisabled}
                className="bg-[#004B91] hover:bg-[#003B71]"
              >
                {isLoading
                  ? "Saving..."
                  : isEdit
                    ? "Save Changes"
                    : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
