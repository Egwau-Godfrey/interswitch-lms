"use client";

import * as React from "react";
import { z } from "zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { LoanProduct, LoanType } from "@/lib/types";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

export const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  loan_type: z.enum(["float", "pay_day"]),
  min_amount: z.coerce.number().min(0, "Min amount must be ≥ 0").optional(),
  max_amount: z.coerce.number().min(1, "Max amount must be positive"),
  interest_rate: z.coerce.number().min(0, "Interest rate must be ≥ 0"),
  penalty_rate: z.coerce.number().min(0, "Penalty rate must be ≥ 0").optional(),
  application_fee_rate: z.coerce
    .number()
    .min(0, "Fee rate must be ≥ 0")
    .optional(),
  application_fee_fixed: z.coerce
    .number()
    .min(0, "Fixed fee must be ≥ 0")
    .optional(),
  tenure_days: z.coerce.number().min(1, "Tenure must be at least 1 day"),
  grace_period_days: z.coerce
    .number()
    .min(0, "Grace period must be ≥ 0")
    .optional(),
  requires_payroll: z.boolean().optional(),
  is_default: z.boolean().optional(),
  is_active: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

// ---------------------------------------------------------------------------
// Default values helper
// ---------------------------------------------------------------------------

export function getProductFormDefaults(
  product?: LoanProduct | null
): ProductFormValues {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    loan_type: (product?.loan_type as LoanType) ?? "float",
    min_amount: product?.min_amount ?? 0,
    max_amount: product?.max_amount ?? 0,
    interest_rate: product?.interest_rate ?? 0,
    penalty_rate: product?.penalty_rate ?? 0,
    application_fee_rate: product?.application_fee_rate ?? 0,
    application_fee_fixed: product?.application_fee_fixed ?? 0,
    tenure_days: product?.tenure_days ?? 0,
    grace_period_days: product?.grace_period_days ?? 0,
    requires_payroll: product?.requires_payroll ?? false,
    is_default: product?.is_default ?? false,
    is_active: product?.is_active ?? true,
  };
}

// ---------------------------------------------------------------------------
// Form fields component
// ---------------------------------------------------------------------------

interface ProductFormFieldsProps {
  form: UseFormReturn<ProductFormValues>;
  writeDisabled?: boolean;
}

export function ProductFormFields({ form, writeDisabled }: ProductFormFieldsProps) {
  const loanType = form.watch("loan_type");

  return (
    <div className="grid gap-4 py-4">
      {/* Loan Type Selector */}
      <FormField
        control={form.control}
        name="loan_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Loan Type</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={writeDisabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select loan type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="float">
                  Float Loan (daily interest, fixed fee)
                </SelectItem>
                <SelectItem value="pay_day">
                  Pay Day Loan (% fee, fixed interest)
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              {loanType === "float"
                ? "Fixed application fee, daily interest on outstanding balance"
                : "Percentage application fee, fixed interest to repay within tenure"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Name */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Name</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Float Advance"
                {...field}
                disabled={writeDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Brief description of the product"
                rows={2}
                {...field}
                disabled={writeDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Amount Range */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="min_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Amount (UGX)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  {...field}
                  disabled={writeDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="max_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Amount (UGX)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  {...field}
                  disabled={writeDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Rates */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="interest_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Interest Rate (%{loanType === "float" ? " /day" : " total"})
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...field}
                  disabled={writeDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="penalty_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Penalty Rate (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...field}
                  disabled={writeDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Conditional Fee Input based on loan_type */}
      {loanType === "float" ? (
        <FormField
          control={form.control}
          name="application_fee_fixed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Application Fee (UGX, fixed)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  {...field}
                  disabled={writeDisabled}
                />
              </FormControl>
              <FormDescription>
                Fixed fee added to repayment for float loans
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={form.control}
          name="application_fee_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Application Fee Rate (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  {...field}
                  disabled={writeDisabled}
                />
              </FormControl>
              <FormDescription>
                Percentage of principal, deducted from disbursement
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Tenure + Grace */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="tenure_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tenure (days)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  {...field}
                  disabled={writeDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="grace_period_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grace Period (days)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  {...field}
                  disabled={writeDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap items-center gap-6 pt-2">
        <FormField
          control={form.control}
          name="requires_payroll"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  disabled={writeDisabled}
                />
              </FormControl>
              <FormLabel className="text-sm font-normal cursor-pointer">
                Requires Payroll
              </FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  disabled={writeDisabled}
                />
              </FormControl>
              <FormLabel className="text-sm font-normal cursor-pointer">
                Default Product
              </FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  disabled={writeDisabled}
                />
              </FormControl>
              <FormLabel className="text-sm font-normal cursor-pointer">
                Active
              </FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
